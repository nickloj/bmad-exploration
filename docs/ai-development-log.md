# AI-Assisted Development Log

**Project:** bmad-to-do-app · **Period:** 2026-04-24–27 · **Model:** Claude Sonnet/Opus 4.6
**Final:** 70 client + 24 server + 20 Playwright tests · Lighthouse accessibility 100/100

---

## Agent Usage

Everything was AI-assisted. The BMAD skill workflow (`bmad-dev-story` → `bmad-code-review` in fresh contexts) produced the best results. Each review caught 2–5 real bugs per story — not noise. Running the reviewer in a separate context was worth it; it didn't rationalise the implementation it just read.

**What worked:** Letting the AI read the full story file rather than describing the task inline. Stories 2.1–2.3 and 3.1–3.2 were implemented in single passes ("do all at once") because they were additive. Epic 1 had to be sequential — each story established infrastructure the next depended on.

**Best prompt pattern:** `bmad-dev-story 1.4` beats "implement complete/delete". The skill reads its own context. Short prompts make the AI assume.

**Live testing prompts were high-value.** "Validate that stuff is actually working by running the app" caught two bugs no automated test would have found (see Debugging section).

---

## MCP Server Usage

| MCP | Status | Used for |
|-----|--------|---------|
| `mcp__ide__getDiagnostics` | Available | Occasional TypeScript error context |
| Chrome DevTools MCP | **Used — QA phase** | Performance audit, Lighthouse, network inspection, accessibility |

Chrome DevTools MCP was unavailable during implementation but was used in the QA phase (2026-04-26–27). It drove the full performance and accessibility audit documented in `docs/performance-audit.md` and `docs/qa-report.md`.

**What it enabled:**
- **Performance trace** — identified the double `GET /api/todos` (StrictMode + no AbortController) and `canvas-confetti` on the critical path. LCP 80 ms, CLS 0.00 confirmed.
- **Lighthouse** — automated accessibility score (100/100 desktop + mobile), caught missing `<meta name="description">` and invalid `robots.txt` (SEO score 82).
- **Network inspection** — revealed `Content-Type` header missing `charset` and confirmed all API requests return 200.
- **Console inspection** — surfaced the browser-native "form field element should have an id or name attribute" issue on `TodoInput`.
- **Live security header check** — `curl` + network tab confirmed helmet headers are absent from live API responses despite being registered in `app.ts`.

The SQLite datetime bug (Case 2 below) would have been a 2-minute Network tab investigation rather than 30 minutes of reasoning if DevTools MCP had been available during implementation.

---

## Test Generation

**Strong:** Hook tests (`useTodos`) were the best AI output — correct use of `renderHook + act + waitFor`, proper module mocking, covered optimistic update, rollback, celebration trigger, and fade eviction. Component and API layer tests were also solid first-pass.

**Misses and fixes needed:**

| Bug | Cause | Caught by |
|-----|-------|-----------|
| `completedAt: '2026-01-02'` in test fixture | Stale date string → fade filter evicted the todo immediately → assertion on `undefined` | Test failure |
| Fake timer + `waitFor` deadlock | `waitFor` polls with `setTimeout`; fake timers stop it | 5s timeout |
| Playwright tests failing with "resolved to 3 elements" | Tests shared the live server DB; todos accumulated across tests | Strict-mode violation |
| Server 500 test registered route after `app.ready()` | Fastify rejects post-ready route registration | `Error: Cannot add route` |

Coverage landed at 100% statements on all meaningful files. The 6% branch gap in `useTodos.ts` is V8 tracking implicit branches inside functional updater callbacks — not real gaps.

---

## Debugging with AI

**Case 1 — Fastify `-o` flag** (`~30 min`)
Unit tests passed for `additionalProperties: false` enforcement but the live server accepted extra fields. AI traced it: `fastify-cli` requires the `-o` flag to apply the `options` export from `app.ts`. Without it, the AJV config is silently ignored. The `package.json` scripts were missing `-o`. One flag, only caught by running the app.

**Case 2 — SQLite datetime format** (`~30 min`)
User reported: "todos disappear instantly after marking done, no confetti." AI traced the chain: `datetime('now')` → `"2026-04-26 15:30:00"` (no `Z`) → `new Date(...)` parsed as local time → in UTC+ timezones, `elapsed` = hours → `getFadeOpacity` returns 0 → item evicted immediately. Fix: `dt.replace(' ', 'T') + 'Z'` in `toTodoResponse`. No automated test caught it because unit tests mock the API layer, and Playwright runs server+client in the same timezone.

**Case 3 — Playwright/Vitest Symbol conflict** (`~2 hours`)
Every Playwright worker crashed with `TypeError: Cannot redefine property: Symbol($$jest-matchers-object)`. AI dug into the minified `expectBundleImpl.js` to find that Playwright's vendored expect bundle calls `Object.defineProperty(globalThis, sym, { value: {...} })` without `configurable: true`, freezing the symbol. `@vitest/expect` then tries to redefine it and throws. Fix: `jest-symbol-patch.cjs` predefines the symbol as `configurable: true` via `NODE_OPTIONS --require` injected in Playwright's `globalSetup` (workers inherit env).

**Case 4 — AutoLoad loading compiled test files**
Server crashed on startup with a Vitest internal error. AutoLoad scanned `dist/src/routes/` and tried to load `root.test.js` as a Fastify plugin. The `tsconfig.json` was compiling `*.test.ts` into dist. Fix: `"exclude": ["src/**/*.test.ts"]` in `server/tsconfig.json`.

---

## Limitations

**Can't see a browser.** Visual UX — animation feel, fade timing, confetti — was code-correct but never visually verified by the AI. Every live-testing insight came from the user running the app.

**Can't catch environment differences.** The datetime bug only bit users in UTC+ timezones. The AI's test environment was UTC, so everything passed. Cross-timezone, cross-browser, and cross-OS issues require a human in a different context.

**Can't resolve infrastructure problems.** Docker failed with a TLS certificate error (corporate proxy SSL inspection). Correctly diagnosed, but fixing a machine-level network config is out of scope.

**Concurrent race conditions stay theoretical.** The stale `prev` closure rollback risk was flagged in two separate code reviews and deferred both times. Reproducing it requires two operations completing in a specific interleaved order — not achievable with sequential tests.

**Human judgment was irreplaceable for:**
- Toggle vs one-way complete behaviour (product intent, spec was ambiguous)
- Fade duration constants (pure feel, no formula)
- Security trade-offs (`unsafe-inline` in CSP vs Tailwind refactor cost)
- Which deferred items matter before shipping
- The live UTC+ timezone test that found the datetime bug
