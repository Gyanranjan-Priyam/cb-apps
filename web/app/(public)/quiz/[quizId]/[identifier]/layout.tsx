import { SecureQuizWrapper } from "./_components/secure-quiz-wrapper";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render quiz in a secure, isolated layout without any navigation
  return <SecureQuizWrapper>{children}</SecureQuizWrapper>;
}
