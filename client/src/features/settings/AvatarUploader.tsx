import React, { ChangeEvent, useEffect, useState } from "react";
import { UserRoundX } from "lucide-react";

import { OptimizedImage } from "@/shared/ui/optimized-image";

type Props = {
  img: string;
  onFileChange: (file: File | null) => void;
};

export const AvatarUploader: React.FC<Props> = ({ img, onFileChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile && !img) {
      setPreviewUrl(null);
      return;
    } else if (!selectedFile) {
      setPreviewUrl(img);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);

    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile, img]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setSelectedFile(file ?? null);
    onFileChange(file ?? null);
  };

  return (
    <div className="flex flex-col items-center">
      <label htmlFor="avatar-upload" className="relative cursor-pointer">
        <div className="w-48 h-48 sm:w-72 sm:h-72 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {previewUrl ? (
            <OptimizedImage
              src={previewUrl}
              alt="Preview avatar"
              className="w-full h-full"
              objectFit="cover"
            />
          ) : (
            <UserRoundX className="w-1/2 h-1/2" />
          )}

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </label>
    </div>
  );
};
