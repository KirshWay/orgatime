import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { TaskImage } from "@/entities/task";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Button } from "@/shared/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/shared/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { OptimizedImage } from "@/shared/ui/optimized-image";

type Props = {
  images: TaskImage[];
  onDelete: (imageId: string) => void;
  isDisabled?: boolean;
};

export const ImageGallery: React.FC<Props> = ({
  images,
  onDelete,
  isDisabled = false,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const [carouselApi, setCarouselApi] = useState<
    UseEmblaCarouselType[1] | null
  >(null);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateCurrentIndex = useCallback(() => {
    if (!carouselApi) return;
    const index = carouselApi.selectedScrollSnap();
    setCurrentIndex(index);
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      updateCurrentIndex();
    };

    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);
    onSelect();

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, updateCurrentIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!carouselApi) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          carouselApi.scrollPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          carouselApi.scrollNext();
          break;
        default:
          break;
      }
    },
    [carouselApi],
  );

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

  const scrollPrev = () => {
    carouselApi?.scrollPrev();
  };

  const scrollNext = () => {
    carouselApi?.scrollNext();
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            className="relative overflow-hidden rounded border hover:opacity-95"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
          >
            <AspectRatio ratio={1} className="bg-gray-100">
              <button
                className="absolute top-1 right-1 z-10 rounded-full bg-black bg-opacity-50 p-1 text-white hover:bg-opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
                disabled={isDisabled}
              >
                <X size={14} />
              </button>
              <button
                className="h-full w-full"
                onClick={() => handleImageClick(index)}
                disabled={isDisabled}
              >
                <OptimizedImage
                  src={image.path}
                  alt={`Task image ${index + 1}`}
                  className="h-full w-full cursor-pointer"
                  objectFit="cover"
                />
              </button>
            </AspectRatio>
          </motion.div>
        ))}
      </div>

      <Dialog
        open={selectedImageIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedImageIndex(null);
        }}
      >
        <DialogContent
          className="max-w-[95vw] sm:max-w-[85vw] md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden p-0 sm:rounded-xl"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <DialogHeader className="absolute right-1 sm:right-2 top-1 sm:top-2 z-30">
            <DialogTitle className="sr-only">Image preview</DialogTitle>
            <DialogDescription className="sr-only">
              Choose added images
            </DialogDescription>

            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleClosePreview}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="relative w-full h-full">
            <Carousel
              className="w-full"
              setApi={handleCarouselApi}
              opts={{
                startIndex: selectedImageIndex ?? 0,
              }}
            >
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem
                    key={image.id}
                    className="transition-all duration-300"
                  >
                    <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
                      <div className="flex items-center justify-center max-h-[70vh] w-full">
                        <OptimizedImage
                          src={image.path}
                          alt={`Task image ${index + 1}`}
                          className="max-h-[70vh] max-w-full mx-auto"
                          objectFit="contain"
                          isGallery={true}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <AnimatePresence mode="sync">
                {canScrollPrev && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 p-0"
                      onClick={scrollPrev}
                    >
                      <ChevronLeft size={16} />
                      <span className="sr-only">Previous slide</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="sync">
                {canScrollNext && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 p-0"
                      onClick={scrollNext}
                    >
                      <ChevronRight size={16} />
                      <span className="sr-only">Next slide</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black bg-opacity-50 text-white text-xs sm:text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
