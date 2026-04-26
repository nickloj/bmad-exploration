import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HoardingNudge } from './HoardingNudge';

describe('HoardingNudge', () => {
  it('is visible (opacity-100) when active is true', () => {
    render(<HoardingNudge active={true} />);
    const el = screen.getByRole('status');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('opacity-100');
    expect(el.className).not.toContain('opacity-0');
  });

  it('is hidden (opacity-0) when active is false', () => {
    render(<HoardingNudge active={false} />);
    const el = screen.getByRole('status');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('opacity-0');
    expect(el.className).not.toContain('opacity-100');
  });

  it('has transition class for smooth appearance', () => {
    render(<HoardingNudge active={true} />);
    expect(screen.getByRole('status').className).toContain('transition-opacity');
  });
});
