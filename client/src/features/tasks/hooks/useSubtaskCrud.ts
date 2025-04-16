import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Subtask } from "@/entities/task";
import { parseApiError } from "@/shared/lib/parseApiError";

import { createSubtask, deleteSubtask, updateSubtask } from "../api";
import { CreateSubtaskDto, UpdateSubtaskDto } from "../model";

export const useCreateSubtask = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Subtask,
    Error,
    { taskId: string; data: CreateSubtaskDto }
  >({
    mutationFn: ({ taskId, data }) => createSubtask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Subtask created successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useUpdateSubtask = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Subtask,
    Error,
    { taskId: string; subtaskId: string; data: UpdateSubtaskDto }
  >({
    mutationFn: ({ taskId, subtaskId, data }) =>
      updateSubtask(taskId, subtaskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Subtask updated successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useDeleteSubtask = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    Error,
    { taskId: string; subtaskId: string }
  >({
    mutationFn: ({ taskId, subtaskId }) => deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Subtask deleted successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
