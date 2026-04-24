import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error text when error is non-null', () => {
    render(<ErrorMessage error="Something went wrong" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render when error is null', () => {
    render(<ErrorMessage error={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
