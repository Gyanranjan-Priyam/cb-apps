import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
  Vibration,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Flashlight,
  FlashlightOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Camera as CameraIcon,
  ShieldAlert,
  Search,
  Users,
  SwitchCamera,
  Info,
  X,
  CloudOff,
  RefreshCw,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
  CameraType,
} from "expo-camera";
import {
  fetchAdminData,
  mutateAdminData,
  RealAttendanceSessionDetail,
} from "@/lib/admin-api";
import {
  cacheSessionDetail,
  getCachedSessionDetail,
  recordOfflineScan,
  getPendingSyncCount,
  getPendingSyncQueue,
  clearSyncedQueueRecords,
} from "@/lib/offline-attendance-db";

interface ScanStudentResult {
  success: boolean;
  alreadyMarked?: boolean;
  batchMismatch?: boolean;
  message?: string;
  error?: string;
  user?: {
    id?: string;
    name: string;
    email: string;
    branch?: string | null;
    rollNumber?: string | null;
    markedAt?: string | null;
  };
}

interface ScanToast {
  type: "success" | "already" | "mismatch" | "error";
  title: string;
  message: string;
  studentName?: string;
  time?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RETICLE_SIZE = Math.min(SCREEN_WIDTH * 0.72, 270);

export default function AdminAttendanceScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const sessionId = params.id;

  const [sessionData, setSessionData] =
    useState<RealAttendanceSessionDetail | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Camera permissions & Controls
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Offline Sync State
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Toast State
  const [toast, setToast] = useState<ScanToast | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual fallback input
  const [manualCode, setManualCode] = useState("");

  // Scan Line Animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanAnim]);

  const refreshPendingCount = async () => {
    if (sessionId) {
      const count = await getPendingSyncCount(sessionId);
      setPendingCount(count);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    refreshPendingCount();

    fetchAdminData<RealAttendanceSessionDetail>("attendance-session-detail", {
      id: sessionId,
    }).then(async (data) => {
      if (data) {
        setSessionData(data);
        await cacheSessionDetail(data); // Auto-cache session and student roster for offline use
      } else {
        // Fallback to offline cached data
        const cached = await getCachedSessionDetail(sessionId);
        if (cached) setSessionData(cached);
      }
      setLoadingSession(false);
    });
  }, [sessionId]);

