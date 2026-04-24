export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateTodoRequest {
  text: string;
}

export interface UpdateTodoRequest {
  completed: boolean;
}
