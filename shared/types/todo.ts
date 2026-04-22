export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface CreateTodoRequest {
  text: string;
}

export interface UpdateTodoRequest {
  completed: boolean;
}
