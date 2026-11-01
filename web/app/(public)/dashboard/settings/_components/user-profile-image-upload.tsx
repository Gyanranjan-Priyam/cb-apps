"use client";

import { useState, useTransition, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { updateUserProfileImage, removeUserProfileImage } from "../actions";
import { ProfileCropDialog } from "@/components/image-cropper/profile-crop-dialog";
import { getUserProfileImageUrl } from "@/lib/image-utils";

interface UserProfileImageUploadProps {
  currentImageKey?: string | null;
  currentOAuthImage?: string | null;
  userName: string;
}

export function UserProfileImageUpload({
  currentImageKey,
  currentOAuthImage,
  userName,
}: UserProfileImageUploadProps) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImageUrl = getUserProfileImageUrl({
    profileImageKey: currentImageKey,
    image: currentOAuthImage,
  });

  const getInitials = (name: string) =>

    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleSelectFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be smaller than 20 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropOpen(true);
    };
    reader.onerror = () => toast.error("Failed to read the file");
    reader.readAsDataURL(file);
  };

  const handleCropSave = async (croppedFile: File, sizeKB: number) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("type", "profile");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        startTransition(async () => {
          const r = await updateUserProfileImage(result.key);
          if (r.status === "success") {
            toast.success(`Avatar updated (${sizeKB} KB)`);
          } else {
            toast.error(r.message);
          }
        });
      } else {
        toast.error(result.message || "Upload failed");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setRawImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    startTransition(async () => {
      const r = await removeUserProfileImage();
      if (r.status === "success") toast.success("Avatar removed");
      else toast.error(r.message);
    });
  };

  const isLoading = pending || uploading;

  return (
    <>
      {/* Avatar block — centered circle + text button + trash */}
      <div className="flex flex-col items-start gap-3">
        {/* Circle avatar */}
        <div className="relative group">
          <Avatar className="w-20 h-20 border border-border">
            {displayImageUrl ? (
              <AvatarImage
                src={displayImageUrl}
                alt={userName}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="text-xl font-semibold bg-muted text-muted-foreground">
                {getInitials(userName)}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
              <Loader2 className="w-5 h-5 animate-spin text-foreground" />
            </div>
          )}
        </div>

        {/* Action row: "Change avatar" text + trash icon */}
        <div className="flex items-center gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectFile(file);
            }}
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="text-sm text-foreground hover:underline underline-offset-2 font-medium disabled:opacity-50 transition-opacity"
          >
            Change avatar
          </button>

          {currentImageKey && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleRemove}
              disabled={isLoading}
              title="Remove avatar"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          JPG, PNG or WEBP. Will be cropped to a circle and compressed to under 100 KB.
        </p>
      </div>

      {/* Crop modal */}
      <ProfileCropDialog
        isOpen={isCropOpen}
        onClose={() => {
          setIsCropOpen(false);
          setRawImageSrc(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        imageSrc={rawImageSrc}
        onCropSave={handleCropSave}
      />
    </>
  );
}