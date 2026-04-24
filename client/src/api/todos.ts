import type { Todo } from '../../../shared/types/todo';

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch('/api/todos');
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json() as Promise<Todo[]>;
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json() as Promise<Todo>;
}
