import { useState, useEffect } from 'react';
import type { Todo } from '../../../shared/types/todo';
import { fetchTodos, createTodo } from '../api/todos';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodos()
      .then(setTodos)
      .finally(() => setIsLoading(false));
  }, []);

  async function addTodo(text: string) {
    const optimisticTodo: Todo = {
      id: `optimistic-${crypto.randomUUID()}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    setTodos((prev) => [...prev, optimisticTodo]);

    const real = await createTodo(text);
    setTodos((prev) => prev.map((t) => (t.id === optimisticTodo.id ? real : t)));
  }

  return { todos, isLoading, addTodo };
}
