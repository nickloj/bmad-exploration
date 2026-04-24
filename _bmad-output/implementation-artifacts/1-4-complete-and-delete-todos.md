# Story 1.4: Complete & Delete Todos

Status: done

## Story

As a user,
I want to mark tasks as done and remove tasks I no longer need,
so that I can manage my list and track progress.

## Acceptance Criteria

1. **Given** an active todo is displayed, **When** the user clicks to complete it, **Then** the todo is marked as completed immediately via optimistic update **And** the completion status is persisted via the API **And** the completed todo is visually distinguishable from active todos.

2. **Given** a todo is displayed, **When** the user triggers the delete action, **Then** the todo is removed from the list immediately via optimistic update **And** the todo is deleted via the API.

3. **Given** an API call fails (create, complete, or delete), **When** the error is detected, **Then** the optimistic update is rolled back **And** an inline error message is displayed **And** no user data is lost.

## Tasks / Subtasks

- [x] Task 1: Extend API layer (AC: #1, #2)
  - [x] Add `updateTodo(id, completed)` → PATCH /api/todos/:id → `Todo`
  - [x] Add `deleteTodo(id)` → DELETE /api/todos/:id

- [x] Task 2: Extend `useTodos` hook (AC: #1, #2, #3)
  - [x] Add `error: string | null` state; clear on every successful operation
  - [x] Add `completeTodo(id)`: optimistically set `completed=true`/`completedAt` in state, call API, roll back + set error on failure
  - [x] Add `deleteTodo(id)`: optimistically remove from state, call API, re-insert at original position + set error on failure
  - [x] Fix `addTodo`: on `createTodo` failure, remove optimistic todo + set error (rollback from Story 1.3 deferral)
  - [x] Expose `{ todos, isLoading, error, addTodo, completeTodo, deleteTodo }`

- [x] Task 3: Create `ErrorMessage` component (AC: #3)
  - [x] Create `client/src/components/ErrorMessage.tsx` — renders error text when `error` is non-null; does not render when null

- [x] Task 4: Update `TodoItem` (AC: #1, #2)
  - [x] Add complete button — checkbox or checkmark; calls `onComplete(todo.id)`
  - [x] Add delete button — calls `onDelete(todo.id)`
  - [x] Visual distinction: completed todos get strikethrough text + muted color

- [x] Task 5: Wire up `App.tsx` (AC: all)
  - [x] Pass `error` to `ErrorMessage`, pass `completeTodo` + `deleteTodo` down through `TodoList` → `TodoItem`

- [x] Task 6: Write tests (AC: all)
  - [x] `client/src/api/todos.test.ts` — add tests for `updateTodo` and `deleteTodo`
  - [x] `client/src/hooks/useTodos.test.ts` — `completeTodo` optimistic update; `deleteTodo` optimistic remove; rollback on failure for complete, delete, add; error state set on failure
  - [x] `client/src/components/TodoItem.test.tsx` — completed todo visual distinction; complete button triggers callback; delete button triggers callback
  - [x] `client/src/components/ErrorMessage.test.tsx` — renders when error non-null; does not render when null

## Dev Notes

### Existing Files to Modify
- `client/src/api/todos.ts` — add `updateTodo`, `deleteTodo`
- `client/src/hooks/useTodos.ts` — add `error` state, `completeTodo`, `deleteTodo`, fix `addTodo` rollback
- `client/src/components/TodoItem.tsx` — add buttons + completed styling
- `client/src/App.tsx` — wire `ErrorMessage`, pass new callbacks

### New Files
- `client/src/components/ErrorMessage.tsx`
- `client/src/components/ErrorMessage.test.tsx`

### API Layer Additions

```typescript
export async function updateTodo(id: string, completed: boolean): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json() as Promise<Todo>;
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete todo');
}
```

### Hook Pattern — `completeTodo`

```typescript
async function completeTodo(id: string) {
  const prev = todos;
  setTodos((t) => t.map((todo) => todo.id === id
    ? { ...todo, completed: true, completedAt: new Date().toISOString() }
    : todo
  ));
  try {
    const real = await updateTodo(id, true);
    setTodos((t) => t.map((todo) => todo.id === id ? real : todo));
    setError(null);
  } catch {
    setTodos(prev);
    setError('Failed to complete todo. Please try again.');
  }
}
```

### Hook Pattern — `deleteTodo`

```typescript
async function deleteTodo(id: string) {
  const prev = todos;
  setTodos((t) => t.filter((todo) => todo.id !== id));
  try {
    await apiDeleteTodo(id);
    setError(null);
  } catch {
    setTodos(prev);
    setError('Failed to delete todo. Please try again.');
  }
}
```

### Hook Pattern — `addTodo` rollback (fix from Story 1.3 deferral)

```typescript
// In addTodo, wrap the API call in try/catch:
try {
  const real = await createTodo(text);
  setTodos((prev) => prev.map((t) => (t.id === optimisticTodo.id ? real : t)));
  setError(null);
} catch {
  setTodos((prev) => prev.filter((t) => t.id !== optimisticTodo.id));
  setError('Failed to add todo. Please try again.');
}
```

### Visual Distinction for Completed Todos

```tsx
<span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
  {todo.text}
</span>
```

### `completeTodo` — uncomplete support

The PATCH endpoint supports `completed: false`. `completeTodo` should toggle — if already completed, uncomplete it. This simplifies the UI: the complete button is a toggle.

```typescript
async function completeTodo(id: string) {
  const current = todos.find((t) => t.id === id);
  if (!current) return;
  const newCompleted = !current.completed;
  // optimistic update, then PATCH with newCompleted
}
```

### Prop Threading

`App.tsx` → `TodoList` → `TodoItem` needs `onComplete` and `onDelete`. Update `TodoListProps` and `TodoItemProps` accordingly.

### Architecture Constraints (from architecture.md)
- All state in `useTodos` — components are presentational
- `error` state cleared on next successful operation
- No global state — error lives in `useTodos`

### Testing Notes
- Use `vi.mocked(updateTodo).mockRejectedValue(new Error('fail'))` for rollback tests
- Capture state before and after optimistic update using `renderHook` + `waitFor`
- `TodoItem` tests: pass `onComplete={vi.fn()}` / `onDelete={vi.fn()}` and verify they are called on click

### Review Findings

- [x] [Review][Decision] `completeTodo` toggle — decided: toggle behaviour is intentional; one button handles complete and uncomplete. AC1's "mark completed" is satisfied; un-completing is a bonus. [client/src/hooks/useTodos.ts]
- [x] [Review][Defer] Stale `prev` closure in rollback — `prev = todos` captures snapshot at call time; concurrent optimistic ops between the call and the catch could be silently discarded on rollback. Low practical risk for single-user app. [client/src/hooks/useTodos.ts]
- [x] [Review][Defer] `completeTodo` callable on optimistic todo (fake id) — if user clicks complete before `createTodo` resolves, PATCH fires with `optimistic-*` id, fails, shows spurious error. UX annoyance, no data loss. [client/src/hooks/useTodos.ts]
- [x] [Review][Defer] `fetchTodos` error silently shows empty list — no `setError` on initial load failure. Already deferred from story 1.3. [client/src/hooks/useTodos.ts]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `completeTodo` is a toggle — flips completed state, handles both complete and uncomplete in one function
- `addTodo` rollback (deferred from 1.3) implemented: removes optimistic todo and sets error on failure
- `completeTodo` and `deleteTodo` both capture `prev` state before optimistic update for clean rollback
- 56 total tests pass (35 client, 21 server)

### Change Log

- 2026-04-24: Story 1.4 implemented — complete/delete with optimistic updates, rollback, error state

### File List

- client/src/api/todos.ts (modified — added updateTodo, deleteTodo)
- client/src/api/todos.test.ts (modified — added updateTodo/deleteTodo tests)
- client/src/hooks/useTodos.ts (modified — added error, completeTodo, deleteTodo, fixed addTodo rollback)
- client/src/hooks/useTodos.test.ts (modified — added rollback/error tests)
- client/src/components/ErrorMessage.tsx (new)
- client/src/components/ErrorMessage.test.tsx (new)
- client/src/components/TodoItem.tsx (modified — added complete/delete buttons, visual distinction)
- client/src/components/TodoItem.test.tsx (modified — updated for new props)
- client/src/components/TodoList.tsx (modified — added onComplete/onDelete props)
- client/src/components/TodoList.test.tsx (modified — updated for new props)
- client/src/App.tsx (modified — wired ErrorMessage and new callbacks)
- client/src/App.test.tsx (modified — updated mock and added error test)
- server/package.json (modified — added -o flag to start/dev scripts)
