"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldOff, LayoutDashboard, Home, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotAdminPage() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-8 px-4 text-center">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20">
          <Image
            src="/assets/logo.png"
            alt="CodeBreakers Logo"
            width={80}
            height={80}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      </div>


      {/* Heading & Subtitle */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Admin Access Required
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          You do not have administrative privileges to access the admin portal.
        </p>
      </div>

      {/* Error Details Card */}
      <div className="bg-card border border-border/80 rounded-xl p-5 text-left space-y-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">
              Restricted Area
            </p>
            <p className="text-muted-foreground leading-relaxed text-xs">
              The page or action you requested is reserved for system administrators. If you believe this is a mistake or require admin access, please contact the administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          asChild
          className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs"
        >
          <Link href="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Go to Member Dashboard
          </Link>
        </Button>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            asChild
            variant="outline"
            className="h-11 text-sm font-normal rounded-xl border-input"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 text-sm font-normal rounded-xl border-input"
          >
            <a href="mailto:cse.codebreaker@gcekbpatna.ac.in?subject=CodeBreakers%20Admin%20Access%20Inquiry">
              <Mail className="w-4 h-4 mr-2" />
              Contact Admin
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
