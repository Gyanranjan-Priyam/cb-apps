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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Layers, Users, Calendar, Plus, Trash2, X, ChevronRight } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { AdminTopBar } from "@/components/admin/admin-header";
import { AppBottomSheet } from "@/components/ui/app-bottom-sheet";
import { fetchAdminData, mutateAdminData, RealBatch } from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function AdminBatchesScreen() {
  const router = useRouter();
  const [batches, setBatches] = useState<RealBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Batch Bottom Sheet
  const addBatchSheetRef = useRef<BottomSheetModal>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [admissionYear, setAdmissionYear] = useState("2024");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadBatches = useCallback(async () => {
    const data = await fetchAdminData<RealBatch[]>("batches");
    if (data) {
      setBatches(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Realtime subscription for live batches updates
  useSupabaseRealtime({
    channel: "admin-batches",
    event: "batch_change",
    onUpdate: () => {
      loadBatches();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const handleAddBatch = async () => {
    if (!name.trim() || !code.trim()) {
      Alert.alert("Required Fields", "Please enter both Batch Name and Code.");
      return;
    }

    setSubmitting(true);
    const res = await mutateAdminData("add-batch", {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      admissionYear: admissionYear.trim(),
      description: description.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      addBatchSheetRef.current?.dismiss();
      setName("");
      setCode("");
      setDescription("");
      loadBatches();
      Alert.alert("Success", "Batch created successfully.");
    } else {
      Alert.alert("Error", res.error || "Failed to create batch.");
    }
  };

  const handleDeleteBatch = (batch: RealBatch) => {
    Alert.alert(
      "Delete Batch",
      `Are you sure you want to delete ${batch.name} (${batch.code})? Members in this batch will be unassigned.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await mutateAdminData("delete-batch", { id: batch.id });
            if (res.success) {
              setBatches((prev) => prev.filter((b) => b.id !== batch.id));
            } else {
              Alert.alert("Error", res.error || "Failed to delete batch.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header with Back, Centered Title, and Circular Add Batch Action */}
      <AdminTopBar
        title="Batches Management"
        subtitle={`${batches.length} cohorts in database`}
        rightAction={
          <TouchableOpacity
            onPress={() => addBatchSheetRef.current?.present()}
            style={styles.circleAddBtn}
            activeOpacity={0.7}
            accessibilityLabel="Create New Batch"
          >
            <Plus size={20} color="#0F172A" />
          </TouchableOpacity>
        }
      />

      {/* Batches List */}
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
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching cohorts from database...</Text>
          </View>
        ) : batches.length === 0 ? (
          <View style={styles.emptyBox}>
            <Layers size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Batches Configured</Text>
            <Text style={styles.emptyText}>Tap the + button on top to create your first batch.</Text>
          </View>
        ) : (
          <View style={styles.batchList}>
            {batches.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                style={styles.batchCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/batches/detail",
                    params: { id: batch.id },
                  })
                }
              >
                <View style={styles.batchHeader}>
                  <View style={styles.batchIcon}>
                    <Layers size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.batchInfo}>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <Text style={styles.batchCode}>{batch.code}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteBatch(batch);
                    }}
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                    accessibilityLabel="Delete batch"
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                <View style={styles.batchMeta}>
                  <View style={styles.metaItem}>
                    <Users size={14} color="#64748B" />
                    <Text style={styles.metaText}>
                      <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                        {batch.membersCount}
                      </Text>{" "}
                      Enrolled
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color="#64748B" />
                    <Text style={styles.metaText}>{batch.admissionYear || "2024"}</Text>
                  </View>
                  <View style={[styles.metaItem, { marginLeft: "auto" }]}>
                    <Text style={styles.viewMembersLink}>View Members</Text>
                    <ChevronRight size={14} color="#4F46E5" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Batch Bottom Sheet */}
      <AppBottomSheet
        ref={addBatchSheetRef}
        snapPoints={["65%"]}
        title="Create New Batch"
        subtitle="Add a new student cohort to Codebreakers"
      >
        <View style={{ gap: 16 }}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Batch Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Batch 2024 - 2028 (CS/IT)"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Batch Code *</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="e.g. B28-CS"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Admission Year</Text>
            <TextInput
              value={admissionYear}
              onChangeText={setAdmissionYear}
              placeholder="e.g. 2024"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            onPress={handleAddBatch}
            disabled={submitting}
            style={styles.submitBtn}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Create Batch</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
    gap: 18,
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
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  batchList: {
    gap: 12,
  },
  batchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 14,
  },
  batchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  batchIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  batchCode: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "700",
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  batchMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
  },
  viewMembersLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  // Modal Common Styles
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
    gap: 16,
    paddingBottom: 36,
    maxHeight: "85%",
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
