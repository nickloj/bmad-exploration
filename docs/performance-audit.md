# Performance Audit Report

**Date:** 2026-04-26  
**Tool:** Chrome DevTools MCP (Lighthouse + Performance Trace)  
**URL:** http://localhost:5173 (development build)

---

## Lighthouse Scores

| Category | Score |
|---|---|
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | **82** (2 failures) |

---

## Issues Found

### 1. Double API fetch on page load (React StrictMode)

**Severity:** Medium (dev-only, but masks real bugs)  
**File:** `client/src/hooks/useTodos.ts:13-18` / `client/src/main.tsx:7`

The network trace shows two concurrent `GET /api/todos` requests on every page load. The root cause is React 18's `StrictMode` in `main.tsx`, which intentionally double-invokes effects in development to surface side-effect bugs. The `useEffect` in `useTodos.ts` fires twice as a result.

```
reqid=52 GET http://localhost:5173/api/todos [200]
reqid=53 GET http://localhost:5173/api/todos [200]
```

This does **not** occur in production builds, but it means real network errors or race conditions in the fetch lifecycle won't be caught in dev. Consider adding an `AbortController` to cancel the first (stale) request when the effect re-fires.

**Fix:** Add cleanup to the fetch effect:
```ts
useEffect(() => {
  const controller = new AbortController();
  fetchTodos(controller.signal)
    .then(setTodos)
    .catch((err) => { if (!controller.signal.aborted) setError('Failed to load todos.'); })
    .finally(() => setIsLoading(false));
  return () => controller.abort();
}, []);
```

---

### 2. Form input missing `id` and `name` attributes

**Severity:** Medium (accessibility + browser features)  
**File:** `client/src/components/TodoInput.tsx:20`

The `<input>` element has no `id` or `name` attribute. This triggers a browser console issue and breaks:
- Label association (screen readers need `htmlFor`/`id` to link label to input)
- Password manager and browser autofill heuristics
- Form serialization

```tsx
// current
<input type="text" value={text} onChange={...} placeholder="Add a new task..." />

// fix
<label htmlFor="new-todo" className="sr-only">New task</label>
<input id="new-todo" name="new-todo" type="text" ... />
```

---

### 3. Missing `<meta name="description">` (SEO score: 82)

**Severity:** Low (SEO)  
**File:** `client/index.html`

Lighthouse flags the page for having no meta description. Search engines use this for snippet text.

```html
<!-- add inside <head> -->
<meta name="description" content="A simple to-do list app to manage your tasks." />
```

---

### 4. Missing `robots.txt` (SEO score: 82)

**Severity:** Low (SEO)  
**Location:** `client/public/robots.txt` (file does not exist)

When Lighthouse requests `/robots.txt`, the server returns the HTML shell page. Lighthouse reports the file as invalid. For a production app, a `robots.txt` should be present.

```
# client/public/robots.txt
User-agent: *
Allow: /
```

---

### 5. `Content-Type` header missing `charset`

**Severity:** Low (correctness / performance)  
**Location:** Vite dev server / production server response headers

The performance trace reports the HTTP `Content-Type` response header does not include `charset=utf-8`, even though `<meta charset="UTF-8">` is present in the HTML. Without the header-level declaration, the browser cannot determine encoding before parsing begins — a potential re-parse trigger.

`index.html` already has the meta tag in a correct position (first `<head>` child), which mitigates the risk, but the server should also set the header:

```
Content-Type: text/html; charset=utf-8
```

For the Fastify server (`server/src/app.ts`), add a reply decorator or set the header in the static file handler.

---

### 6. `canvas-confetti` loaded eagerly

**Severity:** Low (bundle weight)  
**File:** `client/src/components/CelebrationOverlay.tsx`

`canvas-confetti` (26 ms download in the trace) is in the critical dependency chain via `App.tsx → CelebrationOverlay.tsx`. It is only used when the user completes all their todos. Lazy-loading it would remove it from the initial bundle.

```tsx
// App.tsx or CelebrationOverlay.tsx
const CelebrationOverlay = React.lazy(() => import('./CelebrationOverlay'));
```

---

## Core Web Vitals (Lab Data)

| Metric | Value | Assessment |
|---|---|---|
| LCP | **80 ms** | Excellent |
| CLS | **0.00** | Excellent |
| TTFB | 3 ms | Excellent |
| Render delay | 77 ms | Good |

The critical path to first render is 6 levels deep (HTML → `main.tsx` → `App.tsx` → `useTodos.ts` → `api/todos.ts` → `/api/todos`). In the dev server with unbundled modules this resolves in ~75 ms total. In a production build this chain collapses into a single bundle, so no action is needed here.

---

## Summary

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | Double fetch (StrictMode + no AbortController) | Medium | Low |
| 2 | Input missing `id`/`name` | Medium | Low |
| 3 | Missing meta description | Low | Low |
| 4 | Missing `robots.txt` | Low | Low |
| 5 | `Content-Type` missing charset in HTTP header | Low | Low |
| 6 | `canvas-confetti` eager load | Low | Low |

All issues have low implementation effort. Items 1–2 are the highest priority as they affect runtime correctness and accessibility.
