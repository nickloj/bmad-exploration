# Story 3.2: List Length Warning & Hoarding Nudge

Status: done

## Story

As a user, I want a visual indicator when my list gets too long, so I'm gently nudged to complete or clean up tasks.

## Acceptance Criteria

1. When active (non-completed) todos exceed a threshold, a subtle visual indicator appears.
2. When the active count drops back to or below threshold, the indicator disappears.
3. The threshold is configurable via a constant (default: 7).
4. The indicator is a nudge — not punishing or alarming.

## Tasks / Subtasks

- [x] Task 1: Add `MAX_ACTIVE_THRESHOLD = 7` to `client/src/lib/fade.ts`
- [x] Task 2: Expose `isOverloaded` from `useTodos` — true when active count > threshold
- [x] Task 3: Create `HoardingNudge.tsx` — renders a subtle amber banner when `isOverloaded`
- [x] Task 4: Wire `HoardingNudge` into `App.tsx`
- [x] Task 5: Write tests
  - [x] `useTodos.test.ts`: isOverloaded true when active > threshold; false when ≤ threshold
  - [x] `HoardingNudge.test.tsx`: renders when isOverloaded; hidden when not
  - [x] Threshold boundary: at exactly 7 — no nudge; at 8 — nudge appears

## Dev Notes

### Constant
```typescript
export const MAX_ACTIVE_THRESHOLD = 7;
```

### useTodos
```typescript
const activeTodos = todos.filter(t => !t.completed);
const isOverloaded = activeTodos.length > MAX_ACTIVE_THRESHOLD;
// expose isOverloaded
```

### HoardingNudge.tsx
```tsx
export function HoardingNudge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <p role="status" className="text-center text-sm text-amber-600 mt-3">
      Your list is getting long — try completing a few tasks first.
    </p>
  );
}
```

### Review Findings

- [x] [Review][Patch] `HoardingNudge` conditional render — fixed: always renders; toggles between `opacity-100` and `opacity-0 pointer-events-none` with `transition-opacity duration-500`. [client/src/components/HoardingNudge.tsx]
- [x] [Review][Defer] Interactive buttons remain clickable while `<li>` fades — opacity is applied to the entire row including complete/delete buttons; they become hard to see but remain interactive. 15s fade window makes accidental interaction unlikely; disable with `pointer-events-none` in a future accessibility pass.

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### File List
