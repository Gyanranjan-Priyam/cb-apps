import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyProjectSubmissions } from "./actions";
import { SubmissionsList } from "./_components/submissions-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Submissions",
  description: "View your project submission status",
};

export default async function MySubmissionsPage() {
  const result = await getMyProjectSubmissions();

  const pendingCount = result.data.filter((s) => s.status === "pending").length;
  const approvedCount = result.data.filter((s) => s.status === "approved").length;
  const rejectedCount = result.data.filter((s) => s.status === "rejected").length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl tracking-tight font-bold">My Submissions</h1>
        <p className="text-muted-foreground mt-2">
          Track the status of your project submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Submissions</CardDescription>
            <CardTitle className="text-3xl">{result.data.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{approvedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">{rejectedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Submissions List */}
      <SubmissionsList submissions={result.data} />
    </div>
  );
}
