"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin_components/rich-text-editor/Editor";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { 
  X, 
  Paperclip, 
  Send, 
  Loader2,
  FileText,
  Image as ImageIcon,
  File,
} from "lucide-react";

interface EmailComposeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName: string;
}

interface Attachment {
  file: File;
  id: string;
}

export default function EmailComposeSidebar({ 
  isOpen, 
  onClose, 
  recipientEmail, 
  recipientName 
}: EmailComposeSidebarProps) {
  const [subject, setSubject] = useState("");
  const [messageJson, setMessageJson] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
    }));

    // Check total size (max 10MB total)
    const totalSize = [...attachments, ...newAttachments].reduce(
      (sum, att) => sum + att.file.size,
      0
    );

    if (totalSize > 10 * 1024 * 1024) {
      toast.error("Total attachment size cannot exceed 10MB");
      return;
    }

    setAttachments([...attachments, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((att) => att.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (["pdf", "doc", "docx", "txt"].includes(ext || "")) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!messageJson.trim() || messageJson === '{"type":"doc","content":[{"type":"paragraph"}]}') {
      toast.error("Please enter a message");
      return;
    }

    setIsSending(true);

    try {
      // Convert JSON to HTML for email
      const messageHtml = generateHTML(JSON.parse(messageJson), [
        StarterKit.configure({
          bulletList: false,
          orderedList: false,
          listItem: false,
        }),
        ListItem,
        BulletList.configure({
          HTMLAttributes: {
            class: 'prose-bullet-list',
          },
        }),
        OrderedList.configure({
          HTMLAttributes: {
            class: 'prose-ordered-list',
          },
        }),
        TextAlign.configure({ types: ["heading", "paragraph", "listItem"] }),
      ]);

      const formData = new FormData();
      formData.append("to", recipientEmail);
      formData.append("subject", subject);
      formData.append("message", messageHtml);

      // Add attachments
      attachments.forEach((att) => {
        formData.append("attachments", att.file);
      });

      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Email sent successfully!");
        // Reset form
        setSubject("");
        setMessageJson("");
        setAttachments([]);
        onClose();
      } else {
        toast.error(result.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("An error occurred while sending email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Compose Email
            </SheetTitle>
            <SheetDescription>
              Send an email to {recipientName}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4 pb-4">
            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient">To</Label>
              <Input
                id="recipient"
                value={`${recipientName} <${recipientEmail}>`}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
              />
            </div>

            <Separator />

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor 
                field={{
                  value: messageJson,
                  onChange: (value: string) => setMessageJson(value)
                }}
              />
            </div>

            <Separator />

            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Attachments</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSending}
                />
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="shrink-0">
                        {getFileIcon(att.file.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {att.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(att.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(att.id)}
                        disabled={isSending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Total: {formatFileSize(attachments.reduce((sum, att) => sum + att.file.size, 0))} / 10 MB
                  </p>
                </div>
              )}

              {attachments.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No attachments added
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 z-10 px-6 py-4 border-t bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !messageJson.trim() || messageJson === '{"type":"doc","content":[{"type":"paragraph"}]}'}
              className="flex-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
