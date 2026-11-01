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
import { ArrowLeft, QrCode, CheckCircle2, Calendar, Clock, AlertCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";

export default function StudentAttendanceScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const mockHistory = [
    { id: "1", title: "Git & GitHub Essentials", date: "21 Sep 2026", status: "Present", points: "+15 pts" },
    { id: "2", title: "React & Next.js Architecture", date: "14 Sep 2026", status: "Present", points: "+20 pts" },
    { id: "3", title: "Intro to Competitive Programming", date: "07 Sep 2026", status: "Present", points: "+15 pts" },
  ];

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
        <Text style={styles.navTitle}>My Attendance Pass</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR Pass Card */}
        <View style={styles.passCard}>
          <Text style={styles.passTitle}>Session Attendance QR Pass</Text>
          <Text style={styles.passSubtitle}>
            Show this QR code to club coordinators to mark your attendance at offline workshops.
          </Text>

          {/* QR Code Placeholder Graphic */}
          <View style={styles.qrContainer}>
            <QrCode size={160} color="#0F172A" />
            <Text style={styles.qrCodeLabel}>{user?.email}</Text>
          </View>

          <View style={styles.securityNote}>
            <CheckCircle2 size={14} color="#16A34A" />
            <Text style={styles.securityText}>Verified Member QR Pass</Text>
          </View>
        </View>

        {/* History Section */}
        <Text style={styles.sectionHeading}>Attendance History</Text>
        <View style={styles.historyList}>
          {mockHistory.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyIconBox}>
                <CheckCircle2 size={20} color="#16A34A" />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <View style={styles.metaRow}>
                  <Calendar size={12} color="#64748B" />
                  <Text style={styles.metaText}>{item.date}</Text>
                </View>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{item.points}</Text>
              </View>
            </View>
          ))}
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
  content: {
    padding: 20,
    gap: 20,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  passCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  passTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  passSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  qrContainer: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  qrCodeLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  securityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: {
    flex: 1,
    gap: 3,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
  },
  pointsBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
});
