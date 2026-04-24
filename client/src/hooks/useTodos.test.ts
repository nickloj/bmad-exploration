import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodos } from './useTodos';
import type { Todo } from '../../../shared/types/todo';

vi.mock('../api/todos', () => ({
  fetchTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../api/todos';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'real-id',
  text: 'A task',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.mocked(fetchTodos).mockResolvedValue([]);
  vi.mocked(createTodo).mockResolvedValue(makeTodo());
  vi.mocked(updateTodo).mockResolvedValue(makeTodo({ completed: true }));
  vi.mocked(deleteTodo).mockResolvedValue(undefined);
});

describe('useTodos', () => {
  it('initializes with isLoading=true, fetches todos, sets isLoading=false', async () => {
    const todos = [makeTodo({ id: '1', text: 'First' })];
    vi.mocked(fetchTodos).mockResolvedValue(todos);

    const { result } = renderHook(() => useTodos());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.todos).toEqual(todos);
  });

  it('addTodo optimistically adds todo to state before API resolves', async () => {
    let resolveCreate!: (t: Todo) => void;
    vi.mocked(createTodo).mockReturnValue(new Promise<Todo>((res) => { resolveCreate = res; }));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { void result.current.addTodo('New task'); });
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toMatch(/^optimistic-[0-9a-f-]{36}$/);

    const real = makeTodo({ id: 'real-id', text: 'New task' });
    await act(async () => { resolveCreate(real); });
    expect(result.current.todos[0].id).toBe('real-id');
    expect(result.current.error).toBeNull();
  });

  it('addTodo rolls back and sets error on API failure', async () => {
    vi.mocked(createTodo).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.addTodo('New task').catch(() => {}); });

    expect(result.current.todos).toHaveLength(0);
    expect(result.current.error).toBe('Failed to add todo. Please try again.');
  });

  it('completeTodo optimistically sets completed in state', async () => {
    const todo = makeTodo({ id: 'todo-1', completed: false });
    vi.mocked(fetchTodos).mockResolvedValue([todo]);
    vi.mocked(updateTodo).mockResolvedValue({ ...todo, completed: true, completedAt: '2026-01-02T00:00:00.000Z' });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.completeTodo('todo-1'); });

    expect(result.current.todos[0].completed).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('completeTodo rolls back to previous state on API failure', async () => {
    const todo = makeTodo({ id: 'todo-1', completed: false });
    vi.mocked(fetchTodos).mockResolvedValue([todo]);
    vi.mocked(updateTodo).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.completeTodo('todo-1'); });

    expect(result.current.todos[0].completed).toBe(false);
    expect(result.current.error).toBe('Failed to update todo. Please try again.');
  });

  it('deleteTodo optimistically removes todo from state', async () => {
    const todo = makeTodo({ id: 'todo-1' });
    vi.mocked(fetchTodos).mockResolvedValue([todo]);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.deleteTodo('todo-1'); });

    expect(result.current.todos).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('deleteTodo rolls back (todo reappears) on API failure', async () => {
    const todo = makeTodo({ id: 'todo-1' });
    vi.mocked(fetchTodos).mockResolvedValue([todo]);
    vi.mocked(deleteTodo).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.deleteTodo('todo-1'); });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.error).toBe('Failed to delete todo. Please try again.');
  });
});