  // Request permission automatically on mount if not yet determined
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || processing) return;
    const qrData = result.data;
    if (!qrData || !sessionId) return;

    processScan(qrData);
  };

  const processScan = async (qrContent: string) => {
    setScanned(true);
    setProcessing(true);

    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    try {
      // 1. Attempt Online Scan First
      let res: ScanStudentResult | null = null;
      let networkFailed = false;

      try {
        const serverRes = await mutateAdminData("scan-student", {
          sessionId,
          qrContent: qrContent.trim(),
        });
        if (serverRes) {
          res = serverRes as unknown as ScanStudentResult;
          if (!serverRes.success && serverRes.error && (
            serverRes.error.toLowerCase().includes("network") ||
            serverRes.error.toLowerCase().includes("fetch") ||
            serverRes.error.toLowerCase().includes("failed to fetch")
          )) {
            networkFailed = true;
          }
        }
      } catch {
        networkFailed = true;
      }

      // 2. If Offline / Low Internet / Network Error: Run Offline Scan against local DB
      if (networkFailed || !res) {
        const offlineResult = await recordOfflineScan(sessionId, qrContent.trim());
        await refreshPendingCount();

        if (offlineResult.success) {
          if (offlineResult.alreadyMarked) {
            Vibration.vibrate([0, 60, 40, 60]);
            setToast({
              type: "already",
              title: "Already Scanned (Offline) ℹ️",
              message: `Attendance for ${offlineResult.user?.name || "Student"} was already recorded.`,
              studentName: offlineResult.user?.name,
              time: currentTime,
            });
          } else {
            Vibration.vibrate(100);
            setToast({
              type: "success",
              title: "Offline Scan Saved! ✓",
              message: `Attendance for student ${offlineResult.user?.name || "Student"} saved to offline DB.`,
              studentName: offlineResult.user?.name,
              time: currentTime,
            });
          }
        } else {
          Vibration.vibrate([0, 100, 50, 100]);
          if (offlineResult.batchMismatch) {
            setToast({
              type: "mismatch",
              title: "Student Not In This Batch ⚠️",
              message: offlineResult.error || `Student does not belong to this session's assigned batch.`,
              studentName: offlineResult.user?.name,
            });
          } else {
            setToast({
              type: "error",
              title: "Offline Scan Failed ✕",
              message: offlineResult.error || "No student record found matching this QR code in offline DB.",
            });
          }
        }
        return;
      }

      // 3. Online Server Response Handling
      if (res.success) {
        if (res.alreadyMarked) {
          Vibration.vibrate([0, 60, 40, 60]);
          setToast({
            type: "already",
            title: "Already Scanned ℹ️",
            message: `Attendance for ${res.user?.name || "Student"} was already recorded.`,
            studentName: res.user?.name,
            time: currentTime,
          });
        } else {
          Vibration.vibrate(100);
          setToast({
            type: "success",
            title: "Attendance Marked! ✓",
            message: `Attendance for student ${res.user?.name || "Student"} scanned successfully.`,
            studentName: res.user?.name,
            time: currentTime,
          });
        }
      } else {
        Vibration.vibrate([0, 100, 50, 100]);
        if (
          res.batchMismatch ||
          (res.error && res.error.toLowerCase().includes("not belong"))
        ) {
          setToast({
            type: "mismatch",
            title: "Student Not In This Batch ⚠️",
            message:
              res.error ||
              `Student ${res.user?.name || "scanned"} is not assigned to this session's batch.`,
            studentName: res.user?.name,
          });
        } else {
          setToast({
            type: "error",
            title: "Scan Failed ✕",
            message: res.error || "No student record found matching this QR code.",
          });
        }
      }
    } catch {
      // Fallback on any exception to offline storage
      const offlineResult = await recordOfflineScan(sessionId, qrContent.trim());
      await refreshPendingCount();
      if (offlineResult.success) {
        setToast({
          type: "success",
          title: "Offline Scan Saved! ✓",
          message: `Attendance for ${offlineResult.user?.name || "Student"} recorded offline.`,
          studentName: offlineResult.user?.name,
          time: currentTime,
        });
      } else {
        setToast({
          type: "error",
          title: "Scan Error",
          message: offlineResult.error || "Failed to record attendance.",
        });
      }
    } finally {
      setProcessing(false);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        setScanned(false);
      }, 3500);
    }
  };

  const handleSyncNow = async () => {
    if (syncing || pendingCount === 0) return;
    setSyncing(true);
    try {
      const queue = await getPendingSyncQueue(sessionId);
      if (queue.length === 0) {
        setPendingCount(0);
        setSyncing(false);
        return;
      }

      const res = await mutateAdminData("sync-attendance", { records: queue });
      if (res.success) {
        const syncedIds = (res.syncedIds as string[]) || queue.map((q) => q.id);
        await clearSyncedQueueRecords(syncedIds);
        await refreshPendingCount();

        // Refresh session data from server & update cache
        const updated = await fetchAdminData<RealAttendanceSessionDetail>("attendance-session-detail", { id: sessionId });
        if (updated) {
          setSessionData(updated);
          await cacheSessionDetail(updated);
        }

        Alert.alert("Sync Successful ✓", `Uploaded ${syncedIds.length} offline attendance records to the server!`);
      } else {
        Alert.alert("Sync Failed", res.error || "Could not upload offline records to server.");
      }
    } catch {
      Alert.alert("Sync Error", "Could not connect to server. Check your internet connection.");
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert("Input Error", "Please enter a student Roll / Reg / User ID.");
      return;
    }
    processScan(manualCode.trim());
    setManualCode("");
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const dismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
    setScanned(false);
  };


  // 1. Permission Loading View
  if (!permission) {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#09090B" />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Initializing Camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Permission Denied / Not Granted View
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#09090B" />
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <ShieldAlert size={36} color="#EA580C" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            To scan student attendance QR codes and ID passes, CodeBreakers needs
            permission to access your camera.
          </Text>

          <TouchableOpacity
            style={styles.grantBtn}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <CameraIcon size={18} color="#FFFFFF" />
            <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelLinkBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const laserTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RETICLE_SIZE - 4],
  });

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* FULL SCREEN NATIVE CAMERA (Rendered in background) */}
      <CameraView
        style={styles.cameraStream}
        facing={facing}
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* 3-TIER MASK OVERLAY: Dark Background on top, sides, and bottom; Transparent Cutout for camera scanning area */}
      <View style={styles.maskContainer} pointerEvents="box-none">
        {/* TOP MASK LAYER */}
        <SafeAreaView style={styles.maskTop} edges={["top"]}>
          {/* Top Bar: Back Button, Session Badge, Torch, Camera Flip */}
          <View style={styles.topBarRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.glassCircleBtn}
              activeOpacity={0.7}
              accessibilityLabel="Go back to session details"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.sessionBadgeContainer}>
              <Text style={styles.sessionBadgeTitle} numberOfLines={1}>
                {sessionData
                  ? `Session #${sessionData.sessionNumber}`
                  : "Attendance Scanner"}
              </Text>
              <Text style={styles.sessionBadgeBatch} numberOfLines={1}>
                {sessionData?.targetBatchLabel || "Scan Student Pass"}
              </Text>
            </View>

            <View style={styles.rightControlGroup}>
              <TouchableOpacity
                onPress={toggleFacing}
                style={styles.glassCircleBtn}
                activeOpacity={0.7}
                accessibilityLabel="Flip camera"
              >
                <SwitchCamera size={19} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTorchEnabled((prev) => !prev)}
                style={[
                  styles.glassCircleBtn,
                  torchEnabled && styles.glassCircleBtnTorchOn,
                ]}
                activeOpacity={0.7}
                accessibilityLabel="Toggle Flashlight"
              >
                {torchEnabled ? (
                  <FlashlightOff size={19} color="#EA580C" />
                ) : (
                  <Flashlight size={19} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* SYNC PENDING BANNER (if offline records are stored) */}
          {pendingCount > 0 && (
            <View style={styles.syncBanner}>
              <View style={styles.syncBannerLeft}>
                <CloudOff size={15} color="#F59E0B" />
                <Text style={styles.syncBannerText}>
                  {pendingCount} offline {pendingCount === 1 ? "record" : "records"} queued
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleSyncNow}
                disabled={syncing}
                style={styles.syncNowBtn}
                activeOpacity={0.8}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.syncBtnContent}>
                    <RefreshCw size={12} color="#FFFFFF" />
                    <Text style={styles.syncNowBtnText}>Sync Now</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* FLOATING STATUS TOAST */}
          {toast && (
            <View
              style={[
                styles.toastCard,
                toast.type === "success"
                  ? styles.toastSuccess
                  : toast.type === "already"
                  ? styles.toastAlready
                  : toast.type === "mismatch"
                  ? styles.toastMismatch
                  : styles.toastError,
              ]}
            >
              <View style={styles.toastIconBox}>
                {toast.type === "success" ? (
                  <CheckCircle2 size={24} color="#10B981" />
                ) : toast.type === "already" ? (
                  <Info size={24} color="#60A5FA" />
                ) : toast.type === "mismatch" ? (
                  <AlertTriangle size={24} color="#F97316" />
                ) : (
                  <AlertCircle size={24} color="#EF4444" />
                )}
              </View>

              <View style={styles.toastContent}>
                <Text style={styles.toastTitle}>{toast.title}</Text>
                <Text style={styles.toastMessage}>{toast.message}</Text>
                {toast.time && (
                  <Text style={styles.toastTime}>Recorded at {toast.time}</Text>
                )}
              </View>

              <TouchableOpacity
                onPress={dismissToast}
                style={styles.toastDismissBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#E2E8F0" />
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>

        {/* MIDDLE ROW: Left Mask + Clear Viewfinder Cutout + Right Mask */}
        <View
          style={[styles.maskMiddleRow, { height: RETICLE_SIZE }]}
          pointerEvents="box-none"
        >
          {/* Left Dark Mask */}
          <View style={styles.maskSide} />

          {/* CLEAR TRANSPARENT VIEWFINDER CUTOUT (Where camera feed shines through) */}
          <View
            style={[
              styles.viewfinderCutout,
              { width: RETICLE_SIZE, height: RETICLE_SIZE },
            ]}
          >
            {/* 4 Corner Neon Accents */}
            <View style={[styles.cornerAccent, styles.accentTL]} />
            <View style={[styles.cornerAccent, styles.accentTR]} />
            <View style={[styles.cornerAccent, styles.accentBL]} />
            <View style={[styles.cornerAccent, styles.accentBR]} />

            {/* Laser Line */}
            <Animated.View
              style={[
                styles.laserBar,
                {
                  transform: [{ translateY: laserTranslateY }],
                  width: RETICLE_SIZE - 24,
                },
              ]}
            />

            {processing && (
              <View style={styles.processingBadge}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.processingBadgeText}>
                  Checking Roster...
                </Text>
              </View>
            )}
          </View>

          {/* Right Dark Mask */}
          <View style={styles.maskSide} />
        </View>

        {/* BOTTOM MASK LAYER */}
        <SafeAreaView style={styles.maskBottom} edges={["bottom"]}>
          <Text style={styles.reticleHintText}>
            Align student QR code inside the frame to scan
          </Text>

          {/* Manual Entry Fallback Input */}
          <View style={styles.manualEntryBox}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Or enter student Roll / Reg / ID..."
              placeholderTextColor="#71717A"
              style={styles.manualEntryInput}
              autoCapitalize="none"
              onSubmitEditing={handleManualSubmit}
            />
            {manualCode.length > 0 && (
              <TouchableOpacity
                style={styles.manualMarkBtn}
                onPress={handleManualSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.manualMarkBtnText}>Mark</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  cameraStream: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  darkContainer: {
    flex: 1,
    backgroundColor: "#09090B",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingCenter: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#E2E8F0",
    fontWeight: "600",
  },
  permissionCard: {
    backgroundColor: "#18181B",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
    width: "100%",
    maxWidth: 400,
    gap: 14,
  },
  permissionIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    textAlign: "center",
  },
  permissionSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  grantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "100%",
    gap: 8,
    marginTop: 6,
  },
  grantBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelLinkBtn: {
    paddingVertical: 8,
  },
  cancelLinkText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },

  /* 3-TIER MASK CONTAINER (Provides solid dark background everywhere except camera cutout) */
  maskContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  maskTop: {
    flex: 1,
    backgroundColor: "#09090B", // Dark background on top
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  maskMiddleRow: {
    flexDirection: "row",
  },
  maskSide: {
    flex: 1,
    backgroundColor: "#09090B", // Dark background on sides
  },
  viewfinderCutout: {
    backgroundColor: "transparent", // Transparent cutout for camera preview
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 22,
    overflow: "hidden",
  },
  maskBottom: {
    flex: 1,
    backgroundColor: "#09090B", // Dark background on bottom
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  /* TOP BAR ROW */
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  glassCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  glassCircleBtnTorchOn: {
    backgroundColor: "rgba(234, 88, 12, 0.4)",
    borderColor: "#EA580C",
  },
  sessionBadgeContainer: {
    alignItems: "center",
    backgroundColor: "#18181B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272A",
    maxWidth: "52%",
  },
  sessionBadgeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sessionBadgeBatch: {
    fontSize: 11,
    color: "#A1A1AA",
    marginTop: 1,
    fontWeight: "600",
  },
  rightControlGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  /* PROMINENT TOAST NOTIFICATIONS */
  toastCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: "#064E3B",
    borderColor: "#10B981",
  },
  toastAlready: {
    backgroundColor: "#172554",
    borderColor: "#3B82F6",
  },
  toastMismatch: {
    backgroundColor: "#431407", // Deep Amber / Orange for Batch Mismatch
    borderColor: "#F97316",
  },
  toastError: {
    backgroundColor: "#450A0A",
    borderColor: "#EF4444",
  },
  toastIconBox: {
    paddingTop: 1,
  },
  toastContent: {
    flex: 1,
    gap: 3,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  toastMessage: {
    fontSize: 12,
    color: "#F1F5F9",
    lineHeight: 16,
    fontWeight: "500",
  },
  toastTime: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 2,
  },
  toastDismissBtn: {
    padding: 2,
  },

  /* RETICLE ACCENTS */
  cornerAccent: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#E76F51", // Coral/Orange accent
  },
  accentTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },
  accentTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },
  accentBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  accentBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },
  laserBar: {
    height: 3,
    backgroundColor: "#E76F51",
    borderRadius: 2,
    shadowColor: "#E76F51",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  reticleHintText: {
    fontSize: 13,
    color: "#CBD5E1",
    fontWeight: "600",
    textAlign: "center",
  },
  processingBadge: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  processingBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  /* BOTTOM MANUAL ENTRY BAR */
  manualEntryBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: "#27272A",
    gap: 10,
    width: "100%",
  },
  manualEntryInput: {
    flex: 1,
    fontSize: 13,
    color: "#FFFFFF",
  },
  manualMarkBtn: {
    backgroundColor: "#E76F51",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manualMarkBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  syncBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncBannerText: {
    color: "#FDE68A",
    fontSize: 12,
    fontWeight: "700",
  },
  syncNowBtn: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  syncNowBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});

