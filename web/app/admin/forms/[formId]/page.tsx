import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormByFormId } from "../actions";
import FormBuilder from "../_components/form-builder";

interface FormPageProps {
  params: Promise<{ formId: string }>;
}

export async function generateMetadata({ params }: FormPageProps): Promise<Metadata> {
  const { formId } = await params;
  return {
    title: `Edit Form ${formId}`,
    description: "Edit and manage a form",
  };
}

export default async function EditFormPage({ params }: FormPageProps) {
  const { formId } = await params;
  const result = await getFormByFormId(formId);

  if (result.status !== "success") {
    notFound();
  }

  return <FormBuilder initialForm={result.data} />;
}
