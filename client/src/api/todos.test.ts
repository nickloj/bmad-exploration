import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTodos, createTodo } from './todos';
import type { Todo } from '../../../shared/types/todo';

const mockTodo: Todo = {
  id: 'abc-123',
  text: 'Test todo',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchTodos', () => {
  it('calls GET /api/todos and returns parsed Todo[]', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockTodo]),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchTodos();

    expect(fetchMock).toHaveBeenCalledWith('/api/todos');
    expect(result).toEqual([mockTodo]);
  });

  it('throws when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await expect(fetchTodos()).rejects.toThrow('Failed to fetch todos');
  });
});

describe('createTodo', () => {
  it('calls POST /api/todos with text and returns new Todo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTodo),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createTodo('Test todo');

    expect(fetchMock).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test todo' }),
    });
    expect(result).toEqual(mockTodo);
  });

  it('throws when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await expect(createTodo('Test')).rejects.toThrow('Failed to create todo');
  });
});
