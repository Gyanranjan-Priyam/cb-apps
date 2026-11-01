import React from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/auth-context";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  // 1. If unauthenticated, redirect to login onboarding screen
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // 2. If user is Admin or Co-Admin, redirect to Admin Console Dashboard
  if (hasAdminOrCoAdminAccess(user.role)) {
    return <Redirect href="/(admin)/dashboard" />;
  }

  // 3. Otherwise, redirect to Student / Member Dashboard
  return <Redirect href="/(student)/dashboard" />;
}

