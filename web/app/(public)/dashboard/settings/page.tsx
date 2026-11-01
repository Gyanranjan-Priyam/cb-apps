import { UserSettingsShell } from "./_components/user-settings-shell";
import { getCurrentUserProfileData } from "./actions";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings | Dashboard",
  description: "Manage your profile settings and preferences",
};

export default async function SettingsPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user profile data
  const profileResult = await getCurrentUserProfileData();

  if (profileResult.status === "error" || !profileResult.data) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{profileResult.message || "Failed to load profile"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <UserSettingsShell userData={profileResult.data} />
    </div>
  );
}
