"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { submitProjectReview, getUserWhatsAppNumber } from "../actions";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface SendForReviewDialogProps {
  repoName: string;
  repoUrl: string;
  description: string | null;
}

export function SendForReviewDialog({
  repoName,
  repoUrl,
  description,
}: SendForReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [reviewType, setReviewType] = useState<"review" | "collaboration" | "publish">("review");
  const [explanation, setExplanation] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);

  useEffect(() => {
    if (reviewType === "publish" && open) {
      loadWhatsAppNumber();
    }
  }, [reviewType, open]);

  const loadWhatsAppNumber = async () => {
    setLoadingWhatsApp(true);
    try {
      const result = await getUserWhatsAppNumber();
      if (result.success) {
        setWhatsappNumber(result.whatsappNumber || null);
      }
    } catch (error) {
      console.error("Error loading WhatsApp number:", error);
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const handleSubmit = () => {
    if (!explanation.trim()) {
      toast.error("Please provide an explanation");
      return;
    }

    if (reviewType === "publish" && !whatsappNumber) {
      toast.error("WhatsApp number is required for publishing. Please update your profile.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitProjectReview({
          repoName,
          repoUrl,
          description,
          reviewType,
          explanation: explanation.trim(),
          liveUrl: reviewType === "review" && liveUrl.trim() ? liveUrl.trim() : undefined,
        });

        if (result.success) {
          toast.success(result.message);
          setOpen(false);
          // Reset form
          setReviewType("review");
          setExplanation("");
          setLiveUrl("");
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to submit review request");
        console.error(error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="gap-2">
          <Send className="h-3.5 w-3.5" />
          Send for Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-[95vw] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Send Project for Review</DialogTitle>
          <DialogDescription className="text-sm">
            Submit your project "{repoName}" for review, collaboration, or website publication
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Review Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm sm:text-base">Select Reason</Label>
            <RadioGroup value={reviewType} onValueChange={(value: string) => setReviewType(value as "review" | "collaboration" | "publish")}>
              <div className="flex items-start space-x-2 p-2 sm:p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="review" id="review" className="mt-1" />
                <Label htmlFor="review" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm sm:text-base">For Review</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Get feedback and evaluation from mentors or peers
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-2 p-2 sm:p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="collaboration" id="collaboration" className="mt-1" />
                <Label htmlFor="collaboration" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm sm:text-base">For Collaboration</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Find collaborators to work together on this project
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-2 p-2 sm:p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="publish" id="publish" className="mt-1" />
                <Label htmlFor="publish" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm sm:text-base">For Publish on Website</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Showcase your project on the CodeBreakers website
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* For Review */}
          {reviewType === "review" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="explanation" className="text-sm sm:text-base">
                  Project Explanation <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="explanation"
                  placeholder="Explain your project, its features, technologies used, and what you'd like feedback on..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={6}
                  className="resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="liveUrl" className="text-sm sm:text-base">Project Live URL (Optional)</Label>
                <Input
                  id="liveUrl"
                  type="url"
                  placeholder="https://your-project-demo.com"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Provide a link to the deployed version if available
                </p>
              </div>
            </div>
          )}

          {/* For Collaboration */}
          {reviewType === "collaboration" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="explanation" className="text-sm sm:text-base">
                  Project Idea & Collaboration Details <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="explanation"
                  placeholder="Describe your project idea, what you're building, what help you need, and what skills you're looking for in collaborators..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={6}
                  className="resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about what kind of collaboration you're seeking (e.g., frontend developer, designer, etc.)
                </p>
              </div>
            </div>
          )}

          {/* For Publish */}
          {reviewType === "publish" && (
            <div className="space-y-4">
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-xs sm:text-sm mb-2">Why Publish on Website?</h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Showcase your work to the college community</li>
                  <li>Get recognition for your technical skills</li>
                  <li>Inspire other students with your projects</li>
                  <li>Build your portfolio and online presence</li>
                  <li>Potentially attract collaboration opportunities</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation" className="text-sm sm:text-base">
                  Why Should This Project Be Published? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="explanation"
                  placeholder="Explain why this project deserves to be featured on the CodeBreakers website. Describe its impact, uniqueness, or learning value..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={6}
                  className="resize-none text-sm"
                />
              </div>

              {/* WhatsApp Number Section */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm sm:text-base">WhatsApp Number</Label>
                {loadingWhatsApp ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : whatsappNumber ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <span className="font-medium text-sm sm:text-base">{whatsappNumber}</span>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-xs sm:text-sm">WhatsApp number not found in your profile</span>
                      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                        <Link href="/dashboard/settings">
                          Update Profile
                        </Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-xs text-muted-foreground">
                  Your WhatsApp number will be used to contact you regarding the publication
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isPending || (reviewType === "publish" && !whatsappNumber)}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

