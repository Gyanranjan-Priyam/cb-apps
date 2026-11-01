import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OtpInput } from "@/components/auth/otp-input";
import { useAuth } from "@/context/auth-context";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || "";

  const { verifyOtp, sendOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  // Resend timer countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleVerify = async (codeToVerify?: string) => {
    const finalOtp = (codeToVerify || otp).trim();
    if (finalOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    const res = await verifyOtp(email, finalOtp);
    setLoading(false);

    if (res.success) {
      setSuccessMessage("Email verified successfully! Redirecting...");
      setTimeout(() => {
        router.replace("/");
      }, 700);
    } else {
      setErrorMessage(
        res.error || "Invalid verification code. Please check and try again."
      );
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setResending(true);

    const res = await sendOtp(email);
    setResending(false);

    if (res.success) {
      setCountdown(60);
      setSuccessMessage(`A fresh verification code was sent to ${email}`);
      setOtp("");
    } else {
      setErrorMessage(res.error || "Failed to resend code. Please try again later.");
    }
  };

  const isOtpComplete = otp.length === 6;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Navigation Top Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerContainer}>
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <Mail size={32} color="#2563EB" />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit verification code to{"\n"}
              <Text style={styles.emailHighlight}>{email || "your email"}</Text>
            </Text>

            {/* Alerts */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color="#DC2626" style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {successMessage && (
              <View style={styles.successBox}>
                <CheckCircle2 size={18} color="#16A34A" style={{ marginTop: 2 }} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* 6-Digit OTP Component */}
            <View style={styles.otpSection}>
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (errorMessage) setErrorMessage(null);
                  if (val.length === 6) {
                    handleVerify(val);
                  }
                }}
                hasError={Boolean(errorMessage)}
                disabled={loading}
                autoFocus={true}
              />
              <Text style={styles.hintText}>Enter the 6-digit code</Text>
            </View>

            {/* Verify CTA Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleVerify()}
              disabled={loading || !isOtpComplete}
              style={[
                styles.verifyButton,
                (!isOtpComplete || loading) && styles.verifyButtonDisabled,
              ]}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.verifyButtonText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>Verify Email</Text>
              )}
            </TouchableOpacity>

            {/* Resend Action */}
            <View style={styles.resendContainer}>
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0 || resending}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text
                  style={[
                    styles.resendText,
                    countdown > 0 && styles.resendTextDisabled,
                  ]}
                >
                  {resending
                    ? "Resending..."
                    : countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Didn't receive code? Resend"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  innerContainer: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emailHighlight: {
    fontWeight: "600",
    color: "#0F172A",
  },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#B91C1C",
    lineHeight: 18,
  },
  successBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: "100%",
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: "#15803D",
    lineHeight: 18,
  },
  otpSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 28,
  },
  hintText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 8,
  },
  verifyButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resendContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  resendText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: "#94A3B8",
    fontWeight: "400",
  },
});
