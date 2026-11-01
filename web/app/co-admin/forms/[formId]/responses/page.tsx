import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormByFormId } from "@/app/admin/forms/actions";
import { PageHeader } from "@/components/ui/page-header";
import ResponsesClient from "@/app/admin/forms/[formId]/responses/_components/responses-client";

interface ResponsesPageProps {
  params: Promise<{ formId: string }>;
}

export async function generateMetadata({ params }: ResponsesPageProps): Promise<Metadata> {
  const { formId } = await params;
  return {
    title: `Responses — ${formId} | Co-Admin`,
    description: `View submitted responses for form ${formId}`,
  };
}

export default async function CoAdminFormResponsesPage({ params }: ResponsesPageProps) {
  const { formId } = await params;
  const result = await getFormByFormId(formId);

  if (result.status !== "success") {
    notFound();
  }

  const form = result.data;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <PageHeader
        title={`Responses — ${form.title}`}
        description={`${form._count.responses} total response${form._count.responses !== 1 ? "s" : ""} for this form.`}
        showBackButton={false}
      />

      <ResponsesClient form={form} />
    </div>
  );
}
