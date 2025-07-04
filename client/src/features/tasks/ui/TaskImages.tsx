import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { TaskImage } from "@/entities/task";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

import { useDeleteTaskImage, useUploadTaskImage } from "../hooks";
import { ImageGallery } from "./ImageGallery";
import { ImageUploader } from "./ImageUploader";

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

  const handleDeleteImage = (imageId: string) => {
    deleteImageMutation.mutate(
      {
        taskId,
        imageId,
      },
      {
        onSuccess: () => {
          const updatedImages = taskImages.filter((img) => img.id !== imageId);
          onImagesChange(updatedImages);
        },
      },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xl font-bold text-gray-700 dark:text-white">
          Images
        </p>
        {!isAddingImage && (
          <Button
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
            images={taskImages}
            onDelete={handleDeleteImage}
            isDisabled={isDeleting || isUploading}
          />
        </div>
      )}

      <Separator />
    </div>
  );
};
