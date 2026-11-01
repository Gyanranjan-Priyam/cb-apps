import ExternalExamRoomPage from "@/app/(public)/quiz/external/[systemCode]/page";

export default function StandaloneExternalExamPage(props: {
  params: Promise<{ systemCode: string }>;
}) {
  return <ExternalExamRoomPage {...props} />;
}
