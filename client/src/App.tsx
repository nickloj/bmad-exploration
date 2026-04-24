import { useTodos } from './hooks/useTodos';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { ErrorMessage } from './components/ErrorMessage';
import { CelebrationOverlay } from './components/CelebrationOverlay';

function App() {
  const { todos, isLoading, error, shouldCelebrate, dismissCelebration, addTodo, completeTodo, deleteTodo } = useTodos();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">My Todos</h1>
        <div className="mb-4">
          <TodoInput onAdd={addTodo} />
          <ErrorMessage error={error} />
        </div>
        <TodoList todos={todos} isLoading={isLoading} onComplete={completeTodo} onDelete={deleteTodo} />
        <CelebrationOverlay active={shouldCelebrate} onDismiss={dismissCelebration} />
      </div>
    </div>
  );
}

export default App;
