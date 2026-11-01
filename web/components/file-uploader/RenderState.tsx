import { cn } from "@/lib/utils";
import { CloudUploadIcon, FileTextIcon, ImageIcon, Loader, RotateCcw, XIcon, EyeIcon } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { useState } from "react";


export function RenderEmptyState({isDragActive}: {isDragActive: boolean}) {
    return (
        <div className="text-center gap-2 flex flex-col items-center justify-center px-4 py-6">
            <div className="flex items-center mx-auto justify-center size-10 sm:size-12 rounded-full bg-muted mb-3 sm:mb-4">
                <CloudUploadIcon className={cn('size-5 sm:size-6 text-muted-foreground', isDragActive && 'text-primary')}/>
            </div>
            <p className="text-sm sm:text-base font-semibold text-foreground text-center leading-relaxed">Drop your files here or 
                <span className="text-primary font-bold cursor-pointer"> Click to Upload</span>
            </p>
            <Button type="button" className="mt-3 sm:mt-4 text-xs sm:text-sm px-4 py-2">
                Select Files
            </Button>
        </div>
    )
}

export function RenderErrorState() {
    return (
        <div className="text-center px-4 py-6">
            <div className="flex items-center mx-auto justify-center size-10 sm:size-12 rounded-full bg-destructive/40 mb-3 sm:mb-4">
                <ImageIcon className={cn('size-5 sm:size-6 text-destructive animate-pulse')}/>
            </div>
            <p className="text-sm sm:text-base font-semibold">Upload Failed</p>
            <p className="text-xs sm:text-xs text-muted-foreground font-semibold mt-1">Something went wrong</p>
            <Button className="mt-3 sm:mt-4 text-xs sm:text-sm px-4 py-2" type="button">
                <RotateCcw className="size-3 sm:size-4 mr-1 sm:mr-2" />Retry File Selection
            </Button>
        </div>
    )
}

export function RenderUploadedState({previewUrl, isDeleting, handleRemoveFile, fileType, onPreview}: {previewUrl: string; isDeleting: boolean; handleRemoveFile: () => void; fileType: 'image' | 'video' | 'pdf'; onPreview?: () => void;}) {
    const [showMobileActions, setShowMobileActions] = useState(false);

    const handleMobileClick = () => {
        setShowMobileActions(!showMobileActions);
    };

    return (
        <div className="relative group w-full h-full flex items-center justify-center">
            {fileType === 'video' ? (
                <video src={previewUrl} controls className="w-full h-full rounded-md" />
            ) : fileType === 'pdf' ? (
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <FileTextIcon className="size-12 sm:size-16 text-red-500 mb-2" />
                    <p className="text-xs sm:text-sm font-medium text-gray-700">PDF Uploaded</p>
                    <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-xs mt-1 underline"
                    >
                        View PDF
                    </a>
                </div>
            ) : (
                <div 
                    className="relative w-full h-full cursor-pointer sm:cursor-default"
                    onClick={handleMobileClick}
                >
                    <Image
                        src={previewUrl}
                        alt="Uploaded file"
                        fill
                        className="object-contain p-1 sm:p-2"
                        priority
                    />
                    
                    {/* Mobile overlay that appears on tap */}
                    <div className={cn(
                        "absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity duration-200 sm:hidden",
                        showMobileActions ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}>
                        {onPreview && (
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview();
                                }}
                            >
                                <EyeIcon className="size-4" />
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile();
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader className="animate-spin size-4" />
                            ) : (
                                <XIcon className="size-4" />
                            )}
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Desktop delete button (always visible on hover) */}
            <Button 
                type="button"
                variant="destructive" 
                size="icon"
                className={cn(
                    'absolute top-2 right-2 sm:top-4 sm:right-4 cursor-pointer h-7 w-7 sm:h-9 sm:w-9',
                    'hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
                )}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveFile();
                }}
                disabled={isDeleting}>
                    {isDeleting ? (
                        <Loader className="animate-spin size-3 sm:size-4 cursor-pointer" />
                    ) : (
                        <XIcon className="size-3 sm:size-4" />
                    )}
            </Button>
        </div>
    )
}

export function RenderUploadingState({progress, file}: {progress: number; file: File;}) {
    return (
        <div className="text-center flex justify-center items-center flex-col px-4 py-6">
            <p className="text-lg sm:text-xl font-bold text-primary">{progress}%</p>
            <p className="mt-2 text-xs sm:text-sm font-medium text-foreground">Uploading....</p>
            <p className="mt-1 text-xs text-muted-foreground truncate max-w-full sm:max-w-xs px-2">{file.name}</p>
        </div>
    )
}