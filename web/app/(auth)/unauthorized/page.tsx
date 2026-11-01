"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, ArrowLeft, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
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

      {/* Icon Badge */}
      <div className="flex justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20 shadow-sm">
          <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />
        </div>
      </div>

      {/* Heading & Subtitle */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Unauthorized Access
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Only registered members added by an administrator are authorized to
          log in.
        </p>
      </div>

      {/* Error Details Card */}
      <div className="bg-card border border-destructive/20 rounded-xl p-5 text-left space-y-3 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">
              Are you a CodeBreakers member?
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If an administrator has already added you, please ensure you are
              signing in with the exact email address registered in the system.
              If you haven&apos;t received your invitation mail, please contact
              your administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          asChild
          className="w-full h-12 sm:h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm"
        >
          <a href="mailto:cse.codebreaker@gcekbpatna.ac.in?subject=CodeBreakers%20Member%20Access%20Request">
            <Mail className="w-5 h-5 mr-2" />
            Contact Administrator
          </a>
        </Button>

        <Button
          asChild
          variant="outline"
          className="w-full h-12 sm:h-14 text-base font-normal rounded-full border-input"
        >
          <Link href="/login">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Login
          </Link>
        </Button>
      </div>
    </div>
  );
}
