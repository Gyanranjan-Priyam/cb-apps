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
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ListChecks, Calendar, CheckSquare, Plus, Trash2, X } from "lucide-react-native";
import { AdminTopBar } from "@/components/admin/admin-header";
import { AppBottomSheet } from "@/components/ui/app-bottom-sheet";
import { fetchAdminData, mutateAdminData, RealTask } from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function AdminTasksScreen() {
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bottom Sheet Ref
  const addTaskSheetRef = useRef<BottomSheetModal>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("100");
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = useCallback(async () => {
    const data = await fetchAdminData<RealTask[]>("tasks");
    if (data) {
      setTasks(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Realtime updates for tasks
  useSupabaseRealtime({
    channel: "admin-tasks",
    event: "task_change",
    onUpdate: () => {
      loadTasks();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleAddTask = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter task title.");
      return;
    }

    setSubmitting(true);
    const res = await mutateAdminData("add-task", {
      title: title.trim(),
      description: description.trim(),
      points: points.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      addTaskSheetRef.current?.dismiss();
      setTitle("");
      setDescription("");
      loadTasks();
      Alert.alert("Success", "Task created successfully.");
    } else {
      Alert.alert("Error", res.error || "Failed to create task.");
    }
  };

  const handleDeleteTask = (task: RealTask) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await mutateAdminData("delete-task", { id: task.id });
            if (res.success) {
              setTasks((prev) => prev.filter((t) => t.id !== task.id));
            } else {
              Alert.alert("Error", res.error || "Failed to delete task.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header with Back, Inline Title, and Create Task Action */}
      <AdminTopBar
        title="Tasks & Assignments"
        subtitle={`${tasks.length} active assignments`}
        rightAction={
          <TouchableOpacity
            onPress={() => addTaskSheetRef.current?.present()}
            style={styles.circleAddBtn}
            activeOpacity={0.7}
            accessibilityLabel="Create New Task"
          >
            <Plus size={20} color="#0F172A" />
          </TouchableOpacity>
        }
      />

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
            <Text style={styles.loadingText}>Fetching database tasks...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No tasks created in database yet.</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskIcon}>
                    <ListChecks size={20} color="#0D9488" />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskCategory}>Task #{task.taskNumber}</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>{task.points}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                <View style={styles.taskMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color="#64748B" />
                    <Text style={styles.metaText}>Due: {task.dueDate}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <CheckSquare size={14} color="#64748B" />
                    <Text style={styles.metaText}>{task.submissionsCount} submissions</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Task Bottom Sheet */}
      <AppBottomSheet
        ref={addTaskSheetRef}
        snapPoints={["65%"]}
        title="Create New Task"
        subtitle="Create coding assignment for members"
      >
        <View style={{ gap: 16 }}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Build a Responsive Web Application"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Task requirements and submission instructions"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Reward Points</Text>
            <TextInput
              value={points}
              onChangeText={setPoints}
              placeholder="100"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            onPress={handleAddTask}
            disabled={submitting}
            style={styles.submitBtn}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Create Task</Text>
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
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  taskCategory: {
    fontSize: 12,
    color: "#0D9488",
    fontWeight: "600",
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: "#F0FDFA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  pointsText: {
    color: "#0D9488",
    fontSize: 11,
    fontWeight: "700",
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  taskMeta: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
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
