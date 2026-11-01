import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  QrCode,
  Calendar,
  Award,
  User,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Bell,
  ArrowRight,
  Sparkles,
} from "lucide-react-native";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { parseMemberRoles } from "@/lib/member-roles";

export default function StudentDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const displayName = user?.name || user?.email.split("@")[0] || "Member";
  const roles = parseMemberRoles(user?.role);
  const initial = (displayName[0] || "M").toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.clubTitle}>CodeBreakers GCEK</Text>
          <Text style={styles.greetingText}>Welcome, {displayName}</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(student)/profile")}
          activeOpacity={0.8}
          style={styles.avatarBtn}
        >
          <Text style={styles.avatarBtnText}>{initial}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Digital Membership ID Card */}
        <View style={styles.memberCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardOrg}>GOVERNMENT COLLEGE OF ENGINEERING</Text>
              <Text style={styles.cardClub}>CodeBreakers Club</Text>
            </View>
            <ShieldCheck size={26} color="#FFFFFF" />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>{initial}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.cardName}>{displayName}</Text>
              <Text style={styles.cardEmail}>{user?.email}</Text>
              <View style={styles.cardRolePill}>
                <Text style={styles.cardRoleText}>
                  {roles[0] ? roles[0].toUpperCase() : "MEMBER"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardIdText}>
              ID: {user?.id?.slice(0, 14) || "CB-2026-MEM"}
            </Text>
            <View style={styles.activeTag}>
              <CheckCircle2 size={12} color="#4ADE80" />
              <Text style={styles.activeTagText}>Active Member</Text>
            </View>
          </View>
        </View>

        {/* Student Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: "#EFF6FF" }]}>
              <QrCode size={18} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>92%</Text>
            <Text style={styles.statDesc}>Attendance</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: "#FEF2F2" }]}>
              <Flame size={18} color="#EF4444" />
            </View>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statDesc}>Session Streak</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: "#FFFBEB" }]}>
              <Award size={18} color="#D97706" />
            </View>
            <Text style={styles.statNumber}>340</Text>
            <Text style={styles.statDesc}>Club Points</Text>
          </View>
        </View>

        {/* Student Quick Action Grid */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {/* QR Pass */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(student)/attendance")}
            style={styles.actionBtnCard}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "#EFF6FF" }]}>
              <QrCode size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionBtnTitle}>My QR Pass</Text>
            <Text style={styles.actionBtnSub}>Mark attendance in sessions</Text>
          </TouchableOpacity>

          {/* Events */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(student)/events")}
            style={styles.actionBtnCard}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "#ECFDF5" }]}>
              <Calendar size={22} color="#059669" />
            </View>
            <Text style={styles.actionBtnTitle}>Club Events</Text>
            <Text style={styles.actionBtnSub}>View upcoming events & schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Latest Announcement */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Bell size={16} color="#2563EB" />
            <Text style={styles.noticeTitle}>Upcoming Bootcamp</Text>
          </View>
          <Text style={styles.noticeBody}>
            Full-Stack Web & AI Bootcamp this Saturday at Lab 3. Keep your attendance QR pass ready!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: {
    gap: 2,
  },
  clubTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  memberCard: {
    backgroundColor: "#0F172A",
    borderRadius: 22,
    padding: 20,
    gap: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardOrg: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.6,
  },
  cardClub: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1E293B",
    borderWidth: 2,
    borderColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardEmail: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  cardRolePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  cardRoleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#93C5FD",
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 12,
  },
  cardIdText: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: "monospace",
  },
  activeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4ADE80",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  statDesc: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtnCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionBtnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionBtnSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  noticeCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 6,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
  },
  noticeBody: {
    fontSize: 13,
    color: "#1E3A8A",
    lineHeight: 19,
  },
});
