"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Upload, ExternalLink, Github, FileImage, AlertCircle } from "lucide-react";
import { submitTask, getUserGitHubRepos } from "@/app/data/public/tasks/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

interface SubmitTaskButtonProps {
  taskId: string;
  userId: string;
  isResubmit?: boolean;
  githubUsername?: string | null;
}

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  updatedAt: string;
  private: boolean;
}

export default function SubmitTaskButton({ taskId, userId, isResubmit = false, githubUsername }: SubmitTaskButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Project, 2: Upload Screenshot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  
  // Project Selection
  const [projectUrl, setProjectUrl] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  
  // Screenshot Upload
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (open && githubUsername) {
      fetchGitHubRepos();
    }
  }, [open, githubUsername]);

  const fetchGitHubRepos = async () => {
    if (!githubUsername) return;
    
    setLoadingRepos(true);
    try {
      const result = await getUserGitHubRepos(githubUsername);
      if (result.status === "success") {
        setRepos(result.data);
      } else {
        toast.error("Failed to fetch GitHub repositories");
      }
    } catch (error) {
      toast.error("Error loading repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    
    if (!file) {
      setScreenshot(null);
      setScreenshotPreview(null);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError("Please upload an image file");
      return;
    }

    // Check file size (100KB = 102400 bytes)
    if (file.size > 102400) {
      setUploadError("Image size must be less than 100KB");
      return;
    }

    setScreenshot(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (step === 1) {
      const url = useCustomUrl ? customUrl : selectedRepo;
      if (!url) {
        toast.error("Please select a project or enter a URL");
        return;
      }
      setProjectUrl(url);
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let screenshotKey: string | undefined;

      // Upload screenshot to S3 if provided
      if (screenshot) {
        // Step 1: Get pre-signed URL from our API
        const metadataResponse = await fetch('/api/s3/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: screenshot.name,
            contentType: screenshot.type,
            size: screenshot.size,
            isImage: true,
          }),
        });

        if (!metadataResponse.ok) {
          const error = await metadataResponse.json();
          throw new Error(error.error || 'Failed to get upload URL');
        }

        const { preSignedUrl, key } = await metadataResponse.json();
        screenshotKey = key;

        // Step 2: Upload file directly to S3 using pre-signed URL
        const uploadResponse = await fetch(preSignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': screenshot.type,
          },
          body: screenshot,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload screenshot to S3');
        }
      }

      // Submit task with project URL and optional screenshot
      const result = await submitTask(taskId, userId, projectUrl, screenshotKey);

      if (result.status === "success") {
        toast.success("Task submitted successfully!", {
          description: result.message || "Your submission has been recorded for admin review.",
        });
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error("Submission failed", {
          description: result.message || "Please check your repository URL and try again.",
        });
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error("Submission error", {
        description: error?.message || "An unexpected error occurred during submission.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setProjectUrl("");
    setSelectedRepo("");
    setCustomUrl("");
    setUseCustomUrl(false);
    setScreenshot(null);
    setScreenshotPreview(null);
    setUploadError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Send className="h-4 w-4 mr-2" />
          {isResubmit ? "Resubmit Task" : "Submit Task"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Select Project" : "Upload Screenshot (Optional)"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Choose from your GitHub repositories or enter a custom project URL"
              : "Upload a screenshot of your project output (max 100KB)"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            {githubUsername && repos.length > 0 && !useCustomUrl && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="repo-select">Select GitHub Repository</Label>
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                    <SelectTrigger id="repo-select">
                      <SelectValue placeholder="Choose a repository..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.url}>
                          <div className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="font-medium">{repo.name}</span>
                              {repo.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {repo.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRepo && (
                    <a 
                      href={selectedRepo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View repository <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
              </>
            )}

            {(loadingRepos && githubUsername) && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading repositories...</span>
              </div>
            )}

            {(!githubUsername || useCustomUrl) && (
              <div className="space-y-2">
                <Label htmlFor="custom-url">Project URL</Label>
                <Input
                  id="custom-url"
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your project (GitHub, GitLab, or any other platform)
                </p>
              </div>
            )}

            {githubUsername && repos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseCustomUrl(!useCustomUrl)}
                className="w-full"
              >
                {useCustomUrl ? "Use GitHub Repository" : "Use Custom URL"}
              </Button>
            )}

            {!githubUsername && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Link your GitHub account in settings to see your repositories here.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="screenshot">Screenshot (Optional)</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="screenshot"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  {screenshotPreview ? (
                    <div className="relative w-full h-full p-4">
                      <Image
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileImage className="h-10 w-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, JPEG (MAX. 100KB)
                      </p>
                    </div>
                  )}
                  <input
                    id="screenshot"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                  />
                </label>
              </div>
              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}
              {screenshot && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="text-sm truncate">{screenshot.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(screenshot.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can skip uploading a screenshot and submit the task directly.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !!uploadError}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isResubmit ? "Resubmit" : "Submit"}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
