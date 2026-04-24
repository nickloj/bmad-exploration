import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodos } from './useTodos';
import type { Todo } from '../../../shared/types/todo';

vi.mock('../api/todos', () => ({
  fetchTodos: vi.fn(),
  createTodo: vi.fn(),
}));

import { fetchTodos, createTodo } from '../api/todos';

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
    vi.mocked(createTodo).mockReturnValue(
      new Promise<Todo>((res) => { resolveCreate = res; }),
    );

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { void result.current.addTodo('New task'); });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('New task');
    expect(result.current.todos[0].id).toMatch(/^optimistic-[0-9a-f-]{36}$/);

    const real = makeTodo({ id: 'real-id', text: 'New task' });
    await act(async () => { resolveCreate(real); });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe('real-id');
  });
});
