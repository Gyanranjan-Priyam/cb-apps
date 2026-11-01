import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolves the backend Better Auth API URL.
 * Defaults to EXPO_PUBLIC_API_URL if configured, otherwise uses development machine host.
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // If running in Expo Go or development client on device/simulator
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:3000`;
  }

  if (Platform.OS === "android") {
    // Android emulator alias for host localhost
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
}

export const API_BASE_URL = getApiBaseUrl();
