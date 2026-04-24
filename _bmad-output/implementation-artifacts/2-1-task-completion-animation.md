# Story 2.1: Task Completion Animation

Status: review

## Story

As a user, I want a satisfying visual animation when I complete a task, so that completing tasks feels rewarding.

## Acceptance Criteria

1. When user marks a todo complete, a CSS transition plays (strikethrough sweep / fade).
2. Animation runs at 60fps and does not block interaction with other todos.
3. If `prefers-reduced-motion` is enabled, animation is skipped or minimized.

## Tasks / Subtasks

- [x] Task 1: Add CSS transition to `TodoItem` text span for the completed→active toggle
  - [x] Add `transition-all duration-300` to the text span
  - [x] Use `motion-reduce:transition-none` for reduced-motion support
- [x] Task 2: Write tests
  - [x] `TodoItem.test.tsx`: completing a todo adds transition CSS class
  - [x] `TodoItem.test.tsx`: reduced-motion variant present in className

## Dev Notes

- Tailwind `transition-all duration-300` on the `<span>` gives a smooth cross-fade as classes swap
- `motion-reduce:transition-none` disables transitions when OS prefers-reduced-motion
- No JS needed — pure CSS transitions on class changes

### Review Findings

- [x] [Review][Decision] Strikethrough sweep — resolved: implemented `@keyframes strikethrough-sweep` pseudo-element animation in `index.css`; `.strikethrough-sweep` class applied when completed.
- [x] [Review][Patch] Screen reader announcement — addressed via `CelebrationOverlay` `role="status"` region (story 2.2 patch).
- [x] [Review][Defer] Fade transition fragile on simultaneous class set — classes swap atomically with state update; transition still fires on re-render. Low risk in practice.

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### File List
