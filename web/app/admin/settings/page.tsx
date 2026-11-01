import { redirect } from "next/navigation";
import { SettingsShell } from "./_components/settings-shell";
import {
  getCurrentUserProfile,
  getRegistrationSetting,
  getExternalQuizSetting,
  getGitHubOrgSetting,
  getGoogleDriveStatusAction,
  getAdminAndCoAdminSessionsAction,
} from "./actions";

export default async function AdminSettingsPage() {
  const profileResult = await getCurrentUserProfile();
  const registrationSettingResult = await getRegistrationSetting();
  const externalQuizResult = await getExternalQuizSetting();
  const githubOrgResult = await getGitHubOrgSetting();
  const googleDriveResult = await getGoogleDriveStatusAction();
  const sessionsResult = await getAdminAndCoAdminSessionsAction();

  if (profileResult.status === "error") {
    redirect("/login");
  }

  const userProfile = profileResult.data;
  const isRegistrationEnabled =
    registrationSettingResult.status === "success"
      ? registrationSettingResult.data
      : true;
  const isExternalQuizEnabled =
    externalQuizResult.status === "success"
      ? externalQuizResult.data
      : false;
  const githubOrgName =
    githubOrgResult.status === "success" ? githubOrgResult.data : "";
  const googleDriveStatus =
    googleDriveResult.status === "success" && googleDriveResult.data
      ? googleDriveResult.data
      : { isConnected: false };
  const sessionsData =
    sessionsResult.status === "success" && sessionsResult.data
      ? sessionsResult.data
      : {
          sessions: [],
          stats: {
            totalSessions: 0,
            totalAdminSessions: 0,
            totalCoAdminSessions: 0,
            totalUniqueUsers: 0,
            inactiveSessionsCount: 0,
          },
          policy: { inactiveDays: 7 },
        };

  return (
    <SettingsShell
      userProfile={userProfile}
      isRegistrationEnabled={isRegistrationEnabled}
      isExternalQuizEnabled={isExternalQuizEnabled}
      githubOrgName={githubOrgName}
      googleDriveStatus={googleDriveStatus}
      sessionsData={sessionsData}
    />
  );
}