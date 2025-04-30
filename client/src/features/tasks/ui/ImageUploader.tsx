import { ChangeEvent, useState } from "react";
import { Camera, XCircle } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { OptimizedImage } from "@/shared/ui/optimized-image";
import { Progress } from "@/shared/ui/progress";

type Props = {
  onFileChange: (file: File | null) => void;
  onCancel: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
};

export const ImageUploader: React.FC<Props> = ({
  onFileChange,
  onCancel,
  isUploading = false,
  uploadProgress = 0,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File is too large. Maximum size: 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
      return false;
    }
    setFileError(null);
    return true;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    setFileError(null);

    if (selectedFile) {
      if (!validateFile(selectedFile)) {
        return;
      }

      setPreviewUrl(URL.createObjectURL(selectedFile));
      onFileChange(selectedFile);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileError(null);
    onFileChange(null);
    onCancel();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {previewUrl ? (
        <div className="relative w-full">
          <OptimizedImage
            src={previewUrl}
            alt="Preview"
            className="max-h-40 max-w-full rounded object-contain"
            objectFit="contain"
          />
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent mb-2"></div>
              {uploadProgress > 0 && (
                <div className="w-full max-w-64 px-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-white text-center mt-1">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleCancel}
            className="absolute -top-2 -right-2 rounded-full bg-white text-red-500 shadow-md"
            disabled={isUploading}
          >
            <XCircle size={22} />
          </button>
        </div>
      ) : (
        <div className="w-full">
          <label className="group flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 transition-colors hover:border-primary">
            <div className="flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors group-hover:text-primary">
              <Camera size={24} />
              <span className="text-xs font-medium">
                Upload image (up to 10MB)
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          {fileError && (
            <p className="mt-1 text-xs text-red-500">{fileError}</p>
          )}
        </div>
      )}

      {!previewUrl && (
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="w-full"
          disabled={isUploading}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};
