import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    vi.mocked(updateTodo).mockResolvedValue({ ...todo, completed: true, completedAt: new Date().toISOString() });

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

  it('sets shouldCelebrate optimistically when completing the last active todo', async () => {
    const todo = makeTodo({ id: 'todo-1', completed: false });
    vi.mocked(fetchTodos).mockResolvedValue([todo]);
    let resolve!: (t: Todo) => void;
    vi.mocked(updateTodo).mockReturnValue(new Promise<Todo>((res) => { resolve = res; }));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { void result.current.completeTodo('todo-1'); });
    // Celebration fires optimistically — before API resolves
    expect(result.current.shouldCelebrate).toBe(true);

    await act(async () => { resolve({ ...todo, completed: true }); });
    expect(result.current.shouldCelebrate).toBe(true);
  });

  it('resets shouldCelebrate on API failure', async () => {
    const todo = makeTodo({ id: 'todo-1', completed: false });
    vi.mocked(fetchTodos).mockResolvedValue([todo]);
    vi.mocked(updateTodo).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.completeTodo('todo-1'); });

    expect(result.current.shouldCelebrate).toBe(false);
  });

  it('does not set shouldCelebrate when active todos remain', async () => {
    const todos = [
      makeTodo({ id: 'todo-1', completed: false }),
      makeTodo({ id: 'todo-2', completed: false }),
    ];
    vi.mocked(fetchTodos).mockResolvedValue(todos);
    vi.mocked(updateTodo).mockResolvedValue({ ...todos[0], completed: true });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.completeTodo('todo-1'); });

    expect(result.current.shouldCelebrate).toBe(false);
  });

  it('sets error when fetchTodos fails on mount', async () => {
    vi.mocked(fetchTodos).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Failed to load todos. Please refresh.');
  });

  it('visibleTodos excludes todos with fully-faded opacity (completedAt far in past)', async () => {
    const fadedTodo = makeTodo({
      id: 'faded',
      completed: true,
      completedAt: new Date(Date.now() - 25_000).toISOString(), // past full fade
    });
    vi.mocked(fetchTodos).mockResolvedValue([fadedTodo]);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.todos.find((t) => t.id === 'faded')).toBeUndefined();
  });

  it('visibleTodos includes recently completed todos (not yet faded)', async () => {
    const freshTodo = makeTodo({
      id: 'fresh',
      completed: true,
      completedAt: new Date().toISOString(), // just completed
    });
    vi.mocked(fetchTodos).mockResolvedValue([freshTodo]);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.todos.find((t) => t.id === 'fresh')).toBeDefined();
  });

  it('getOpacity returns 1 for active todos', async () => {
    const todo = makeTodo({ id: 'active', completed: false });
    vi.mocked(fetchTodos).mockResolvedValue([todo]);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.getOpacity(todo)).toBe(1);
  });

  it('isOverloaded is false when active todos <= threshold', async () => {
    vi.mocked(fetchTodos).mockResolvedValue([makeTodo(), makeTodo({ id: '2' })]);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isOverloaded).toBe(false);
  });

  it('isOverloaded is true when active todos > MAX_ACTIVE_THRESHOLD (7)', async () => {
    const manyTodos = Array.from({ length: 8 }, (_, i) =>
      makeTodo({ id: `t${i}`, completed: false }),
    );
    vi.mocked(fetchTodos).mockResolvedValue(manyTodos);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isOverloaded).toBe(true);
  });

  it('isOverloaded is false at exactly the threshold (7)', async () => {
    const exactThreshold = Array.from({ length: 7 }, (_, i) =>
      makeTodo({ id: `t${i}`, completed: false }),
    );
    vi.mocked(fetchTodos).mockResolvedValue(exactThreshold);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isOverloaded).toBe(false);
  });

  it('dismissCelebration sets shouldCelebrate to false', async () => {
    const todo = makeTodo({ id: 'todo-1', completed: false });
    vi.mocked(fetchTodos).mockResolvedValue([todo]);
    vi.mocked(updateTodo).mockResolvedValue({ ...todo, completed: true, completedAt: new Date().toISOString() });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Trigger celebration
    await act(async () => { await result.current.completeTodo('todo-1'); });
    expect(result.current.shouldCelebrate).toBe(true);

    // Dismiss it
    act(() => { result.current.dismissCelebration(); });
    expect(result.current.shouldCelebrate).toBe(false);
  });

  it('tick interval evicts fully-faded todos from state', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const fadedAt = new Date(Date.now() - 25_000).toISOString(); // past full fade threshold
    const fadedTodo = makeTodo({ id: 'fading', completed: true, completedAt: fadedAt });
    vi.mocked(fetchTodos).mockResolvedValue([fadedTodo]);

    const { result } = renderHook(() => useTodos());

    // Drain the fetchTodos microtask
    await act(async () => { await vi.runAllTimersAsync(); });

    // Advance 1s so the setInterval callback fires
    await act(async () => { await vi.advanceTimersByTimeAsync(1001); });

    expect(result.current.todos.find((t) => t.id === 'fading')).toBeUndefined();
    vi.useRealTimers();
  });
});
