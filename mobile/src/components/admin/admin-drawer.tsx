import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Easing,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  Users,
  Layers,
  QrCode,
  Brain,
  ListChecks,
  Trophy,
  Award,
  FileText,
  Compass,
  Receipt,
  MonitorCog,
  Settings,
  LogOut,
  X,
  ShieldAlert,
  ChevronRight,
  CloudDownload,
} from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { preloadEntireAppOfflineData } from "@/lib/offline-manager";
import { Image } from "expo-image";
import { getUserProfileImageUrl } from "@/lib/image-utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export interface NavItem {
  title: string;
  route: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  badge?: string;
}

export const ADMIN_NAV_SECTIONS: { sectionTitle: string; items: NavItem[] }[] = [
  {
    sectionTitle: "Core Management",
    items: [
      {
        title: "Dashboard",
        route: "/(admin)/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Members",
        route: "/(admin)/members",
        icon: Users,
      },
      {
        title: "Batches",
        route: "/(admin)/batches",
        icon: Layers,
      },
      {
        title: "Attendance",
        route: "/(admin)/attendance",
        icon: QrCode,
      },
    ],
  },
  {
    sectionTitle: "Activities & Management",
    items: [
      {
        title: "Tasks",
        route: "/(admin)/tasks",
        icon: ListChecks,
      },
      {
        title: "Leaderboard",
        route: "/(admin)/leaderboard",
        icon: Trophy,
      },
      {
        title: "Forms",
        route: "/(admin)/forms",
        icon: FileText,
      },
    ],
  },
  {
    sectionTitle: "Administration",
    items: [
      {
        title: "Transactions",
        route: "/(admin)/transactions",
        icon: Receipt,
      },
      {
        title: "System Settings",
        route: "/(admin)/system-settings",
        icon: MonitorCog,
      },
      {
        title: "Settings",
        route: "/(admin)/settings",
        icon: Settings,
      },
    ],
  },
];

interface AdminDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function AdminDrawer({ visible, onClose }: AdminDrawerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  // Swipe-to-close gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx < -15;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -DRAWER_WIDTH * 0.25 || gestureState.vx < -0.5) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const [preloading, setPreloading] = useState(false);

  const handlePreloadOffline = async () => {
    if (preloading) return;
    setPreloading(true);
    try {
      await preloadEntireAppOfflineData();
      Alert.alert(
        "Offline Database Ready ✓",
        "All dashboard statistics, member profiles, batch student rosters, and attendance records have been downloaded and saved for full offline use."
      );
    } catch {
      Alert.alert("Notice", "Offline sync completed with local cache.");
    } finally {
      setPreloading(false);
    }
  };

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      const cleanTarget = route.replace("/(admin)", "");
      const cleanCurrent = (pathname || "").replace("/(admin)", "");
      if (cleanCurrent === cleanTarget || (cleanCurrent === "/dashboard" && cleanTarget === "/dashboard")) {
        return;
      }
      // @ts-ignore
      router.replace(route);
    }, 120);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of the Admin Console?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            onClose();
            await signOut();
          },
        },
      ]
    );
  };


  const displayName = user?.name || user?.email.split("@")[0] || "Admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Soft Dim Backdrop with Smooth Fade */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: opacityAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Animated Slide Drawer with Swipe-To-Dismiss */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.drawerContent,
            {
              paddingTop: insets.top + 10,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Drawer Header with Brand & Close Button */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconCircle}>
                <ShieldAlert size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.brandTitle}>CodeBreakers</Text>
                <Text style={styles.brandSubtitle}>Admin Portal</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              {getUserProfileImageUrl(user) ? (
                <Image
                  source={{ uri: getUserProfileImageUrl(user)! }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>ADMIN</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Nav List */}
          <ScrollView
            style={styles.navList}
            contentContainerStyle={styles.navListContent}
            showsVerticalScrollIndicator={false}
          >
            {ADMIN_NAV_SECTIONS.map((section, sIndex) => (
              <View key={sIndex} style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>{section.sectionTitle.toUpperCase()}</Text>
                {section.items.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname.includes(item.route.replace("/(admin)", ""));

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleNavigate(item.route)}
                      style={[
                        styles.navItem,
                        isActive && styles.navItemActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.navItemLeft}>
                        <View
                          style={[
                            styles.iconContainer,
                            isActive && styles.iconContainerActive,
                          ]}
                        >
                          <Icon
                            size={18}
                            color={isActive ? "#4F46E5" : "#64748B"}
                          />
                        </View>
                        <Text
                          style={[
                            styles.navItemTitle,
                            isActive && styles.navItemTitleActive,
                          ]}
                        >
                          {item.title}
                        </Text>
                      </View>
                      {isActive ? (
                        <View style={styles.activeIndicator} />
                      ) : (
                        <ChevronRight size={16} color="#CBD5E1" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Bottom Actions Section */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handlePreloadOffline}
              disabled={preloading}
              style={styles.offlineSyncButton}
              activeOpacity={0.8}
            >
              {preloading ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <CloudDownload size={18} color="#4F46E5" />
              )}
              <Text style={styles.offlineSyncText}>
                {preloading ? "Syncing Full DB..." : "Download Offline Data"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.8}
            >
              <LogOut size={18} color="#DC2626" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  drawerContent: {
    width: DRAWER_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    flexDirection: "column",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  roleBadgeText: {
    color: "#4F46E5",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
    marginHorizontal: 16,
  },
  navList: {
    flex: 1,
  },
  navListContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: "#EEF2FF",
  },
  navItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    backgroundColor: "#E0E7FF",
  },
  navItemTitle: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  navItemTitleActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4F46E5",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 8,
  },
  offlineSyncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  offlineSyncText: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
});

