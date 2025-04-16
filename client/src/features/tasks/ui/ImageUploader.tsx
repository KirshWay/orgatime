import { ChangeEvent, useState } from "react";
import { Camera, XCircle } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { OptimizedImage } from "@/shared/ui/optimized-image";

type Props = {
  onFileChange: (file: File | null) => void;
  onCancel: () => void;
};

export const ImageUploader: React.FC<Props> = ({ onFileChange, onCancel }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
      onFileChange(selectedFile);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onFileChange(null);
    onCancel();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {previewUrl ? (
        <div className="relative">
          <OptimizedImage
            src={previewUrl}
            alt="Preview"
            className="max-h-40 max-w-full rounded object-contain"
            objectFit="contain"
          />
          <button
            onClick={handleCancel}
            className="absolute -top-2 -right-2 rounded-full bg-white text-red-500 shadow-md"
          >
            <XCircle size={22} />
          </button>
        </div>
      ) : (
        <label className="group flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 transition-colors hover:border-primary">
          <div className="flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors group-hover:text-primary">
            <Camera size={24} />
            <span className="text-xs font-medium">Upload image</span>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      )}

      {!previewUrl && (
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </div>
  );
};
