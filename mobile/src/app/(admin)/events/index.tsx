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
import { Calendar, Clock, Users, Plus, Trash2, X } from "lucide-react-native";
import { AdminTopBar } from "@/components/admin/admin-header";
import { AppBottomSheet } from "@/components/ui/app-bottom-sheet";
import { fetchAdminData, mutateAdminData, RealEvent } from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function AdminEventsScreen() {
  const [events, setEvents] = useState<RealEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bottom Sheet Ref
  const addEventSheetRef = useRef<BottomSheetModal>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("50");
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = useCallback(async () => {
    const data = await fetchAdminData<RealEvent[]>("events");
    if (data) {
      setEvents(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Realtime updates for live events
  useSupabaseRealtime({
    channel: "admin-events",
    event: "event_change",
    onUpdate: () => {
      loadEvents();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleAddEvent = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter event title.");
      return;
    }

    setSubmitting(true);
    const res = await mutateAdminData("add-event", {
      title: title.trim(),
      description: description.trim(),
      points: points.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      addEventSheetRef.current?.dismiss();
      setTitle("");
      setDescription("");
      loadEvents();
      Alert.alert("Success", "Event created successfully.");
    } else {
      Alert.alert("Error", res.error || "Failed to create event.");
    }
  };

  const handleDeleteEvent = (evt: RealEvent) => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${evt.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await mutateAdminData("delete-event", { id: evt.id });
            if (res.success) {
              setEvents((prev) => prev.filter((e) => e.id !== evt.id));
            } else {
              Alert.alert("Error", res.error || "Failed to delete event.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header with Back, Inline Title, and Create Event Action */}
      <AdminTopBar
        title="Events & Workshops"
        subtitle={`${events.length} club sessions`}
        rightAction={
          <TouchableOpacity
            onPress={() => addEventSheetRef.current?.present()}
            style={styles.circleAddBtn}
            activeOpacity={0.7}
            accessibilityLabel="Create New Event"
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
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching database events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No events recorded in database yet.</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((evt) => (
              <View key={evt.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventIcon}>
                    <Calendar size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{evt.title}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            evt.status === "Upcoming"
                              ? "#EFF6FF"
                              : "#ECFDF5",
                          borderColor:
                            evt.status === "Upcoming"
                              ? "#BFDBFE"
                              : "#A7F3D0",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              evt.status === "Upcoming"
                                ? "#2563EB"
                                : "#059669",
                          },
                        ]}
                      >
                        {evt.status}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteEvent(evt)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                <View style={styles.eventMeta}>
                  <View style={styles.metaRow}>
                    <Clock size={14} color="#64748B" />
                    <Text style={styles.metaText}>{evt.date}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Users size={14} color="#64748B" />
                    <Text style={styles.metaText}>{evt.attendeesCount} Registered Members</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Event Bottom Sheet */}
      <AppBottomSheet
        ref={addEventSheetRef}
        snapPoints={["65%"]}
        title="Create New Event"
        subtitle="Publish workshop or club session"
      >
        <View style={{ gap: 16 }}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. AI & Full-Stack Workshop"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Session details and venue information"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Participation Points</Text>
            <TextInput
              value={points}
              onChangeText={setPoints}
              placeholder="50"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            onPress={handleAddEvent}
            disabled={submitting}
            style={styles.submitBtn}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Publish Event</Text>
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
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 14,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flex: 1,
    gap: 6,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  eventMeta: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
