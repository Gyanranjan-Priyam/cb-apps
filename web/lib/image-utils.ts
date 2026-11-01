// Utility to check if S3 URLs are accessible and provide fallback strategies

export const checkImageHealth = async (imageUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Image health check failed for:', imageUrl, error);
    return false;
  }
};

export const getOptimizedImageUrl = (originalUrl: string, options?: {
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}): string => {
  if (!originalUrl) return '';
  
  // If it's already optimized or in development, return as is
  if (process.env.NODE_ENV === 'development') {
    return originalUrl;
  }
  
  const { width = 1920, quality = 75, format = 'auto' } = options || {};
  
  try {
    const url = new URL('/_next/image', window.location.origin);
    url.searchParams.set('url', encodeURIComponent(originalUrl));
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    
    if (format !== 'auto') {
      url.searchParams.set('f', format);
    }
    
    return url.toString();
  } catch (error) {
    console.warn('Failed to create optimized image URL:', error);
    return originalUrl;
  }
};

export const createImageFallbackChain = (imageKey: string): string[] => {
  if (!imageKey) return [];
  
  const baseUrls = [
    'https://codebreakers.t3.storage.dev',
    'https://codebreakers.s3.amazonaws.com'
  ];
  
  return baseUrls.map(baseUrl => {
    if (imageKey.startsWith('http')) return imageKey;
    return `${baseUrl}/${imageKey}`;
  });
};

export const preloadCriticalImages = (imageUrls: string[]) => {
  if (typeof window === 'undefined') return;
  
  imageUrls.forEach(url => {
    if (!url) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

/**
 * Resolves the display avatar URL for a user across the entire application.
 * Priority:
 * 1. Custom uploaded profileImageKey (from S3/T3 storage)
 * 2. OAuth/Google avatar URL (user.image or user.avatar)
 * 3. null / fallback
 */
export const getUserProfileImageUrl = (user?: {
  profileImageKey?: string | null;
  image?: string | null;
  avatar?: string | null;
} | null): string | null => {
  if (!user) return null;
  if (user.profileImageKey && user.profileImageKey.trim()) {
    const key = user.profileImageKey.trim();
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    return `https://codebreakers.t3.storage.dev/${key}`;
  }
  const oauthImage = user.image || user.avatar;
  if (
    oauthImage &&
    typeof oauthImage === 'string' &&
    oauthImage !== 'undefined' &&
    oauthImage !== 'null' &&
    oauthImage !== '/default-avatar.png' &&
    oauthImage.trim() !== ''
  ) {
    return oauthImage.trim();
  }
  return null;
};