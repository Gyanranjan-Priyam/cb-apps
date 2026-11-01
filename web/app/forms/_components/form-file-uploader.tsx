/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import {
  UploadCloud,
  FileText,
  ImageIcon,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  processAndCompressFormFile,
  MAX_ORIGINAL_FILE_SIZE_BYTES,
} from "@/lib/file-compression";

export interface ProcessedFormFile {
  id: string;
  originalName: string;
  compressedName: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  base64Data: string; // Base64 data for submission on submit click
  previewUrl?: string;
}

interface FormFileUploaderProps {
  fieldId: string;
  label?: string;
  description?: string;
  required?: boolean;
  allowedFileTypes?: string[];
  maxFiles?: number;
  imageOnly?: boolean;
  multipleFiles?: boolean;
  value?: ProcessedFormFile[];
  onChange: (files: ProcessedFormFile[]) => void;
  disabled?: boolean;
}

export function FormFileUploader({
  fieldId,
  allowedFileTypes = ["jpg", "jpeg", "png", "webp", "pdf"],
  maxFiles = 1,
  imageOnly = false,
  multipleFiles = false,
  value = [],
  onChange,
  disabled = false,
}: FormFileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processingState, setProcessingState] = useState<{
    isProcessing: boolean;
    fileName?: string;
    fileSize?: number;
    stage?: string;
    progress: number;
  }>({ isProcessing: false, progress: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const limitCount = multipleFiles ? maxFiles || 3 : 1;

  // Convert allowed extensions into accept string
  const acceptAttr = imageOnly
    ? "image/jpeg,image/png,image/webp"
    : (allowedFileTypes || [])
        .map((t) => {
          const clean = t.toLowerCase().replace(/^\./, "");
          if (clean === "jpg" || clean === "jpeg") return "image/jpeg";
          if (clean === "png") return "image/png";
          if (clean === "webp") return "image/webp";
          if (clean === "pdf") return "application/pdf";
          return `.${clean}`;
        })
        .join(",");

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;

    const remainingSlots = limitCount - value.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum of ${limitCount} file${limitCount > 1 ? "s" : ""} allowed.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    const newProcessedFiles: ProcessedFormFile[] = [...value];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const maxAllowedBytes = MAX_ORIGINAL_FILE_SIZE_BYTES;

      if (file.size > maxAllowedBytes) {
        toast.error(`"${file.name}" exceeds the maximum allowed file size of 5 MB.`);
        continue;
      }

      setProcessingState({
        isProcessing: true,
        fileName: file.name,
        fileSize: file.size,
        stage: "Reading file...",
        progress: 15,
      });

      try {
        const result = await processAndCompressFormFile(file, (stage, percent) => {
          setProcessingState((prev) => ({
            ...prev,
            stage,
            progress: percent !== undefined ? percent : Math.min(prev.progress + 15, 90),
          }));
        });

        // Convert blob to Base64 (stored locally in client state, uploaded on form submit)
        setProcessingState((prev) => ({ ...prev, stage: "Encoding file...", progress: 95 }));
        const base64Data = await blobToBase64(result.blob);
        setProcessingState((prev) => ({ ...prev, stage: "Ready", progress: 100 }));

        let previewUrl: string | undefined;
        if (result.mimeType.startsWith("image/")) {
          previewUrl = URL.createObjectURL(result.blob);
        }

        newProcessedFiles.push({
          id: `file-${Math.random().toString(36).slice(2, 10)}`,
          originalName: file.name,
          compressedName: result.fileName,
          mimeType: result.mimeType,
          originalSize: result.originalSizeBytes,
          compressedSize: result.compressedSizeBytes,
          base64Data,
          previewUrl,
        });

        toast.success(
          result.isCompressed
            ? `"${file.name}" ready: ${(result.originalSizeBytes / 1024).toFixed(0)} KB → ${(
                result.compressedSizeBytes / 1024
              ).toFixed(0)} KB`
            : `"${file.name}" selected (${(result.compressedSizeBytes / 1024).toFixed(0)} KB)`
        );
      } catch (err: any) {
        toast.error(err.message || `Failed to process "${file.name}"`);
      }
    }

    setProcessingState({ isProcessing: false, progress: 0 });
    onChange(newProcessedFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleRemove = (fileId: string) => {
    const fileToRemove = value.find((f) => f.id === fileId);
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    const updated = value.filter((f) => f.id !== fileId);
    onChange(updated);
  };

  return (
    <div className="space-y-3 w-full font-sans">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        multiple={multipleFiles && limitCount > 1}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilesSelected(e.target.files)}
        disabled={disabled || processingState.isProcessing || value.length >= limitCount}
        className="hidden"
        id={`upload-${fieldId}`}
      />

      {/* Dropzone Area (shown when slots are available) */}
      {value.length < limitCount && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!processingState.isProcessing && value.length < limitCount) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? "border-[#0078D4] bg-[#F0F7FD] scale-[0.99]"
              : "border-[#D2D0CA] bg-[#FAFAFA] hover:border-[#0078D4] hover:bg-[#F3F9FD]"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3FC] text-[#0078D4] flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1C1B1F]">
                Drag & Drop File or <span className="text-[#0078D4] hover:underline">Browse Files</span>
              </p>
              <p className="text-xs text-[#605E5C]">
                {imageOnly ? "Images (JPG, PNG, WEBP)" : `Allowed: ${allowedFileTypes.join(", ").toUpperCase()}`}
                {" • "}
                Max size: <span className="font-semibold text-[#1C1B1F]">5 MB</span> (Optimized to ≤ 300 KB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Processing / Upload Progress Card */}
      {processingState.isProcessing && (
        <div className="p-4 rounded-xl border border-[#0078D4]/30 bg-[#F0F7FD] shadow-xs space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#EBF3FC] text-[#0078D4] flex items-center justify-center shrink-0 border border-[#0078D4]/20">
                <Loader2 className="w-4 h-4 animate-spin text-[#0078D4]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1C1B1F] truncate max-w-[200px] sm:max-w-[300px]">
                  {processingState.fileName}
                </p>
                <p className="text-[11px] text-[#605E5C]">
                  {processingState.fileSize ? `${(processingState.fileSize / 1024).toFixed(0)} KB • ` : ""}
                  <span className="text-[#0078D4] font-medium">{processingState.stage}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm font-bold font-mono text-[#0078D4]">
                {Math.round(processingState.progress)}%
              </span>
            </div>
          </div>

          {/* High-visibility Progress bar */}
          <div className="relative w-full h-2 bg-[#D2D0CA]/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0078D4] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, Math.min(100, processingState.progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Uploaded Files Card List */}
      {value.length > 0 && (
        <div className="space-y-2 pt-1">
          {value.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#E1DFDD] bg-white shadow-sm transition-all hover:border-[#C8C6C4]"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Thumbnail Preview */}
                {f.previewUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#D2D0CA] shrink-0 bg-[#F3F2F1]">
                    {/* eslint-disable-next-html-img-element */}
                    <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : f.mimeType.startsWith("image/") ? (
                  <div className="w-12 h-12 rounded-lg bg-[#DFF6DD] text-[#107C10] flex items-center justify-center shrink-0 border border-[#107C10]/20">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#EBF3FC] text-[#0078D4] flex items-center justify-center shrink-0 border border-[#0078D4]/20">
                    <FileText className="w-6 h-6" />
                  </div>
                )}

                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-[#1C1B1F] truncate max-w-[220px] sm:max-w-[340px]">
                    {f.originalName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-medium text-[#107C10] bg-[#DFF6DD] px-2 py-0.5 rounded-full text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-[#107C10]" />
                      Ready
                    </span>
                    <span className="text-[#605E5C] font-mono">
                      {(f.compressedSize / 1024).toFixed(0)} KB
                    </span>
                    {f.originalSize !== f.compressedSize && (
                      <span className="text-[#A19F9D] text-[10px]">
                        (from {(f.originalSize / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove / Change button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(f.id)}
                  title="Remove file"
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[#605E5C] hover:text-[#D13438] hover:bg-[#FDE7E9] transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
