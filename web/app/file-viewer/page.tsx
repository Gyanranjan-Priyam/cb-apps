"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon,
  FileX,
  Loader2
} from "lucide-react";

interface AttachmentData {
  downloadUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

// Loading component for Suspense fallback
const FileViewerLoading = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-6xl mx-auto h-[calc(100vh-2rem)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FileViewer = () => {
  const [attachmentData, setAttachmentData] = useState<AttachmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const attachmentId = searchParams?.get("id");
  const type = searchParams?.get("type"); // "user" or "response"

  useEffect(() => {
    if (!attachmentId) {
      setError("No attachment ID provided");
      setLoading(false);
      return;
    }

    const fetchAttachment = async () => {
      try {
        const apiUrl = type === "response" 
          ? `/api/view-response-attachment?attachmentId=${attachmentId}&action=download`
          : `/api/view-attachment?attachmentId=${attachmentId}&action=download`;
          
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error("Failed to fetch attachment");
        }
        
        const data = await response.json();
        setAttachmentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load attachment");
      } finally {
        setLoading(false);
      }
    };

    fetchAttachment();
  }, [attachmentId, type]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6" />;
    }
    return <FileText className="h-6 w-6" />;
  };

  const handleDownload = () => {
    if (attachmentData?.downloadUrl) {
      const a = document.createElement('a');
      a.href = attachmentData.downloadUrl;
      a.download = attachmentData.fileName;
      a.click();
    }
  };

  const handleOpenInNewTab = () => {
    if (attachmentData?.downloadUrl) {
      window.open(attachmentData.downloadUrl, '_blank');
    }
  };

  const renderFileViewer = () => {
    if (!attachmentData) return null;

    const { mimeType, downloadUrl, fileName } = attachmentData;

    // Image viewer
    if (mimeType.startsWith('image/')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={downloadUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              setError("Failed to load image");
            }}
          />
        </div>
      );
    }

    // PDF viewer
    if (mimeType === 'application/pdf') {
      return (
        <div className="w-full h-full">
          <iframe
            src={downloadUrl}
            className="w-full h-full border-0 rounded-lg"
            title={fileName}
            onError={() => setError("Failed to load PDF")}
          />
        </div>
      );
    }

    // Text files
    if (mimeType.startsWith('text/')) {
      return (
        <div className="w-full h-full">
          <iframe
            src={downloadUrl}
            className="w-full h-full border border-gray-300 rounded-lg"
            title={fileName}
          />
        </div>
      );
    }

    // Other file types - show download option
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <FileX className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-medium">Preview not available</p>
          <p className="text-sm text-muted-foreground mt-1">
            This file type cannot be previewed in the browser
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={handleOpenInNewTab}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !attachmentData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <FileX className="h-4 w-4" />
              <AlertDescription>
                {error || "Failed to load attachment"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-6xl mx-auto h-[calc(100vh-2rem)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              {getFileIcon(attachmentData.mimeType)}
              <span className="truncate">{attachmentData.fileName}</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {formatFileSize(attachmentData.fileSize)} • {attachmentData.mimeType}
              </span>
              
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.close()}
              >
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="h-[calc(100%-5rem)]">
          {renderFileViewer()}
        </CardContent>
      </Card>
    </div>
  );
};

export default function FileViewerPage() {
  return (
    <Suspense fallback={<FileViewerLoading />}>
      <FileViewer />
    </Suspense>
  );
}