import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholderSrc?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  isAvatar?: boolean;
  isGallery?: boolean;
  onLoad?: () => void;
  onError?: () => void;
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  placeholderSrc,
  objectFit = "cover",
  isAvatar = false,
  isGallery = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  if (isAvatar) {
    return (
      <img
        src={isError && placeholderSrc ? placeholderSrc : src}
        alt={alt}
        className={cn(
          "transition-opacity",
          {
            "opacity-0": !isLoaded && !isError,
            "opacity-100": isLoaded || isError,
          },
          className,
        )}
        width={width}
        height={height}
        loading="lazy"
        style={{
          objectFit,
        }}
        aria-label={alt}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  if (isGallery) {
    return (
      <div
        className={cn(
          "relative w-full h-full flex items-center justify-center",
          className,
        )}
      >
        <img
          src={isError && placeholderSrc ? placeholderSrc : src}
          alt={alt}
          className={cn(
            "transition-opacity object-contain max-w-full max-h-full",
            {
              "opacity-0": !isLoaded && !isError,
              "opacity-100": isLoaded || isError,
            },
          )}
          width={width}
          height={height}
          loading="lazy"
          style={{ maxHeight: "100%", maxWidth: "100%" }}
          aria-label={alt}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      <img
        src={isError && placeholderSrc ? placeholderSrc : src}
        alt={alt}
        className={cn("max-h-full max-w-full transition-opacity", {
          "opacity-0": !isLoaded && !isError,
          "opacity-100": isLoaded || isError,
        })}
        width={width}
        height={height}
        loading="lazy"
        style={{
          objectFit,
        }}
        aria-label={alt}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};
