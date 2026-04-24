# Story 2.3: Application States Polish

Status: review

## Story

As a user, I want clear visual feedback for loading, empty, and error states, so the app always feels responsive.

## Acceptance Criteria

1. Loading state displayed during initial fetch.
2. Empty state with meaningful message when no todos and not loading.
3. Inline error message on failure; clears on next successful action.
4. All interactive elements keyboard-navigable; touch targets ≥ 44×44px; non-color status indicators.

## Tasks / Subtasks

- [x] Task 1: Extract `LoadingState.tsx` component
- [x] Task 2: Fix `fetchTodos` error handling — set `error` state on initial load failure
- [x] Task 3: Fix `TodoItem` touch targets — complete and delete buttons now `min-w-[44px] min-h-[44px]`
- [x] Task 4: Write tests
  - [x] `LoadingState.test.tsx`: renders loading indicator
  - [x] `useTodos.test.ts`: fetchTodos failure sets error state
  - [x] `TodoItem.test.tsx`: complete button keyboard accessible (role=button, aria-label)

## Dev Notes

- TodoItem buttons are already `<button>` elements → keyboard nav works out of the box
- Non-color status: strikethrough already present; complete button color change is supplementary
- Touch target fix: replace `w-5 h-5` with padding approach or `min-w-[44px] min-h-[44px]` with centered icon
- fetchTodos error: add `.catch((e) => setError(e.message || 'Failed to load todos'))` to useEffect chain

### Review Findings

- [x] [Review][Decision] Complete button color-only — resolved: row-level `line-through + opacity-60` provides sufficient non-color indicator; button supplementary.
- [x] [Review][Patch] `LoadingState` conflicting ARIA — fixed: removed `aria-label` from live region container. [client/src/components/LoadingState.tsx]
- [x] [Review][Defer] Initial load error not dismissible/retriable — no retry button. Out of scope for this story; the error message exists and is inline. Address in a future polish pass.

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### File List
