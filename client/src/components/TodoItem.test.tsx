import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoItem } from './TodoItem';
import type { Todo } from '../../../shared/types/todo';

const todo: Todo = {
  id: 'id-1',
  text: 'Buy groceries',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
};

describe('TodoItem', () => {
  it('displays the todo text', () => {
    render(<TodoItem todo={todo} />);
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });
});
