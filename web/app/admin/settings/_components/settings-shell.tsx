/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { ProfileImageUpload } from "./profile-image-upload";
import { ProfileForm } from "./profile-form";
import { LinkedAccountsSection } from "./linked-accounts-section";
import { RegistrationToggle } from "./registration-toggle";
import { ExternalQuizToggle } from "./external-quiz-toggle";
import { GitHubOrgSettings } from "./github-org-settings";
import { DataCleanup } from "./data-cleanup";
import { GoogleDriveSettingsCard } from "./google-drive-settings-card";
import { UserSocialLinksForm } from "@/app/(public)/dashboard/settings/_components/user-social-links-form";
import { AdminSessionsManager } from "./admin-sessions-manager";
import type { AdminSessionsData } from "../actions";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

import {
  User,
  Shield,
  Bell,
  Settings2,
  CheckCircle2,
  Circle,
  Mail,
  MessageSquare,
  Phone,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "profile" | "social" | "security" | "notifications" | "system";

interface SettingsShellProps {
  userProfile: {
    name: string;
    email: string;
    role?: string | null;
    createdAt: Date | string;
    profileImageKey?: string | null;
    image?: string | null;
    githubUsername?: string | null;
    mobileNumber?: string | null;
    whatsappNumber?: string | null;
    upiId?: string | null;
    username?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    aadhaarNumber?: string | null;
    registration?: string | null;
    rollNumber?: string | null;
    branch?: string | null;
    admissionYear?: string | null;
    collegeName?: string | null;
    collegeAddress?: string | null;
    address?: string | null;
    postOffice?: string | null;
    policeStation?: string | null;
    block?: string | null;
    pinCode?: string | null;
    state?: string | null;
    district?: string | null;
    profileComplete?: boolean;
    socialLinks?: any;
    customLinks?: any;
  };
  isRegistrationEnabled: boolean;
  isExternalQuizEnabled: boolean;
  githubOrgName: string;
  googleDriveStatus?: {
    isConnected: boolean;
    email?: string;
  };
  sessionsData?: AdminSessionsData;
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "social", label: "Social & Links", icon: Globe },
  { id: "security", label: "Account Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "system", label: "System Settings", icon: Settings2 },
];

export function SettingsShell({
  userProfile,
  isRegistrationEnabled,
  isExternalQuizEnabled,
  githubOrgName,
  googleDriveStatus,
  sessionsData,
}: SettingsShellProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as Tab) || (searchParams?.get("gdrive") ? "security" : "profile");
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams?.get("tab") as Tab;
    if (tabParam && ["profile", "social", "security", "notifications", "system"].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (searchParams?.get("gdrive") || searchParams?.get("error")?.startsWith("gdrive_")) {
      setActiveTab("security");
    }
  }, [searchParams]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Manage your account profile, security credentials, notification preferences, and system configuration.
        </p>
      </div>

      {/* ── Top Navbar Style Tabs ───────────────────────────── */}
      <div className="border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto overscroll-x-contain scrollbar-none">
        <nav
          className="flex items-center gap-1 sm:gap-2 min-w-max no-scrollbar scroll-smooth"
          aria-label="Settings Tabs"
        >
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-[1px] shrink-0",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab Content Panel ───────────────────────────────── */}
      <div className="pt-2">
        {/* Tab: Profile */}
        {activeTab === "profile" && (
          <div className="space-y-8 max-w-3xl">
            {/* Profile picture block */}
            <div className="space-y-3">
              <SectionLabel>Profile picture</SectionLabel>
              <ProfileImageUpload
                currentImageKey={userProfile.profileImageKey}
                currentOAuthImage={userProfile.image}
                userName={userProfile.name}
              />
            </div>

            <Separator />

            {/* Full profile form */}
            <div className="space-y-6">
              <ProfileForm initialData={userProfile} />
            </div>
          </div>
        )}

        {/* Tab: Social & Links */}
        {activeTab === "social" && (
          <div className="space-y-6 max-w-3xl">
            <UserSocialLinksForm
              initialSocialLinks={userProfile.socialLinks}
              initialCustomLinks={userProfile.customLinks}
              githubUsername={userProfile.githubUsername}
              profileComplete={userProfile.profileComplete ?? true}
            />
          </div>
        )}

        {/* Tab: Account Security */}
        {activeTab === "security" && (
          <div className="space-y-6 max-w-3xl">
            {/* Info rows */}
            <div className="space-y-4">
              <SecurityRow
                label="Email address"
                value={userProfile.email}
                extra={
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                }
              />
              <Separator />
              <SecurityRow
                label="Account role"
                value="Your current access level"
                extra={
                  <span className="inline-flex items-center px-2 py-0.5 rounded border border-border text-xs font-medium capitalize">
                    {userProfile.role || "User"}
                  </span>
                }
              />
              <Separator />
              <SecurityRow
                label="Member since"
                value={new Date(userProfile.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            </div>

            <Separator />

            {/* Google Drive Integration */}
            <div className="space-y-3">
              <SectionHeading>Google Drive Storage</SectionHeading>
              <GoogleDriveSettingsCard
                initialConnected={googleDriveStatus?.isConnected}
                initialEmail={googleDriveStatus?.email}
              />
            </div>

            <Separator />

            {/* Linked accounts */}
            <div className="space-y-3">
              <SectionHeading>Linked Accounts</SectionHeading>
              <LinkedAccountsSection githubUsername={userProfile.githubUsername ?? null} />
            </div>
          </div>
        )}

        {/* Tab: Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-6 max-w-3xl">
            <div className="space-y-4">
              <NotifRow
                icon={Mail}
                label="Email"
                description="Receive notifications via email"
                active
                fixed
              />
              <Separator />
              <NotifRow
                icon={MessageSquare}
                label="WhatsApp"
                description={
                  userProfile.whatsappNumber
                    ? `Notifications to ${userProfile.whatsappNumber}`
                    : "Add a WhatsApp number in Profile to enable"
                }
                active={!!userProfile.whatsappNumber}
              />
              <Separator />
              <NotifRow
                icon={Phone}
                label="SMS"
                description={
                  userProfile.mobileNumber
                    ? `SMS to ${userProfile.mobileNumber}`
                    : "Add a mobile number in Profile to enable"
                }
                active={!!userProfile.mobileNumber}
              />
            </div>
          </div>
        )}

        {/* Tab: System Settings */}
        {activeTab === "system" && (
          <div className="space-y-8 max-w-3xl">
            {/* Active Admin & Co-Admin Sessions */}
            {sessionsData && (
              <div className="space-y-3">
                <SectionHeading>Active Admin &amp; Co-Admin Sessions &amp; Devices</SectionHeading>
                <p className="text-sm text-muted-foreground mb-3">
                  Inspect logged-in devices across Admin and Co-Admin accounts, remotely log out devices, and configure inactive auto-logout policies.
                </p>
                <AdminSessionsManager initialData={sessionsData} />
              </div>
            )}

            {sessionsData && <Separator />}

            {/* Registration toggle */}
            <div className="space-y-2">
              <SectionHeading>User Registration</SectionHeading>
              <p className="text-sm text-muted-foreground mb-3">
                Control whether new users can register on the platform.
              </p>
              <RegistrationToggle initialValue={isRegistrationEnabled} />
            </div>

            <Separator />

            {/* External Quiz System toggle */}
            <div className="space-y-2">
              <SectionHeading>External Quiz System &amp; Live Sockets</SectionHeading>
              <p className="text-sm text-muted-foreground mb-3">
                Activate or shut down external kiosk registration terminals, candidate exam rooms, and real-time Socket.IO event monitors.
              </p>
              <ExternalQuizToggle initialValue={isExternalQuizEnabled} />
            </div>

            <Separator />

            {/* GitHub Org */}
            <div className="space-y-2">
              <SectionHeading>GitHub Organization</SectionHeading>
              <p className="text-sm text-muted-foreground mb-3">
                Set the GitHub organization used to fetch repositories.
              </p>
              <GitHubOrgSettings initialValue={githubOrgName} />
            </div>


            <Separator />

            {/* Data cleanup */}
            <div className="space-y-2">
              <SectionHeading>Data Cleanup</SectionHeading>
              <p className="text-sm text-muted-foreground mb-3">
                Permanently remove selected platform data. This action cannot be undone.
              </p>
              <DataCleanup />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared layout primitives ───────────────────────────────────────── */

function Section({ children }: { children: React.ReactNode }) {
  return <div className="py-4 space-y-4">{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground">{children}</p>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-foreground">{children}</p>;
}

function SecurityRow({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{value}</p>
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </div>
  );
}

function NotifRow({
  icon: Icon,
  label,
  description,
  active,
  fixed,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  active?: boolean;
  fixed?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 p-1.5 rounded-md bg-muted shrink-0">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <div className="shrink-0">
        {fixed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : active ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/30" />
        )}
      </div>
    </div>
  );
}
