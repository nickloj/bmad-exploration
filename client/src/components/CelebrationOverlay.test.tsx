import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { CelebrationOverlay } from './CelebrationOverlay';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import confetti from 'canvas-confetti';

beforeEach(() => {
  vi.mocked(confetti).mockClear();
  vi.useFakeTimers();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CelebrationOverlay', () => {
  it('calls confetti when active is true', () => {
    render(<CelebrationOverlay active={true} onDismiss={vi.fn()} />);
    expect(confetti).toHaveBeenCalledOnce();
  });

  it('does not call confetti when active is false', () => {
    render(<CelebrationOverlay active={false} onDismiss={vi.fn()} />);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('does not call confetti when prefers-reduced-motion is enabled', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    render(<CelebrationOverlay active={true} onDismiss={vi.fn()} />);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('announces to screen readers when active', () => {
    render(<CelebrationOverlay active={true} onDismiss={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('All todos complete!');
  });

  it('screen reader region is empty when not active', () => {
    render(<CelebrationOverlay active={false} onDismiss={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('calls onDismiss after 3 seconds', async () => {
    const onDismiss = vi.fn();
    render(<CelebrationOverlay active={true} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
