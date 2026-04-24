# Deferred Work

## Deferred from: code review of 1-2-api-crud-endpoints (2026-04-24)

- **Test DB singleton interference** — `closeDb()` in afterEach destroys the module-level singleton, which could cause issues if test files run in parallel and share the same DB_PATH (defaulting to `data/todos.db`). Pre-existing pattern established in Story 1.1. Consider setting `DB_PATH=:memory:` in test environment or configuring Vitest for sequential execution.
