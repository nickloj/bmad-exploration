# Deferred Work

## Deferred from: code review of 1-2-api-crud-endpoints (2026-04-24)

- **Test DB singleton interference** — `closeDb()` in afterEach destroys the module-level singleton, which could cause issues if test files run in parallel and share the same DB_PATH (defaulting to `data/todos.db`). Pre-existing pattern established in Story 1.1. Consider setting `DB_PATH=:memory:` in test environment or configuring Vitest for sequential execution.

## Deferred from: code review of 1-4-complete-and-delete-todos (2026-04-24)

- **Stale `prev` closure in optimistic rollback** — `prev = todos` captures state at call time; rapid concurrent operations could cause a successful op to vanish on a subsequent rollback. Fix: use a per-id ref or functional rollback. Low risk for single-user app. [client/src/hooks/useTodos.ts]
- **`completeTodo` on optimistic todo** — if user clicks complete before `createTodo` resolves, PATCH fires with a fake id, fails, and shows a spurious error. No data loss. Mitigation: disable complete/delete buttons on optimistic items. [client/src/hooks/useTodos.ts]

## Deferred from: code review of Epic 3 (2026-04-26)

- **Abrupt final-frame removal of faded todos** — `visibleTodos` filter removes the item the same tick its opacity reaches 0; CSS transition can't complete on a removed DOM element. Fix: defer removal by one tick or use `pointer-events-none` + `opacity: 0` before eviction. [client/src/hooks/useTodos.ts]
- **Interactive controls remain accessible during fade** — opacity applied to the entire `<li>` including buttons; buttons become nearly invisible but remain clickable near end of fade. Add `pointer-events-none` when opacity drops below a threshold. [client/src/components/TodoItem.tsx]
- **Future `completedAt` timestamp (clock skew) never fades** — negative elapsed returns 1 indefinitely. [client/src/lib/fade.ts]

## Deferred from: code review of 1-3-frontend-todo-list-and-api-integration (2026-04-24)

- **Optimistic todo not rolled back on API failure** — phantom stays in list until reload. Story 1.4 adds error handling and rollback. [client/src/hooks/useTodos.ts]
- **`fetchTodos` error shows EmptyState silently** — no error signal to user. Story 1.4 adds error state. [client/src/hooks/useTodos.ts]
- **`createTodo` error discards server error details** — generic message only. Story 1.4 will surface API errors. [client/src/api/todos.ts]
- **Optimistic `createdAt` uses client clock** — replaced by server timestamp on API response. Only visible during the brief optimistic window. [client/src/hooks/useTodos.ts]
- **No `useEffect` AbortController cleanup** — stale state update possible on unmount. Low risk in this single-page app. [client/src/hooks/useTodos.ts]

## Deferred from: code review of 1-2-api-crud-endpoints (Round 2, 2026-04-24)

- **Validation error message detail** — AJV messages (e.g., "body/text must NOT have fewer than 1 characters") are sent as-is. Not truly internal like stack traces; revisit when API becomes public-facing. [server/src/routes/api/todos/index.ts]

- ~~**`completed_at` / `created_at` datetime format**~~ — **FIXED 2026-04-26**: `toIso()` helper in `toTodoResponse` now replaces space with `T` and appends `Z`. [server/src/routes/api/todos/index.ts]
