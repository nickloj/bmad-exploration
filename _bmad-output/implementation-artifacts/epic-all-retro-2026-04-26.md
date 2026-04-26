# Full Project Retrospective — Epics 1, 2 & 3
**Date:** 2026-04-26
**Project:** bmad-to-do-app
**Scope:** All three epics (partial retrospective — discussion halted early)

---

## Delivery Summary

| Metric | Result |
|--------|--------|
| Stories shipped | 8 (all done) |
| Tests | 89 total (68 client, 21 server) — all green |
| Code review runs | 5 |
| Patches applied in review | 18+ |
| Deferred items | 10 documented |
| Production incidents | 0 |

---

## Key Patterns Identified

### ✅ What Worked

**Code review caught real bugs every time.** Every review run found actionable patches — no false alarms, no noise. Standout catches: Fastify `-o` flag missing from start scripts (found during live testing), optimistic ID collision via `Date.now()`, NaN in fade opacity from invalid timestamps, `useCallback` stability for `dismissCelebration`, `completedAt` idempotency in PATCH handler.

**Deferred-item tracking was reliable.** Optimistic rollback and `fetchTodos` error handling were explicitly deferred from Story 1.3 and delivered exactly in Story 1.4. The deferred-work.md document made this traceable.

**Incremental complexity worked.** Each epic built cleanly on the previous. API in Epic 1 → UI integration → animation/polish → anti-hoarding behaviour. No story required significant rework of prior stories.

**89 tests, all green throughout.** No regressions discovered post-implementation.

### ⚠️ Recurring Challenges

**Accessibility was implementation-afterthought, review-catch.** ARIA issues appeared in Stories 2.1, 2.2, 2.3, and 3.2: conflicting `aria-label`/`aria-live`, missing screen reader announcements for celebration, abrupt component unmount defeating CSS transitions. Each was fixed in review — but should have been in the initial implementation.

**React state edge cases were a consistent class of bug.** Stale `prev` closure in optimistic rollback (1.4, 3.1), unstable function reference causing effect re-runs (2.2), optimistic ID on in-flight requests (1.4). These appear when reasoning only about the happy path, not about concurrent renders.

**Fastify configuration subtleties required live testing to discover.** The `-o` flag omission from `start`/`dev` scripts meant `removeAdditional: false` was silently ignored in production. Tests passed because they constructed Fastify directly with the options. The gap between test setup and production setup was only caught by running the app.

---

## Technical Debt Carried Forward

See `deferred-work.md` for the full list. Highest priority items before any public release:

1. **SQLite datetime format** — `datetime('now')` returns `YYYY-MM-DD HH:MM:SS` without `Z`. Not valid ISO 8601. Clients may interpret as local time. Fix: `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')` in DB inserts.
2. **Stale closure in optimistic rollback** — `prev = todos` captures render-time snapshot. Low risk for single-user, but a correctness cliff for concurrent operations.
3. **Interactive controls clickable during fade** — `opacity` on `<li>` includes buttons. Add `pointer-events-none` below a threshold.
4. **No retry on initial load failure** — error message shows but no refresh mechanism.
5. **Test DB singleton** — `closeDb()` in afterEach could interfere with parallel test files.

---

## Action Items

| # | Action | Priority |
|---|--------|----------|
| 1 | Fix SQLite datetime format before any API consumer beyond the frontend | High |
| 2 | Add accessibility checklist to implementation habit (not just review catch) | High |
| 3 | Establish pattern for React state rollback using functional updater + per-id keys | Med |
| 4 | Add `pointer-events-none` to fading TodoItem rows | Low |
| 5 | Consider `DB_PATH=:memory:` in test environment to resolve singleton concern | Low |

---

## Next Steps

No Epic 4 is planned. The app MVP is feature-complete per the PRD's three epics.

Before shipping publicly:
- Fix the SQLite ISO 8601 datetime issue
- Manual accessibility audit (keyboard nav, screen reader)
- Deploy and verify the Fastify `-o` flag is applied in production

