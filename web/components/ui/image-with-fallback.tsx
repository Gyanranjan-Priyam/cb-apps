"use client";

import React from "react";
import Image from "next/image";
import { ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  fallbackContent?: React.ReactNode;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  width,
  height,
  fill,
  className,
  sizes,
  priority,
  onLoad,
  fallbackContent,
  ...props
}) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [isError, setIsError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = () => {
    setIsError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setIsError(false);
    if (onLoad) onLoad();
  };

  const retry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setIsError(false);
      setIsLoading(true);
      // Add cache busting parameter
      const separator = src.includes('?') ? '&' : '?';
      setImgSrc(`${src}${separator}_retry=${Date.now()}`);
    }
  };

  React.useEffect(() => {
    setImgSrc(src);
    setIsError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [src]);

  if (isError && fallbackContent) {
    return <>{fallbackContent}</>;
  }

  if (isError) {
    return (
      <div 
        className={`bg-muted flex flex-col items-center justify-center space-y-3 p-4 ${className}`}
        style={fill ? { width: '100%', height: '100%' } : { width, height }}
      >
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Image failed to load</p>
          {retryCount < 3 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retry}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry ({3 - retryCount} left)
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={retryCount > 0} // Skip optimization on retry
        {...props}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted/50 flex items-center justify-center"
          style={!fill ? { width, height } : {}}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};