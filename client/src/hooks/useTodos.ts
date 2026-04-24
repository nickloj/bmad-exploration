import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '../../../shared/types/todo';
import { fetchTodos, createTodo, updateTodo, deleteTodo as apiDeleteTodo } from '../api/todos';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldCelebrate, setShouldCelebrate] = useState(false);

  useEffect(() => {
    fetchTodos()
      .then(setTodos)
      .catch(() => setError('Failed to load todos. Please refresh.'))
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
    try {
      const real = await createTodo(text);
      setTodos((prev) => prev.map((t) => (t.id === optimisticTodo.id ? real : t)));
      setError(null);
      setShouldCelebrate(false);
    } catch {
      setTodos((prev) => prev.filter((t) => t.id !== optimisticTodo.id));
      setError('Failed to add todo. Please try again.');
    }
  }

  async function completeTodo(id: string) {
    const current = todos.find((t) => t.id === id);
    if (!current) return;
    const newCompleted = !current.completed;
    const prev = todos;

    const activeCountBeforeToggle = todos.filter((t) => !t.completed).length;
    const willCelebrate = newCompleted && activeCountBeforeToggle === 1;

    setTodos((t) =>
      t.map((todo) =>
        todo.id === id
          ? { ...todo, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null }
          : todo,
      ),
    );

    // Fire celebration optimistically — if API fails, it rolls back with todos
    if (willCelebrate) setShouldCelebrate(true);

    try {
      const real = await updateTodo(id, newCompleted);
      setTodos((t) => t.map((todo) => (todo.id === id ? real : todo)));
      setError(null);
    } catch {
      setTodos(prev);
      setShouldCelebrate(false);
      setError('Failed to update todo. Please try again.');
    }
  }

  async function removeTodo(id: string) {
    const prev = todos;
    setTodos((t) => t.filter((todo) => todo.id !== id));
    try {
      await apiDeleteTodo(id);
      setError(null);
      setShouldCelebrate(false);
    } catch {
      setTodos(prev);
      setError('Failed to delete todo. Please try again.');
    }
  }

  const dismissCelebration = useCallback(() => {
    setShouldCelebrate(false);
  }, []);

  return { todos, isLoading, error, shouldCelebrate, dismissCelebration, addTodo, completeTodo, deleteTodo: removeTodo };
}
