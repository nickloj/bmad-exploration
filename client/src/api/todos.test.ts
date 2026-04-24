import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './todos';
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

describe('updateTodo', () => {
  it('calls PATCH /api/todos/:id with completed and returns updated Todo', async () => {
    const updated = { ...mockTodo, completed: true, completedAt: '2026-01-02T00:00:00.000Z' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updated),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await updateTodo('abc-123', true);

    expect(fetchMock).toHaveBeenCalledWith('/api/todos/abc-123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    expect(result).toEqual(updated);
  });

  it('throws when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(updateTodo('abc-123', true)).rejects.toThrow('Failed to update todo');
  });
});

describe('deleteTodo', () => {
  it('calls DELETE /api/todos/:id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await deleteTodo('abc-123');

    expect(fetchMock).toHaveBeenCalledWith('/api/todos/abc-123', { method: 'DELETE' });
  });

  it('throws when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(deleteTodo('abc-123')).rejects.toThrow('Failed to delete todo');
  });
});
