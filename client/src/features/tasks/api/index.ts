import { Subtask, Task, TaskImage } from "@/entities/task";
import { apiClient } from "@/shared/api";

import {
  CreateSubtaskDto,
  CreateTaskDto,
  UpdateSubtaskDto,
  UpdateTaskDateDto,
  UpdateTaskDto,
  UpdateTasksOrderDto,
} from "../model/dto";

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>("/tasks");
  return response.data;
};

export const createTask = async (data: CreateTaskDto): Promise<Task> => {
  const response = await apiClient.post<Task>("/tasks", data);
  return response.data;
};

export const updateTask = async (
  id: string,
  data: UpdateTaskDto,
): Promise<Task> => {
  const response = await apiClient.patch<Task>(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/tasks/${id}`);
  return response.data;
};

export const createSubtask = async (
  taskId: string,
  data: CreateSubtaskDto,
): Promise<Subtask> => {
  const response = await apiClient.post<Subtask>(
    `/tasks/${taskId}/subtasks`,
    data,
  );
  return response.data;
};

export const updateSubtask = async (
  taskId: string,
  subtaskId: string,
  data: UpdateSubtaskDto,
): Promise<Subtask> => {
  const response = await apiClient.patch<Subtask>(
    `/tasks/${taskId}/subtasks/${subtaskId}`,
    data,
  );
  return response.data;
};

export const deleteSubtask = async (
  taskId: string,
  subtaskId: string,
): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    `/tasks/${taskId}/subtasks/${subtaskId}`,
  );
  return response.data;
};

export const updateTaskDate = async (
  taskId: string,
  data: UpdateTaskDateDto,
): Promise<Task> => {
  const response = await apiClient.patch<Task>(`/tasks/${taskId}/date`, data);
  return response.data;
};

export const duplicateTask = async (taskId: string): Promise<Task> => {
  const response = await apiClient.post<Task>(`/tasks/${taskId}/duplicate`);
  return response.data;
};

export const updateTasksOrder = async (
  payload: UpdateTasksOrderDto,
): Promise<Task[]> => {
  const response = await apiClient.patch<Task[]>("/tasks/order", payload);
  return response.data;
};

export const uploadTaskImage = async (
  taskId: string,
  imageFile: File,
  onProgress?: (progress: number) => void,
): Promise<TaskImage> => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await apiClient.post<TaskImage>(
    `/tasks/${taskId}/images`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
      timeout: 60000,
    },
  );

  return response.data;
};

export const replaceTaskImage = async (
  taskId: string,
  imageId: string,
  imageFile: File,
): Promise<TaskImage> => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await apiClient.patch<TaskImage>(
    `/tasks/${taskId}/images/${imageId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
};

export const getTaskImages = async (taskId: string): Promise<TaskImage[]> => {
  const response = await apiClient.get<TaskImage[]>(`/tasks/${taskId}/images`);
  return response.data;
};

export const deleteTaskImage = async (
  taskId: string,
  imageId: string,
): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    `/tasks/${taskId}/images/${imageId}`,
  );
  return response.data;
};

export const searchTasks = async (query: string): Promise<Task[]> => {
  const response = await apiClient.post<Task[]>("/tasks/search", { query });
  return response.data;
};
