import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoItem } from './TodoItem';
import type { Todo } from '../../../shared/types/todo';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'id-1',
  text: 'Buy groceries',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
  ...overrides,
});

describe('TodoItem', () => {
  it('displays the todo text', () => {
    render(<TodoItem todo={makeTodo()} onComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  it('active todo does not have strikethrough', () => {
    render(<TodoItem todo={makeTodo({ completed: false })} onComplete={vi.fn()} onDelete={vi.fn()} />);
    const text = screen.getByText('Buy groceries');
    expect(text.className).not.toContain('line-through');
  });

  it('completed todo renders with visual distinction (strikethrough + muted color)', () => {
    render(<TodoItem todo={makeTodo({ completed: true })} onComplete={vi.fn()} onDelete={vi.fn()} />);
    const text = screen.getByText('Buy groceries');
    expect(text.className).toContain('line-through');
    expect(text.className).toContain('text-gray-400');
  });

  it('clicking complete button triggers onComplete with todo id', () => {
    const onComplete = vi.fn();
    render(<TodoItem todo={makeTodo()} onComplete={onComplete} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(onComplete).toHaveBeenCalledWith('id-1');
  });

  it('clicking delete button triggers onDelete with todo id', () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={makeTodo()} onComplete={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete todo' }));
    expect(onDelete).toHaveBeenCalledWith('id-1');
  });

  it('completed todo complete button has aria-label "Mark incomplete"', () => {
    render(<TodoItem todo={makeTodo({ completed: true })} onComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Mark incomplete' })).toBeInTheDocument();
  });
});
