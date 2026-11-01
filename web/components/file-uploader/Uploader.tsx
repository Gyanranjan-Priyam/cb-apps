/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { Button } from '../ui/button';
import { EyeIcon, FileIcon, ImageIcon, Loader2, TrashIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Progress } from '../ui/progress';
import Image from 'next/image';

interface SimpleUploaderProps {
    value?: string;
    onChange?: (value: string) => void;
    fileTypeAccepted: "image" | "pdf";
    disabled?: boolean;
    maxSize?: number; // in bytes
}

export function Uploader({ value, onChange, fileTypeAccepted, disabled = false, maxSize = 10 * 1024 * 1024 }: SimpleUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');

    const uploadFile = useCallback(async (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        setFileName(file.name);
        
        const toastId = toast.loading(`Uploading ${file.name}... (0%)`, {
            description: "Preparing upload...",
        });

        try {
            // Create preview URL
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            // Server-side direct upload fallback helper
            const uploadDirectly = async () => {
                toast.loading(`Uploading ${file.name}...`, {
                    id: toastId,
                    description: "Uploading directly to server...",
                });
                const formData = new FormData();
                formData.append('file', file);
                const directRes = await fetch('/api/s3/upload-direct', {
                    method: 'POST',
                    body: formData,
                });
                if (!directRes.ok) {
                    throw new Error('Direct server upload failed');
                }
                const data = await directRes.json();
                if (!data.key) throw new Error('No key returned from server upload');
                setUploadProgress(100);
                onChange?.(data.key);
                toast.success('File uploaded successfully', {
                    id: toastId,
                    description: file.name,
                });
                return data.key;
            };

            try {
                // Get pre-signed URL from server
                const response = await fetch('/api/s3/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        contentType: file.type,
                        size: file.size,
                        isImage: fileTypeAccepted === 'image',
                        isPdf: fileTypeAccepted === 'pdf',
                    })
                });

                if (!response.ok) {
                    await uploadDirectly();
                    return;
                }

                const { preSignedUrl, key } = await response.json();

                // Upload to S3 via presigned URL with real-time progress
                await new Promise<string>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress = Math.round((event.loaded / event.total) * 100);
                            setUploadProgress(progress);
                            const loadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
                            const totalMB = (event.total / (1024 * 1024)).toFixed(1);
                            toast.loading(`Uploading ${file.name}... (${progress}%)`, {
                                id: toastId,
                                description: `${loadedMB} MB of ${totalMB} MB`,
                            });
                        }
                    });

                    xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            setUploadProgress(100);
                            onChange?.(key);
                            toast.success('File uploaded successfully', {
                                id: toastId,
                                description: file.name,
                            });
                            resolve(key);
                        } else {
                            reject(new Error(`Upload failed with status ${xhr.status}`));
                        }
                    });

                    xhr.addEventListener('error', () => {
                        reject(new Error('Network error during file upload'));
                    });

                    xhr.addEventListener('abort', () => {
                        reject(new Error('Upload aborted'));
                    });

                    xhr.open('PUT', preSignedUrl);
                    xhr.setRequestHeader('Content-Type', file.type);
                    xhr.send(file);
                });
            } catch (presignedErr) {
                console.warn('Presigned upload failed or blocked by CORS. Using direct upload fallback...', presignedErr);
                await uploadDirectly();
            }
        } catch (error: any) {
            console.error('All upload attempts failed:', error);
            toast.error('Upload failed', {
                id: toastId,
                description: error?.message || 'Please check the file and try again.',
            });
            setPreviewUrl('');
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    }, [fileTypeAccepted, onChange]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            uploadFile(acceptedFiles[0]);
        }
    }, [uploadFile]);

    const onDropRejected = useCallback((rejectedFiles: any[]) => {
        if (rejectedFiles.length > 0) {
            const errors = rejectedFiles[0].errors;
            if (errors.some((e: any) => e.code === 'file-invalid-type')) {
                toast.error('Invalid file format', {
                    description: `Please upload a valid ${fileTypeAccepted === 'image' ? 'image (JPG/PNG/WebP)' : 'PDF'} file`,
                });
            } else if (errors.some((e: any) => e.code === 'file-too-large')) {
                const maxSizeMB = Math.round(maxSize / 1024 / 1024);
                const maxSizeKB = Math.round(maxSize / 1024);
                const sizeText = maxSizeMB >= 1 ? `${maxSizeMB}MB` : `${maxSizeKB}KB`;
                toast.warning('File exceeds size limit', {
                    description: `Maximum file size allowed is ${sizeText}`,
                });
            } else {
                toast.error('File rejected', {
                    description: errors[0]?.message || 'Please choose a valid file',
                });
            }
        }
    }, [fileTypeAccepted, maxSize]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        accept: fileTypeAccepted === 'image' 
            ? { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }
            : { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        maxSize: maxSize,
        disabled: disabled || uploading,
    });

    const handleRemove = async () => {
        if (!value) return;
        
        try {
            const response = await fetch('/api/s3/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: value })
            });

            if (response.ok) {
                onChange?.('');
                setPreviewUrl('');
                setFileName('');
                setUploadProgress(0);
                toast.success('File removed');
            } else {
                toast.error('Failed to remove file');
            }
        } catch (error) {
            console.error('Remove error:', error);
            toast.error('Failed to remove file');
        }
    };

    const getImageUrl = (key: string) => {
        if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('blob:')) {
            return key;
        }
        return `https://codebreakers.t3.storage.dev/${key}`;
    };

    const currentDisplayUrl = previewUrl || (value ? getImageUrl(value) : '');

    return (
        <div className="w-full">
            {currentDisplayUrl || value ? (
                <div className="relative rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {fileTypeAccepted === 'image' ? (
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                                    <Image
                                        src={currentDisplayUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized={currentDisplayUrl.startsWith('blob:')}
                                    />
                                </div>
                            ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex flex-col truncate">
                                <span className="text-sm font-medium truncate">
                                    {fileName || (value ? value.split('-').slice(1).join('-') : '') || value || ''}
                                </span>
                                {uploading && (
                                    <span className="text-xs text-muted-foreground">
                                        Uploading... {uploadProgress}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {currentDisplayUrl && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-2" align="end">
                                        {fileTypeAccepted === 'image' ? (
                                            <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                                <Image
                                                    src={currentDisplayUrl}
                                                    alt="Full Preview"
                                                    fill
                                                    className="object-contain"
                                                    unoptimized={currentDisplayUrl.startsWith('blob:')}
                                                />
                                            </div>
                                        ) : (
                                            <a
                                                href={currentDisplayUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline"
                                            >
                                                View Document
                                            </a>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            )}

                            {!disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemove}
                                    disabled={uploading}
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {uploading && (
                        <div className="mt-3">
                            <Progress value={uploadProgress} className="h-1" />
                        </div>
                    )}
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={cn(
                        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors',
                        isDragActive && 'border-primary/50 bg-primary/5',
                        disabled && 'opacity-60 cursor-not-allowed',
                        !disabled && 'cursor-pointer hover:border-primary/50 hover:bg-muted/50'
                    )}
                >
                    <input {...getInputProps()} />
                    
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : fileTypeAccepted === 'image' ? (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        ) : (
                            <FileIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>

                    <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium">
                            {uploading ? (
                                `Uploading... ${uploadProgress}%`
                            ) : (
                                <>
                                    <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                                </>
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {fileTypeAccepted === 'image' 
                                ? 'JPG, PNG or WebP' 
                                : 'PDF document'} (max. {Math.round(maxSize / 1024 / 1024)}MB)
                        </p>
                    </div>

                    {uploading && (
                        <div className="mt-4 w-full max-w-xs space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-medium">
                                <span className="text-muted-foreground">Uploading file...</span>
                                <span className="font-mono font-bold text-primary">{uploadProgress}%</span>
                            </div>
                            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
                                    style={{ width: `${Math.max(4, Math.min(100, uploadProgress))}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}