import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  X,
  Check,
  UserPlus,
  Users,
  CheckCircle2,
} from "lucide-react-native";
import {
  fetchAdminData,
  mutateAdminData,
  RealUnassignedMember,
  RealBatchDetail,
} from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function EnrollMembersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    batchId: string;
    batchName?: string;
    batchCode?: string;
  }>();

  const batchId = params.batchId;
  const [batchInfo, setBatchInfo] = useState<{ name: string; code: string }>({
    name: params.batchName || "Batch",
    code: params.batchCode || "",
  });

  const [unassignedMembers, setUnassignedMembers] = useState<RealUnassignedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load batch metadata if not provided
  const loadBatchMeta = useCallback(async () => {
    if (!batchId) return;
    if (!params.batchName) {
      const data = await fetchAdminData<RealBatchDetail>("batch-detail", { id: batchId });
      if (data) {
        setBatchInfo({ name: data.name, code: data.code });
      }
    }
  }, [batchId, params.batchName]);

  // Load unassigned members from API
  const loadUnassignedMembers = useCallback(async () => {
    const data = await fetchAdminData<RealUnassignedMember[]>("unassigned-members");
    if (data) {
      setUnassignedMembers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBatchMeta();
    loadUnassignedMembers();
  }, [loadBatchMeta, loadUnassignedMembers]);

  // Realtime subscription for member or batch changes
  useSupabaseRealtime({
    channel: "admin-members",
    event: "member_change",
    onUpdate: () => {
      loadUnassignedMembers();
    },
  });

  useSupabaseRealtime({
    channel: "admin-batches",
    event: "batch_change",
    onUpdate: () => {
      loadUnassignedMembers();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUnassignedMembers();
    setRefreshing(false);
  };

  // Filter unassigned members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return unassignedMembers;
    const q = searchQuery.toLowerCase().trim();
    return unassignedMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.rollNumber && m.rollNumber.toLowerCase().includes(q)) ||
        (m.branch && m.branch.toLowerCase().includes(q))
    );
  }, [unassignedMembers, searchQuery]);

  const filteredIds = useMemo(() => filteredMembers.map((m) => m.id), [filteredMembers]);

  const isAllFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedUserIds.includes(id));

  // Toggle single member selection
  const toggleMemberSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Select all or deselect all
  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Submit enrollment
  const handleEnrollSelected = async () => {
    if (!batchId || selectedUserIds.length === 0) {
      Alert.alert("Select Students", "Please select at least one student to enroll.");
      return;
    }

    setSubmitting(true);
    const res = await mutateAdminData("assign-members-to-batch", {
      batchId,
      userIds: selectedUserIds,
    });
    setSubmitting(false);

    if (res.success) {
      Alert.alert(
        "Enrolled Successfully",
        `Added ${selectedUserIds.length} student${selectedUserIds.length > 1 ? "s" : ""} to ${batchInfo.name}.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      Alert.alert("Error", res.error || "Failed to assign students to batch.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* 1. Header with Circular Back Button and Centered Title */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.circleNavBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back to Batch Details"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <Text style={styles.pageTitle} numberOfLines={1}>
            Enroll Students
          </Text>
          <Text style={styles.pageSubtitle} numberOfLines={1}>
            Into {batchInfo.name} {batchInfo.code ? `(${batchInfo.code})` : ""}
          </Text>
        </View>

        {/* Balance spacer for centered title */}
        <View style={{ width: 42 }} />
      </View>

      {/* 2. Controls Row: Search & Selection Stats */}
      <View style={styles.controlsSection}>
        {/* Search Bar */}
        <View style={styles.searchBarBox}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search students by name, email, roll..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Selection Summary & Select All Toggle */}
        <View style={styles.selectionMetaRow}>
          <View style={styles.selectedCountBadge}>
            <Text style={styles.selectedCountText}>
              <Text style={{ fontWeight: "800", color: "#4F46E5" }}>
                {selectedUserIds.length}
              </Text>{" "}
              of {filteredMembers.length} selected
            </Text>
          </View>

          {filteredMembers.length > 0 && (
            <TouchableOpacity
              style={[
                styles.selectAllBtn,
                isAllFilteredSelected && styles.selectAllBtnActive,
              ]}
              onPress={toggleSelectAll}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectAllBtnText,
                  isAllFilteredSelected && styles.selectAllBtnTextActive,
                ]}
              >
                {isAllFilteredSelected ? "Deselect All" : "Select All Visible"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. Students List */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (insets.bottom || 16) + 80 },
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
            <Text style={styles.loadingText}>Fetching unassigned members...</Text>
          </View>
        ) : filteredMembers.length === 0 ? (
          <View style={styles.emptyBox}>
            <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No Matching Students" : "All Students Assigned"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "No unassigned students match your filter query."
                : "There are currently no unassigned students without a batch."}
            </Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {filteredMembers.map((member) => {
              const isSelected = selectedUserIds.includes(member.id);
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberCardRow,
                    isSelected && styles.memberCardRowSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => toggleMemberSelection(member.id)}
                >
                  {/* Custom Checkbox */}
                  <View
                    style={[
                      styles.checkboxCircle,
                      isSelected && styles.checkboxCircleSelected,
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>

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
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 4. Sticky Bottom Action CTA Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 14) + 6 },
        ]}
      >
        <TouchableOpacity
          onPress={handleEnrollSelected}
          disabled={submitting || selectedUserIds.length === 0}
          style={[
            styles.enrollSubmitBtn,
            selectedUserIds.length === 0 && styles.enrollSubmitBtnDisabled,
            submitting && { opacity: 0.7 },
          ]}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <UserPlus size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.enrollSubmitBtnText}>
                Enroll Selected ({selectedUserIds.length}) Students
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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

  controlsSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
  },
  searchBarBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    gap: 10,
  },
  searchBarInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
  },
  selectionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  selectedCountBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  selectedCountText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  selectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectAllBtnActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  selectAllBtnText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  selectAllBtnTextActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
    gap: 12,
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
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  membersList: {
    gap: 10,
  },
  memberCardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  memberCardRowSelected: {
    borderColor: "#818CF8",
    backgroundColor: "#F5F7FF",
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxCircleSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
  },
  memberCardInfo: {
    flex: 1,
    gap: 2,
  },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  memberCardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  memberRoleBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberRoleText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  memberCardEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  memberCardMeta: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  enrollSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  enrollSubmitBtnDisabled: {
    opacity: 0.5,
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
  },
  enrollSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
