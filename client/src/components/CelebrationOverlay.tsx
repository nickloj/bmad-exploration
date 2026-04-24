import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationOverlayProps {
  active: boolean;
  onDismiss: () => void;
}

export function CelebrationOverlay({ active, onDismiss }: CelebrationOverlayProps) {
  useEffect(() => {
    if (!active) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      void confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [active, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {active ? 'All todos complete!' : ''}
    </div>
  );
}
