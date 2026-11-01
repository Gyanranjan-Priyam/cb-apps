import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail } from "lucide-react-native";
import { StampIllustration } from "@/components/auth/stamp-illustration";
import { GoogleIcon, GitHubIcon } from "@/components/auth/social-icons";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const { signInSocial } = useAuth();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.contentContainer}>
          {/* Top Stamp Artwork */}
          <View style={styles.illustrationWrapper}>
            <StampIllustration />
          </View>

          {/* Hero Slogan / Headline */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.mainHeading}>
              Stamp Every Step of Your Journey
            </Text>
            <Text style={styles.subHeading}>
              CodeBreakers Member Portal
            </Text>
          </View>

          {/* Buttons Stack */}
          <View style={styles.buttonStack}>
            {/* 1. Email Button -> Navigates to dedicated EmailSignInScreen */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(auth)/email-signin")}
              style={styles.pillButtonLight}
            >
              <Mail size={20} color="#0F172A" strokeWidth={1.8} />
              <Text style={styles.pillButtonLightText}>
                Sign in with Email
              </Text>
            </TouchableOpacity>

            {/* 2. Google Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={Boolean(socialLoading)}
              onPress={() => handleSocialSignIn("google")}
              style={styles.pillButtonLight}
            >
              {socialLoading === "google" ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <GoogleIcon size={20} />
              )}
              <Text style={styles.pillButtonLightText}>
                Sign in with Google
              </Text>
            </TouchableOpacity>

            {/* 3. GitHub Button (Dark Pill) */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={Boolean(socialLoading)}
              onPress={() => handleSocialSignIn("github")}
              style={styles.pillButtonDark}
            >
              {socialLoading === "github" ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <GitHubIcon size={20} color="#FFFFFF" />
              )}
              <Text style={styles.pillButtonDarkText}>
                Sign in with GitHub
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Footer Note */}
          <View style={styles.footerRow}>
            <Text style={styles.footerNote}>
              Only registered club members can access this portal.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 28,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  illustrationWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  heroTextContainer: {
    paddingHorizontal: 12,
    marginBottom: 32,
    alignItems: "center",
  },
  mainHeading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#18181B",
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 14,
    color: "#71717A",
    fontWeight: "500",
    textAlign: "center",
  },
  buttonStack: {
    width: "100%",
    gap: 14,
    marginBottom: 32,
  },
  pillButtonLight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  pillButtonLightText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#18181B",
    letterSpacing: -0.2,
  },
  pillButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#18181B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  pillButtonDarkText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  footerRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  footerNote: {
    fontSize: 12,
    color: "#A1A1AA",
    textAlign: "center",
    lineHeight: 18,
  },
});
