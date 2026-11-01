/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useState } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { Button } from '../ui/button';
import { CloudUploadIcon, EyeIcon, ImageIcon, Loader2, TrashIcon, XIcon, FileTextIcon, FileIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Progress } from '../ui/progress';
import Image from 'next/image';

interface MultipleUploaderProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    disabled?: boolean;
    maxFiles?: number;
    minFiles?: number;
    accept?: 'images' | 'documents' | 'mixed';
    maxFileSize?: number; // in MB
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    previewUrl: string;
}

export function MultipleUploader({ 
    value = [], 
    onChange, 
    disabled = false, 
    maxFiles = 10, 
    minFiles = 1,
    accept = 'images',
    maxFileSize = 10
}: MultipleUploaderProps) {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

    // Define accepted file types based on accept prop
    const getAcceptedTypes = (): Accept => {
        switch (accept) {
            case 'images':
                return { 
                    'image/jpeg': ['.jpg', '.jpeg'], 
                    'image/png': ['.png'],
                    'image/gif': ['.gif'],
                    'image/webp': ['.webp']
                };
            case 'documents':
                return { 
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'application/vnd.ms-excel': ['.xls'],
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                    'application/vnd.ms-powerpoint': ['.ppt'],
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                    'text/plain': ['.txt'],
                    'text/csv': ['.csv']
                };
            case 'mixed':
                return {
                    'image/jpeg': ['.jpg', '.jpeg'], 
                    'image/png': ['.png'],
                    'image/gif': ['.gif'],
                    'image/webp': ['.webp'],
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'text/plain': ['.txt']
                };
            default:
                return { 
                    'image/jpeg': ['.jpg', '.jpeg'], 
                    'image/png': ['.png'] 
                };
        }
    };

    const getFileTypeLabels = () => {
        switch (accept) {
            case 'images':
                return 'JPG, PNG, GIF, WEBP';
            case 'documents':
                return 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV';
            case 'mixed':
                return 'Images (JPG, PNG, GIF, WEBP) and Documents (PDF, DOC, TXT)';
            default:
                return 'JPG, PNG';
        }
    };

    const isImageFile = (file: File) => {
        return file.type.startsWith('image/');
    };

    const isPdfFile = (file: File) => {
        return file.type === 'application/pdf';
    };

    const uploadFile = useCallback(async (file: File) => {
        const uploadId = Math.random().toString(36).substring(7);
        const objectUrl = URL.createObjectURL(file);
        
        // Add to uploading files
        const uploadingFile: UploadingFile = {
            id: uploadId,
            file,
            progress: 0,
            previewUrl: objectUrl
        };
        
        setUploadingFiles(prev => [...prev, uploadingFile]);

        const toastId = toast.loading(`Uploading ${file.name}... (0%)`, {
            description: "Preparing upload...",
        });

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
            
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
            const newValue = [...value, data.key];
            onChange?.(newValue);
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
                    isImage: isImageFile(file),
                    isPdf: isPdfFile(file),
                })
            });

            if (!response.ok) {
                await uploadDirectly();
                return;
            }

            const { preSignedUrl, key } = await response.json();

            // Upload to S3 with real-time progress tracking
            await new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        setUploadingFiles(prev => 
                            prev.map(f => f.id === uploadId ? { ...f, progress } : f)
                        );
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
                        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
                        const newValue = [...value, key];
                        onChange?.(newValue);
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
            console.warn('Presigned upload failed or blocked by CORS. Trying server direct upload fallback...', presignedErr);
            try {
                await uploadDirectly();
            } catch (fallbackErr: any) {
                console.error('All upload attempts failed:', fallbackErr);
                toast.error(`Failed to upload ${file.name}`, {
                    id: toastId,
                    description: fallbackErr?.message || 'Please check your connection.',
                });
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
                URL.revokeObjectURL(objectUrl);
            }
        }
    }, [value, onChange]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const currentTotal = value.length + uploadingFiles.length;
        const remainingSlots = maxFiles - currentTotal;
        
        if (remainingSlots <= 0) {
            const fileTypeLabel = accept === 'images' ? 'images' : accept === 'documents' ? 'files' : 'files';
            toast.error(`Maximum ${maxFiles} ${fileTypeLabel} allowed`);
            return;
        }
        
        const filesToUpload = acceptedFiles.slice(0, remainingSlots);
        
        if (filesToUpload.length < acceptedFiles.length) {
            toast.warning(`Only uploading ${filesToUpload.length} files due to limit`);
        }
        
        filesToUpload.forEach(file => {
            uploadFile(file);
        });
    }, [uploadFile, value.length, uploadingFiles.length, maxFiles]);

    const onDropRejected = useCallback((rejectedFiles: any[]) => {
        if (rejectedFiles.length > 0) {
            const errors = rejectedFiles[0].errors;
            if (errors.some((e: any) => e.code === 'file-invalid-type')) {
                toast.error(`Please upload valid files (${getFileTypeLabels()})`);
            } else if (errors.some((e: any) => e.code === 'file-too-large')) {
                toast.error(`File is too large. Maximum size is ${maxFileSize}MB`);
            }
        }
    }, [maxFileSize]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        accept: getAcceptedTypes(),
        maxFiles: maxFiles - value.length - uploadingFiles.length,
        maxSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
        disabled: disabled || (value.length + uploadingFiles.length) >= maxFiles,
        multiple: true,
    });

    const handleRemove = async (keyToRemove: string) => {
        try {
            const response = await fetch('/api/s3/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: keyToRemove })
            });

            if (response.ok) {
                const newValue = value.filter(key => key !== keyToRemove);
                onChange?.(newValue);
                toast.success('Image removed');
            } else {
                toast.error('Failed to remove image');
            }
        } catch (error) {
            console.error('Remove error:', error);
            toast.error('Failed to remove image');
        }
    };

    const getFileUrl = (key: string) => {
        return `https://codebreakers.t3.storage.dev/${key}`;
    };

    const canUploadMore = (value.length + uploadingFiles.length) < maxFiles;
    const hasMinimumFiles = value.length >= minFiles;

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            {canUploadMore && (
                <Card
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed cursor-pointer transition-colors",
                        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <CardContent className="p-4 sm:p-6">
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                            {accept === 'images' ? (
                                <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                            ) : accept === 'documents' ? (
                                <FileTextIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                            ) : (
                                <FileIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                            )}
                            <div>
                                <p className="text-xs sm:text-sm font-medium">
                                    {accept === 'images' 
                                        ? 'Drop images here or click to browse'
                                        : accept === 'documents'
                                        ? 'Drop documents here or click to browse'
                                        : 'Drop files here or click to browse'
                                    }
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                    {value.length}/{maxFiles} files • Supports {getFileTypeLabels()} (max {maxFileSize}MB each)
                                </p>
                                {!hasMinimumFiles && (
                                    <p className="text-[10px] sm:text-xs text-destructive mt-1">
                                        Minimum {minFiles} file{minFiles > 1 ? 's' : ''} required
                                    </p>
                                )}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="text-xs sm:text-sm">
                                <CloudUploadIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                {accept === 'images' ? 'Choose Images' : accept === 'documents' ? 'Choose Documents' : 'Choose Files'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Uploading Files */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Uploading...</p>
                    {uploadingFiles.map((uploadingFile) => (
                        <Card key={uploadingFile.id}>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden shrink-0 flex items-center justify-center bg-muted">
                                        {isImageFile(uploadingFile.file) ? (
                                            <Image
                                                src={uploadingFile.previewUrl}
                                                alt="Uploading..."
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        ) : (
                                            <FileTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium truncate">{uploadingFile.file.name}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                            {uploadingFile.progress}% complete
                                        </p>
                                        <Progress value={uploadingFile.progress} className="w-full mt-1" />
                                    </div>
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {value.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-medium">
                        Uploaded Files ({value.length}/{maxFiles})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                        {value.map((key, index) => {
                            const fileUrl = getFileUrl(key);
                            const fileName = key.split('/').pop() || `File ${index + 1}`;
                            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                            
                            return (
                                <Card key={key} className="relative group">
                                    <CardContent className="p-1 sm:p-2">
                                        <div className="relative aspect-square rounded overflow-hidden">
                                            {isImage ? (
                                                <Image
                                                    src={fileUrl}
                                                    alt={`Uploaded file ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-2">
                                                    <FileTextIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mb-1" />
                                                    <p className="text-[8px] sm:text-[10px] text-center text-muted-foreground uppercase font-medium">
                                                        {fileExtension}
                                                    </p>
                                                    <p className="text-[6px] sm:text-[8px] text-center text-muted-foreground truncate w-full mt-1">
                                                        {fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {/* Overlay with actions */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 sm:space-x-2">
                                                {/* Preview Button */}
                                                {isImage ? (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button type="button" variant="secondary" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
                                                                <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" side="top">
                                                            <div className="relative">
                                                                <Image
                                                                    src={fileUrl}
                                                                    alt="File preview"
                                                                    width={300}
                                                                    height={200}
                                                                    className="object-contain rounded-md max-w-[90vw] h-auto"
                                                                    priority
                                                                />
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : (
                                                    <Button 
                                                        type="button" 
                                                        variant="secondary" 
                                                        size="icon" 
                                                        className="h-6 w-6 sm:h-8 sm:w-8"
                                                        onClick={() => window.open(fileUrl, '_blank')}
                                                    >
                                                        <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </Button>
                                                )}
                                                
                                                {/* Remove Button */}
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleRemove(key)}
                                                    className="h-6 w-6 sm:h-8 sm:w-8"
                                                >
                                                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty state when no files */}
            {value.length === 0 && uploadingFiles.length === 0 && !canUploadMore && (
                <Card>
                    <CardContent className="p-4 sm:p-6 text-center">
                        {accept === 'images' ? (
                            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2" />
                        ) : (
                            <FileTextIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2" />
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {accept === 'images' ? 'No images uploaded' : 'No files uploaded'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}