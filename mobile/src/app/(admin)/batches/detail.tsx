import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Layers,
  UserMinus,
  UserCheck,
  UserPlus,
  GraduationCap,
  ChevronRight,
  User,
} from "lucide-react-native";
import { AppBottomSheet } from "@/components/ui/app-bottom-sheet";
import {
  fetchAdminData,
  mutateAdminData,
  RealBatchDetail,
  RealBatchMember,
} from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function BatchDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const batchId = params.id;

  const [batch, setBatch] = useState<RealBatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState("");

  // Member Action Bottom Sheet State
  const memberActionSheetRef = useRef<BottomSheetModal>(null);
  const [selectedMember, setSelectedMember] = useState<RealBatchMember | null>(null);

  // Load batch detail
  const loadBatchDetail = useCallback(async () => {
    if (!batchId) return;
    const data = await fetchAdminData<RealBatchDetail>("batch-detail", { id: batchId });
    if (data) {
      setBatch(data);
    }
    setLoading(false);
  }, [batchId]);

  useEffect(() => {
    loadBatchDetail();
  }, [loadBatchDetail]);

  // Realtime subscription for live batch changes
  useSupabaseRealtime({
    channel: "admin-batches",
    event: "batch_change",
    onUpdate: () => {
      loadBatchDetail();
    },
  });

  useSupabaseRealtime({
    channel: "admin-members",
    event: "member_change",
    onUpdate: () => {
      loadBatchDetail();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatchDetail();
    setRefreshing(false);
  };

  // Navigate to dedicated enroll members screen in batches folder
  const navigateToEnroll = () => {
    if (!batch) return;
    router.push({
      pathname: "/(admin)/batches/enroll",
      params: {
        batchId: batch.id,
        batchName: batch.name,
        batchCode: batch.code,
      },
    });
  };

  // Open member action modal
  const openMemberActionModal = (member: RealBatchMember) => {
    setSelectedMember(member);
    memberActionSheetRef.current?.present();
  };

  // View member full profile
  const handleViewProfile = (memberId: string) => {
    memberActionSheetRef.current?.dismiss();
    setTimeout(() => {
      router.push({
        pathname: "/(admin)/members/profile",
        params: { id: memberId },
      });
    }, 150);
  };

  // Remove a member from batch
  const handleRemoveMember = (member: RealBatchMember) => {
    Alert.alert(
      "Remove Student",
      `Are you sure you want to remove ${member.name} from ${batch?.name || "this batch"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            memberActionSheetRef.current?.dismiss();
            const res = await mutateAdminData("remove-member-from-batch", { userId: member.id });
            if (res.success) {
              loadBatchDetail();
            } else {
              Alert.alert("Error", res.error || "Failed to remove student.");
            }
          },
        },
      ]
    );
  };

  // Filter batch members
  const filteredBatchMembers = (batch?.members || []).filter((m) => {
    if (!searchMemberQuery.trim()) return true;
    const q = searchMemberQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.rollNumber && m.rollNumber.toLowerCase().includes(q)) ||
      (m.branch && m.branch.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* 1. Top Header with Back Button, Centered Title, and Circular + Action */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.circleNavBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back to Batches"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <Text style={styles.pageTitle} numberOfLines={1}>
            {batch?.name || "Batch Details"}
          </Text>
          <Text style={styles.pageSubtitle} numberOfLines={1}>
            {batch?.code || ""} • {batch?.members?.length || 0} Students
          </Text>
        </View>

        {/* Circular + Button to Navigate to Dedicated Enroll Page */}
        <TouchableOpacity
          onPress={navigateToEnroll}
          style={styles.circleAddBtn}
          activeOpacity={0.7}
          accessibilityLabel="Enroll Students in Batch"
        >
          <Plus size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* 2. Main Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (insets.bottom || 16) + 30 },
        ]}
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
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading batch students...</Text>
          </View>
        ) : !batch ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Batch Not Found</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn}>
              <Text style={styles.backLinkText}>Return to Batches</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Hero Metrics Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroIconBox}>
                  <Layers size={24} color="#4F46E5" />
                </View>
                <View style={styles.heroHeaderInfo}>
                  <Text style={styles.heroName}>{batch.name}</Text>
                  <View style={styles.heroBadgeRow}>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{batch.code}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>Active Cohort</Text>
                    </View>
                  </View>
                </View>
              </View>

              {batch.description ? (
                <Text style={styles.heroDesc}>{batch.description}</Text>
              ) : null}

              {/* Minimalist Stats Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricNumber, { color: "#4F46E5" }]}>
                    {batch.members.length}
                  </Text>
                  <Text style={styles.metricLabel}>Enrolled</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricCol}>
                  <Text style={styles.metricNumber}>{batch.admissionYear || "2024"}</Text>
                  <Text style={styles.metricLabel}>Admission Year</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricCol}>
                  <Text style={styles.metricNumber}>{batch.createdAt}</Text>
                  <Text style={styles.metricLabel}>Created</Text>
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarBox}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search enrolled students..."
                placeholderTextColor="#94A3B8"
                value={searchMemberQuery}
                onChangeText={setSearchMemberQuery}
                autoCapitalize="none"
              />
              {searchMemberQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchMemberQuery("")}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Enrolled Students</Text>
              <Text style={styles.sectionCountBadge}>
                {filteredBatchMembers.length} of {batch.members.length}
              </Text>
            </View>

            {filteredBatchMembers.length === 0 ? (
              <View style={styles.emptyDetailBox}>
                <GraduationCap size={44} color="#CBD5E1" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyDetailTitle}>
                  {searchMemberQuery ? "No Matching Students" : "No Students in this Batch"}
                </Text>
                <Text style={styles.emptyDetailSubtitle}>
                  {searchMemberQuery
                    ? "Try adjusting your search query."
                    : "Tap the + icon on top or button below to add unassigned students to this batch."}
                </Text>
                {!searchMemberQuery && (
                  <TouchableOpacity
                    style={styles.enrollCtaBtn}
                    activeOpacity={0.8}
                    onPress={navigateToEnroll}
                  >
                    <UserPlus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.enrollCtaBtnText}>Enroll Students Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.membersList}>
                {filteredBatchMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.memberCardRow}
                    activeOpacity={0.7}
                    onPress={() => openMemberActionModal(member)}
                  >
                    {/* Squircle Avatar */}
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                      </Text>
                    </View>

                    {/* Member Details */}
                    <View style={styles.memberCardInfo}>
                      <View style={styles.memberTitleRow}>
                        <Text style={styles.memberCardName} numberOfLines={1}>
                          {member.name}
                        </Text>
                        <View style={styles.memberRoleBadge}>
                          <Text style={styles.memberRoleText}>{member.role}</Text>
                        </View>
                      </View>
                      <Text style={styles.memberCardEmail} numberOfLines={1}>
                        {member.email}
                      </Text>
                      <Text style={styles.memberCardMeta}>
                        {member.branch || "General"}
                        {member.rollNumber ? ` • Roll: ${member.rollNumber}` : ""}
                      </Text>
                    </View>

                    {/* Chevron Indicator */}
                    <View style={styles.memberChevronBox}>
                      <ChevronRight size={18} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 3. Member Actions Bottom Sheet */}
      <AppBottomSheet
        ref={memberActionSheetRef}
        snapPoints={["45%"]}
        title={selectedMember?.name || "Student Options"}
        subtitle={
          selectedMember
            ? `${selectedMember.email} • ${selectedMember.branch || "General"}`
            : undefined
        }
      >
        <View style={styles.actionsList}>
          {/* 1. View Profile Action */}
          <TouchableOpacity
            style={styles.actionItemBtn}
            activeOpacity={0.7}
            onPress={() => selectedMember && handleViewProfile(selectedMember.id)}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#EEF2FF" }]}>
              <User size={18} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionItemTitle}>View Member Profile</Text>
              <Text style={styles.actionItemSub}>
                View academic info, attendance stats, and points
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 2. Remove from Batch Action */}
          <TouchableOpacity
            style={[styles.actionItemBtn, { borderColor: "#FEE2E2" }]}
            activeOpacity={0.7}
            onPress={() => selectedMember && handleRemoveMember(selectedMember)}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#FEF2F2" }]}>
              <UserMinus size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionItemTitle, { color: "#DC2626" }]}>
                Remove from Batch
              </Text>
              <Text style={styles.actionItemSub}>
                Unassign student so they can be added to another batch
              </Text>
            </View>
            <ChevronRight size={18} color="#F87171" />
          </TouchableOpacity>
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
  topNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  circleNavBtn: {
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
  titleWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  backLinkBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backLinkText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  codeBadgeText: {
    color: "#4F46E5",
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  statusBadgeText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
  },
  heroDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 12,
    alignItems: "center",
  },
  metricCol: {
    flex: 1,
    alignItems: "center",
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },

  // Search
  searchBarBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionCountBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  // Member Rows
  membersList: {
    gap: 10,
  },
  memberCardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: "#4F46E5",
    fontSize: 17,
    fontWeight: "800",
  },
  memberCardInfo: {
    flex: 1,
    gap: 2,
  },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberCardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flexShrink: 1,
  },
  memberRoleBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  memberRoleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  memberCardEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  memberCardMeta: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  memberChevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty Detail Box
  emptyDetailBox: {
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyDetailSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 17,
  },
  enrollCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  enrollCtaBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // Member Action Bottom Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  backdropDismiss: {
    flex: 1,
  },
  actionSheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  swipeHandleArea: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },
  actionSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalMemberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  modalMemberAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4F46E5",
  },
  actionSheetName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  actionSheetEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  actionSheetMeta: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  actionsList: {
    gap: 10,
    paddingTop: 4,
  },
  actionItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionItemSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
});
