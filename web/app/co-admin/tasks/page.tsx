import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import CreateTaskDialog from "@/app/admin/tasks/_components/create-task-dialog";
import TasksTable from "@/app/admin/tasks/_components/tasks-table";
import { getAllTasks } from "@/app/admin/tasks/actions";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks Management | Co-Admin",
  description: "Create, edit, and evaluate tasks for members",
};

export default async function CoAdminTasksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const tasksResult = await getAllTasks();
  const tasks = tasksResult.status === "success" ? tasksResult.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ListChecks className="h-7 w-7" />
          Tasks Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Create, edit, and mark tasks for members.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="space-y-1">
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>
              Create tasks, edit parameters, and evaluate member submissions.
            </CardDescription>
          </div>
          <CreateTaskDialog userId={session?.user.id || ""} />
        </CardHeader>
        <CardContent>
          <TasksTable tasks={tasks} canDelete={false} baseUrl="/co-admin/tasks" />
        </CardContent>
      </Card>
    </div>
  );
}
