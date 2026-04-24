import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders loading indicator', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('has aria-live for screen readers', () => {
    const { container } = render(<LoadingState />);
    expect(container.firstChild).toHaveAttribute('aria-live', 'polite');
  });
});
