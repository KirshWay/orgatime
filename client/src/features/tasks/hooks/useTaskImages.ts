import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { TaskImage } from "@/entities/task";
import { parseApiError } from "@/shared/lib/parseApiError";

import {
  deleteTaskImage,
  getTaskImages,
  replaceTaskImage,
  uploadTaskImage,
} from "../api";

export const useUploadTaskImage = () => {
  const queryClient = useQueryClient();
  return useMutation<TaskImage, Error, { taskId: string; imageFile: File }>({
    mutationFn: ({ taskId, imageFile }) => uploadTaskImage(taskId, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Image uploaded successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useReplaceTaskImage = () => {
  const queryClient = useQueryClient();
  return useMutation<
    TaskImage,
    Error,
    { taskId: string; imageId: string; imageFile: File }
  >({
    mutationFn: ({ taskId, imageId, imageFile }) =>
      replaceTaskImage(taskId, imageId, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Image replaced successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useTaskImages = (taskId: string) => {
  return useQuery<TaskImage[], Error>({
    queryKey: ["taskImages", taskId],
    queryFn: () => getTaskImages(taskId),
    enabled: !!taskId,
  });
};

export const useDeleteTaskImage = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    Error,
    { taskId: string; imageId: string }
  >({
    mutationFn: ({ taskId, imageId }) => deleteTaskImage(taskId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Image deleted successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
