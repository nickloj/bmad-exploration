interface HoardingNudgeProps {
  active: boolean;
}

export function HoardingNudge({ active }: HoardingNudgeProps) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-center text-sm text-amber-600 mt-3 transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      Your list is getting long — try completing a few tasks first.
    </p>
  );
}
