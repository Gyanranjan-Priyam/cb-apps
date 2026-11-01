/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { UserProfileImageUpload } from "./user-profile-image-upload";
import { UserProfileForm } from "./user-profile-form";
import { LinkedAccountsSection } from "./linked-accounts-section";
import { UserSocialLinksForm } from "./user-social-links-form";
import { UserActiveSessionsSection } from "./user-active-sessions-section";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Shield,
  Bell,
  CheckCircle2,
  Circle,
  Mail,
  MessageSquare,
  Phone,
  Info,
  Globe,
  MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "profile" | "social" | "devices" | "security" | "notifications";

interface UserSettingsShellProps {
  userData: {
    id: string;
    name: string | null;
    email: string;
    mobileNumber: string | null;
    whatsappNumber: string | null;
    profileImageKey: string | null;
    image?: string | null;
    aadhaarNumber: string | null;
    state: string | null;
    district: string | null;
    collegeName: string | null;
    collegeAddress: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    username: string | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    registration: string | null;
    rollNumber: string | null;
    branch: string | null;
    admissionYear: string | null;
    address: string | null;
    postOffice: string | null;
    policeStation: string | null;
    block: string | null;
    pinCode: string | null;
    githubUsername: string | null;
    profileComplete?: boolean;
    specializedDomain?: string | null;
    socialLinks?: any;
    customLinks?: any;
    batch?: { id: string; name: string; code: string } | null;
  };
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "social", label: "Social & Links", icon: Globe },
  { id: "devices", label: "Devices & Sessions", icon: MonitorSmartphone },
  { id: "security", label: "Account Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function UserSettingsShell({ userData }: UserSettingsShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Manage your personal details, credentials, and notification preferences. Changes sync across your event registrations.
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
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                />
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
              <UserProfileImageUpload
                currentImageKey={userData.profileImageKey}
                currentOAuthImage={userData.image}
                userName={userData.name || "User"}
              />
            </div>

            <Separator />

            {/* Profile form */}
            <div className="space-y-6">
              <UserProfileForm
                initialData={{
                  name: userData.name || "",
                  email: userData.email || "",
                  mobileNumber: userData.mobileNumber || "",
                  whatsappNumber: userData.whatsappNumber || "",
                  aadhaarNumber: userData.aadhaarNumber || "",
                  state: userData.state || "",
                  district: userData.district || "",
                  collegeName: userData.collegeName || "",
                  collegeAddress: userData.collegeAddress || "",
                  username: userData.username || "",
                  firstName: userData.firstName || "",
                  middleName: userData.middleName || "",
                  lastName: userData.lastName || "",
                  registration: userData.registration || "",
                  rollNumber: userData.rollNumber || "",
                  branch: userData.branch || "",
                  admissionYear: userData.admissionYear || "",
                  address: userData.address || "",
                  postOffice: userData.postOffice || "",
                  policeStation: userData.policeStation || "",
                  block: userData.block || "",
                  pinCode: userData.pinCode || "",
                  specializedDomain: userData.specializedDomain || "",
                }}
              />
            </div>

            <Separator />

            {/* Read-only sync notice */}
            <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span>Profile Synchronization</span>
              </div>
              <p>
                Your profile information is automatically synced across all your event registrations, certificates, and team rosters. Updates made here take effect immediately.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Social & Links */}
        {activeTab === "social" && (
          <div className="space-y-6 max-w-3xl">
            <UserSocialLinksForm
              initialSocialLinks={userData.socialLinks as any}
              initialCustomLinks={userData.customLinks as any}
              githubUsername={userData.githubUsername}
              profileComplete={userData.profileComplete}
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
                value={userData.email}
                extra={
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                }
              />
              <Separator />
              <SecurityRow
                label="Member since"
                value={new Date(userData.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <Separator />
              <SecurityRow
                label="Last profile update"
                value={
                  userData.updatedAt
                    ? new Date(userData.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Not available"
                }
              />
            </div>

            <Separator />

            {/* Linked accounts */}
            <div className="space-y-3">
              <SectionHeading>Linked Accounts</SectionHeading>
              <LinkedAccountsSection githubUsername={userData.githubUsername} />
            </div>
          </div>
        )}

        {/* Tab: Devices & Active Sessions */}
        {activeTab === "devices" && (
          <div className="space-y-6 max-w-3xl">
            <UserActiveSessionsSection />
          </div>
        )}

        {/* Tab: Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-6 max-w-3xl">
            <div className="space-y-4">
              <NotifRow
                icon={Mail}
                label="Email"
                description="Receive registrations & event updates via email"
                active
                fixed
              />
              <Separator />
              <NotifRow
                icon={MessageSquare}
                label="WhatsApp"
                description={
                  userData.whatsappNumber
                    ? `Notifications sent to ${userData.whatsappNumber}`
                    : "Add a WhatsApp number in your Profile to enable updates"
                }
                active={!!userData.whatsappNumber}
              />
              <Separator />
              <NotifRow
                icon={Phone}
                label="SMS"
                description={
                  userData.mobileNumber
                    ? `SMS alerts to ${userData.mobileNumber}`
                    : "Add a mobile number in your Profile to enable alerts"
                }
                active={!!userData.mobileNumber}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared layout primitives ───────────────────────────────────────── */

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
