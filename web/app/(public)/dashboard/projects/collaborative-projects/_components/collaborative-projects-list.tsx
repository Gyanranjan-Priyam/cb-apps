"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, ExternalLink, Users, Calendar, MessageSquare } from "lucide-react";
import { ContactOwnerDialog } from "./contact-owner-dialog";
import { getUserProfileImageUrl } from "@/lib/image-utils";

interface CollaborativeProject {
  id: string;
  repoName: string;
  repoUrl: string;
  description: string;
  explanation: string;
  liveUrl: string | null;
  adminResponse: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    githubUsername: string | null;
    profileImageKey: string | null;
    image?: string | null;
  };
}

interface CollaborativeProjectsListProps {
  projects: CollaborativeProject[];
  currentUserId: string | null;
  currentUserEmail: string | null;
}

export function CollaborativeProjectsList({ projects, currentUserId, currentUserEmail }: CollaborativeProjectsListProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">No Collaborative Projects Yet</h3>
              <p className="text-muted-foreground text-sm">
                Be the first to share a project for collaboration! Go to "My Projects" and submit your project for collaboration.
              </p>
            </div>
            <Button asChild>
              <a href="/dashboard/projects/my-projects">Share Your Project</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2">
                    {getUserProfileImageUrl(project.user) ? (
                      <AvatarImage
                        src={getUserProfileImageUrl(project.user)!}
                        alt={project.user.name}
                      />
                    ) : null}
                    <AvatarFallback>{getInitials(project.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg sm:text-xl">{project.repoName}</CardTitle>
                      <Badge variant="default" className="bg-blue-600 gap-1">
                        <Users className="h-3 w-3" />
                        Open for Collaboration
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="font-medium">{project.user.name}</span>
                      {project.user.username && (
                        <>
                          <span>•</span>
                          <span>@{project.user.username}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm sm:text-base">
                  {project.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Idea/Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium">Project Details:</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.explanation}
                </p>
              </div>
            </div>



            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Posted: {formatDate(project.updatedAt)}</span>
              </div>
              {project.user.githubUsername && (
                <div className="flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5" />
                  <a
                    href={`https://github.com/${project.user.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    @{project.user.githubUsername}
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm" variant="default" className="flex-1 sm:flex-none gap-2">
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-3.5 w-3.5" />
                  View Repository
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              {project.liveUrl && (
                <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none gap-2">
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Live Demo
                  </a>
                </Button>
              )}
              {currentUserId !== project.user.id && currentUserEmail && (
                <ContactOwnerDialog
                  ownerName={project.user.name}
                  ownerEmail={project.user.email}
                  senderEmail={currentUserEmail}
                  projectName={project.repoName}
                  className="flex-1 sm:flex-none gap-2"
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
