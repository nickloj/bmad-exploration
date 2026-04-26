import type { Todo } from '../../../shared/types/todo';

interface TodoItemProps {
  todo: Todo;
  fadeOpacity?: number;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, fadeOpacity = 1, onComplete, onDelete }: TodoItemProps) {
  return (
    <li
      className="py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 transition-opacity duration-1000"
      style={{ opacity: fadeOpacity }}
    >
      <button
        onClick={() => onComplete(todo.id)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 -ml-2 rounded-full transition-colors ${
          todo.completed ? 'text-green-500' : 'text-gray-300 hover:text-green-400'
        }`}
      >
        <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
          todo.completed ? 'bg-green-500 border-green-500' : 'border-current'
        }`} />
      </button>
      <span
        className={`flex-1 transition-opacity duration-300 motion-reduce:transition-none ${
          todo.completed
            ? 'line-through text-gray-400 strikethrough-sweep'
            : 'text-gray-800'
        }`}
      >
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        aria-label="Delete todo"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-gray-400 hover:text-red-500 transition-colors text-lg"
      >
        ×
      </button>
    </li>
  );
}
