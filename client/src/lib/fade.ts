export const FADE_START_MS = 5_000;
export const FADE_DURATION_MS = 15_000;
export const MAX_ACTIVE_THRESHOLD = 7;

export function getFadeOpacity(completedAt: string | null, now: number): number {
  if (!completedAt) return 1;
  const elapsed = now - new Date(completedAt).getTime();
  if (isNaN(elapsed) || elapsed < FADE_START_MS) return 1;
  return Math.max(0, 1 - (elapsed - FADE_START_MS) / FADE_DURATION_MS);
}
