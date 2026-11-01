import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { preloadEntireAppOfflineData } from "@/lib/offline-manager";
import { AdminBottomNavbar } from "@/components/admin/admin-bottom-navbar";

export default function AdminLayout() {
  useEffect(() => {
    // Non-blocking background full-database sync
    const timer = setTimeout(() => {
      void preloadEntireAppOfflineData();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        {/* Dashboard */}
        <Stack.Screen name="dashboard/index" options={{ headerShown: false }} />

        {/* Members */}
        <Stack.Screen name="members/index" options={{ headerShown: false }} />
        <Stack.Screen name="members/profile" options={{ headerShown: false }} />

        {/* Batches */}
        <Stack.Screen name="batches/index" options={{ headerShown: false }} />
        <Stack.Screen name="batches/detail" options={{ headerShown: false }} />
        <Stack.Screen name="batches/enroll" options={{ headerShown: false }} />

        {/* Attendance */}
        <Stack.Screen name="attendance/index" options={{ headerShown: false }} />
        <Stack.Screen name="attendance/detail" options={{ headerShown: false }} />
        <Stack.Screen name="attendance/scanner" options={{ headerShown: false }} />

        {/* Tasks */}
        <Stack.Screen name="tasks/index" options={{ headerShown: false }} />

        {/* Leaderboard */}
        <Stack.Screen name="leaderboard/index" options={{ headerShown: false }} />

        {/* Forms */}
        <Stack.Screen name="forms/index" options={{ headerShown: false }} />
        <Stack.Screen name="forms/responses" options={{ headerShown: false }} />
        <Stack.Screen name="forms/response-detail" options={{ headerShown: false }} />

        {/* Events */}
        <Stack.Screen name="events/index" options={{ headerShown: false }} />

        {/* Transactions */}
        <Stack.Screen name="transactions/index" options={{ headerShown: false }} />
        <Stack.Screen name="transactions/form-transactions" options={{ headerShown: false }} />
        <Stack.Screen name="transactions/receipt-detail" options={{ headerShown: false }} />

        {/* System Settings */}
        <Stack.Screen name="system-settings/index" options={{ headerShown: false }} />

        {/* Settings */}
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      </Stack>

      <AdminBottomNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});

