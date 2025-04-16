import { TaskColor } from "./task-colors";

export type TaskImage = {
  id: string;
  filename: string;
  path: string;
  createdAt?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  color: TaskColor | null;
  dueDate: string | null;
  order: number;
  subtasks: Subtask[];
  images?: TaskImage[];
  createdAt?: string;
  updatedAt?: string;
};

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  color?: TaskColor;
};
