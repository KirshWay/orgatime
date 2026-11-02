import { OptimizedImage } from '@/shared/ui/optimized-image';

import { useTaskAttachment } from '../hooks/useTaskAttachment';

type Props = {
  taskId: string;
  imageId: string;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
  isGallery?: boolean;
};

export function TaskAttachmentImage({ taskId, imageId, ...imageProps }: Props) {
  const { url, isError, retry } = useTaskAttachment(taskId, imageId);
  if (isError) {
    return (
      <div
        className="flex h-full min-h-16 flex-col items-center justify-center gap-1 bg-gray-100 p-2 text-center text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
        role="status"
      >
        <span>Image unavailable</span>
        <button
          type="button"
          className="underline"
          onClick={(event) => {
            event.stopPropagation();
            void retry();
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  if (!url)
    return (
      <span role="status" className="text-sm text-gray-700 dark:text-gray-200">
        Loading image…
      </span>
    );
  return <OptimizedImage {...imageProps} src={url} />;
}
