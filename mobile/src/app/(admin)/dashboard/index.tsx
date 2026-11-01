import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  Users,
  QrCode,
  Award,
  TrendingUp,
  Sparkles,
  ArrowRight,
  FileText,
  ListChecks,
  Trophy,
  ShieldCheck,
  Menu,
  ChevronDown,
  ChevronRight,
  Plus,
  Layers,
  CreditCard,
  Settings as SettingsIcon,
  Calendar,
  CheckCircle2,
} from "lucide-react-native";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { fetchAdminData, DashboardRealStats } from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";
import { getUserProfileImageUrl } from "@/lib/image-utils";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeMetricFilter, setActiveMetricFilter] = useState<"points" | "members" | "attendance">("points");
  const [stats, setStats] = useState<DashboardRealStats>({
    totalMembers: 0,
    activeBatches: 0,
    avgAttendanceRate: "0%",
    totalPointsIssued: "0",
    rawPoints: 0,
    counts: {
      quizzes: 0,
      tasks: 0,
      events: 0,
      batches: 0,
    },
    recentMembers: [],
  });
  const [loading, setLoading] = useState(true);

  const loadRealStats = useCallback(async () => {
    const data = await fetchAdminData<DashboardRealStats>("dashboard");
    if (data) {
      setStats(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRealStats();
  }, [loadRealStats]);

  // Realtime updates for live dashboard counters
  useSupabaseRealtime({
    channel: "admin-members",
    event: "member_change",
    onUpdate: () => loadRealStats(),
  });

  useSupabaseRealtime({
    channel: "admin-batches",
    event: "batch_change",
    onUpdate: () => loadRealStats(),
  });

  useSupabaseRealtime({
    channel: "admin-attendance",
    event: "attendance_change",
    onUpdate: () => loadRealStats(),
  });

  useSupabaseRealtime({
    channel: "admin-points",
    event: "points_change",
    onUpdate: () => loadRealStats(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRealStats();
    setRefreshing(false);
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Admin";
  const userAvatarUrl = getUserProfileImageUrl(user);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning 👋";
    if (hour < 17) return "Good Afternoon 👋";
    return "Good Evening 👋";
  }, []);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />

      {/* ── TOP HEADER (Reference App Header Style) ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileHeaderLeft}
          onPress={() => router.push("/(admin)/settings")}
          activeOpacity={0.7}
        >
          <View style={styles.headerAvatarWrap}>
            {userAvatarUrl ? (
              <Image
                source={{ uri: userAvatarUrl }}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarInitial}>
                  {displayName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.headerGreetingCol}>
            <Text style={styles.headerGreetingText}>{greeting}</Text>
            <Text style={styles.headerNameText} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.menuCircleBtn}
            onPress={() => router.push("/(admin)/settings")}
            activeOpacity={0.7}
          >
            <SettingsIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
          />
        }
      >
        {/* ── HERO GLASS CARD (Reference "Total Spending" Style) ── */}
        <View style={styles.heroCard}>
          {/* Card Top Label & Filter Pill */}
          <View style={styles.heroTopRow}>
            <Text style={styles.heroSubTitle}>TOTAL CLUB METRICS</Text>
            <TouchableOpacity
              style={styles.heroFilterPill}
              activeOpacity={0.8}
              onPress={() => {
                setActiveMetricFilter((prev) =>
                  prev === "points" ? "members" : prev === "members" ? "attendance" : "points"
                );
              }}
            >
              <Text style={styles.heroFilterPillText}>
                {activeMetricFilter === "points"
                  ? `${currentMonthName}`
                  : activeMetricFilter === "members"
                  ? "All Members"
                  : "Attendance Rate"}
              </Text>
              <ChevronDown size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Hero Main Number */}
          <View style={styles.heroNumberRow}>
            {activeMetricFilter === "points" ? (
              <>
                <Text style={styles.heroCurrencySymbol}>★</Text>
                <Text style={styles.heroMainValue}>{stats.totalPointsIssued}</Text>
                <Text style={styles.heroUnitLabel}>pts</Text>
              </>
            ) : activeMetricFilter === "members" ? (
              <>
                <Text style={styles.heroMainValue}>{stats.totalMembers}</Text>
                <Text style={styles.heroUnitLabel}>Students</Text>
              </>
            ) : (
              <>
                <Text style={styles.heroMainValue}>{stats.avgAttendanceRate}</Text>
                <Text style={styles.heroUnitLabel}>Avg Rate</Text>
              </>
            )}
          </View>

          {/* Hero Bottom Trend & Active Subscriptions Stack */}
          <View style={styles.heroBottomRow}>
            <View style={styles.trendChip}>
              <TrendingUp size={13} color="#059669" />
              <Text style={styles.trendChipText}>
                {activeMetricFilter === "points"
                  ? `${stats.counts.tasks} tasks active`
                  : activeMetricFilter === "members"
                  ? `${stats.activeBatches} active cohorts`
                  : `High engagement`}
              </Text>
            </View>

            {/* Avatar Stack + Batch Count */}
            <TouchableOpacity
              style={styles.avatarStackWrap}
              onPress={() => router.push("/(admin)/batches")}
              activeOpacity={0.8}
            >
              <View style={styles.avatarOverlapRow}>
                {stats.recentMembers && stats.recentMembers.length > 0 ? (
                  stats.recentMembers.slice(0, 3).map((m, idx) => (
                    <View
                      key={m.id || idx}
                      style={[
                        styles.stackAvatarCircle,
                        {
                          marginLeft: idx === 0 ? 0 : -10,
                          backgroundColor:
                            idx === 0 ? "#6366F1" : idx === 1 ? "#EC4899" : "#3B82F6",
                        },
                      ]}
                    >
                      <Text style={styles.stackAvatarInitial}>
                        {m.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.stackAvatarCircle}>
                    <Text style={styles.stackAvatarInitial}>CB</Text>
                  </View>
                )}
              </View>
              <View>
                <Text style={styles.stackLabelCount}>{stats.activeBatches} Batches</Text>
                <Text style={styles.stackSubLabel}>active cohorts</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Center decorative tab notch */}
          <View style={styles.heroCardNotch}>
            <View style={styles.heroCardNotchInner} />
          </View>
        </View>

        {/* ── QUICK ACTIONS ROW (Reference 4-button pill row) ── */}
        <View style={styles.quickActionsRow}>
          {/* 1. Add / Scan Attendance */}
          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/(admin)/attendance")}
          >
            <View style={[styles.quickActionIconBox, { backgroundColor: "#EEF2FF" }]}>
              <QrCode size={20} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionLabel}>Scan QR</Text>
          </TouchableOpacity>

          {/* 2. Members Directory */}
          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/(admin)/members")}
          >
            <View style={[styles.quickActionIconBox, { backgroundColor: "#ECFDF5" }]}>
              <Users size={20} color="#059669" />
            </View>
            <Text style={styles.quickActionLabel}>Members</Text>
          </TouchableOpacity>

          {/* 3. Tasks & Assignments */}
          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/(admin)/tasks")}
          >
            <View style={[styles.quickActionIconBox, { backgroundColor: "#FFFBEB" }]}>
              <ListChecks size={20} color="#D97706" />
            </View>
            <Text style={styles.quickActionLabel}>Tasks</Text>
          </TouchableOpacity>

          {/* 4. Dynamic Forms */}
          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/(admin)/forms")}
          >
            <View style={[styles.quickActionIconBox, { backgroundColor: "#FAF5FF" }]}>
              <FileText size={20} color="#9333EA" />
            </View>
            <Text style={styles.quickActionLabel}>Forms</Text>
          </TouchableOpacity>
        </View>

        {/* ── LIVE HIGHLIGHTS (Reference "Upcoming payments" Section) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Live Activities</Text>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push("/(admin)/leaderboard")}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Leaderboard</Text>
            <ChevronRight size={14} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardsList}>
          {/* Card 1: Live Leaderboard Ranking */}
          <TouchableOpacity
            style={styles.itemCard}
            activeOpacity={0.7}
            onPress={() => router.push("/(admin)/leaderboard")}
          >
            <View style={[styles.itemCardIcon, { backgroundColor: "#FEF3C7" }]}>
              <Trophy size={20} color="#D97706" />
            </View>
            <View style={styles.itemCardContent}>
              <View style={styles.itemCardTitleRow}>
                <Text style={styles.itemCardTitle} numberOfLines={1}>
                  Club Leaderboard
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#B45309" }]}>REALTIME</Text>
                </View>
              </View>
              <Text style={styles.itemCardSubtitle} numberOfLines={1}>
                Batch-wise & overall live rankings
              </Text>
            </View>
            <View style={styles.itemCardTrailing}>
              <Text style={styles.itemCardValue}>{stats.totalPointsIssued} pts</Text>
              <Text style={styles.itemCardValueSub}>Issued</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Latest Attendance Session */}
          <TouchableOpacity
            style={styles.itemCard}
            activeOpacity={0.7}
            onPress={() => router.push("/(admin)/attendance")}
          >
            <View style={[styles.itemCardIcon, { backgroundColor: "#EEF2FF" }]}>
              <QrCode size={20} color="#4F46E5" />
            </View>
            <View style={styles.itemCardContent}>
              <View style={styles.itemCardTitleRow}>
                <Text style={styles.itemCardTitle} numberOfLines={1}>
                  {stats.recentSession
                    ? `#${stats.recentSession.sessionNumber} • ${stats.recentSession.title}`
                    : "Attendance System"}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: "#EEF2FF" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#4F46E5" }]}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.itemCardSubtitle} numberOfLines={1}>
                {stats.recentSession
                  ? `${stats.recentSession.presentCount} students marked present`
                  : "Quick QR scanner & student verify"}
              </Text>
            </View>
            <View style={styles.itemCardTrailing}>
              <Text style={styles.itemCardValue}>{stats.avgAttendanceRate}</Text>
              <Text style={styles.itemCardValueSub}>Present</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Tasks & Submissions */}
          <TouchableOpacity
            style={styles.itemCard}
            activeOpacity={0.7}
            onPress={() => router.push("/(admin)/tasks")}
          >
            <View style={[styles.itemCardIcon, { backgroundColor: "#ECFDF5" }]}>
              <ListChecks size={20} color="#059669" />
            </View>
            <View style={styles.itemCardContent}>
              <View style={styles.itemCardTitleRow}>
                <Text style={styles.itemCardTitle} numberOfLines={1}>
                  {stats.recentTask ? stats.recentTask.title : "Tasks & Projects"}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: "#ECFDF5" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#059669" }]}>TASK</Text>
                </View>
              </View>
              <Text style={styles.itemCardSubtitle} numberOfLines={1}>
                {stats.recentTask
                  ? `${stats.recentTask.submissionsCount} submissions received`
                  : `${stats.counts.tasks} ongoing club assignments`}
              </Text>
            </View>
            <View style={styles.itemCardTrailing}>
              <Text style={styles.itemCardValue}>
                {stats.recentTask ? `+${stats.recentTask.points}` : `${stats.counts.tasks}`}
              </Text>
              <Text style={styles.itemCardValueSub}>Points</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Forms & Registration */}
          <TouchableOpacity
            style={styles.itemCard}
            activeOpacity={0.7}
            onPress={() => router.push("/(admin)/forms")}
          >
            <View style={[styles.itemCardIcon, { backgroundColor: "#FAF5FF" }]}>
              <FileText size={20} color="#9333EA" />
            </View>
            <View style={styles.itemCardContent}>
              <View style={styles.itemCardTitleRow}>
                <Text style={styles.itemCardTitle} numberOfLines={1}>
                  Forms & Responses
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: "#FAF5FF" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#9333EA" }]}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.itemCardSubtitle} numberOfLines={1}>
                Review responses & manage collection
              </Text>
            </View>
            <View style={styles.itemCardTrailing}>
              <Text style={styles.itemCardValue}>Active</Text>
              <Text style={styles.itemCardValueSub}>Collect</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── CORE OPERATIONS & SHORTCUTS (Reference 2nd section style) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Management Modules</Text>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push("/(admin)/batches")}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>All Modules</Text>
            <ChevronRight size={14} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.modulesGrid}>
          {/* Batches Management */}
          <TouchableOpacity
            style={styles.moduleBox}
            activeOpacity={0.7}
            onPress={() => router.push("/(admin)/batches")}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: "#EEF2FF" }]}>
              <Layers size={18} color="#4F46E5" />
            </View>
            <Text style={styles.moduleBoxTitle}>Batches</Text>
            <Text style={styles.moduleBoxSub}>{stats.activeBatches} active cohorts</Text>
          </TouchableOpacity>

          {/* Transactions & Receipts */}
          <TouchableOpacity
            style={styles.moduleBox}
            activeOpacity={0.7}
            onPress={() => router.push("/(admin)/transactions")}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: "#ECFDF5" }]}>
              <CreditCard size={18} color="#059669" />
            </View>
            <Text style={styles.moduleBoxTitle}>Transactions</Text>
            <Text style={styles.moduleBoxSub}>Receipts & verification</Text>
          </TouchableOpacity>

          {/* Members Directory */}
          <TouchableOpacity
            style={styles.moduleBox}
            activeOpacity={0.7}
            onPress={() => router.push("/(admin)/members")}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: "#FFFBEB" }]}>
              <Users size={18} color="#D97706" />
            </View>
            <Text style={styles.moduleBoxTitle}>Members</Text>
            <Text style={styles.moduleBoxSub}>{stats.totalMembers} enrolled</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            style={styles.moduleBox}
            activeOpacity={0.7}
            onPress={() => router.push("/(admin)/settings")}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: "#F8FAFC" }]}>
              <SettingsIcon size={18} color="#64748B" />
            </View>
            <Text style={styles.moduleBoxTitle}>Settings</Text>
            <Text style={styles.moduleBoxSub}>Profile & system</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#F4F6FA",
  },
  profileHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerAvatarWrap: {
    position: "relative",
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarInitial: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerGreetingCol: {
    flex: 1,
  },
  headerGreetingText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  headerNameText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
    gap: 20,
  },
  heroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    position: "relative",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroSubTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  heroFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroFilterPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  heroNumberRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 12,
    marginBottom: 14,
    gap: 6,
  },
  heroCurrencySymbol: {
    fontSize: 22,
    fontWeight: "700",
    color: "#D97706",
  },
  heroMainValue: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  heroUnitLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  heroBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  avatarStackWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarOverlapRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
  },
  stackAvatarInitial: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  stackLabelCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  stackSubLabel: {
    fontSize: 9,
    color: "#64748B",
  },
  heroCardNotch: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: 28,
    height: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCardNotchInner: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  quickActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  quickActionItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  quickActionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  cardsList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemCardContent: {
    flex: 1,
  },
  itemCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  itemCardSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  itemCardTrailing: {
    alignItems: "flex-end",
  },
  itemCardValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  itemCardValueSub: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moduleBox: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  moduleBoxTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  moduleBoxSub: {
    fontSize: 11,
    color: "#64748B",
  },
  footerSyncBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF2FF",
    padding: 12,
    borderRadius: 12,
    marginTop: 2,
  },
  footerSyncText: {
    flex: 1,
    fontSize: 11,
    color: "#4338CA",
    fontWeight: "500",
  },
});
