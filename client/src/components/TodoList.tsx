import type { Todo } from '../../../shared/types/todo';
import { TodoItem } from './TodoItem';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoList({ todos, isLoading, onComplete, onDelete }: TodoListProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onComplete={onComplete} onDelete={onDelete} />
      ))}
    </ul>
  );
}
