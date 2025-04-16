import { TaskColor } from "@/entities/task";
import { ApiRequest } from "@/shared/api";

export interface CreateTaskDto extends ApiRequest {
  title: string;
  description?: string;
  dueDate?: string;
  color?: TaskColor;
}

export interface UpdateTaskDto extends ApiRequest {
  title?: string;
  description?: string | null;
  completed?: boolean;
  color?: TaskColor | null;
  dueDate?: string | null;
}

export interface CreateSubtaskDto extends ApiRequest {
  title: string;
  completed?: boolean;
}

export interface UpdateSubtaskDto extends ApiRequest {
  title?: string;
  completed?: boolean;
}

export interface UpdateTaskDateDto extends ApiRequest {
  action: "tomorrow" | "nextWeek" | "someday" | "custom";
  customDate?: string;
}

export interface UpdateTaskOrderItemDto extends ApiRequest {
  id: string;
  order: number;
  dueDate?: string | null;
}

export interface UpdateTasksOrderDto extends ApiRequest {
  tasks: UpdateTaskOrderItemDto[];
}
