import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders empty state message', () => {
    render(<EmptyState />);
    expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
    expect(screen.getByText('Add a task above to get started.')).toBeInTheDocument();
  });
});
