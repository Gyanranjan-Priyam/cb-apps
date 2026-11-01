import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedFormByFormId } from "../actions";
import PublicForm from "../_components/public-form";

interface PublicFormPageProps {
  params: Promise<{ formId: string }>;
}

/** Extract plain text from Tiptap JSON for OG/meta descriptions */
function extractPlainText(description: string | null): string {
  if (!description) return "";
  try {
    const json = JSON.parse(description);
    // Recursively extract text from Tiptap JSON content
    function getText(node: Record<string, unknown>): string {
      if (node.text && typeof node.text === "string") return node.text;
      if (Array.isArray(node.content)) {
        return (node.content as Record<string, unknown>[]).map(getText).join(" ");
      }
      return "";
    }
    return getText(json).replace(/\s+/g, " ").trim();
  } catch {
    // Not JSON — treat as plain text
    return description;
  }
}

export async function generateMetadata({ params }: PublicFormPageProps): Promise<Metadata> {
  const { formId } = await params;
  const result = await getPublishedFormByFormId(formId);

  const title = result.status === "success" && result.data.title
    ? result.data.title
    : `Form ${formId}`;
  const description = result.status === "success" && result.data.description
    ? extractPlainText(result.data.description)
    : "Fill out this form published by CodeBreakers GCEK.";
  const formUrl = `https://forms.cbgcek.dev/${formId}`;
  const ogImageUrl = `https://forms.cbgcek.dev/api/og/forms/${formId}`;

  return {
    title,
    description,
    alternates: {
      canonical: formUrl,
    },
    openGraph: {
      type: "website",
      url: formUrl,
      title,
      description,
      siteName: "CodeBreakers Forms",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: "@codebreakers_gcek",
    },
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { formId } = await params;
  const result = await getPublishedFormByFormId(formId);

  if (result.status !== "success") {
    notFound();
  }

  return <PublicForm key={result.data.formId || result.data.id} form={result.data} />;
}
