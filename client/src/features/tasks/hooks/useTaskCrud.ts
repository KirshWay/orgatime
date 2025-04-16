import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Task } from "@/entities/task";
import { parseApiError } from "@/shared/lib/parseApiError";

import {
  createTask,
  deleteTask,
  duplicateTask,
  fetchTasks,
  updateTask,
  updateTaskDate,
} from "../api";
import { CreateTaskDto, UpdateTaskDateDto, UpdateTaskDto } from "../model";

export const useTasks = () => {
  return useQuery<Task[], Error>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, CreateTaskDto>({
    mutationFn: (data) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, { id: string; data: UpdateTaskDto }>({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useUpdateTaskDate = () => {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, { taskId: string; data: UpdateTaskDateDto }>({
    mutationFn: ({ taskId, data }) => updateTaskDate(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task date updated successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useDuplicateTask = () => {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, string>({
    mutationFn: (taskId) => duplicateTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task duplicated successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
