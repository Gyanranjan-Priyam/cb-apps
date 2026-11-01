import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isSystemAdminRole, isCoAdminRole } from "@/lib/member-roles";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return redirect("/login");
    }

    // Verify that the logged in user actually exists in database (pre-added by admin) and is not banned
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            role: true,
            banned: true,
            profileComplete: true,
            emailVerified: true,
            hasLoggedIn: true,
            hasCompletedOnboarding: true,
        },
    });

    if (!dbUser) {
        await auth.api.signOut({ headers: await headers() });
        return redirect("/unauthorized");
    }

    if (dbUser.banned) {
        await auth.api.signOut({ headers: await headers() });
        return redirect("/login?error=banned");
    }

    // Switch member status from Pending to Active upon successful login and record login activity
    await prisma.user.update({
        where: { id: dbUser.id },
        data: {
            hasLoggedIn: true,
            emailVerified: true,
            profileComplete: true,
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
            updatedAt: new Date(),
        },
    });

    // Auto-save GitHub username if user logged in with GitHub
    try {
        const githubAccount = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                providerId: "github",
            },
            select: {
                accessToken: true,
                accountId: true,
            },
        });

        if (githubAccount?.accessToken) {
            // Check if GitHub username is not already saved
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { githubUsername: true },
            });

            if (!user?.githubUsername) {
                // Fetch GitHub username using access token
                const githubResponse = await fetch("https://api.github.com/user", {
                    headers: {
                        Authorization: `Bearer ${githubAccount.accessToken}`,
                        Accept: "application/json",
                    },
                });

                if (githubResponse.ok) {
                    const githubUser = await githubResponse.json();
                    
                    if (githubUser.login) {
                        await prisma.user.update({
                            where: { id: session.user.id },
                            data: {
                                githubUsername: githubUser.login,
                                updatedAt: new Date(),
                            },
                        });
                        
                        console.log(`✅ Auto-saved GitHub username: @${githubUser.login}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error auto-saving GitHub username:", error);
        // Don't fail the redirect if this fails
    }

    // If user is admin, they have unlimited device access -> redirect to admin dashboard
    if (isSystemAdminRole(session.user.role) || isSystemAdminRole(dbUser.role)) {
        return redirect("/admin");
    }

    // If user is co-admin, redirect to co-admin portal
    if (isCoAdminRole(session.user.role) || isCoAdminRole(dbUser.role)) {
        return redirect("/co-admin");
    }

    // ── Device Limit Enforcement (Max 2 Devices for Regular Users) ──
    const activeSessions = await prisma.session.findMany({
        where: {
            userId: session.user.id,
            expiresAt: { gt: new Date() },
        },
        orderBy: { updatedAt: "desc" },
    });

    if (activeSessions.length > 2) {
        return redirect("/device-limit");
    }

    // Otherwise, redirect to user dashboard
    return redirect("/dashboard");
}