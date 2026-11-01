import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ChevronLeft, CloudOff, RefreshCw } from "lucide-react-native";
import {
  subscribeToPendingSyncCount,
  syncAllApplicationOfflineData,
} from "@/lib/offline-manager";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { getUserProfileImageUrl } from "@/lib/image-utils";

interface AdminTopBarProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  onOpenDrawer?: () => void;
  style?: object;
}

export function AdminTopBar({
  title,
  subtitle,
  rightAction,
  onOpenDrawer,
  style,
}: AdminTopBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const avatarUrl = getUserProfileImageUrl(user);
  const displayName = user?.name || user?.email?.split("@")[0] || "A";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  useEffect(() => {
    const unsubscribe = subscribeToPendingSyncCount((count) => {
      setPendingCount(count);
    });
    return () => unsubscribe();
  }, []);

  const handleGlobalSync = async () => {
    if (syncing || pendingCount === 0) return;
    setSyncing(true);
    try {
      const res = await syncAllApplicationOfflineData();
      if (res.success) {
        Alert.alert("Sync Complete ✓", `Successfully synced ${res.syncedCount} offline items to the server!`);
      } else {
        Alert.alert("Sync Notice", res.error || "Could not complete sync with server.");
      }
    } catch {
      Alert.alert("Connection Error", "Cannot reach the server. Make sure your device is connected to the internet.");
    } finally {
      setSyncing(false);
    }
  };

  const handleBackOrHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(admin)/dashboard");
    }
  };

  return (
    <>
      <View style={[styles.container, style]}>
        {/* Sleek Circular Navigation / Back Button on Top Left */}
        <TouchableOpacity
          onPress={handleBackOrHome}
          activeOpacity={0.7}
          style={styles.hamburgerButton}
          accessibilityLabel="Go back or Home"
          accessibilityRole="button"
        >
          <ChevronLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        {/* Inline Page Title & Subtitle */}
        {title ? (
          <View style={styles.titleWrapper}>
            <Text style={styles.pageTitle} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.pageSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.flexSpacer} />
        )}

        {/* Right Action slot (or user avatar button to open settings) */}
        {rightAction ? (
          <View style={styles.rightActionWrapper}>{rightAction}</View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push("/(admin)/settings")}
            style={styles.headerAvatarBtn}
            activeOpacity={0.8}
            accessibilityLabel="Open Settings"
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.headerAvatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarPlaceholderText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* GLOBAL OFFLINE PENDING SYNC BAR */}
      {pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <View style={styles.syncBannerLeft}>
            <CloudOff size={15} color="#D97706" />
            <Text style={styles.syncBannerText}>
              {pendingCount} {pendingCount === 1 ? "change" : "changes"} queued offline
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleGlobalSync}
            disabled={syncing}
            style={styles.syncNowBtn}
            activeOpacity={0.8}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.syncBtnContent}>
                <RefreshCw size={11} color="#FFFFFF" />
                <Text style={styles.syncNowBtnText}>Sync</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  hamburgerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
    textAlign: "center",
  },
  flexSpacer: {
    flex: 1,
  },
  rightActionWrapper: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarPlaceholderText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  balancer: {
    width: 42,
    height: 42,
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  syncBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncBannerText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "700",
  },
  syncNowBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  syncBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  syncNowBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});

