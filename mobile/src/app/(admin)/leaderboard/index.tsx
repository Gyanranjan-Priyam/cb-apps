import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  Trophy,
  Award,
  Calendar,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  QrCode,
  ListChecks,
  FileCheck,
  Brain,
  X,
  TrendingUp,
  Flame,
} from "lucide-react-native";
import { AdminTopBar } from "@/components/admin/admin-header";
import { AppBottomSheet } from "@/components/ui/app-bottom-sheet";
import {
  fetchLeaderboard,
  RealLeaderboardStudent,
  LeaderboardBatchItem,
  LeaderboardResponseData,
} from "@/lib/admin-api";
import { getUserProfileImageUrl } from "@/lib/image-utils";
import { subscribeToMobileBroadcast } from "@/lib/supabase-client";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AdminLeaderboardScreen() {
  // Filter States
  const [timeframe, setTimeframe] = useState<"overall" | "monthly">("overall");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);

  // Data State
  const [leaders, setLeaders] = useState<RealLeaderboardStudent[]>([]);
  const [batches, setBatches] = useState<LeaderboardBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Batch Picker Bottom Sheet
  const batchSheetRef = useRef<BottomSheetModal>(null);

  // Detailed Student Scorecard Bottom Sheet
  const studentScorecardSheetRef = useRef<BottomSheetModal>(null);
  const [selectedStudent, setSelectedStudent] = useState<RealLeaderboardStudent | null>(null);

  const openStudentScorecard = (student: RealLeaderboardStudent) => {
    setSelectedStudent(student);
    studentScorecardSheetRef.current?.present();
  };

  const loadData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const data: LeaderboardResponseData | null = await fetchLeaderboard({
          timeframe,
          batchId: selectedBatchId,
          month: currentMonth,
          year: currentYear,
          forceFresh: isSilent,
        });

        if (data) {
          setLeaders(data.leaderboard || []);
          if (data.batches && data.batches.length > 0) {
            setBatches(data.batches);
          }
        }
      } catch {
        // offline fallback
      } finally {
        if (!isSilent) setLoading(false);
        setRefreshing(false);
      }
    },
    [timeframe, selectedBatchId, currentMonth, currentYear]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime updates when points, attendance, tasks, or events change
  useEffect(() => {
    const unsubLeaderboard = subscribeToMobileBroadcast("admin-leaderboard", "leaderboard_change", () => {
      loadData(true);
    });
    const unsubPoints = subscribeToMobileBroadcast("admin-points", "points_change", () => {
      loadData(true);
    });
    const unsubAttendance = subscribeToMobileBroadcast("admin-attendance", "attendance_change", () => {
      loadData(true);
    });
    const unsubTasks = subscribeToMobileBroadcast("admin-tasks", "task_change", () => {
      loadData(true);
    });

    return () => {
      unsubLeaderboard();
      unsubPoints();
      unsubAttendance();
      unsubTasks();
    };
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    // Don't go into the future
    if (currentYear === now.getFullYear() && currentMonth >= now.getMonth() + 1) {
      return;
    }
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const selectedBatchLabel = useMemo(() => {
    if (selectedBatchId === "all") return "All Batches";
    const found = batches.find((b) => b.id === selectedBatchId);
    return found ? found.name : "All Batches";
  }, [selectedBatchId, batches]);

  // Top 3 Podium
  const top3 = useMemo(() => {
    return {
      first: leaders[0] || null,
      second: leaders[1] || null,
      third: leaders[2] || null,
    };
  }, [leaders]);

  const remainingLeaders = useMemo(() => {
    return leaders.slice(3);
  }, [leaders]);

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: "#FEF3C7", text: "#B45309", border: "#FCD34D", crown: "#F59E0B" };
      case 2:
        return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", crown: "#94A3B8" };
      case 3:
        return { bg: "#FFEDD5", text: "#C2410C", border: "#FDBA74", crown: "#FB923C" };
      default:
        return { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0", crown: "#94A3B8" };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <AdminTopBar
        title="Leaderboard"
        subtitle={
          timeframe === "overall"
            ? `${selectedBatchLabel} • All-Time`
            : `${selectedBatchLabel} • ${MONTH_NAMES[currentMonth - 1]} ${currentYear}`
        }
      />

      {/* FILTERS SECTION */}
      <View style={styles.filterSection}>
        {/* Timeframe Toggle: Overall vs Monthly */}
        <View style={styles.filterTopRow}>
          <View style={styles.timeframeSegment}>
            <TouchableOpacity
              onPress={() => setTimeframe("overall")}
              style={[
                styles.timeframeBtn,
                timeframe === "overall" && styles.timeframeBtnActive,
              ]}
              activeOpacity={0.8}
            >
              <Sparkles
                size={14}
                color={timeframe === "overall" ? "#4F46E5" : "#64748B"}
              />
              <Text
                style={[
                  styles.timeframeBtnText,
                  timeframe === "overall" && styles.timeframeBtnTextActive,
                ]}
              >
                Overall
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTimeframe("monthly")}
              style={[
                styles.timeframeBtn,
                timeframe === "monthly" && styles.timeframeBtnActive,
              ]}
              activeOpacity={0.8}
            >
              <Calendar
                size={14}
                color={timeframe === "monthly" ? "#4F46E5" : "#64748B"}
              />
              <Text
                style={[
                  styles.timeframeBtnText,
                  timeframe === "monthly" && styles.timeframeBtnTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Monthly Month-Switcher (Only shown when timeframe is monthly) */}
          {timeframe === "monthly" && (
            <View style={styles.monthSwitcher}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.monthNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={16} color="#4F46E5" />
              </TouchableOpacity>

              <Text style={styles.monthLabel}>
                {MONTH_NAMES[currentMonth - 1].slice(0, 3)} {currentYear}
              </Text>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.monthNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={16} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Batch Filter Chips Horizontal Scroll */}
        {batches.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.batchChipsScroll}
          >
            {batches.map((b) => {
              const isActive = selectedBatchId === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setSelectedBatchId(b.id)}
                  style={[
                    styles.batchChip,
                    isActive && styles.batchChipActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.batchChipText,
                      isActive && styles.batchChipTextActive,
                    ]}
                  >
                    {b.name}
                  </Text>
                  {b.code !== "ALL" && (
                    <View
                      style={[
                        styles.batchChipCodeBadge,
                        isActive && styles.batchChipCodeBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.batchChipCodeText,
                          isActive && styles.batchChipCodeTextActive,
                        ]}
                      >
                        {b.code}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

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
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Recalibrating live leaderboard...</Text>
          </View>
        ) : leaders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Trophy size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptySubtitle}>
              {timeframe === "monthly"
                ? `No point activity recorded in ${MONTH_NAMES[currentMonth - 1]} ${currentYear} for ${selectedBatchLabel}.`
                : `No members have earned points yet in ${selectedBatchLabel}.`}
            </Text>
          </View>
        ) : (
          <>
            {/* ── TOP 3 PODIUM HERO ── */}
            <View style={styles.podiumContainer}>
              {/* #2 Rank (Left) */}
              {top3.second ? (
                <TouchableOpacity
                  onPress={() => openStudentScorecard(top3.second)}
                  style={[styles.podiumCol, styles.podiumColSecond]}
                  activeOpacity={0.8}
                >
                  <View style={styles.podiumAvatarWrap}>
                    {getUserProfileImageUrl(top3.second) ? (
                      <Image
                        source={{ uri: getUserProfileImageUrl(top3.second)! }}
                        style={styles.podiumAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.podiumAvatar, styles.podiumAvatarPlaceholder, { backgroundColor: "#94A3B8" }]}>
                        <Text style={styles.podiumAvatarText}>
                          {top3.second.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.podiumRankBadge, { backgroundColor: "#94A3B8" }]}>
                      <Text style={styles.podiumRankText}>2</Text>
                    </View>
                  </View>

                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top3.second.name}
                  </Text>
                  <Text style={styles.podiumBranch} numberOfLines={1}>
                    {top3.second.branch}
                  </Text>
                  <View style={styles.podiumPointsBadge}>
                    <Text style={styles.podiumPointsText}>{top3.second.totalPoints} pts</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.podiumColPlaceholder} />
              )}

              {/* #1 Rank (Center) */}
              {top3.first && (
                <TouchableOpacity
                  onPress={() => openStudentScorecard(top3.first)}
                  style={[styles.podiumCol, styles.podiumColFirst]}
                  activeOpacity={0.8}
                >
                  <View style={styles.crownIconWrap}>
                    <Trophy size={22} color="#D97706" />
                  </View>
                  <View style={styles.podiumAvatarWrap}>
                    {getUserProfileImageUrl(top3.first) ? (
                      <Image
                        source={{ uri: getUserProfileImageUrl(top3.first)! }}
                        style={[styles.podiumAvatar, styles.podiumAvatarFirst]}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, styles.podiumAvatarPlaceholder, { backgroundColor: "#F59E0B" }]}>
                        <Text style={[styles.podiumAvatarText, { fontSize: 20 }]}>
                          {top3.first.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.podiumRankBadge, { backgroundColor: "#D97706", width: 24, height: 24, borderRadius: 12 }]}>
                      <Text style={styles.podiumRankText}>1</Text>
                    </View>
                  </View>

                  <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                    {top3.first.name}
                  </Text>
                  <Text style={styles.podiumBranch} numberOfLines={1}>
                    {top3.first.branch} • {top3.first.batchName}
                  </Text>
                  <View style={[styles.podiumPointsBadge, styles.podiumPointsBadgeFirst]}>
                    <Award size={13} color="#B45309" />
                    <Text style={[styles.podiumPointsText, styles.podiumPointsTextFirst]}>
                      {top3.first.totalPoints} pts
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* #3 Rank (Right) */}
              {top3.third ? (
                <TouchableOpacity
                  onPress={() => openStudentScorecard(top3.third)}
                  style={[styles.podiumCol, styles.podiumColThird]}
                  activeOpacity={0.8}
                >
                  <View style={styles.podiumAvatarWrap}>
                    {getUserProfileImageUrl(top3.third) ? (
                      <Image
                        source={{ uri: getUserProfileImageUrl(top3.third)! }}
                        style={styles.podiumAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.podiumAvatar, styles.podiumAvatarPlaceholder, { backgroundColor: "#EA580C" }]}>
                        <Text style={styles.podiumAvatarText}>
                          {top3.third.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.podiumRankBadge, { backgroundColor: "#EA580C" }]}>
                      <Text style={styles.podiumRankText}>3</Text>
                    </View>
                  </View>

                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top3.third.name}
                  </Text>
                  <Text style={styles.podiumBranch} numberOfLines={1}>
                    {top3.third.branch}
                  </Text>
                  <View style={styles.podiumPointsBadge}>
                    <Text style={styles.podiumPointsText}>{top3.third.totalPoints} pts</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.podiumColPlaceholder} />
              )}
            </View>

            {/* ── COMPLETE RANKING ROSTER ── */}
            <View style={styles.rosterCard}>
              <View style={styles.rosterHeader}>
                <Text style={styles.rosterHeaderTitle}>Rankings List</Text>
                <Text style={styles.rosterHeaderCount}>{leaders.length} Members</Text>
              </View>

              <View style={styles.rosterList}>
                {leaders.map((student) => {
                  const badge = getRankBadgeColor(student.rank);
                  const avatarUrl = getUserProfileImageUrl(student);

                  return (
                    <TouchableOpacity
                      key={student.id}
                      onPress={() => openStudentScorecard(student)}
                      style={[
                        styles.studentRow,
                        student.rank <= 3 && styles.studentRowTopThree,
                      ]}
                      activeOpacity={0.7}
                    >
                      {/* Rank Number */}
                      <View style={[styles.rankPill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Text style={[styles.rankPillText, { color: badge.text }]}>
                          #{student.rank}
                        </Text>
                      </View>

                      {/* Avatar */}
                      <View style={styles.studentAvatarWrap}>
                        {avatarUrl ? (
                          <Image
                            source={{ uri: avatarUrl }}
                            style={styles.studentAvatar}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.studentAvatarPlaceholder}>
                            <Text style={styles.studentAvatarPlaceholderText}>
                              {student.name.slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Name & Metadata */}
                      <View style={styles.studentInfo}>
                        <View style={styles.studentNameRow}>
                          <Text style={styles.studentName} numberOfLines={1}>
                            {student.name}
                          </Text>
                          {student.rank === 1 && (
                            <Flame size={14} color="#EA580C" style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        <View style={styles.studentMetaRow}>
                          <Text style={styles.studentBranch} numberOfLines={1}>
                            {student.branch} • {student.batchName}
                          </Text>
                        </View>
                      </View>

                      {/* Points Total */}
                      <View style={styles.pointsBadge}>
                        <Award size={13} color="#D97706" />
                        <Text style={styles.pointsBadgeText}>{student.totalPoints}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── STUDENT DETAILS SCORECARD BOTTOM SHEET ── */}
      <AppBottomSheet
        ref={studentScorecardSheetRef}
        snapPoints={["75%"]}
        title="Student Scorecard"
        subtitle={
          selectedStudent
            ? `${selectedStudent.name} • #${selectedStudent.rank} Overall`
            : undefined
        }
        onClose={() => setSelectedStudent(null)}
      >
        {selectedStudent && (
          <View style={{ gap: 16, paddingBottom: 24 }}>
            <View style={styles.studentDetailHeader}>
              <View style={styles.studentDetailAvatarWrap}>
                {getUserProfileImageUrl(selectedStudent) ? (
                  <Image
                    source={{ uri: getUserProfileImageUrl(selectedStudent)! }}
                    style={styles.studentDetailAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.studentDetailAvatar, styles.studentAvatarPlaceholder]}>
                    <Text style={[styles.studentAvatarPlaceholderText, { fontSize: 20 }]}>
                      {selectedStudent.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.studentDetailRankBadge, { backgroundColor: getRankBadgeColor(selectedStudent.rank).bg }]}>
                  <Text style={[styles.studentDetailRankText, { color: getRankBadgeColor(selectedStudent.rank).text }]}>
                    #{selectedStudent.rank}
                  </Text>
                </View>
              </View>

              <View style={styles.studentDetailMainInfo}>
                <Text style={styles.studentDetailName}>{selectedStudent.name}</Text>
                <Text style={styles.studentDetailEmail}>{selectedStudent.email}</Text>
                <Text style={styles.studentDetailSub}>
                  {selectedStudent.branch} • {selectedStudent.batchName}
                </Text>
              </View>
            </View>

            {/* Total Points Big Display */}
            <View style={styles.totalPointsHero}>
              <Text style={styles.totalPointsHeroLabel}>TOTAL SCORE</Text>
              <Text style={styles.totalPointsHeroValue}>{selectedStudent.totalPoints} PTS</Text>
            </View>

            {/* Points Breakdown Grid */}
            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownCard}>
                <View style={[styles.breakdownIcon, { backgroundColor: "#EEF2FF" }]}>
                  <QrCode size={16} color="#4F46E5" />
                </View>
                <Text style={styles.breakdownPoints}>{selectedStudent.attendancePoints} pts</Text>
                <Text style={styles.breakdownLabel}>Attendance ({selectedStudent.sessionsAttended} sessions)</Text>
              </View>

              <View style={styles.breakdownCard}>
                <View style={[styles.breakdownIcon, { backgroundColor: "#ECFDF5" }]}>
                  <ListChecks size={16} color="#059669" />
                </View>
                <Text style={styles.breakdownPoints}>{selectedStudent.taskPoints} pts</Text>
                <Text style={styles.breakdownLabel}>Tasks ({selectedStudent.tasksCompleted} completed)</Text>
              </View>

              <View style={styles.breakdownCard}>
                <View style={[styles.breakdownIcon, { backgroundColor: "#FFFBEB" }]}>
                  <Award size={16} color="#D97706" />
                </View>
                <Text style={styles.breakdownPoints}>{selectedStudent.eventPoints} pts</Text>
                <Text style={styles.breakdownLabel}>Events ({selectedStudent.eventsParticipated} joined)</Text>
              </View>

              <View style={styles.breakdownCard}>
                <View style={[styles.breakdownIcon, { backgroundColor: "#FDF2F8" }]}>
                  <Brain size={16} color="#DB2777" />
                </View>
                <Text style={styles.breakdownPoints}>{selectedStudent.quizPoints} pts</Text>
                <Text style={styles.breakdownLabel}>Quizzes ({selectedStudent.quizzesTaken} taken)</Text>
              </View>
            </View>
          </View>
        )}
      </AppBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  filterTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  timeframeSegment: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
  },
  timeframeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
  },
  timeframeBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  timeframeBtnTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  batchChipsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  batchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  batchChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  batchChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  batchChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  batchChipCodeBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  batchChipCodeBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  batchChipCodeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  batchChipCodeTextActive: {
    color: "#FFFFFF",
  },
  batchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  batchSelectorBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  batchSelectorBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  monthSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    gap: 4,
  },
  monthNavBtn: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    gap: 16,
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
    fontWeight: "500",
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  podiumCol: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  podiumColFirst: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
    paddingVertical: 18,
    shadowColor: "#F59E0B",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  podiumColSecond: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  podiumColThird: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  podiumColPlaceholder: {
    flex: 1,
  },
  crownIconWrap: {
    marginBottom: 4,
  },
  podiumAvatarWrap: {
    position: "relative",
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  podiumAvatarFirst: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: "#F59E0B",
  },
  podiumAvatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  podiumAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  podiumRankBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  podiumRankText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  podiumName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    maxWidth: "100%",
  },
  podiumNameFirst: {
    fontSize: 14,
    color: "#92400E",
  },
  podiumBranch: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
    textAlign: "center",
  },
  podiumPointsBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  podiumPointsBadgeFirst: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
  },
  podiumPointsText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  podiumPointsTextFirst: {
    color: "#B45309",
    fontWeight: "800",
  },
  rosterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: 10,
  },
  rosterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rosterHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  rosterHeaderCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  rosterList: {
    gap: 8,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  studentRowTopThree: {
    backgroundColor: "#FFFFFF",
  },
  rankPill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rankPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  studentAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  studentAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  studentAvatarPlaceholderText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  studentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  studentBranch: {
    fontSize: 11,
    color: "#64748B",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D97706",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  studentDetailCard: {
    paddingHorizontal: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  batchOptionsList: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  batchOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  batchOptionItemSelected: {
    backgroundColor: "#EEF2FF",
  },
  batchOptionInfo: {
    flex: 1,
  },
  batchOptionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  batchOptionNameSelected: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  batchOptionCode: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  studentDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 6,
  },
  studentDetailAvatarWrap: {
    position: "relative",
  },
  studentDetailAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  studentDetailRankBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  studentDetailRankText: {
    fontSize: 10,
    fontWeight: "800",
  },
  studentDetailMainInfo: {
    flex: 1,
  },
  studentDetailName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  studentDetailEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  studentDetailSub: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
    marginTop: 2,
  },
  totalPointsHero: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalPointsHeroLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 1,
  },
  totalPointsHeroValue: {
    fontSize: 24,
    color: "#F59E0B",
    fontWeight: "900",
    marginTop: 2,
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  breakdownCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 4,
  },
  breakdownIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  breakdownPoints: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  breakdownLabel: {
    fontSize: 11,
    color: "#64748B",
  },
});
