"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  ExternalLink,
  ImageIcon 
} from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const ImageGallery = ({ 
  images, 
  title = "Gallery", 
  autoPlay = true,
  autoPlayInterval = 4000
}: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState<boolean[]>(new Array(images.length).fill(true));
  const [hasError, setHasError] = useState<boolean[]>(new Array(images.length).fill(false));
  const [retryCount, setRetryCount] = useState<number[]>(new Array(images.length).fill(0));

  // Helper function to construct full URL
  const getFileUrl = (key: string) => {
    if (!key) return "";
    // If it's already a full URL, return as is
    if (key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }
    // Otherwise, construct the full URL
    return `https://codebreakers.t3.storage.dev/${key}`;
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, autoPlayInterval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleImageLoad = (index: number) => {
    setIsLoading(prev => {
      const newLoading = [...prev];
      newLoading[index] = false;
      return newLoading;
    });
    setHasError(prev => {
      const newError = [...prev];
      newError[index] = false;
      return newError;
    });
  };

  const handleImageError = (index: number) => {
    setIsLoading(prev => {
      const newLoading = [...prev];
      newLoading[index] = false;
      return newLoading;
    });
    setHasError(prev => {
      const newError = [...prev];
      newError[index] = true;
      return newError;
    });
  };

  const retryImage = (index: number) => {
    const currentRetries = retryCount[index];
    if (currentRetries < 3) {
      setRetryCount(prev => {
        const newRetry = [...prev];
        newRetry[index] = currentRetries + 1;
        return newRetry;
      });
      setIsLoading(prev => {
        const newLoading = [...prev];
        newLoading[index] = true;
        return newLoading;
      });
      setHasError(prev => {
        const newError = [...prev];
        newError[index] = false;
        return newError;
      });
    }
  };

  const openImageInNewTab = () => {
    const currentImageUrl = getFileUrl(images[currentIndex]);
    window.open(currentImageUrl, '_blank', 'noopener,noreferrer');
  };

  if (!images || images.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground">No Gallery Images</h3>
              <p className="text-sm text-muted-foreground mt-1">No images available for this event</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
          </div>

          {/* Main Image Display */}
          <div className="relative aspect-video bg-muted overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.4, 0, 0.2, 1] 
                }}
                className="absolute inset-0"
              >
                {hasError[currentIndex] ? (
                  /* Error Fallback */
                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center space-y-4">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Failed to load image
                      </p>
                      {retryCount[currentIndex] < 3 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => retryImage(currentIndex)}
                        >
                          Retry ({3 - retryCount[currentIndex]} attempts left)
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Image
                    src={getFileUrl(images[currentIndex])}
                    alt={`Gallery image ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                    priority={currentIndex === 0}
                    onLoad={() => handleImageLoad(currentIndex)}
                    onError={() => handleImageError(currentIndex)}
                    unoptimized={retryCount[currentIndex] > 0} // Skip optimization on retry
                  />
                )}
                
                {/* Loading overlay */}
                {isLoading[currentIndex] && !hasError[currentIndex] && (
                  <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-muted-foreground">Loading image...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageGallery;