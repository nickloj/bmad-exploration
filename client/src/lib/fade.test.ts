import { describe, it, expect } from 'vitest';
import { getFadeOpacity, FADE_START_MS, FADE_DURATION_MS } from './fade';

const NOW = 1_000_000;
const completedAt = new Date(NOW - 0).toISOString(); // completed right now

describe('getFadeOpacity', () => {
  it('returns 1 when completedAt is null (active todo)', () => {
    expect(getFadeOpacity(null, NOW)).toBe(1);
  });

  it('returns 1 when elapsed time is less than FADE_START_MS', () => {
    const recentCompleted = new Date(NOW - FADE_START_MS + 1000).toISOString();
    expect(getFadeOpacity(recentCompleted, NOW)).toBe(1);
  });

  it('returns 1 at exactly FADE_START_MS elapsed', () => {
    const at = new Date(NOW - FADE_START_MS).toISOString();
    expect(getFadeOpacity(at, NOW)).toBe(1);
  });

  it('returns decreasing opacity during fade window', () => {
    const halfFade = new Date(NOW - FADE_START_MS - FADE_DURATION_MS / 2).toISOString();
    const opacity = getFadeOpacity(halfFade, NOW);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
    expect(opacity).toBeCloseTo(0.5, 1);
  });

  it('returns 0 after full fade duration has elapsed', () => {
    const fullyFaded = new Date(NOW - FADE_START_MS - FADE_DURATION_MS).toISOString();
    expect(getFadeOpacity(fullyFaded, NOW)).toBe(0);
  });

  it('returns 0 (not negative) past the fade duration', () => {
    const wayOld = new Date(NOW - FADE_START_MS - FADE_DURATION_MS * 2).toISOString();
    expect(getFadeOpacity(wayOld, NOW)).toBe(0);
  });

  it('returns 1 for invalid completedAt string (NaN guard)', () => {
    expect(getFadeOpacity('not-a-date', NOW)).toBe(1);
    expect(getFadeOpacity('', NOW)).toBe(1);
  });

  it('newer completed todo has higher opacity than older one', () => {
    const newer = new Date(NOW - FADE_START_MS - 1000).toISOString();
    const older = new Date(NOW - FADE_START_MS - 10_000).toISOString();
    expect(getFadeOpacity(newer, NOW)).toBeGreaterThan(getFadeOpacity(older, NOW));
  });
});

void completedAt; // suppress unused warning
