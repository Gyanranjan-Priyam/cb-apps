"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Github, Save } from "lucide-react";
import { updateGitHubOrgSetting } from "../actions";
import { toast } from "sonner";

interface GitHubOrgSettingsProps {
  initialValue: string;
}

export function GitHubOrgSettings({ initialValue }: GitHubOrgSettingsProps) {
  const [orgName, setOrgName] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateGitHubOrgSetting(orgName);
      
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="github-org" className="flex items-center gap-2">
          <Github className="w-4 h-4" />
          GitHub Organization
        </Label>
        <Input
          id="github-org"
          type="text"
          placeholder="e.g., CodeBreakersGCEK"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Enter the GitHub organization name to fetch all repositories
        </p>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Organization
          </>
        )}
      </Button>
    </form>
  );
}
