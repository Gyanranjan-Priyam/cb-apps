import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail, AlertCircle, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { GoogleIcon, GitHubIcon } from "@/components/auth/social-icons";

export default function EmailSignInScreen() {
  const router = useRouter();
  const { sendOtp, signInSocial } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Smooth entrance transition animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, iconScaleAnim]);

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    const result = await sendOtp(trimmed);
    setLoading(false);

    if (result.success) {
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email: trimmed },
      });
    } else {
      setErrorMessage(
        result.error ||
          "Unauthorized Access: Only registered members added by an admin can log in."
      );
    }
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    const result = await signInSocial(provider);
    setSocialLoading(null);

    if (!result.success && result.error && result.error !== "Authentication cancelled or dismissed") {
      Alert.alert("Sign In Error", result.error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Sign In</Text>
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
          <Animated.View
            style={[
              styles.contentCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Animated Header Icon */}
            <Animated.View
              style={[
                styles.iconCircle,
                { transform: [{ scale: iconScaleAnim }] },
              ]}
            >
              <Mail size={32} color="#2563EB" />
            </Animated.View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Sign in with Email</Text>
            <Text style={styles.subtitle}>
              Enter your registered CodeBreakers email to receive a 6-digit verification code.
            </Text>

            {/* Error banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color="#DC2626" style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Email Input Field */}
            <View style={styles.inputContainer}>
              <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="member@gcekbpatna.ac.in"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleSendOtp}
                style={styles.input}
                autoFocus={true}
              />
            </View>

            {/* Action CTA Button */}
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.actionBtn, loading && styles.btnDisabled]}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.actionBtnText}>Sending OTP...</Text>
                </View>
              ) : (
                <Text style={styles.actionBtnText}>Continue with Email</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or sign in with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Options Buttons */}
            <View style={styles.socialRow}>
              {/* Google Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={Boolean(socialLoading)}
                onPress={() => handleSocialSignIn("google")}
                style={styles.socialBtn}
              >
                {socialLoading === "google" ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <GoogleIcon size={20} />
                )}
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              {/* GitHub Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={Boolean(socialLoading)}
                onPress={() => handleSocialSignIn("github")}
                style={styles.socialBtn}
              >
                {socialLoading === "github" ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <GitHubIcon size={20} color="#0F172A" />
                )}
                <Text style={styles.socialBtnText}>GitHub</Text>
              </TouchableOpacity>
            </View>

            {/* Helpful Hint */}
            <View style={styles.hintContainer}>
              <Sparkles size={16} color="#64748B" />
              <Text style={styles.hintText}>
                No password required. We will authenticate you using a secure one-time passcode.
              </Text>
            </View>
          </Animated.View>
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
  contentCard: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#DBEAFE",
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
    paddingHorizontal: 8,
  },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#B91C1C",
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    width: "100%",
    marginBottom: 18,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    height: "100%",
  },
  actionBtn: {
    width: "100%",
    backgroundColor: "#0F172A",
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerLabel: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#18181B",
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
});
