import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllForms } from "./actions";
import FormsList from "./_components/forms-list";

export const metadata: Metadata = {
  title: "Forms Management",
  description: "Create and manage Google Forms-like forms",
};

export default async function AdminFormsPage() {
  const result = await getAllForms();
  const forms = result.status === "success" ? result.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Forms Management</h1>
          <p className="text-muted-foreground mt-2">
            Build, publish, and track manual-verification forms.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/forms/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
          <CardDescription>
            Short URLs, publish status, and response counts are shown here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormsList forms={forms} />
        </CardContent>
      </Card>
    </div>
  );
}
