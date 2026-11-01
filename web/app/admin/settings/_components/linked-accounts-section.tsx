"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Link2, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface LinkedAccountsSectionProps {
  githubUsername: string | null;
}

export function LinkedAccountsSection({ githubUsername }: LinkedAccountsSectionProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const github = searchParams?.get("github");
    const error = searchParams?.get("error");

    if (github === "linked") {
      toast.success("GitHub account linked successfully!");
      router.replace("/admin/settings");
    } else if (error) {
      let errorMessage = "Failed to link GitHub account";
      switch (error) {
        case "missing_params":
          errorMessage = "Missing required parameters";
          break;
        case "unauthorized":
          errorMessage = "Unauthorized access";
          break;
        case "token_failed":
          errorMessage = "Failed to obtain access token";
          break;
        case "user_fetch_failed":
          errorMessage = "Failed to fetch GitHub user data";
          break;
        case "callback_failed":
          errorMessage = "OAuth callback failed";
          break;
      }
      toast.error(errorMessage);
      router.replace("/admin/settings");
    }
  }, [searchParams, router]);

  const handleLinkGithub = () => {
    setIsLinking(true);
    window.location.href = "/api/admin/link-github";
  };

  const handleUnlinkGithub = async () => {
    setIsUnlinking(true);
    try {
      const response = await fetch("/api/admin/unlink-github", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("GitHub account unlinked successfully");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to unlink GitHub account");
      }
    } catch (error) {
      toast.error("An error occurred while unlinking GitHub account");
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Linked Accounts
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to access organization repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-lg">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium">GitHub</p>
              {githubUsername ? (
                <p className="text-sm text-muted-foreground">
                  Connected as <span className="font-mono font-medium">@{githubUsername}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not connected
                </p>
              )}
            </div>
          </div>
          <div>
            {githubUsername ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkGithub}
                disabled={isUnlinking}
              >
                {isUnlinking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Unlinking...
                  </>
                ) : (
                  <>
                    <Unlink className="w-4 h-4 mr-2" />
                    Unlink
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkGithub}
                disabled={isLinking}
              >
                {isLinking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Link Account
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
