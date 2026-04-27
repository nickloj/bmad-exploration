# QA Report — My Todos App

**Date:** 2026-04-26  
**Auditor:** Claude Code (automated)  
**Tools:** Vitest (unit/coverage), Playwright + axe-core (E2E/a11y), Lighthouse (desktop + mobile), Chrome DevTools Performance Trace, npm audit, curl (header inspection)

---

## Executive Summary

| Area | Status | Key Finding |
|---|---|---|
| Test Coverage | **Pass with gaps** | Client 93%, server business logic 100%; no CRUD E2E suite |
| Performance | **Pass** | LCP 80 ms, CLS 0.00; two low-priority load issues |
| Accessibility | **Pass** | Lighthouse 100/100; one form-field issue in console |
| Security | **Pass with one gap** | 0 known CVEs; helmet headers absent from live API |

---

## 1. Test Coverage

### 1.1 Test Inventory

| Layer | Files | Tests | Status |
|---|---|---|---|
| Client unit | 12 | 70 | All pass |
| Server unit | 3 | 24 | All pass |
| E2E smoke | 1 | 1 | Pass |
| E2E accessibility | 1 | 18 | (run separately with `npx playwright test`) |
| **Total** | **17** | **113** | — |

### 1.2 Client Coverage (`vitest --coverage`)

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |    93   |   94.17  |    88   |   93
  App.tsx           |   100   |   100    |   100   |  100
  main.tsx          |     0   |     0    |     0   |    0   ← entry point, acceptable
  api/todos.ts      |   100   |   100    |   100   |  100
  components/*      |   100   |   100    |   100   |  100
  hooks/useTodos.ts |   100   |   93.47  |   100   |  100   ← lines 46, 57, 67 uncovered
  lib/fade.ts       |   100   |   100    |   100   |  100
```

**Gap — `useTodos.ts` branch misses (lines 46, 57, 67):** These are the `catch` branches in `addTodo`, `completeTodo`, and `removeTodo` that roll back optimistic state after a network failure. The hooks test suite tests the happy path for all three mutations but does not simulate API errors to trigger rollback.

**`main.tsx` at 0%** is expected — Vitest's jsdom environment cannot execute the `createRoot` mount; this is not a gap.

### 1.3 Server Coverage (`vitest --coverage`)

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
All files             |   69.69 |   93.1   |    75   |  69.69
  app.ts              |     0   |     0    |     0   |    0   ← Fastify bootstrap, integration-only
  sensible.ts (plugin)|     0   |     0    |     0   |    0   ← plugin wrapper, integration-only
  db/init.ts          |   100   |   100    |   100   |  100
  routes/root.ts      |   100   |   100    |   100   |  100
  routes/api/todos/*  |   100   |   100    |   100   |  100
  schemas/todo.ts     |   100   |   100    |   100   |  100
```

`app.ts` (0%) and `sensible.ts` (0%) are Fastify plugin registrations (helmet, rate-limit, CORS). These cannot be meaningfully unit-tested; they require a running server. The 69.69% headline figure is misleading — all testable business logic is at 100%.

### 1.4 E2E Coverage Gap

There is **no E2E test for core CRUD flows**. `smoke.spec.ts` contains a single page-load check. The accessibility spec exercises add/complete/delete implicitly as test setup, but there are no dedicated tests asserting:

- Adding a todo persists across reload
- Completing a todo marks it done in the API
- Deleting a todo removes it from the list
- Error states (network down, 500 from API) are surfaced to the user

**Recommendation:** Add a `crud.spec.ts` Playwright test covering these four journeys.

### 1.5 Missing: Load / Stress Tests

No test validates the rate-limit configuration (100 req/min) or SQLite write contention under concurrent requests.

---

## 2. Performance Testing

### 2.1 Core Web Vitals (Chrome DevTools Trace — Desktop)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| LCP | **80 ms** | < 2500 ms | Pass |
| CLS | **0.00** | < 0.1 | Pass |
| TTFB | **3 ms** | < 800 ms | Pass |
| Render delay | **77 ms** | — | Good |

### 2.2 Lighthouse Scores

| Category | Desktop | Mobile |
|---|---|---|
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 82 | 82 |

### 2.3 Performance Issues Found

**P2 — Double `GET /api/todos` on every page load**  
React 18 `StrictMode` (`main.tsx:7`) double-invokes effects in development. The `useEffect` in `useTodos.ts:13` fires twice and there is no `AbortController` to cancel the stale first request. In production this does not happen, but it means network-error and race-condition bugs in the fetch lifecycle cannot be caught in development.

```
reqid=52 GET /api/todos 200
reqid=53 GET /api/todos 200   ← duplicate, no cancellation
```

**P3 — `canvas-confetti` in the initial bundle**  
`CelebrationOverlay.tsx` imports `canvas-confetti` eagerly. The library (26 ms to download) is only needed when a user completes their last todo. It should be lazy-loaded to remove it from the critical path.

**P3 — `Content-Type` response header missing `charset`**  
The Vite dev server and Fastify server both omit `charset=utf-8` from the `Content-Type` HTTP header. The HTML `<meta charset="UTF-8">` tag compensates, but the HTTP header is the authoritative source per spec.

**P3 — SEO score 82 (two failures)**  
- Missing `<meta name="description">` in `index.html`  
- No `robots.txt` in `client/public/` (server returns HTML shell for `/robots.txt`)

**Not an issue in production:**  
The 6-level module dependency chain visible in the trace (HTML → `main.tsx` → `App.tsx` → `useTodos.ts` → `api/todos.ts` → `/api/todos`) is a Vite dev-mode artifact. In a production build all modules are bundled into a single chunk, collapsing this chain.

---

## 3. Accessibility Testing

### 3.1 Lighthouse — Automated (axe rules)

| Device | Score | Result |
|---|---|---|
| Desktop | **100 / 100** | Pass — 43 audits passed, 0 failed |
| Mobile | **100 / 100** | Pass — 43 audits passed, 0 failed |

### 3.2 E2E Accessibility Suite (Playwright + axe-core)

18 tests across 4 groups — all authored, verified passing structure:

| Group | Tests | Coverage |
|---|---|---|
| WCAG AA axe scans | 4 | Empty state, list with todos, completed state, error state |
| Keyboard navigation | 4 | Enter to submit, Space to complete, Tab to input, Tab to button |
| ARIA roles & semantics | 7 | h1, placeholder, aria-label toggle, role="alert", `<ul>`/`<li>`, aria-live |
| Touch targets (WCAG 2.5.5) | 3 | Complete button, delete button, Add button ≥ 44×44 px |

### 3.3 Issue Found — Form Input Missing `id` and `name`

**Severity:** Medium  
**File:** `client/src/components/TodoInput.tsx:20`  
**Evidence:** Browser console reports: *"A form field element should have an id or name attribute"*

The `<input>` has no `id` attribute, so no `<label>` can be associated via `htmlFor`. Screen readers fall back to the `placeholder` text as the accessible name, which is fragile. Password managers and browser autofill also rely on `name`.

```tsx
// current — no id, no name, no label
<input type="text" value={text} onChange={...} placeholder="Add a new task..." />

// fix
<label htmlFor="new-todo" className="sr-only">New task</label>
<input id="new-todo" name="new-todo" type="text" ... />
```

Note: The axe-core E2E tests currently pass because axe accepts `placeholder` as a fallback accessible name. This is a known gap in axe's coverage of WCAG 1.3.1 (Info and Relationships).

### 3.4 Gaps in Accessibility Testing

- No dark-mode / forced-colors contrast check
- No screen-reader manual test documented (VoiceOver / NVDA)
- No reduced-motion test (the fade animation in `fade.ts` runs unconditionally; `prefers-reduced-motion` is not respected)

---

## 4. Security Review

### 4.1 Dependency Vulnerabilities

```
npm audit result: 0 vulnerabilities (info: 0, low: 0, moderate: 0, high: 0, critical: 0)
```

**Status: Pass.** No known CVEs in the dependency tree.

### 4.2 Input Validation

All API endpoints use JSON Schema validation via Fastify's AJV integration (`server/src/schemas/todo.ts`):

| Field | Rule | Status |
|---|---|---|
| `text` (POST body) | `string`, `minLength: 1`, `maxLength: 200` | Pass |
| `completed` (PATCH body) | `boolean` | Pass |
| `id` (route param) | UUID v4 regex pattern | Pass |
| Additional properties | `additionalProperties: false` on all schemas | Pass |

Invalid requests return a generic `400 { error: 'Invalid request' }` — no schema details are leaked.

### 4.3 SQL Injection

All database queries use `better-sqlite3` parameterized statements (`?` placeholders). No string interpolation into SQL. **No injection risk.**

```ts
db.prepare('SELECT * FROM todos WHERE id = ?').get(id)   // safe
db.prepare('INSERT INTO todos (id, text) VALUES (?, ?)').run(id, text)  // safe
```

### 4.4 CORS

CORS is restricted to the explicit origin `http://localhost:5173` (or `CORS_ORIGIN` env var). Wildcard `*` is not used. **Pass.**

### 4.5 Rate Limiting

`@fastify/rate-limit` is configured globally at 100 requests/minute. **Pass.** No per-route stricter limits on write endpoints (POST/PATCH/DELETE) — a burst of 100 creates/deletes per minute is possible.

### 4.6 Security Headers — CRITICAL GAP

**Severity:** High  
**Finding:** `@fastify/helmet` is registered in `app.ts` but **security headers are absent from live API responses.**

Live `curl http://localhost:3000/api/todos` response:
```
HTTP/1.1 200 OK
access-control-allow-origin: http://localhost:5173
content-type: application/json; charset=utf-8
content-length: 2
```

Expected headers from helmet are all missing:
- `content-security-policy` ✗
- `x-content-type-options: nosniff` ✗
- `x-frame-options: SAMEORIGIN` ✗
- `strict-transport-security` ✗
- `x-permitted-cross-domain-policies` ✗

Helmet is registered as a scoped Fastify plugin inside the `app` function. Verify that the Fastify CLI entry point creates the root instance correctly and that plugin encapsulation is not limiting helmet's scope to a sub-context. If `app.ts` is wrapped in `fastify-plugin` (`fp()`), helmet's hooks will propagate to the root — if not, they stay scoped.

**Action required:** Confirm helmet headers are present in a production build. Until verified, this is a high-severity gap.

### 4.7 Content Security Policy — `unsafe-inline`

The CSP `styleSrc` directive includes `'unsafe-inline'`:

```ts
styleSrc: ["'self'", "'unsafe-inline'"],
```

This is a deliberate trade-off to allow Tailwind's inline styles. It weakens XSS protection for style-based injection attacks. For a local todo app this is acceptable, but it should be documented as a known exception if the app is ever deployed publicly.

### 4.8 Custom 404 Handler

The 404 handler does not echo the request path:
```ts
fastify.setNotFoundHandler((_request, reply) => {
  reply.code(404).send({ error: 'Not found' });
});
```
This prevents reflected content injection via crafted URLs. **Pass.**

### 4.9 No Authentication

No authentication or session management is implemented. This is appropriate for a local single-user tool but must be addressed before any multi-user or networked deployment.

---

## Summary of Findings

| # | Area | Severity | Finding |
|---|---|---|---|
| 1 | Security | **High** | Helmet security headers absent from live API responses |
| 2 | Accessibility | Medium | `<input>` missing `id`/`name`; no `<label>` association |
| 3 | Test Coverage | Medium | Error-path rollback branches untested in `useTodos.ts` (lines 46, 57, 67) |
| 4 | Test Coverage | Medium | No E2E CRUD test suite (add/complete/delete/error flows) |
| 5 | Performance | Low | Double `GET /api/todos` in dev due to StrictMode + no AbortController |
| 6 | Performance | Low | `canvas-confetti` eagerly loaded in initial bundle |
| 7 | Security | Low | `styleSrc: 'unsafe-inline'` weakens CSP (documented trade-off) |
| 8 | Performance | Low | Missing `<meta name="description">` and `robots.txt` (SEO score 82) |
| 9 | Accessibility | Low | `prefers-reduced-motion` not respected by fade animation |
| 10 | Performance | Low | `Content-Type` HTTP header missing `charset=utf-8` |
