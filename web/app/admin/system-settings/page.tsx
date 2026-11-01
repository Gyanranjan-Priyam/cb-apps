import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/data/admin/require-admin";
import {
  getAdminAndCoAdminSessionsAction,
  getRegistrationSetting,
  getExternalQuizSetting,
  getGitHubOrgSetting,
} from "@/app/admin/settings/actions";
import { AdminSessionsManager } from "@/app/admin/settings/_components/admin-sessions-manager";
import { RegistrationToggle } from "@/app/admin/settings/_components/registration-toggle";
import { ExternalQuizToggle } from "@/app/admin/settings/_components/external-quiz-toggle";
import { GitHubOrgSettings } from "@/app/admin/settings/_components/github-org-settings";
import { DataCleanup } from "@/app/admin/settings/_components/data-cleanup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings2, ShieldCheck, UserPlus, GitFork, Trash2, Monitor } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Settings & Active Sessions | CodeBreakers Admin",
  description: "Manage admin active device sessions, inactive auto-logout, and platform settings.",
};

export default async function SystemSettingsPage() {
  await requireAdmin();

  const sessionsResult = await getAdminAndCoAdminSessionsAction();
  const registrationResult = await getRegistrationSetting();
  const externalQuizResult = await getExternalQuizSetting();
  const githubOrgResult = await getGitHubOrgSetting();

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

  const isRegistrationEnabled =
    registrationResult.status === "success" ? registrationResult.data : true;
  const isExternalQuizEnabled =
    externalQuizResult.status === "success" ? externalQuizResult.data : false;
  const githubOrgName =
    githubOrgResult.status === "success" ? githubOrgResult.data : "";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Settings2 className="h-7 w-7 text-primary" />
          System Settings &amp; Device Security
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Monitor all active Admin &amp; Co-Admin devices, remotely revoke sessions, configure auto-logout for inactive devices, and manage platform-wide settings.
        </p>
      </div>

      <Separator />

      {/* ── Section 1: Active Sessions & Device Security ────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Active Admin &amp; Co-Admin Sessions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time list of all logged-in devices with IP address, browser, OS, and remote logout controls.
          </p>
        </div>

        <AdminSessionsManager initialData={sessionsData} />
      </div>

      <Separator />

      {/* ── Section 2: General System Configuration ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Toggle */}
        <Card className="border border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              User Registration
            </CardTitle>
            <CardDescription className="text-xs">
              Control whether new members can self-register or register for recruitment tests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationToggle initialValue={isRegistrationEnabled} />
          </CardContent>
        </Card>

        {/* External Quiz System Toggle */}
        <Card className="border border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              External Quiz System &amp; Live Sockets
            </CardTitle>
            <CardDescription className="text-xs">
              Activate or deactivate external kiosk registration, candidate kiosks, and Socket.IO real-time monitor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalQuizToggle initialValue={isExternalQuizEnabled} />
          </CardContent>
        </Card>

        {/* GitHub Organization */}
        <Card className="border border-border/80 bg-card shadow-xs md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GitFork className="h-4 w-4 text-primary" />
              GitHub Organization
            </CardTitle>
            <CardDescription className="text-xs">
              Configure the GitHub organization slug used for fetching official club repositories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GitHubOrgSettings initialValue={githubOrgName} />
          </CardContent>
        </Card>
      </div>


      <Separator />

      {/* ── Section 3: Data Cleanup ─────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Platform Data Cleanup
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanently delete old or test records. This operation cannot be reversed.
          </p>
        </div>
        <DataCleanup />
      </div>
    </div>
  );
}
