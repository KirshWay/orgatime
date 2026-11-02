import React, { ChangeEvent, useEffect, useState } from 'react';
import { UserRoundX } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { OptimizedImage } from '@/shared/ui/optimized-image';

type Props = {
  img: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

export const AvatarUploader: React.FC<Props> = ({
  img,
  file,
  onFileChange,
  disabled,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) onFileChange(selected);
    event.target.value = '';
  };
  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor="avatar-upload"
        className="relative shrink-0 rounded-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      >
        <span className="sr-only">Change avatar</span>
        <div className="h-20 w-20 overflow-hidden rounded-full bg-muted flex items-center justify-center">
          {previewUrl || img ? (
            <OptimizedImage
              src={previewUrl || img}
              alt="Preview avatar"
              className="w-full h-full"
              objectFit="cover"
              isAvatar
            />
          ) : (
            <UserRoundX
              aria-hidden="true"
              className="h-10 w-10 text-muted-foreground"
            />
          )}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </div>
      </label>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">Profile photo</p>
        <p className="text-xs text-muted-foreground">
          Choose an image to update your avatar.
        </p>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onFileChange(null)}
          >
            Cancel photo change
          </Button>
        )}
      </div>
    </div>
  );
};
