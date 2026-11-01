"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface HeroBackgroundImageProps {
  src: string;
  alt: string;
}

export default function HeroBackgroundImage({ src, alt }: HeroBackgroundImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Add timeout handling
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (hasError) {
    return null; // Don't render anything if image fails, gradient background will show
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="100vw"
      priority
      onError={handleError}
      onLoad={handleLoad}
      unoptimized={process.env.NODE_ENV === 'development'} // Skip optimization in dev
    />
  );
}