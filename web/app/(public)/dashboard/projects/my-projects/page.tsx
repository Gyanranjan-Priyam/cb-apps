import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { GitHubProjects } from "./_components/github-projects";

export const metadata: Metadata = {
  title: "My Projects",
  description: "View your GitHub repositories and projects",
};

export default function ProjectPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl tracking-tight font-bold">My Projects</h1>
        <p className="text-muted-foreground mt-2">
          All your GitHub repositories are displayed here. Repositories are automatically synced from your GitHub profile.
        </p>
      </div>

      <div>
        <GitHubProjects />
      </div>
    </div>
  );
}
