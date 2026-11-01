import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, ShieldCheck, Mail, Layers, Plus, ChevronRight } from "lucide-react-native";
import { AdminTopBar } from "@/components/admin/admin-header";
import { fetchAdminData, mutateAdminData, RealMember, RealBatch } from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/ui/app-bottom-sheet";

export default function AdminMembersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<RealMember[]>([]);
  const [batches, setBatches] = useState<RealBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Member Modal State
  const addMemberSheetRef = useRef<AppBottomSheetRef>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Member");
  const [newBranch, setNewBranch] = useState("CSE");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const openAddMemberModal = () => {
    setModalVisible(true);
    addMemberSheetRef.current?.present();
  };

  const loadData = useCallback(async () => {
    const [membersData, batchesData] = await Promise.all([
      fetchAdminData<RealMember[]>("members"),
      fetchAdminData<RealBatch[]>("batches"),
    ]);
    if (membersData) setMembers(membersData);
    if (batchesData) setBatches(batchesData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription for live database sync
  useSupabaseRealtime({
    channel: "admin-members",
    event: "member_change",
    onUpdate: () => {
      loadData();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddMember = async () => {
    if (!newEmail.trim()) {
      Alert.alert("Error", "Please enter member email address.");
      return;
    }

    setSubmitting(true);
    const res = await mutateAdminData("add-member", {
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      branch: newBranch,
      batchId: selectedBatchId || null,
    });
    setSubmitting(false);

    if (res.success) {
      setModalVisible(false);
      setNewName("");
      setNewEmail("");
      loadData();
      Alert.alert("Success", "Member added successfully.");
    } else {
      Alert.alert("Error", res.error || "Failed to add member.");
    }
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header with Back, Inline Title, and Add Member Action */}
      <AdminTopBar
        title="Members Directory"
        subtitle={`${members.length} registered members`}
        rightAction={
          <TouchableOpacity
            onPress={openAddMemberModal}
            style={styles.circleAddBtn}
            activeOpacity={0.7}
            accessibilityLabel="Add New Member"
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
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, email or role..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>

        {/* Members List */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching database members...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No members match your search criteria.</Text>
          </View>
        ) : (
          <View style={styles.memberList}>
            {filtered.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/members/profile",
                    params: { id: member.id },
                  })
                }
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                  <View style={styles.emailRow}>
                    <Mail size={12} color="#64748B" />
                    <Text style={styles.memberEmail} numberOfLines={1}>{member.email}</Text>
                  </View>
                  <View style={styles.tagsRow}>
                    <View style={styles.roleBadge}>
                      <ShieldCheck size={12} color="#4F46E5" />
                      <Text style={styles.roleText} numberOfLines={1}>{member.role}</Text>
                    </View>
                    {member.batch && (
                      <View style={styles.batchBadge}>
                        <Layers size={10} color="#64748B" />
                        <Text style={styles.batchBadgeText} numberOfLines={1}>{member.batch}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Clean Subtle Chevron Indicator */}
                <View style={styles.chevronWrapper}>
                  <ChevronRight size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Member Bottom Sheet */}
      <AppBottomSheet
        ref={addMemberSheetRef}
        snapPoints={["68%", "90%"]}
        title="Add New Member"
        subtitle="Create a new member profile"
        scrollable
        onClose={() => setModalVisible(false)}
      >
        <View style={{ gap: 16 }}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Gyanranjan Priyam"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="e.g. student@gcek.ac.in"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.rolePicker}>
              {["Member", "Co-Admin", "Admin", "Tech Lead"].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setNewRole(r)}
                  style={[
                    styles.roleChip,
                    newRole === r && styles.roleChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      newRole === r && styles.roleChipTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleAddMember}
            disabled={submitting}
            style={styles.submitBtn}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Save Member to Database</Text>
            )}
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 46,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
  },
  loadingBox: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  emptyBox: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  memberList: {
    gap: 12,
  },
  memberCard: {
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
    gap: 3,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 160,
  },
  roleText: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "600",
  },
  batchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 140,
  },
  batchBadgeText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  backdropDismiss: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  closeBtn: {
    padding: 4,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: "#0F172A",
  },
  rolePicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  roleChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  roleChipText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  roleChipTextActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
