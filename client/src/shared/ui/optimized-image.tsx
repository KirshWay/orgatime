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
};
