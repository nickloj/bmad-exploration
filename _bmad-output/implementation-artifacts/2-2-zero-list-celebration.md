# Story 2.2: Zero-List Celebration

Status: review

## Story

As a user, I want an expressive celebration when I complete all my tasks, so that clearing my list feels like an accomplishment.

## Acceptance Criteria

1. When the last active todo is completed, a canvas-confetti celebration fires.
2. Celebration does not block UI — user can still add new tasks.
3. If `prefers-reduced-motion` is enabled, confetti is skipped.

## Tasks / Subtasks

- [x] Task 1: Install `canvas-confetti` and `@types/canvas-confetti`
- [x] Task 2: Add `shouldCelebrate` to `useTodos` — true when completing the last active todo
- [x] Task 3: Create `CelebrationOverlay.tsx` — fires confetti on trigger, respects reduced-motion
- [x] Task 4: Wire `CelebrationOverlay` into `App.tsx`
- [x] Task 5: Write tests
  - [x] `useTodos.test.ts`: shouldCelebrate true when last active todo completed
  - [x] `useTodos.test.ts`: shouldCelebrate false when active todos remain
  - [x] `CelebrationOverlay.test.tsx`: calls confetti when triggered, not when untriggered
  - [x] `CelebrationOverlay.test.tsx`: does not call confetti when prefers-reduced-motion

## Dev Notes

- `canvas-confetti` is already in the architecture plan
- `shouldCelebrate`: set true in `completeTodo` when `todos.filter(t => !t.completed).length === 1` (the one being completed is the last active)
- After firing, reset `shouldCelebrate` to false
- Reduced motion: `window.matchMedia('(prefers-reduced-motion: reduce)').matches`

### Review Findings

- [x] [Review][Decision] prefers-reduced-motion — resolved: skip is sufficient (no confetti, no alternative).
- [x] [Review][Patch] `useCallback` on `dismissCelebration` — fixed: prevents useEffect re-trigger in CelebrationOverlay. [client/src/hooks/useTodos.ts]
- [x] [Review][Patch] Confetti fires optimistically — fixed: `setShouldCelebrate(true)` moved before `await updateTodo`; rolls back on failure. [client/src/hooks/useTodos.ts]
- [x] [Review][Patch] Screen reader announcement — fixed: `CelebrationOverlay` now renders `role="status" aria-live="polite"` div announcing "All todos complete!". [client/src/components/CelebrationOverlay.tsx]
- [x] [Review][Defer] `willCelebrate` race condition on concurrent calls — same stale-closure concern as story 1.4; low risk for single-user app.
- [x] [Review][Defer] `setShouldCelebrate(false)` in addTodo/removeTodo success paths — intentional design; adding/deleting resets celebration state. Acceptable coupling.

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### File List
