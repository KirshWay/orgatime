import { useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import { TaskImage } from '@/entities/task';
import { Button } from '@/shared/ui/button';
import { ConfirmationDialog } from '@/shared/ui/confirmation-dialog';
import { Separator } from '@/shared/ui/separator';

import { useDeleteTaskImage, useUploadTaskImage } from '../hooks';
import { ImageGallery } from './ImageGallery';
import { ImageUploader } from './ImageUploader';

type Props = {
  taskId: string;
  taskImages: TaskImage[];
  onImagesChange: (images: TaskImage[]) => void;
};

export const TaskImages: React.FC<Props> = ({
  taskId,
  taskImages,
  onImagesChange,
}) => {
  const [pendingImageId, setPendingImageId] = useState<string | null>(null);
  const deleting = useRef(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const uploadImageMutation = useUploadTaskImage();
  const deleteImageMutation = useDeleteTaskImage();

  const isUploading = uploadImageMutation.isPending;
  const isDeleting = deleteImageMutation.isPending;
  const { uploadProgress } = uploadImageMutation;

  const handleUploadImage = (file: File | null) => {
    if (file) {
      uploadImageMutation.mutate(
        {
          taskId,
          imageFile: file,
        },
        {
          onSuccess: (newImage) => {
            const updatedImages = [...taskImages, newImage];
            onImagesChange(updatedImages);
            setIsAddingImage(false);
          },
        },
      );
    }
  };

  const handleDeleteImage = async () => {
    if (!pendingImageId || deleting.current || isDeleting || isUploading)
      return;
    deleting.current = true;
    try {
      await deleteImageMutation.mutateAsync({
        taskId,
        imageId: pendingImageId,
      });
      onImagesChange(taskImages.filter((img) => img.id !== pendingImageId));
      setPendingImageId(null);
    } catch {
      return;
    } finally {
      deleting.current = false;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white">
          Images
        </h3>
        {!isAddingImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingImage(true)}
            disabled={isUploading || isDeleting}
          >
            <ImageIcon className="mr-1 h-4 w-4" /> Add
          </Button>
        )}
      </div>

      {isAddingImage ? (
        <ImageUploader
          onFileChange={handleUploadImage}
          onCancel={() => !isUploading && setIsAddingImage(false)}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      ) : (
        <div className="min-h-[40px]">
          <ImageGallery
            taskId={taskId}
            images={taskImages}
            onDelete={setPendingImageId}
            isDisabled={isDeleting || isUploading}
          />
        </div>
      )}

      {pendingImageId && (
        <ConfirmationDialog
          title="Delete image?"
          description="This image will be permanently removed from the task."
          confirmLabel="Delete image"
          isPending={isDeleting}
          onCancel={() => setPendingImageId(null)}
          onConfirm={() => {
            void handleDeleteImage();
          }}
        />
      )}
      <Separator />
    </div>
  );
};
