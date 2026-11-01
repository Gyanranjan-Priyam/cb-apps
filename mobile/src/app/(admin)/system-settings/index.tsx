import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  Switch,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Server } from "lucide-react-native";
import { AdminTopBar } from "@/components/admin/admin-header";
import { fetchAdminData, RealSystemSettings } from "@/lib/admin-api";

export default function AdminSystemSettingsScreen() {
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireOtp, setRequireOtp] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemData, setSystemData] = useState<RealSystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSettings = useCallback(async () => {
    const data = await fetchAdminData<RealSystemSettings>("system-settings");
    if (data) {
      setSystemData(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header with Back Button and Inline Page Title */}
      <AdminTopBar
        title="System Settings"
        subtitle="Server & runtime configuration"
      />

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
        {/* Server Status Box */}
        <View style={styles.statusBox}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              <Server size={20} color="#059669" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {systemData?.serverStatus === "Operational"
                  ? "Backend API Connected"
                  : "Connecting..."}
              </Text>
              <Text style={styles.statusDesc}>
                {systemData?.databaseEngine
                  ? `Active (${systemData.databaseEngine} + Better Auth)`
                  : "Checking database health..."}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>

        {/* Configuration Toggles */}
        <Text style={styles.sectionHeading}>Security & Access Rules</Text>

        <View style={styles.toggleList}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Allow Whitelist Registration</Text>
              <Text style={styles.toggleSubtitle}>Permit pre-whitelisted students to sign up</Text>
            </View>
            <Switch
              value={allowRegistration}
              onValueChange={setAllowRegistration}
              trackColor={{ false: "#E2E8F0", true: "#4F46E5" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Enforce Email OTP Verification</Text>
              <Text style={styles.toggleSubtitle}>Require 6-digit OTP for all email logins</Text>
            </View>
            <Switch
              value={requireOtp}
              onValueChange={setRequireOtp}
              trackColor={{ false: "#E2E8F0", true: "#4F46E5" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Maintenance Mode</Text>
              <Text style={styles.toggleSubtitle}>Temporarily disable student access</Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: "#E2E8F0", true: "#EF4444" }}
              thumbColor="#FFFFFF"
            />
          </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
    gap: 18,
  },
  statusBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 6,
  },
  toggleList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  toggleSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
});
