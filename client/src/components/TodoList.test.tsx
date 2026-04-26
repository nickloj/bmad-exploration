import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoList } from './TodoList';
import type { Todo } from '../../../shared/types/todo';

const makeTodo = (id: string, text: string): Todo => ({
  id,
  text,
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
});

const noop = vi.fn();
const getOpacity = () => 1;

describe('TodoList', () => {
  it('renders a TodoItem for each todo', () => {
    const todos = [makeTodo('1', 'First task'), makeTodo('2', 'Second task')];
    render(<TodoList todos={todos} isLoading={false} getOpacity={getOpacity} onComplete={noop} onDelete={noop} />);
    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('shows EmptyState when todos array is empty and not loading', () => {
    render(<TodoList todos={[]} isLoading={false} getOpacity={getOpacity} onComplete={noop} onDelete={noop} />);
    expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
  });

  it('shows LoadingState when isLoading is true', () => {
    render(<TodoList todos={[]} isLoading={true} getOpacity={getOpacity} onComplete={noop} onDelete={noop} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('No tasks yet.')).not.toBeInTheDocument();
  });
});
