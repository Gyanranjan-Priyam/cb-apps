import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  Home,
  Users,
  Plus,
  QrCode,
  Settings,
  Layers,
  ListChecks,
  Trophy,
  FileText,
  CreditCard,
  Award,
  X,
  Sparkles,
} from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabItem {
  key: "home" | "members" | "plus" | "attendance" | "settings";
  label: string;
  route?: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const TABS: TabItem[] = [
  { key: "home", label: "Dashboard", route: "/(admin)/dashboard", icon: Home },
  { key: "members", label: "Members", route: "/(admin)/members", icon: Users },
  { key: "plus", label: "More", icon: Plus },
  { key: "attendance", label: "Attendance", route: "/(admin)/attendance", icon: QrCode },
  { key: "settings", label: "Settings", route: "/(admin)/settings", icon: Settings },
];

interface QuickOption {
  title: string;
  sub: string;
  route: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  bg: string;
}

const MORE_OPTIONS: QuickOption[] = [
  {
    title: "Batches",
    sub: "Cohorts & assignments",
    route: "/(admin)/batches",
    icon: Layers,
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    title: "Tasks",
    sub: "Assignments & review",
    route: "/(admin)/tasks",
    icon: ListChecks,
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    title: "Leaderboard",
    sub: "Points & live rankings",
    route: "/(admin)/leaderboard",
    icon: Trophy,
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    title: "Forms",
    sub: "Dynamic forms & answers",
    route: "/(admin)/forms",
    icon: FileText,
    color: "#9333EA",
    bg: "#FAF5FF",
  },
  {
    title: "Transactions",
    sub: "Receipts & verification",
    route: "/(admin)/transactions",
    icon: CreditCard,
    color: "#0284C7",
    bg: "#F0F9FF",
  },
  {
    title: "Events Points",
    sub: "Manage event awards",
    route: "/(admin)/events",
    icon: Award,
    color: "#E11D48",
    bg: "#FFF1F2",
  },
];

export function AdminBottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ["56%"], []);

  // Animation values for plus rotation
  const plusRotateAnim = useRef(new Animated.Value(0)).current;

  // Determine active tab based on pathname
  const activeTabKey = React.useMemo<"home" | "members" | "plus" | "attendance" | "settings">(() => {
    if (!pathname) return "home";
    if (pathname.includes("/dashboard")) return "home";
    if (pathname.includes("/members")) return "members";
    if (pathname.includes("/attendance")) return "attendance";
    if (pathname.includes("/settings") || pathname.includes("/system-settings")) return "settings";
    if (
      pathname.includes("/batches") ||
      pathname.includes("/tasks") ||
      pathname.includes("/leaderboard") ||
      pathname.includes("/forms") ||
      pathname.includes("/transactions") ||
      pathname.includes("/events")
    ) {
      return "plus";
    }
    return "home";
  }, [pathname]);

  const isHiddenRoute = React.useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.includes("/scanner") ||
      pathname.includes("/receipt-detail") ||
      pathname.includes("/response-detail")
    );
  }, [pathname]);

  const handleTabPress = (tab: TabItem) => {
    if (tab.key === "plus") {
      openBottomSheet();
      return;
    }

    if (!tab.route) return;

    // Check if user is already exactly on this root tab route to prevent duplicate navigation & re-renders
    const isAlreadyOnHome = tab.key === "home" && (pathname === "/(admin)/dashboard" || pathname === "/dashboard" || pathname === "/");
    const isAlreadyOnMembers = tab.key === "members" && (pathname === "/(admin)/members" || pathname === "/members");
    const isAlreadyOnAttendance = tab.key === "attendance" && (pathname === "/(admin)/attendance" || pathname === "/attendance");
    const isAlreadyOnSettings = tab.key === "settings" && (pathname === "/(admin)/settings" || pathname === "/settings");

    if (isAlreadyOnHome || isAlreadyOnMembers || isAlreadyOnAttendance || isAlreadyOnSettings) {
      // Already on the current tab root - no duplicate push or re-render
      return;
    }

    // Switch tabs using replace to avoid piling up back-history entries
    router.replace(tab.route as any);
  };

  const openBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.present();
    setIsSheetOpen(true);
    Animated.spring(plusRotateAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  }, [plusRotateAnim]);

  const closeBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
    setIsSheetOpen(false);
    Animated.timing(plusRotateAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [plusRotateAnim]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setIsSheetOpen(false);
        Animated.timing(plusRotateAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      } else {
        setIsSheetOpen(true);
      }
    },
    [plusRotateAnim]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleOptionSelect = (route: string) => {
    closeBottomSheet();
    setTimeout(() => {
      if (pathname !== route) {
        router.push(route as any);
      }
    }, 120);
  };

  const spin = plusRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 8);

  if (isHiddenRoute) return null;

  return (
    <>
      {/* ── STICKY SOLID BOTTOM NAVBAR (Reference Layout) ── */}
      <View style={[styles.bottomBarWrapper, { paddingBottom: bottomPadding }]}>
        <View style={styles.navRow}>
          {TABS.map((tab) => {
            const isActive = activeTabKey === tab.key;
            const Icon = tab.icon;

            if (tab.key === "plus") {
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.8}
                  style={styles.centerTabContainer}
                  accessibilityLabel="More Options"
                  accessibilityRole="button"
                >
                  <Animated.View
                    style={[
                      styles.centerActionBtn,
                      (isActive || isSheetOpen) && styles.centerActionBtnActive,
                      { transform: [{ rotate: spin }] },
                    ]}
                  >
                    <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
                  </Animated.View>
                  <Text style={[styles.tabLabel, (isActive || isSheetOpen) && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
                style={styles.tabItem}
                accessibilityLabel={tab.label}
                accessibilityRole="button"
              >
                <View style={styles.iconContainer}>
                  <Icon
                    size={22}
                    color={isActive ? "#0F172A" : "#94A3B8"}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  {isActive && <View  />}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── GESTURE BOTTOM SHEET MODAL (Powered by BottomSheetModal) ── */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backgroundStyle={styles.bottomSheetBackground}
        enablePanDownToClose
      >
        <BottomSheetView style={[styles.bottomSheetContent, { paddingBottom: bottomPadding + 16 }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.sparkleIconBox}>
                <Sparkles size={16} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Admin Modules</Text>
                <Text style={styles.modalSubTitle}>Quick navigation shortcuts</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={closeBottomSheet}
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Grid of options */}
          <View style={styles.modalGrid}>
            {MORE_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.route}
                  onPress={() => handleOptionSelect(opt.route)}
                  style={styles.modalGridItem}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalOptionIconBox, { backgroundColor: opt.bg }]}>
                    <OptIcon size={20} color={opt.color} />
                  </View>
                  <View style={styles.modalOptionTextCol}>
                    <Text style={styles.modalOptionTitle} numberOfLines={1}>
                      {opt.title}
                    </Text>
                    <Text style={styles.modalOptionSub} numberOfLines={1}>
                      {opt.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  bottomBarWrapper: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 12,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 26,
  },
  // activeDot: {
  //   position: "absolute",
  //   bottom: -3,
  //   width: 4,
  //   height: 4,
  //   borderRadius: 2,
  //   backgroundColor: "#0F172A",
  // },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  tabLabelInactive: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  centerTabContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginTop: -8,
    marginBottom: 2,
  },
  centerActionBtnActive: {
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  bottomSheetIndicator: {
    backgroundColor: "#CBD5E1",
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sparkleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  modalSubTitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 14,
  },
  modalGridItem: {
    width: "48.2%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  modalOptionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOptionTextCol: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalOptionSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
});

