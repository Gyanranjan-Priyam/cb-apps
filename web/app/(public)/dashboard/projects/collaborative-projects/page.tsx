import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { getCollaborativeProjects } from "./actions";
import { CollaborativeProjectsList } from "./_components/collaborative-projects-list";

export const metadata = {
  title: "Collaborative Projects | CodeBreaker",
  description: "Explore and contribute to projects shared by the CodeBreaker community",
};

export default async function CollaborativeProjectsPage() {
  const { projects, currentUserId, currentUserEmail } = await getCollaborativeProjects();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl tracking-tight font-bold">Collaborative Projects</h1>
        <p className="text-muted-foreground mt-2">
          Explore and contribute to projects shared by the CodeBreaker community. Collaborate, learn, and grow together with fellow developers.
        </p>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Open for Collaboration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <CollaborativeProjectsList projects={projects} currentUserId={currentUserId} currentUserEmail={currentUserEmail} />
    </div>
  );
}
