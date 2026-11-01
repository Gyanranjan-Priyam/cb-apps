import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LoginForm } from "./_components/LoginForm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isSystemAdminRole } from "@/lib/member-roles";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to CodeBreakers portal - Government College of Engineering Kalahandi",
};

export default async function LoginPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, role: true, banned: true },
        });

        if (!dbUser || dbUser.banned) {
            await auth.api.signOut({ headers: await headers() });
            return redirect("/unauthorized");
        }

        // If user is admin, redirect to admin dashboard
        if (isSystemAdminRole(dbUser.role)) {
            return redirect("/admin");
        }

        // Otherwise, redirect to user dashboard
        return redirect("/dashboard");
    }
    return (
        <LoginForm />
    );
}