import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./hooks/useTodos', () => ({
  useTodos: () => ({
    todos: [],
    isLoading: false,
    error: null,
    shouldCelebrate: false,
    isOverloaded: false,
    dismissCelebration: vi.fn(),
    getOpacity: () => 1,
    addTodo: vi.fn(),
    completeTodo: vi.fn(),
    deleteTodo: vi.fn(),
  }),
}));

vi.mock('./components/CelebrationOverlay', () => ({
  CelebrationOverlay: () => null,
}));

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('My Todos')).toBeInTheDocument();
  });

  it('renders TodoInput and TodoList', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Add a new task...')).toBeInTheDocument();
    expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
  });

  it('does not render error message when error is null', () => {
    render(<App />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
