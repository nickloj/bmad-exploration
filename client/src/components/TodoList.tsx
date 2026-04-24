import type { Todo } from '../../../shared/types/todo';
import { TodoItem } from './TodoItem';
import { EmptyState } from './EmptyState';

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
}

export function TodoList({ todos, isLoading }: TodoListProps) {
  if (isLoading) {
    return <p className="text-center text-gray-400 py-8">Loading...</p>;
  }

  if (todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
