import { redirect } from "next/navigation";

export default async function AssignStudentRedirectPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  redirect(`/admin/quizzes/${quizId}/systems`);
}
