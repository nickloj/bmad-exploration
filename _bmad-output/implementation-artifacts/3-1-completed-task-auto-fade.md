# Story 3.1: Completed Task Auto-Fade

Status: done

## Story

As a user, I want completed tasks to gradually fade and disappear over time, so that my list stays clean without manual deletion.

## Acceptance Criteria

1. When a todo is marked complete, its visual opacity decreases over a configurable time period, then it is removed from the visible list.
2. Newer completed todos are more visible than older ones.
3. Fade is driven by comparing current time to `completedAt` on the client side.
4. Fade duration is configurable via constants.

## Tasks / Subtasks

- [x] Task 1: Create `client/src/lib/fade.ts` with `FADE_START_MS`, `FADE_DURATION_MS` constants and `getFadeOpacity(completedAt, now)` function
- [x] Task 2: Add `now` tick to `useTodos` — setInterval every 1s when completed todos exist; expose `visibleTodos` (filtered) and `getOpacity(todo)` function
- [x] Task 3: Update `TodoItem` — add `fadeOpacity` prop; apply as inline `style={{ opacity }}`; opacity-60 replaced
- [x] Task 4: Update `TodoList` + `App.tsx` to pass `getOpacity` down to `TodoItem`
- [x] Task 5: Write tests
  - [x] `fade.test.ts`: full opacity before fade starts; decreasing opacity during fade; 0 after full fade
  - [x] `useTodos.test.ts`: visibleTodos excludes fully-faded todos; getOpacity returns correct value
  - [x] `TodoItem.test.tsx`: renders with correct inline opacity style

## Dev Notes

### Constants (`client/src/lib/fade.ts`)
```typescript
export const FADE_START_MS = 5_000;
export const FADE_DURATION_MS = 15_000;

export function getFadeOpacity(completedAt: string | null, now: number): number {
  if (!completedAt) return 1;
  const elapsed = now - new Date(completedAt).getTime();
  if (elapsed < FADE_START_MS) return 1;
  return Math.max(0, 1 - (elapsed - FADE_START_MS) / FADE_DURATION_MS);
}
```

### useTodos additions
- `const [now, setNow] = useState(Date.now())`
- useEffect: starts interval only while completed todos exist; cleans up on unmount
- `visibleTodos = todos.filter(t => !t.completed || getFadeOpacity(t.completedAt, now) > 0)`
- `getOpacity = (todo: Todo) => getFadeOpacity(todo.completedAt, now)`

### TodoItem change
- Replace `opacity-60` Tailwind class with inline `style={{ opacity: fadeOpacity }}`
- Keep `strikethrough-sweep` and `line-through text-gray-400` classes

### Review Findings

- [x] [Review][Patch] Invalid `completedAt` string NaN guard — fixed: `if (isNaN(elapsed) || elapsed < FADE_START_MS) return 1`. [client/src/lib/fade.ts]
- [x] [Review][Patch] Faded todos never evicted from state — fixed: tick callback now calls `setTodos(prev => prev.filter(...))` to evict fully-faded todos, stopping the interval when none remain. [client/src/hooks/useTodos.ts]
- [x] [Review][Defer] Abrupt final-frame removal — item is filtered from `visibleTodos` the same tick its opacity hits 0; CSS transition can't complete on a removed element. Low visual impact since opacity is already near-zero; address in a visual-polish pass.
- [x] [Review][Defer] Future `completedAt` (clock skew) — negative `elapsed` always returns 1; item never fades. Low probability; acceptable for now.
- [x] [Review][Defer] Stale `now` on first render — up to 1s window before first tick fires; cosmetic.

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### File List
