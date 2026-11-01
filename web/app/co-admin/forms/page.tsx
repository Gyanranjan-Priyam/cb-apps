import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllForms } from "@/app/admin/forms/actions";
import FormsList from "@/app/admin/forms/_components/forms-list";

export const metadata: Metadata = {
  title: "Forms Management | Co-Admin",
  description: "View form responses and copy public links",
};

export default async function CoAdminFormsPage() {
  const result = await getAllForms();
  const forms = result.status === "success" ? result.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Forms Management</h1>
          <p className="text-muted-foreground mt-2">
            View submitted form responses, copy public links, and monitor response statistics.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
          <CardDescription>
            Short URLs, active status, and response counts. Click action menu to view responses or copy link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormsList forms={forms} canManage={false} baseUrl="/co-admin/forms" />
        </CardContent>
      </Card>
    </div>
  );
}
