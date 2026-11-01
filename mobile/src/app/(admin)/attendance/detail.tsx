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
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  X,
  Trash2,
  Clock,
  Sparkles,
  QrCode,
  Award,
  CloudOff,
  RefreshCw,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  fetchAdminData,
  mutateAdminData,
  RealAttendanceSessionDetail,
  RealAttendanceStudent,
} from "@/lib/admin-api";
import {
  cacheSessionDetail,
  getCachedSessionDetail,
  toggleOfflineStudentAttendance,
  getPendingSyncCount,
  getPendingSyncQueue,
  clearSyncedQueueRecords,
} from "@/lib/offline-attendance-db";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function AdminAttendanceSessionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const sessionId = params.id;


  const [sessionData, setSessionData] =
    useState<RealAttendanceSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "present" | "absent">("all");
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    if (sessionId) {
      const count = await getPendingSyncCount(sessionId);
      setPendingCount(count);
    }
  }, [sessionId]);

  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    refreshPendingCount();

    try {
      const data = await fetchAdminData<RealAttendanceSessionDetail>(
        "attendance-session-detail",
        { id: sessionId }
      );
      if (data) {
        setSessionData(data);
        await cacheSessionDetail(data); // Pre-cache roster for offline use
      } else {
        // Fallback to offline cached data
        const cached = await getCachedSessionDetail(sessionId);
        if (cached) setSessionData(cached);
      }
    } catch {
      const cached = await getCachedSessionDetail(sessionId);
      if (cached) setSessionData(cached);
    } finally {
      setLoading(false);
    }
  }, [sessionId, refreshPendingCount]);

  useEffect(() => {
    loadSessionDetails();
  }, [loadSessionDetails]);

  // Realtime updates for live attendance marks
  useSupabaseRealtime({
    channel: "admin-attendance",
    event: "attendance_change",
    onUpdate: () => {
      loadSessionDetails();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessionDetails();
    setRefreshing(false);
  };

  // Sync offline records
  const handleSyncAttendance = async () => {
    if (syncing || pendingCount === 0 || !sessionId) return;
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
        await loadSessionDetails();
        Alert.alert("Sync Successful ✓", `Uploaded ${syncedIds.length} offline attendance records to the server!`);
      } else {
        Alert.alert("Sync Failed", res.error || "Could not sync offline records.");
      }
    } catch {
      Alert.alert("Sync Error", "Could not connect to server. Check your internet connection.");
    } finally {
      setSyncing(false);
    }
  };

  // Toggle student attendance (Present <-> Absent)
  const handleToggleAttendance = async (student: RealAttendanceStudent) => {
    if (!sessionId) return;

    const newStatus: "present" | "absent" =
      student.status === "present" ? "absent" : "present";
    setTogglingUserId(student.id);

    // Optimistic UI update
    setSessionData((prev) => {
      if (!prev) return prev;
      const updatedStudents: RealAttendanceStudent[] = prev.students.map((s) => {
        if (s.id === student.id) {
          return {
            ...s,
            status: newStatus,
            markedAt:
              newStatus === "present"
                ? new Date().toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                : null,
            method: "manual",
          };
        }
        return s;
      });

      const newPresentCount = updatedStudents.filter(
        (s) => s.status === "present"
      ).length;
      const newAbsentCount = updatedStudents.length - newPresentCount;
      const newRate =
        updatedStudents.length > 0
          ? Math.round((newPresentCount / updatedStudents.length) * 100)
          : 0;

      return {
        ...prev,
        students: updatedStudents,
        presentCount: newPresentCount,
        absentCount: newAbsentCount,
        attendanceRate: newRate,
      };
    });

    try {
      const res = await mutateAdminData("toggle-student-attendance", {
        sessionId,
        userId: student.id,
        status: newStatus,
      });

      if (!res.success) {
        // Network or server error -> save offline!
        await toggleOfflineStudentAttendance(sessionId, student.id, newStatus);
        await refreshPendingCount();
      }
    } catch {
      // Network error -> save offline!
      await toggleOfflineStudentAttendance(sessionId, student.id, newStatus);
      await refreshPendingCount();
    } finally {
      setTogglingUserId(null);
    }
  };

  // Delete session
  const handleDeleteSession = () => {
    if (!sessionData) return;
    Alert.alert(
      "Delete Attendance Session",
      `Are you sure you want to delete "${sessionData.title}"? All marked attendances for this session will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await mutateAdminData("delete-session", {
              id: sessionData.id,
            });
            if (res.success) {
              Alert.alert("Deleted", "Session deleted successfully.");
              router.back();
            } else {
              Alert.alert("Error", res.error || "Failed to delete session.");
            }
          },
        },
      ]
    );
  };

  // Filter & search students
  const filteredStudents = useMemo(() => {
    if (!sessionData) return [];
    let list = sessionData.students;

    if (filterTab === "present") {
      list = list.filter((s) => s.status === "present");
    } else if (filterTab === "absent") {
      list = list.filter((s) => s.status === "absent");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
          (s.registration && s.registration.toLowerCase().includes(q)) ||
          (s.branch && s.branch.toLowerCase().includes(q))
      );
    }

    return list;
  }, [sessionData, filterTab, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Bar with Back Button, Title, and Delete Action */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {sessionData
              ? `Session #${sessionData.sessionNumber}`
              : "Session Details"}
          </Text>
          <Text style={styles.topBarSubtitle} numberOfLines={1}>
            {sessionData?.title || "Loading..."}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(admin)/attendance/scanner",
              params: { id: sessionId },
            })
          }
          style={styles.scannerHeaderBtn}
          activeOpacity={0.7}
          accessibilityLabel="Open QR Scanner"
        >
          <QrCode size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>
              Loading batch student roster...
            </Text>
          </View>
        ) : !sessionData ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Session Not Found</Text>
            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.backHomeBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* OFFLINE PENDING SYNC BANNER */}
            {pendingCount > 0 && (
              <View style={styles.syncBanner}>
                <View style={styles.syncBannerLeft}>
                  <CloudOff size={16} color="#D97706" />
                  <Text style={styles.syncBannerText}>
                    {pendingCount} offline {pendingCount === 1 ? "record" : "records"} unsynced
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleSyncAttendance}
                  disabled={syncing}
                  style={styles.syncNowBtn}
                  activeOpacity={0.8}
                >
                  {syncing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.syncBtnContent}>
                      <RefreshCw size={13} color="#FFFFFF" />
                      <Text style={styles.syncNowBtnText}>Sync Server</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 1. TOP CARD - SESSION OVERVIEW DETAILS */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeaderRow}>
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>
                    Session #{sessionData.sessionNumber}
                  </Text>
                </View>
                <View style={styles.targetBatchBadge}>
                  <Layers size={12} color="#4F46E5" />
                  <Text style={styles.targetBatchText} numberOfLines={1}>
                    {sessionData.targetBatchLabel}
                  </Text>
                </View>
              </View>

              <Text style={styles.overviewTitle}>{sessionData.title}</Text>

              <View style={styles.overviewMetaRow}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color="#64748B" />
                  <Text style={styles.metaItemText}>
                    {sessionData.day},{" "}
                    {new Date(sessionData.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              {/* Attendance Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabelText}>
                    Presence Percentage
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {sessionData.attendanceRate}%
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(sessionData.attendanceRate, 100)}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Metric Counters */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, styles.metricCardTotal]}>
                  <Users size={16} color="#4F46E5" />
                  <Text style={styles.metricVal}>{sessionData.totalEligible}</Text>
                  <Text style={styles.metricLbl}>Enrolled</Text>
                </View>

                <View style={[styles.metricCard, styles.metricCardPresent]}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={[styles.metricVal, { color: "#059669" }]}>
                    {sessionData.presentCount}
                  </Text>
                  <Text style={styles.metricLbl}>Present</Text>
                </View>

                <View style={[styles.metricCard, styles.metricCardAbsent]}>
                  <XCircle size={16} color="#DC2626" />
                  <Text style={[styles.metricVal, { color: "#DC2626" }]}>
                    {sessionData.absentCount}
                  </Text>
                  <Text style={styles.metricLbl}>Absent</Text>
                </View>
              </View>
            </View>

            {/* 2. BOTTOM SECTION - ASSIGNED BATCH STUDENTS ROSTER */}
            <View style={styles.rosterSection}>
              <View style={styles.rosterHeader}>
                <View>
                  <Text style={styles.rosterTitle}>Assigned Batch Students</Text>
                  <Text style={styles.rosterSubtitle}>
                    Showing members assigned to {sessionData.targetBatchLabel}
                  </Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBox}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by student name, roll, reg..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Tabs */}
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    filterTab === "all" && styles.tabBtnActive,
                  ]}
                  onPress={() => setFilterTab("all")}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      filterTab === "all" && styles.tabBtnTextActive,
                    ]}
                  >
                    All ({sessionData.students.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    filterTab === "present" && styles.tabBtnActive,
                  ]}
                  onPress={() => setFilterTab("present")}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      filterTab === "present" && styles.tabBtnTextActive,
                    ]}
                  >
                    Present ({sessionData.presentCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    filterTab === "absent" && styles.tabBtnActive,
                  ]}
                  onPress={() => setFilterTab("absent")}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      filterTab === "absent" && styles.tabBtnTextActive,
                    ]}
                  >
                    Absent ({sessionData.absentCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Students List */}
              {filteredStudents.length === 0 ? (
                <View style={styles.noStudentsBox}>
                  <Text style={styles.noStudentsText}>
                    No students match your filter or search query.
                  </Text>
                </View>
              ) : (
                <View style={styles.studentsList}>
                  {filteredStudents.map((student) => {
                    const isPresent = student.status === "present";
                    const isToggling = togglingUserId === student.id;

                    return (
                      <View key={student.id} style={styles.studentCard}>
                        {/* Avatar */}
                        <View style={styles.avatarBox}>
                          {student.image ? (
                            <Image
                              source={{ uri: student.image }}
                              style={styles.avatarImg}
                            />
                          ) : (
                            <Text style={styles.avatarText}>
                              {student.name.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>

                        {/* Student Details */}
                        <TouchableOpacity
                          style={styles.studentInfoCol}
                          activeOpacity={0.7}
                          onPress={() =>
                            router.push({
                              pathname: "/(admin)/members/profile",
                              params: { id: student.id },
                            })
                          }
                        >
                          <Text style={styles.studentName} numberOfLines={1}>
                            {student.name}
                          </Text>

                          <View style={styles.studentSubRow}>
                            {student.rollNumber && (
                              <Text style={styles.studentRoll}>
                                Roll: {student.rollNumber}
                              </Text>
                            )}
                            {student.branch && (
                              <Text style={styles.studentBranch}>
                                • {student.branch}
                              </Text>
                            )}
                          </View>

                          {/* Status Tag */}
                          <View style={styles.statusRow}>
                            <View
                              style={[
                                styles.presenceBadge,
                                isPresent
                                  ? styles.presenceBadgePresent
                                  : styles.presenceBadgeAbsent,
                              ]}
                            >
                              {isPresent ? (
                                <Check size={11} color="#059669" />
                              ) : (
                                <X size={11} color="#64748B" />
                              )}
                              <Text
                                style={[
                                  styles.presenceBadgeText,
                                  isPresent
                                    ? styles.presenceBadgeTextPresent
                                    : styles.presenceBadgeTextAbsent,
                                ]}
                              >
                                {isPresent ? "Present" : "Absent"}
                              </Text>
                            </View>

                            {isPresent && student.markedAt && (
                              <Text style={styles.markedTimeText}>
                                {student.markedAt}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Toggle Action Button */}
                        <TouchableOpacity
                          style={[
                            styles.toggleBtn,
                            isPresent
                              ? styles.toggleBtnMarkAbsent
                              : styles.toggleBtnMarkPresent,
                          ]}
                          onPress={() => handleToggleAttendance(student)}
                          disabled={isToggling}
                          activeOpacity={0.8}
                        >
                          {isToggling ? (
                            <ActivityIndicator
                              size="small"
                              color={isPresent ? "#DC2626" : "#059669"}
                            />
                          ) : isPresent ? (
                            <Text style={styles.toggleBtnTextAbsent}>
                              Mark Absent
                            </Text>
                          ) : (
                            <Text style={styles.toggleBtnTextPresent}>
                              Mark Present
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
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
    paddingHorizontal: 16,
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
  topBarCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  topBarSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  scannerHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
    gap: 18,
  },
  loadingBox: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  backHomeBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backHomeBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  /* OVERVIEW CARD */
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  overviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4F46E5",
  },
  targetBatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: "60%",
  },
  targetBatchText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 24,
  },
  overviewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaItemText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  /* PROGRESS BAR */
  progressSection: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabelText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },

  /* METRICS GRID */
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    gap: 4,
  },
  metricCardTotal: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricCardPresent: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  metricCardAbsent: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },

  /* ROSTER SECTION */
  rosterSection: {
    gap: 12,
  },
  rosterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rosterTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  rosterSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  /* SEARCH & TABS */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* STUDENTS LIST */
  noStudentsBox: {
    padding: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  noStudentsText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  studentsList: {
    gap: 10,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  studentInfoCol: {
    flex: 1,
    gap: 3,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  studentSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  studentRoll: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  studentBranch: {
    fontSize: 11,
    color: "#64748B",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  presenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  presenceBadgePresent: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  presenceBadgeAbsent: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presenceBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  presenceBadgeTextPresent: {
    color: "#059669",
  },
  presenceBadgeTextAbsent: {
    color: "#64748B",
  },
  markedTimeText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 96,
  },
  toggleBtnMarkPresent: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  toggleBtnMarkAbsent: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  toggleBtnTextPresent: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
  },
  toggleBtnTextAbsent: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  syncBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncBannerText: {
    color: "#B45309",
    fontSize: 13,
    fontWeight: "700",
  },
  syncNowBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncNowBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});

