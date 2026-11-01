export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function calculateRotatedSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crops an image according to pixel coordinates from react-easy-crop,
 * applies rotation, resizes to avatar dimensions, and compresses to target <= targetMaxKB (default 100KB).
 */
export async function getCroppedAndCompressedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  targetMaxKB = 100,
  maxDimension = 512
): Promise<{ file: File; blob: Blob; sizeKB: number; dataUrl: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not obtain 2D canvas context');
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central point to allow rotating around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create crop canvas
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');

  if (!cropCtx) {
    throw new Error('Could not obtain crop canvas context');
  }

  // Determine final output dimensions (capped at maxDimension for crisp avatar resolution)
  const targetWidth = Math.min(pixelCrop.width, maxDimension);
  const targetHeight = Math.min(pixelCrop.height, maxDimension);

  cropCanvas.width = targetWidth;
  cropCanvas.height = targetHeight;

  // Use high quality image smoothing
  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = 'high';

  // Draw the cropped section onto the target canvas
  cropCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const targetMaxBytes = targetMaxKB * 1024;

  // Helper to convert canvas to blob with specific mimeType and quality
  const toBlobPromise = (c: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      c.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        mimeType,
        quality
      );
    });

  // Try webp first (excellent compression & modern support), fallback to jpeg
  const mimeTypes = ['image/webp', 'image/jpeg'];
  let chosenMime = 'image/webp';
  let bestBlob: Blob | null = null;

  // Test WebP support
  const testCanvas = document.createElement('canvas');
  testCanvas.width = 1;
  testCanvas.height = 1;
  const testData = testCanvas.toDataURL('image/webp');
  if (!testData.startsWith('data:image/webp')) {
    chosenMime = 'image/jpeg';
  }

  // Iterative compression to strictly satisfy <= 100KB while maintaining maximum clarity
  let currentQuality = 0.92;
  const currentCanvas = cropCanvas;

  while (currentQuality >= 0.2) {
    const candidateBlob = await toBlobPromise(currentCanvas, chosenMime, currentQuality);
    bestBlob = candidateBlob;

    if (candidateBlob.size <= targetMaxBytes) {
      break;
    }

    currentQuality -= 0.12;
  }

  // If still larger than targetMaxBytes at lowest quality, scale dimensions down
  if (bestBlob && bestBlob.size > targetMaxBytes) {
    let scale = 0.8;
    while (scale >= 0.4 && bestBlob.size > targetMaxBytes) {
      const scaledCanvas = document.createElement('canvas');
      const scaledCtx = scaledCanvas.getContext('2d');
      if (scaledCtx) {
        scaledCanvas.width = Math.round(targetWidth * scale);
        scaledCanvas.height = Math.round(targetHeight * scale);
        scaledCtx.imageSmoothingEnabled = true;
        scaledCtx.imageSmoothingQuality = 'high';
        scaledCtx.drawImage(cropCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

        const scaledBlob = await toBlobPromise(scaledCanvas, chosenMime, 0.75);
        bestBlob = scaledBlob;
      }
      scale -= 0.15;
    }
  }

  if (!bestBlob) {
    throw new Error('Failed to create compressed image blob');
  }

  const extension = chosenMime === 'image/webp' ? 'webp' : 'jpg';
  const file = new File([bestBlob], `profile-avatar.${extension}`, {
    type: chosenMime,
    lastModified: Date.now(),
  });

  const dataUrl = URL.createObjectURL(bestBlob);
  const sizeKB = Math.round((bestBlob.size / 1024) * 10) / 10;

  return {
    file,
    blob: bestBlob,
    sizeKB,
    dataUrl,
  };
}
