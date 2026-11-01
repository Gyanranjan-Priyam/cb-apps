import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  QrCode,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Plus,
  X,
  Check,
  Users,
  CheckCircle2,
  CloudOff,
  RefreshCw,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { AdminTopBar } from "@/components/admin/admin-header";
import { AppBottomSheet } from "@/components/ui/app-bottom-sheet";
import {
  fetchAdminData,
  mutateAdminData,
  RealAttendanceData,
  RealAttendanceSession,
  RealBatch,
} from "@/lib/admin-api";
import {
  cacheSessionsList,
  getCachedSessionsList,
  getPendingSyncCount,
  getPendingSyncQueue,
  clearSyncedQueueRecords,
} from "@/lib/offline-attendance-db";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function AdminAttendanceScreen() {
  const router = useRouter();
  const [attendanceData, setAttendanceData] = useState<RealAttendanceData>({
    sessions: [],
    recentLogs: [],
  });
  const [batches, setBatches] = useState<RealBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [syncingAll, setSyncingAll] = useState(false);

  // Bottom Sheet Ref for "Create Attendance Session"
  const createSessionSheetRef = useRef<BottomSheetModal>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all"); // "all" or batch.id
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBatchPicker, setShowBatchPicker] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingSyncCount();
    setTotalPendingCount(count);
  }, []);

  const loadData = useCallback(async () => {
    refreshPendingCount();
    try {
      const [attRes, batchRes] = await Promise.all([
        fetchAdminData<RealAttendanceData>("attendance"),
        fetchAdminData<RealBatch[]>("batches"),
      ]);
      if (attRes) {
        setAttendanceData(attRes);
        await cacheSessionsList(attRes.sessions);
      } else {
        const cached = await getCachedSessionsList();
        if (cached && cached.length > 0) {
          setAttendanceData({ sessions: cached, recentLogs: [] });
        }
      }
      if (batchRes) {
        setBatches(batchRes);
      }
    } catch {
      const cached = await getCachedSessionsList();
      if (cached && cached.length > 0) {
        setAttendanceData({ sessions: cached, recentLogs: [] });
      }
    } finally {
      setLoading(false);
    }
  }, [refreshPendingCount]);

  const handleSyncAllPending = async () => {
    if (syncingAll || totalPendingCount === 0) return;
    setSyncingAll(true);
    try {
      const queue = await getPendingSyncQueue();
      if (queue.length === 0) {
        setTotalPendingCount(0);
        setSyncingAll(false);
        return;
      }

      const res = await mutateAdminData("sync-attendance", { records: queue });
      if (res.success) {
        const syncedIds = (res.syncedIds as string[]) || queue.map((q) => q.id);
        await clearSyncedQueueRecords(syncedIds);
        await refreshPendingCount();
        await loadData();
        Alert.alert("Sync Complete ✓", `Successfully uploaded ${syncedIds.length} offline attendance records to the server!`);
      } else {
        Alert.alert("Sync Failed", res.error || "Could not upload records.");
      }
    } catch {
      Alert.alert("Sync Error", "Could not connect to server. Check your internet connection.");
    } finally {
      setSyncingAll(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime updates for live presence & sessions
  useSupabaseRealtime({
    channel: "admin-attendance",
    event: "attendance_change",
    onUpdate: () => {
      loadData();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDayName = (date: Date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  };

  const handleCreateSession = async () => {
    if (!sessionTitle.trim()) {
      Alert.alert("Validation Error", "Please enter session title.");
      return;
    }

    setSubmitting(true);
    const targetBatchIds = selectedBatchId === "all" ? [] : [selectedBatchId];
    const res = await mutateAdminData("add-session", {
      title: sessionTitle.trim(),
      date: selectedDate.toISOString(),
      day: getDayName(selectedDate),
      targetBatchIds,
    });
    setSubmitting(false);

    if (res.success) {
      createSessionSheetRef.current?.dismiss();
      setSessionTitle("");
      setSelectedBatchId("all");
      setSelectedDate(new Date());
      loadData();
      Alert.alert("Success", "Attendance session created successfully.");
    } else {
      Alert.alert("Error", res.error || "Failed to create session.");
    }
  };

  // Calendar matrix generator
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const prevLastDay = new Date(year, month, 0).getDate();
    const startDayIndex = firstDay.getDay(); // 0 is Sunday
    const totalDays = lastDay.getDate();

    const days: { day: number; currentMonth: boolean; date: Date }[] = [];

    // Previous month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevLastDay - i,
        currentMonth: false,
        date: new Date(year, month - 1, prevLastDay - i),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        currentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Next month padding to make full weeks
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [currentCalendarMonth]);

  const monthYearLabel = currentCalendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedBatchObj = batches.find((b) => b.id === selectedBatchId);
  const selectedBatchLabel =
    selectedBatchId === "all"
      ? "All Batches (Global - All students)"
      : selectedBatchObj
      ? `${selectedBatchObj.name} (${selectedBatchObj.code})`
      : "Select Target Batch";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header with Back, Inline Title, and Create Session Button */}
      <AdminTopBar
        title="Attendance Manager"
        subtitle={`${attendanceData.sessions.length} sessions recorded`}
        rightAction={
          <TouchableOpacity
            onPress={() => createSessionSheetRef.current?.present()}
            style={styles.circleAddBtn}
            activeOpacity={0.7}
            accessibilityLabel="Create Attendance Session"
          >
            <Plus size={20} color="#0F172A" />
          </TouchableOpacity>
        }
      />

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
        {/* GLOBAL OFFLINE PENDING SYNC BANNER */}
        {totalPendingCount > 0 && (
          <View style={styles.syncBanner}>
            <View style={styles.syncBannerLeft}>
              <CloudOff size={18} color="#D97706" />
              <View>
                <Text style={styles.syncBannerTitle}>
                  {totalPendingCount} Offline {totalPendingCount === 1 ? "Record" : "Records"} Pending
                </Text>
                <Text style={styles.syncBannerSubtitle}>
                  Connect to internet and sync with central server
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSyncAllPending}
              disabled={syncingAll}
              style={styles.syncNowBtn}
              activeOpacity={0.8}
            >
              {syncingAll ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.syncBtnContent}>
                  <RefreshCw size={13} color="#FFFFFF" />
                  <Text style={styles.syncNowBtnText}>Sync All</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Sessions Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Attendance Sessions</Text>
            <Text style={styles.sectionSubtitle}>
              Tap any session to view enrolled students & mark attendance
            </Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching attendance sessions...</Text>
          </View>
        ) : attendanceData.sessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Sessions Found</Text>
            <Text style={styles.emptyText}>
              Create your first attendance session to start tracking student presence.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => createSessionSheetRef.current?.present()}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.emptyActionText}>Create New Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {attendanceData.sessions.map((session) => {
              const formattedDate = new Date(session.date).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );
              const isGlobal =
                !session.targetBatchIds || session.targetBatchIds.length === 0;

              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/(admin)/attendance/detail",
                      params: { id: session.id },
                    })
                  }
                >
                  <View style={styles.sessionTopRow}>
                    <View style={styles.sessionNumBadge}>
                      <Text style={styles.sessionNumText}>
                        Session #{session.sessionNumber}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.batchBadge,
                        isGlobal ? styles.batchBadgeGlobal : styles.batchBadgeCohort,
                      ]}
                    >
                      <Layers
                        size={12}
                        color={isGlobal ? "#4F46E5" : "#0284C7"}
                      />
                      <Text
                        style={[
                          styles.batchBadgeText,
                          isGlobal
                            ? styles.batchBadgeTextGlobal
                            : styles.batchBadgeTextCohort,
                        ]}
                        numberOfLines={1}
                      >
                        {session.targetBatchLabel || "All Batches"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionMainInfo}>
                    <Text style={styles.sessionTitle} numberOfLines={2}>
                      {session.title}
                    </Text>
                    <View style={styles.sessionDateRow}>
                      <Calendar size={13} color="#64748B" />
                      <Text style={styles.sessionDateText}>
                        {session.day}, {formattedDate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionFooter}>
                    <View style={styles.statPill}>
                      <Users size={14} color="#059669" />
                      <Text style={styles.statPillText}>
                        {session.presentCount || 0} Present
                      </Text>
                      {session.totalEligible ? (
                        <Text style={styles.statPillSub}>
                          / {session.totalEligible} Target
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.cardArrow}>
                      <Text style={styles.viewStudentsText}>View Students</Text>
                      <ChevronRight size={16} color="#6366F1" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* CREATE ATTENDANCE SESSION BOTTOM SHEET */}
      <AppBottomSheet
        ref={createSessionSheetRef}
        snapPoints={["85%"]}
        title="Create Attendance Session"
        subtitle="Create a new attendance session for members"
        onClose={() => {
          setShowDatePicker(false);
          setShowBatchPicker(false);
        }}
      >
        <View style={{ gap: 16, paddingBottom: 24 }}>
          {/* Field 1: Session Title */}
          <View style={styles.darkFormGroup}>
            <Text style={styles.darkLabel}>Session Title</Text>
            <TextInput
              value={sessionTitle}
              onChangeText={setSessionTitle}
              placeholder="Enter session title"
              placeholderTextColor="#64748B"
              style={styles.darkInput}
            />
          </View>

          {/* Field 2: Session Date */}
          <View style={styles.darkFormGroup}>
            <Text style={styles.darkLabel}>Session Date</Text>
            <TouchableOpacity
              style={styles.darkSelectTrigger}
              activeOpacity={0.8}
              onPress={() => {
                setShowBatchPicker(false);
                setShowDatePicker((prev) => !prev);
              }}
            >
              <Text
                style={
                  selectedDate ? styles.darkSelectText : styles.darkPlaceholder
                }
              >
                {selectedDate
                  ? `${getDayName(selectedDate)}, ${selectedDate.toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}`
                  : "Pick a date"}
              </Text>
              <CalendarIcon size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Inline Popover Calendar Grid */}
            {showDatePicker && (
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    onPress={() =>
                      setCurrentCalendarMonth(
                        new Date(
                          currentCalendarMonth.getFullYear(),
                          currentCalendarMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                    style={styles.calendarNavBtn}
                  >
                    <ChevronLeft size={18} color="#E2E8F0" />
                  </TouchableOpacity>

                  <Text style={styles.calendarMonthText}>
                    {monthYearLabel}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setCurrentCalendarMonth(
                        new Date(
                          currentCalendarMonth.getFullYear(),
                          currentCalendarMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                    style={styles.calendarNavBtn}
                  >
                    <ChevronRight size={18} color="#E2E8F0" />
                  </TouchableOpacity>
                </View>

                {/* Weekdays Row */}
                <View style={styles.weekdaysRow}>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                    (day, idx) => (
                      <Text key={idx} style={styles.weekdayText}>
                        {day}
                      </Text>
                    )
                  )}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((item, idx) => {
                    const isSelected =
                      selectedDate.getDate() === item.date.getDate() &&
                      selectedDate.getMonth() === item.date.getMonth() &&
                      selectedDate.getFullYear() === item.date.getFullYear();

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                        ]}
                        onPress={() => {
                          setSelectedDate(item.date);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            !item.currentMonth && styles.dayCellOtherMonth,
                            isSelected && styles.dayCellTextSelected,
                          ]}
                        >
                          {item.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Field 3: Target Batch */}
          <View style={styles.darkFormGroup}>
            <Text style={styles.darkLabel}>Target Batch</Text>
            <TouchableOpacity
              style={styles.darkSelectTrigger}
              activeOpacity={0.8}
              onPress={() => {
                setShowDatePicker(false);
                setShowBatchPicker((prev) => !prev);
              }}
            >
              <View style={styles.darkSelectLeft}>
                <Layers size={18} color="#94A3B8" />
                <Text
                  style={styles.darkSelectText}
                  numberOfLines={1}
                >
                  {selectedBatchLabel}
                </Text>
              </View>
              <ChevronRight
                size={16}
                color="#64748B"
                style={{ transform: [{ rotate: showBatchPicker ? "90deg" : "0deg" }] }}
              />
            </TouchableOpacity>

            {/* Batch Picker Dropdown */}
            {showBatchPicker && (
              <View style={styles.dropdownContainer}>
                {/* All Batches Option */}
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedBatchId === "all" && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedBatchId("all");
                    setShowBatchPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedBatchId === "all" && styles.dropdownItemTextActive,
                    ]}
                  >
                    All Batches (Global - All students)
                  </Text>
                  {selectedBatchId === "all" && (
                    <Check size={16} color="#E2E8F0" />
                  )}
                </TouchableOpacity>

                {/* Specific Batches */}
                {batches.map((batch) => {
                  const isSelected = selectedBatchId === batch.id;
                  return (
                    <TouchableOpacity
                      key={batch.id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedBatchId(batch.id);
                        setShowBatchPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextActive,
                        ]}
                      >
                        {batch.name} ({batch.code})
                      </Text>
                      {isSelected && <Check size={16} color="#E2E8F0" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.darkHelpText}>
              Select which batch this attendance session is for. Only students
              belonging to this batch will be listed for attendance.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActionsRow}>
            <TouchableOpacity
              style={styles.darkCancelBtn}
              onPress={() => createSessionSheetRef.current?.dismiss()}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.darkCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.darkSubmitBtn}
              onPress={handleCreateSession}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.darkSubmitText}>Create Session</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  circleAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  sessionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionNumBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  batchBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    maxWidth: "60%",
  },
  batchBadgeGlobal: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  batchBadgeCohort: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  batchBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  batchBadgeTextGlobal: {
    color: "#4F46E5",
  },
  batchBadgeTextCohort: {
    color: "#0284C7",
  },
  sessionMainInfo: {
    gap: 6,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 22,
  },
  sessionDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionDateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  sessionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  statPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  statPillSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  cardArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewStudentsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  /* DARK MODAL STYLES (Matching Screenshots) */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdropDismiss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  darkModalCard: {
    backgroundColor: "#18181B", // Zinc 900
    borderRadius: 20,
    padding: 22,
    width: "100%",
    maxWidth: 480,
    borderWidth: 1,
    borderColor: "#27272A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalHeaderTexts: {
    flex: 1,
    paddingRight: 10,
    gap: 4,
  },
  darkModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  darkModalSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 16,
  },
  darkCloseBtn: {
    padding: 4,
  },
  darkFormGroup: {
    gap: 6,
  },
  darkLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  darkInput: {
    backgroundColor: "#09090B", // Zinc 950
    borderWidth: 1,
    borderColor: "#EA580C", // Accent orange/coral focus border as seen in screenshot 1
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: "#F8FAFC",
  },
  darkSelectTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#09090B",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  darkSelectLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  darkSelectText: {
    fontSize: 13,
    color: "#F8FAFC",
    fontWeight: "500",
  },
  darkPlaceholder: {
    fontSize: 13,
    color: "#64748B",
  },
  darkHelpText: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 15,
    marginTop: 2,
  },

  /* CALENDAR POPOVER */
  calendarContainer: {
    backgroundColor: "#09090B",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  calendarMonthText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  calendarNavBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#18181B",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    width: 34,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  dayCell: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: "#27272A",
    borderWidth: 1,
    borderColor: "#EA580C",
  },
  dayCellText: {
    fontSize: 12,
    color: "#F8FAFC",
    fontWeight: "600",
  },
  dayCellOtherMonth: {
    color: "#475569",
  },
  dayCellTextSelected: {
    color: "#EA580C",
    fontWeight: "800",
  },

  /* DROPDOWN CONTAINER */
  dropdownContainer: {
    backgroundColor: "#09090B",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#18181B",
  },
  dropdownItemActive: {
    backgroundColor: "#18181B",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: "#F8FAFC",
    fontWeight: "700",
  },

  /* MODAL ACTION BUTTONS (matches screenshots) */
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  darkCancelBtn: {
    backgroundColor: "#27272A",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  darkCancelText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
  },
  darkSubmitBtn: {
    backgroundColor: "#E76F51", // Coral/Orange matching screenshot
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 130,
    alignItems: "center",
  },
  darkSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
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
    paddingVertical: 12,
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
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  syncBannerTitle: {
    color: "#B45309",
    fontSize: 13,
    fontWeight: "800",
  },
  syncBannerSubtitle: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  syncNowBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 14,
    paddingVertical: 8,
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

