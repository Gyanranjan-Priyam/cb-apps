"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { publishStudentResult } from "../../../actions";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

interface PublishResultButtonProps {
  attemptId: string;
  isPublished: boolean;
  publishedAt?: Date | null;
  size?: "default" | "sm";
}

export function PublishResultButton({
  attemptId,
  isPublished: initialPublished,
  publishedAt: initialDate,
  size = "default",
}: PublishResultButtonProps) {
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = async () => {
    setIsLoading(true);
    const res = await publishStudentResult(attemptId);
    if (res.status === "success") {
      toast.success("Result published successfully", {
        description: res.message || "Email notification dispatched to student.",
      });
      setIsPublished(true);
    } else {
      toast.error("Failed to publish result", {
        description: res.message || "Please check your connection and try again.",
      });
    }
    setIsLoading(false);
  };

  if (isPublished) {
    return (
      <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 gap-1 px-3 py-1 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Published & Emailed
      </Badge>
    );
  }

  return (
    <Button
      size={size}
      onClick={handlePublish}
      disabled={isLoading}
      className="font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Send className="h-4 w-4 mr-2" />
      )}
      Publish Result
    </Button>
  );
}
