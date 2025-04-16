import { useState } from "react";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { X } from "lucide-react";

import { TaskImage } from "@/entities/task";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Button } from "@/shared/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { Dialog, DialogContent, DialogHeader } from "@/shared/ui/dialog";
import { OptimizedImage } from "@/shared/ui/optimized-image";

type Props = {
  images: TaskImage[];
  onDelete: (imageId: string) => void;
};

export const ImageGallery: React.FC<Props> = ({ images, onDelete }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [carouselApi, setCarouselApi] = useState<
    UseEmblaCarouselType[1] | null
  >(null);

  if (images.length === 0) {
    return null;
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleClosePreview = () => {
    setSelectedImageIndex(null);
  };

  const handleCarouselApi = (api: UseEmblaCarouselType[1]) => {
    setCarouselApi(api);
  };

  if (carouselApi && selectedImageIndex !== null) {
    carouselApi.scrollTo(selectedImageIndex);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative overflow-hidden rounded border hover:opacity-95"
          >
            <AspectRatio ratio={1}>
              <button
                className="absolute top-1 right-1 z-10 rounded-full bg-black bg-opacity-50 p-1 text-white hover:bg-opacity-70"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
              >
                <X size={14} />
              </button>
              <button
                className="h-full w-full"
                onClick={() => handleImageClick(index)}
              >
                <OptimizedImage
                  src={image.path}
                  alt={`Task image ${index + 1}`}
                  className="h-full w-full cursor-pointer object-cover"
                />
              </button>
            </AspectRatio>
          </div>
        ))}
      </div>

      <Dialog
        open={selectedImageIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedImageIndex(null);
        }}
      >
        <DialogContent className="max-w-4xl overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="absolute right-2 top-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              onClick={handleClosePreview}
            >
              <X />
            </Button>
          </DialogHeader>

          <Carousel className="w-full" setApi={handleCarouselApi}>
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={image.id}>
                  <div className="flex h-full items-center justify-center p-6">
                    <OptimizedImage
                      src={image.path}
                      alt={`Task image ${index + 1}`}
                      className="max-h-[70vh] max-w-full"
                      objectFit="contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </DialogContent>
      </Dialog>
    </>
  );
};
