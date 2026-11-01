import { redirect } from "next/navigation";

interface OldReceiptPageProps {
  params: Promise<{ responseId: string }>;
}

/**
 * Redirect old /admin/forms/receipt/[responseId] → /admin/receipt/[responseId]
 */
export default async function OldReceiptPage({ params }: OldReceiptPageProps) {
  const { responseId } = await params;
  redirect(`/admin/receipt/${responseId}`);
}
