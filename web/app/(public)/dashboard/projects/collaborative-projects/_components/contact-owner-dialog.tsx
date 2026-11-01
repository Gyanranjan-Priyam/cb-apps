"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2, X, Mail, User } from "lucide-react";
import { sendCollaborationEmail } from "../actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface ContactOwnerDialogProps {
  ownerName: string;
  ownerEmail: string;
  senderEmail: string;
  projectName: string;
  className?: string;
}

export function ContactOwnerDialog({
  ownerName,
  ownerEmail,
  senderEmail,
  projectName,
  className,
}: ContactOwnerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    subject: `Collaboration Request: ${projectName}`,
    message: "",
  });

  const handleSend = () => {
    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Message is required");
      return;
    }
    if (formData.message.trim().length < 20) {
      toast.error("Please write a more detailed message (at least 20 characters)");
      return;
    }

    startTransition(async () => {
      try {
        const result = await sendCollaborationEmail({
          toEmail: ownerEmail,
          toName: ownerName,
          fromEmail: senderEmail,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          projectName,
        });

        if (result.success) {
          toast.success(result.message);
          setOpen(false);
          setFormData({
            subject: `Collaboration Request: ${projectName}`,
            message: "",
          });
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to send email");
        console.error(error);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className={className}>
          <MessageSquare className="h-3.5 w-3.5" />
          Contact Owner
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <SheetTitle className="text-lg sm:text-xl">Contact Project Owner</SheetTitle>
              <SheetDescription className="text-sm">
                Reach out to collaborate on <span className="font-medium text-foreground">{projectName}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-5 sm:space-y-6">
            {/* Recipient Info Card */}
            <div className="rounded-lg border bg-muted/50 p-3 sm:p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-medium text-muted-foreground">To</Label>
                  <p className="font-medium text-sm sm:text-base truncate">{ownerName}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{ownerEmail}</p>
                </div>
              </div>
            </div>

            {/* Sender Info Card */}
            <div className="rounded-lg border bg-muted/50 p-3 sm:p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-medium text-muted-foreground">From</Label>
                  <p className="text-sm sm:text-base truncate">{senderEmail}</p>
                </div>
              </div>
            </div>

            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Enter a clear and concise subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                disabled={isPending}
                className="text-sm sm:text-base"
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground">
                {formData.subject.length}/150 characters
              </p>
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and explain your interest in collaboration...&#10;&#10;• What aspects of the project interest you?&#10;• What skills or experience can you bring?&#10;• What type of collaboration are you looking for?"
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={10}
                disabled={isPending}
                className="text-sm sm:text-base resize-none"
                maxLength={2000}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Be professional and specific about your collaboration goals</span>
                <span>{formData.message.length}/2000</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-muted/30">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isPending || !formData.subject.trim() || !formData.message.trim()}
              className="w-full sm:flex-1 gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
