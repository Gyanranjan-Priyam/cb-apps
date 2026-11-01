"use client";

import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center px-4 sm:px-6 bg-background">
            <div className="w-full">
                {children}
            </div>

            {/* Footer */}
            <div className="text-balance mt-8 mb-10 text-center text-xs text-muted-foreground px-4">
                By clicking continue, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                </Link>
            </div>
        </div>
    );
}
