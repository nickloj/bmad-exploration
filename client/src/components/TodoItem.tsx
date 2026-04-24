import type { Todo } from '../../../shared/types/todo';

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  return (
    <li className="py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
      <span className="flex-1 text-gray-800">{todo.text}</span>
    </li>
  );
}
