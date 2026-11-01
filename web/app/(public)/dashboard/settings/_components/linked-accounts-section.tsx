"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Link2, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
      // Clean up URL
      router.replace("/dashboard/settings");
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
      // Clean up URL
      router.replace("/dashboard/settings");
    }
  }, [searchParams, router]);

  const handleLinkGithub = () => {
    setIsLinking(true);
    // Redirect to GitHub OAuth
    window.location.href = "/api/user/link-github";
  };

  const handleUnlinkGithub = async () => {
    setIsUnlinking(true);
    try {
      const response = await fetch("/api/user/unlink-github", {
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
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
          Linked Accounts
        </CardTitle>
        <CardDescription className="text-sm">
          Connect your external accounts to enhance your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* GitHub Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-lg">
                <Github className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col gap-2 items-start">
                <p className="font-medium text-lg">GitHub</p>
                {githubUsername ? (
                  <p className="text-sm text-muted-foreground">
                    Connected as <span className="font-mono font-medium text-white">@{githubUsername}</span>
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
                  className="text-xs cursor-pointer"
                >
                  {isUnlinking ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Unlinking...
                    </>
                  ) : (
                    <>
                      <Unlink className="w-3 h-3 mr-1" />
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
                  className="text-xs cursor-pointer"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3 mr-1" />
                      Link Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
