import { usePrivateImage } from '@/shared/hooks/usePrivateImage';

export function useTaskAttachment(taskId: string, imageId: string) {
  return usePrivateImage(
    ['task-attachment', taskId, imageId],
    `/tasks/${encodeURIComponent(taskId)}/images/${encodeURIComponent(imageId)}/content`,
  );
}
