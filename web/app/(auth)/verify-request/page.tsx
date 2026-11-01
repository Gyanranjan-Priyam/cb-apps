"use client";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { toast } from "sonner";
import Image from "next/image";

export default function VerifyRequestRoute(){
    return (
        <Suspense>
            <VerifyRequest />
        </Suspense>
    )
}

function VerifyRequest() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [emailPending, startTransition] = useTransition();
    const params = useSearchParams();
    const email = params?.get('email') || '';
    const isOtpCompleted = otp.length === 6;

    function verifyOtp() {
        startTransition(async () => {
            await authClient.signIn.emailOtp({
                email: email,
                otp: otp,
                fetchOptions: {
                    onSuccess: () => {
                        toast.success("Email verified successfully!", {
                            description: "Signing you in and redirecting to dashboard...",
                        });
                        router.push("/auth/callback");
                    },
                    onError: () => {
                        toast.error("Invalid verification code", {
                            description: "Please check the 6-digit OTP and try again.",
                        });
                    }
                }
            })
        });
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-6 py-8 px-4">

            {/* Icon */}
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                    Verify your email
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground px-4">
                    We sent a verification code to <span className="font-medium text-foreground">{email}</span>
                </p>
            </div>

            {/* OTP Input */}
            <div className="flex flex-col items-center space-y-6">
                <InputOTP 
                    maxLength={6} 
                    value={otp} 
                    onChange={(value) => setOtp(value)}
                    className="gap-2"
                >
                    <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="w-12 h-12 sm:w-14 sm:h-14 text-lg border-input rounded-lg text-foreground" />
                        <InputOTPSlot index={1} className="w-12 h-12 sm:w-14 sm:h-14 text-lg border-input rounded-lg text-foreground" />
                        <InputOTPSlot index={2} className="w-12 h-12 sm:w-14 sm:h-14 text-lg border-input rounded-lg text-foreground" />
                    </InputOTPGroup>
                    <span className="text-2xl text-muted-foreground">-</span>
                    <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={3} className="w-12 h-12 sm:w-14 sm:h-14 text-lg border-input rounded-lg text-foreground" />
                        <InputOTPSlot index={4} className="w-12 h-12 sm:w-14 sm:h-14 text-lg border-input rounded-lg text-foreground" />
                        <InputOTPSlot index={5} className="w-12 h-12 sm:w-14 sm:h-14 text-lg border-input rounded-lg text-foreground" />
                    </InputOTPGroup>
                </InputOTP>
                <p className="text-sm text-muted-foreground">Enter the 6-digit code</p>
            </div>

            {/* Verify Button */}
            <Button 
                onClick={verifyOtp} 
                disabled={emailPending || !isOtpCompleted} 
                className="cursor-pointer w-full h-12 sm:h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-full mt-6"
            >
                {emailPending ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin"/>
                        <span>Verifying...</span>
                    </>
                ) : (
                    <span>Verify Email</span>
                )}
            </Button>

            {/* Resend Button */}
            <div className="text-center mt-4">
                <button
                    disabled={emailPending}
                    onClick={() => {
                        startTransition(async () => {
                            await authClient.emailOtp.sendVerificationOtp({
                                email: email,
                                type: "sign-in",
                                fetchOptions: {
                                    onSuccess: () => {
                                        toast.success("Verification code resent!", {
                                            description: `A fresh 6-digit OTP was sent to ${email}.`,
                                        });
                                    },
                                    onError: (ctx) => {
                                        toast.error("Failed to resend code", {
                                            description: ctx.error.message || "Please wait a moment before trying again.",
                                        });
                                    }
                                }
                            });
                        });
                    }}
                    className="cursor-pointer text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {emailPending ? "Resending..." : "Didn't receive code? Resend"}
                </button>
            </div>
        </div>
    )
} 