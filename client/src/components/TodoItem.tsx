import type { Todo } from '../../../shared/types/todo';

interface TodoItemProps {
  todo: Todo;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onComplete, onDelete }: TodoItemProps) {
  return (
    <li className="py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
      <button
        onClick={() => onComplete(todo.id)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
          todo.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-400'
        }`}
      />
      <span
        className={`flex-1 ${
          todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
        }`}
      >
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        aria-label="Delete todo"
        className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </li>
  );
}
