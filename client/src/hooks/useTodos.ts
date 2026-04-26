import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '../../../shared/types/todo';
import { fetchTodos, createTodo, updateTodo, deleteTodo as apiDeleteTodo } from '../api/todos';
import { getFadeOpacity, MAX_ACTIVE_THRESHOLD } from '../lib/fade';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldCelebrate, setShouldCelebrate] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchTodos()
      .then(setTodos)
      .catch(() => setError('Failed to load todos. Please refresh.'))
      .finally(() => setIsLoading(false));
  }, []);

  // Tick every second while completed todos exist to drive the fade;
  // also evicts fully-faded todos from state to stop the interval eventually.
  useEffect(() => {
    const hasCompleted = todos.some((t) => t.completed && t.completedAt);
    if (!hasCompleted) return;
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      setTodos((prev) =>
        prev.filter((t) => !t.completed || getFadeOpacity(t.completedAt, currentNow) > 0),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [todos]);

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

  const getOpacity = useCallback(
    (todo: Todo) => getFadeOpacity(todo.completedAt, now),
    [now],
  );

  const visibleTodos = todos.filter(
    (t) => !t.completed || getFadeOpacity(t.completedAt, now) > 0,
  );

  const isOverloaded = todos.filter((t) => !t.completed).length > MAX_ACTIVE_THRESHOLD;

  return {
    todos: visibleTodos,
    isLoading,
    error,
    shouldCelebrate,
    isOverloaded,
    dismissCelebration,
    getOpacity,
    addTodo,
    completeTodo,
    deleteTodo: removeTodo,
  };
}
