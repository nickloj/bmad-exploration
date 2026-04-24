# Story 1.3: Frontend Todo List & API Integration

Status: done

## Story

As a user,
I want to see my list of todos when I open the app and add new tasks,
so that I can start tracking what I need to do.

## Acceptance Criteria

1. **Given** the user opens the app, **When** the page loads, **Then** all persisted todos are fetched from the API and displayed in a list.

2. **Given** the todo list is displayed, **When** the user types a task description and submits, **Then** the todo appears in the list immediately via optimistic update **And** the todo is persisted via the API.

3. **Given** no todos exist, **When** the user opens the app, **Then** a meaningful empty state is displayed prompting the user to add a task.

## Tasks / Subtasks

- [x] Task 1: Create API layer (AC: #1, #2)
  - [x] Create `client/src/api/todos.ts` with `fetchTodos()` and `createTodo(text)`
  - [x] `fetchTodos` calls GET /api/todos and returns parsed `Todo[]`
  - [x] `createTodo` calls POST /api/todos with `{ text }` and returns `Todo`

- [x] Task 2: Create `useTodos` hook (AC: #1, #2, #3)
  - [x] Create `client/src/hooks/useTodos.ts`
  - [x] Hook initializes with `isLoading=true`, fetches todos on mount, sets `isLoading=false`
  - [x] `addTodo(text)` optimistically adds a placeholder todo to state before API resolves, then replaces with real todo
  - [x] Exposes `{ todos, isLoading, addTodo }`

- [x] Task 3: Create presentational components (AC: #1, #2, #3)
  - [x] Create `client/src/components/EmptyState.tsx` — renders when todos is empty and isLoading is false
  - [x] Create `client/src/components/TodoItem.tsx` — displays todo text
  - [x] Create `client/src/components/TodoList.tsx` — renders `TodoItem` for each todo; shows `EmptyState` when empty
  - [x] Create `client/src/components/TodoInput.tsx` — input field + submit button; calls `addTodo`; clears input after submit; does not submit empty input

- [x] Task 4: Wire up `App.tsx` (AC: #1, #2, #3)
  - [x] Update `client/src/App.tsx` to use `useTodos` hook and compose `TodoInput` + `TodoList`

- [x] Task 5: Write tests (AC: all)
  - [x] `client/src/api/todos.test.ts` — unit tests for fetchTodos and createTodo (mock fetch)
  - [x] `client/src/hooks/useTodos.test.ts` — unit tests for loading state, addTodo optimistic update
  - [x] `client/src/components/TodoInput.test.tsx` — renders, submit calls addTodo, clears input, empty input does not call addTodo
  - [x] `client/src/components/TodoList.test.tsx` — renders TodoItem for each todo
  - [x] `client/src/components/TodoItem.test.tsx` — displays todo text
  - [x] `client/src/components/EmptyState.test.tsx` — renders when todos is empty and not loading

### Review Findings

- [x] [Review][Patch] Optimistic ID collision — fixed: replaced `Date.now()` with `crypto.randomUUID()`. [client/src/hooks/useTodos.ts:17]
- [x] [Review][Patch] No client-side `maxLength` on input — fixed: added `maxLength={200}`. [client/src/components/TodoInput.tsx:22]
- [x] [Review][Defer] Optimistic todo not rolled back on `createTodo` failure — phantom stays in list until reload. Explicitly deferred to Story 1.4 which adds error handling and rollback. [client/src/hooks/useTodos.ts:24]
- [x] [Review][Defer] `fetchTodos` error silently shows EmptyState — no error signal to user. Deferred to Story 1.4. [client/src/hooks/useTodos.ts:10]
- [x] [Review][Defer] `createTodo` error discards server error details — generic message only. Deferred to Story 1.4. [client/src/api/todos.ts:14]
- [x] [Review][Defer] Optimistic `createdAt` uses client clock — replaced by server timestamp when real response arrives; only visible during the brief optimistic window. Acceptable for this story. [client/src/hooks/useTodos.ts:20]
- [x] [Review][Defer] No `useEffect` cleanup / AbortController — stale state update on unmount possible. Pre-existing React pattern; low risk in this app. [client/src/hooks/useTodos.ts:9]

## Dev Notes

### Tech Stack
- React 19 + TypeScript, Vite, Tailwind CSS, Vitest, @testing-library/react
- Test environment: jsdom; setup file: `client/src/test-setup.ts` (imports jest-dom matchers)

### Shared Types
Shared types in `shared/types/todo.ts` are included via `tsconfig.app.json` (`"include": ["src", "../shared"]`).
Import as: `import type { Todo } from '../../shared/types/todo'`

### API Base URL
Vite proxy forwards `/api` to `http://localhost:3000` in dev. Use relative URLs: `/api/todos`.

### API Layer Pattern (`client/src/api/todos.ts`)
```typescript
import type { Todo } from '../../shared/types/todo';

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch('/api/todos');
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}
```

### Hook Pattern (`client/src/hooks/useTodos.ts`)
- State: `todos: Todo[]`, `isLoading: boolean`
- `useEffect` calls `fetchTodos()` on mount; sets `isLoading=false` after
- `addTodo(text)`: optimistic — immediately push a temp todo (id = `optimistic-${Date.now()}`), call API, replace temp with real response
- Story 1.3 scope: no error state needed (added in story 1.4)

### Component Architecture
- All state in `useTodos` hook; components are pure/presentational
- `App.tsx` calls `useTodos()`, passes data down as props
- No direct API calls from components

### Testing Approach
- API tests: use `vi.stubGlobal('fetch', ...)` to mock `fetch`
- Hook tests: use `renderHook` from `@testing-library/react`; wrap in `act` for state updates; mock `../../api/todos` module
- Component tests: use `render` + `screen` from `@testing-library/react`; use `userEvent` for interactions

### `userEvent` Import
`@testing-library/user-event` is NOT installed. Use `fireEvent` from `@testing-library/react` for simulating events.

### Vitest Config (client)
Located at `client/vitest.config.ts`. Environment: jsdom. Globals: true.

### Project Structure
```
client/src/
  api/
    todos.ts
    todos.test.ts
  hooks/
    useTodos.ts
    useTodos.test.ts
  components/
    TodoInput.tsx
    TodoInput.test.tsx
    TodoList.tsx
    TodoList.test.tsx
    TodoItem.tsx
    TodoItem.test.tsx
    EmptyState.tsx
    EmptyState.test.tsx
  App.tsx          (update)
  App.test.tsx     (update)
```

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented API layer (`fetchTodos`, `createTodo`) with relative URLs for Vite proxy compatibility
- `useTodos` hook: fetch on mount with loading state; optimistic add replaces temp id with real id after API resolves
- 4 presentational components: `EmptyState`, `TodoItem`, `TodoList` (shows loading/empty/list states), `TodoInput` (trims whitespace, clears after submit)
- `App.tsx` wired up as composition root; passes hook data as props
- 18 client tests pass; 21 server tests pass; 0 regressions

### Change Log

- 2026-04-24: Story 1.3 implemented — frontend todo list with API integration, optimistic add, empty state

### File List

- client/src/api/todos.ts (new)
- client/src/api/todos.test.ts (new)
- client/src/hooks/useTodos.ts (new)
- client/src/hooks/useTodos.test.ts (new)
- client/src/components/EmptyState.tsx (new)
- client/src/components/EmptyState.test.tsx (new)
- client/src/components/TodoItem.tsx (new)
- client/src/components/TodoItem.test.tsx (new)
- client/src/components/TodoList.tsx (new)
- client/src/components/TodoList.test.tsx (new)
- client/src/components/TodoInput.tsx (new)
- client/src/components/TodoInput.test.tsx (new)
- client/src/App.tsx (modified)
- client/src/App.test.tsx (modified)
