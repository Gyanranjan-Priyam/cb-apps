"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { publishAllResults } from "../../../actions";
import { Send, Loader2 } from "lucide-react";

interface PublishAllResultsButtonProps {
  quizId: string;
}

export function PublishAllResultsButton({ quizId }: PublishAllResultsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePublishAll = async () => {
    if (!confirm("Are you sure you want to publish results and send emails to ALL students who have completed this quiz? This action cannot be undone.")) return;

    setIsLoading(true);
    try {
      const publishPromise = (async () => {
        const res = await publishAllResults(quizId);
        if (res.status !== "success") {
          throw new Error(res.message || "Failed to publish all results");
        }
        return res.message;
      })();

      await toast.promise(publishPromise, {
        loading: "Publishing results and dispatching emails...",
        success: (msg: string) => msg || "Results published and emails sent successfully!",
        error: (err: any) => String(err?.message || err || "Failed to publish all results"),
        description: "Official scorecard notifications dispatched to all participants",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePublishAll}
      disabled={isLoading}
      className="font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Send className="h-4 w-4 mr-2" />
      )}
      Publish All Results
    </Button>
  );
}
