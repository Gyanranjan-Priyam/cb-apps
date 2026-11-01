"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon,
  FileArchive,
  FileVideo,
  FileAudio,
  File as FileIcon,
  Paperclip,
  ExternalLink
} from "lucide-react";

interface AttachmentData {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Loading component for Suspense fallback
const AttachmentListLoading = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-6" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AttachmentListViewer = () => {
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const ticketParam = searchParams?.get("ticketNumber");
      const attachmentsParam = searchParams?.get("attachments");

      if (!ticketParam || !attachmentsParam) {
        setError("Missing ticket information");
        setLoading(false);
        return;
      }

      setTicketNumber(ticketParam);
      const parsedAttachments = JSON.parse(decodeURIComponent(attachmentsParam));
      setAttachments(parsedAttachments);
      setLoading(false);
    } catch (err) {
      setError("Failed to load attachment information");
      setLoading(false);
    }
  }, [searchParams]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    if (mimeType.startsWith('video/')) {
      return <FileVideo className="h-6 w-6 text-purple-500" />;
    }
    if (mimeType.startsWith('audio/')) {
      return <FileAudio className="h-6 w-6 text-green-500" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return <FileArchive className="h-6 w-6 text-yellow-500" />;
    }
    return <FileIcon className="h-6 w-6 text-gray-500" />;
  };

  const getFileTypeBadge = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return { label: 'Image', variant: 'default' as const };
    if (mimeType === 'application/pdf') return { label: 'PDF', variant: 'destructive' as const };
    if (mimeType.startsWith('video/')) return { label: 'Video', variant: 'secondary' as const };
    if (mimeType.startsWith('audio/')) return { label: 'Audio', variant: 'outline' as const };
    if (mimeType.startsWith('text/')) return { label: 'Text', variant: 'outline' as const };
    return { label: 'File', variant: 'outline' as const };
  };

  const handleViewFile = (attachmentId: string) => {
    const viewerUrl = `/file-viewer?id=${attachmentId}&type=user`;
    window.open(viewerUrl, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
  };

  const handleDownloadFile = async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/view-attachment?attachmentId=${attachmentId}&action=download`);
      
      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }
      
      const data = await response.json();
      
      // Create download link
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = fileName;
      a.click();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <Paperclip className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Paperclip className="h-6 w-6" />
              <span>Attachments - Ticket {ticketNumber}</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {attachments.length} file{attachments.length !== 1 ? 's' : ''}
              </Badge>
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
        
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-center py-12">
              <Paperclip className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Attachments</h3>
              <p className="text-muted-foreground">This ticket has no attachments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => {
                const typeBadge = getFileTypeBadge(attachment.mimeType);
                
                return (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {getFileIcon(attachment.mimeType)}
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm">{attachment.fileName}</p>
                          <Badge variant={typeBadge.variant} className="text-xs">
                            {typeBadge.label}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(attachment.fileSize)}</span>
                          <span>•</span>
                          <span className="font-mono">{attachment.mimeType}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFile(attachment.id)}
                        className="text-xs"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(attachment.id, attachment.fileName)}
                        className="text-xs"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total size: {formatFileSize(attachments.reduce((sum, att) => sum + att.fileSize, 0))}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.close()}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Close Window
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function AttachmentListPage() {
  return (
    <Suspense fallback={<AttachmentListLoading />}>
      <AttachmentListViewer />
    </Suspense>
  );
}