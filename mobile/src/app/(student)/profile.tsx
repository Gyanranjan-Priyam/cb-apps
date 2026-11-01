import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Fingerprint,
  CheckCircle2,
  Sparkles,
} from "lucide-react-native";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { parseMemberRoles } from "@/lib/member-roles";

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your CodeBreakers account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const displayName = user?.name || user?.email.split("@")[0] || "Member";
  const initial = (displayName[0] || "M").toUpperCase();
  const rolesList = parseMemberRoles(user?.role);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Account & Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutTopBtn}>
          <LogOut size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {rolesList.map((role, idx) => (
              <View key={idx} style={styles.roleBadge}>
                <ShieldCheck size={13} color="#16A34A" />
                <Text style={styles.roleText}>{role}</Text>
              </View>
            ))}
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={13} color="#2563EB" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <Text style={styles.sectionHeader}>Membership Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <UserIcon size={18} color="#64748B" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{displayName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Mail size={18} color="#64748B" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Registered Email</Text>
              <Text style={styles.detailValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <ShieldCheck size={18} color="#64748B" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Club Role</Text>
              <View style={styles.rolesPillsWrap}>
                {rolesList.map((role, idx) => (
                  <View key={idx} style={styles.rolePillSmall}>
                    <Text style={styles.rolePillSmallText}>{role.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Fingerprint size={18} color="#64748B" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Account ID</Text>
              <Text style={styles.detailValueSmall} numberOfLines={1}>
                {user?.id || "cb-student-auth"}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Box */}
        <View style={styles.statusBox}>
          <View style={styles.statusHeader}>
            <Sparkles size={18} color="#D97706" />
            <Text style={styles.statusTitle}>Better Auth Connected</Text>
          </View>
          <Text style={styles.statusBody}>
            Your member profile is securely authenticated via Better Auth on the CodeBreakers portal.
          </Text>
        </View>

        {/* Big Bottom Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          style={styles.fullLogoutButton}
        >
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.fullLogoutText}>Log Out of Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  logoutTopBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2563EB",
  },
  profileMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  userName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 13,
    color: "#64748B",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  detailIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  detailValueSmall: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
    fontFamily: "monospace",
  },
  rolesPillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  rolePillSmall: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rolePillSmallText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  statusBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 6,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
  },
  statusBody: {
    fontSize: 13,
    color: "#B45309",
    lineHeight: 18,
  },
  fullLogoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    marginTop: 8,
  },
  fullLogoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
  },
});
