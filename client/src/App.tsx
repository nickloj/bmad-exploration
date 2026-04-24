import { useTodos } from './hooks/useTodos';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';

function App() {
  const { todos, isLoading, addTodo } = useTodos();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">My Todos</h1>
        <div className="mb-4">
          <TodoInput onAdd={addTodo} />
        </div>
        <TodoList todos={todos} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;
