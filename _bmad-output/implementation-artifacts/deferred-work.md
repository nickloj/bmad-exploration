# Deferred Work

## Deferred from: code review of 1-2-api-crud-endpoints (2026-04-24)

- **Test DB singleton interference** — `closeDb()` in afterEach destroys the module-level singleton, which could cause issues if test files run in parallel and share the same DB_PATH (defaulting to `data/todos.db`). Pre-existing pattern established in Story 1.1. Consider setting `DB_PATH=:memory:` in test environment or configuring Vitest for sequential execution.

## Deferred from: code review of 1-3-frontend-todo-list-and-api-integration (2026-04-24)

- **Optimistic todo not rolled back on API failure** — phantom stays in list until reload. Story 1.4 adds error handling and rollback. [client/src/hooks/useTodos.ts]
- **`fetchTodos` error shows EmptyState silently** — no error signal to user. Story 1.4 adds error state. [client/src/hooks/useTodos.ts]
- **`createTodo` error discards server error details** — generic message only. Story 1.4 will surface API errors. [client/src/api/todos.ts]
- **Optimistic `createdAt` uses client clock** — replaced by server timestamp on API response. Only visible during the brief optimistic window. [client/src/hooks/useTodos.ts]
- **No `useEffect` AbortController cleanup** — stale state update possible on unmount. Low risk in this single-page app. [client/src/hooks/useTodos.ts]

## Deferred from: code review of 1-2-api-crud-endpoints (Round 2, 2026-04-24)

- **Validation error message detail** — AJV messages (e.g., "body/text must NOT have fewer than 1 characters") are sent as-is. Not truly internal like stack traces; revisit when API becomes public-facing. [server/src/routes/api/todos/index.ts]

- **`completed_at` / `created_at` datetime format** — SQLite `datetime('now')` stores `"YYYY-MM-DD HH:MM:SS"` without a `Z` or `+00:00` suffix. Not valid ISO 8601. Clients parsing these as timestamps may get timezone bugs. Fix requires either appending `Z` in `toTodoResponse`, or changing the DB insert to store `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`. Pre-existing from Story 1.1 DB schema design. Address before shipping.
