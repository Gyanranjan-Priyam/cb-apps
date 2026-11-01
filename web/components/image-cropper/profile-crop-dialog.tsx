"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedAndCompressedImg } from "@/lib/crop-image";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Check, 
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropSave: (croppedFile: File, sizeKB: number) => Promise<void> | void;
}

export function ProfileCropDialog({
  isOpen,
  onClose,
  imageSrc,
  onCropSave,
}: ProfileCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (location: Point) => {
    setCrop(location);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropAreaComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Please wait for the image to load properly");
      return;
    }

    setIsProcessing(true);
    try {
      // Crop and compress image targeting <= 100KB
      const result = await getCroppedAndCompressedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        100 // 100KB target
      );

      await onCropSave(result.file, result.sizeKB);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
      toast.error("Failed to process and crop image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-lg w-[95vw] p-0 overflow-hidden border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                Crop Profile Picture
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Drag to reposition, use the slider to zoom, and confirm to apply the circle crop.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Cropper Viewport */}
        <div className="relative w-full h-[320px] sm:h-[360px] bg-neutral-950/90 select-none">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onRotationChange={setRotation}
              onCropComplete={onCropAreaComplete}
              style={{
                containerStyle: {
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(10, 10, 10, 0.95)",
                },
                cropAreaStyle: {
                  border: "2px solid rgba(255, 255, 255, 0.85)",
                  boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.65)",
                },
              }}
            />
          )}
        </div>

        {/* Controls and adjustments */}
        <div className="p-5 space-y-4 bg-muted/20 border-t border-border/60">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              disabled={isProcessing || zoom <= 1}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.02}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={isProcessing}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              disabled={isProcessing || zoom >= 3}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions & Optimization Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 px-3 rounded-lg border-border/80"
                onClick={handleRotate}
                disabled={isProcessing}
              >
                <RotateCw className="w-3.5 h-3.5" />
                Rotate 90°
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                onClick={handleReset}
                disabled={isProcessing || (zoom === 1 && rotation === 0 && crop.x === 0 && crop.y === 0)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </div>

            <div className="text-xs text-muted-foreground border border-border px-2.5 py-1 rounded">
              Output ≤ 100 KB
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 pt-2 border-t border-border/60 flex items-center justify-end gap-2 bg-background">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="rounded-lg text-sm gap-2 min-w-[130px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Apply & Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
