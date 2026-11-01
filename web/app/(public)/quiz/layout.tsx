export default function QuizRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pass-through layout: Internal member quizzes enforce auth inside their own page.tsx,
  // allowing external kiosk routes (/quiz/system-register, /quiz/external/...) to remain 100% public.
  return <>{children}</>;
}
