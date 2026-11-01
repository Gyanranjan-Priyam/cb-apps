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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  FileText,
  Users,
  Clock,
  MoreVertical,
  Copy,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X,
  Radio,
  EyeOff,
  Eye,
} from "lucide-react-native";
import { AdminTopBar } from "@/components/admin/admin-header";
import { AppBottomSheet } from "@/components/ui/app-bottom-sheet";
import { fetchAdminData, mutateAdminData, RealForm } from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function AdminFormsScreen() {
  const router = useRouter();
  const [forms, setForms] = useState<RealForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Action Menu Bottom Sheet State
  const actionSheetRef = useRef<BottomSheetModal>(null);
  const [selectedForm, setSelectedForm] = useState<RealForm | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Live direct database fetch (no offline caching)
  const loadForms = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    const data = await fetchAdminData<RealForm[]>("forms", undefined, { forceFresh: true });
    if (data && Array.isArray(data)) {
      setForms(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  // Realtime updates for live forms
  useSupabaseRealtime({
    channel: "admin-forms",
    event: "form_change",
    onUpdate: () => {
      loadForms(true);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadForms(true);
    setRefreshing(false);
  };

  const openActionMenu = (form: RealForm) => {
    setSelectedForm(form);
    actionSheetRef.current?.present();
  };

  const closeActionMenu = () => {
    actionSheetRef.current?.dismiss();
  };

  // 1. Copy URL
  const handleCopyUrl = async () => {
    if (!selectedForm) return;
    const formUrl = `https://forms.cbgcek.dev/${selectedForm.formId}`;
    try {
      await Clipboard.setStringAsync(formUrl);
      closeActionMenu();
      showToast("Form link copied to clipboard!");
    } catch {
      closeActionMenu();
      Alert.alert("Form Link", formUrl);
    }
  };

  // 2. Toggle Publish / Unpublish
  const handleTogglePublish = async () => {
    if (!selectedForm) return;
    const nextState = !selectedForm.isPublished;
    setActionLoading(true);
    const res = await mutateAdminData("toggle-form-publish", {
      id: selectedForm.id,
      isPublished: nextState,
    });
    setActionLoading(false);
    closeActionMenu();

    if (res.success) {
      setForms((prev) =>
        prev.map((f) => (f.id === selectedForm.id ? { ...f, isPublished: nextState } : f))
      );
      showToast(nextState ? "Form published successfully!" : "Form unpublished to draft!");
    } else {
      Alert.alert("Error", res.error || "Failed to update publish status");
    }
  };

  // 3. Toggle Stop / Resume Collecting
  const handleToggleAccepting = async () => {
    if (!selectedForm) return;
    const nextState = !selectedForm.acceptingResponses;
    setActionLoading(true);
    const res = await mutateAdminData("toggle-form-accepting", {
      id: selectedForm.id,
      acceptingResponses: nextState,
    });
    setActionLoading(false);
    closeActionMenu();

    if (res.success) {
      setForms((prev) =>
        prev.map((f) =>
          f.id === selectedForm.id
            ? { ...f, acceptingResponses: nextState, status: nextState ? "Accepting Responses" : "Closed" }
            : f
        )
      );
      showToast(nextState ? "Form is now accepting responses!" : "Form response collection stopped!");
    } else {
      Alert.alert("Error", res.error || "Failed to toggle response collection");
    }
  };

  // 4. Delete Form
  const handleDeleteForm = () => {
    if (!selectedForm) return;
    const target = selectedForm;
    closeActionMenu();

    Alert.alert(
      "Delete Form",
      `Are you sure you want to delete "${target.title}"? All submitted responses will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await mutateAdminData("delete-form", { id: target.id });
            if (res.success) {
              setForms((prev) => prev.filter((f) => f.id !== target.id));
              showToast("Form deleted successfully.");
            } else {
              Alert.alert("Error", res.error || "Failed to delete form.");
            }
          },
        },
      ]
    );
  };

  // Navigate to Form Responses Detailed View
  const handleCardPress = (form: RealForm) => {
    router.push({
      pathname: "/(admin)/forms/responses",
      params: {
        id: form.id,
        formId: form.formId,
        title: form.title,
      },
    });
  };

  const filteredForms = forms.filter((f) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      f.title.toLowerCase().includes(query) ||
      f.formId.toLowerCase().includes(query) ||
      (f.description && f.description.toLowerCase().includes(query))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <AdminTopBar
        title="Forms & Responses"
        subtitle={`${forms.length} live forms`}
      />

      {/* Floating Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search forms by title or ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
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
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching live forms from server...</Text>
          </View>
        ) : filteredForms.length === 0 ? (
          <View style={styles.emptyBox}>
            <FileText size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matching forms found" : "No forms created yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try searching with a different term"
                : "Forms can be created and designed via the CodeBreakers Web Portal."}
            </Text>
          </View>
        ) : (
          <View style={styles.formsList}>
            {filteredForms.map((form) => {
              const isPub = form.isPublished;
              const isAccepting = form.acceptingResponses;

              return (
                <TouchableOpacity
                  key={form.id}
                  style={styles.formCard}
                  activeOpacity={0.7}
                  onPress={() => handleCardPress(form)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconWrapper}>
                      <FileText size={20} color="#4F46E5" />
                    </View>

                    <View style={styles.titleWrapper}>
                      <View style={styles.titleRow}>
                        <Text style={styles.formTitle} numberOfLines={1}>
                          {form.title}
                        </Text>
                      </View>
                      <Text style={styles.formIdCode}>ID: {form.formId}</Text>
                    </View>

                    {/* 3-Dot Action Button */}
                    <TouchableOpacity
                      style={styles.threeDotBtn}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      onPress={(e) => {
                        e.stopPropagation();
                        openActionMenu(form);
                      }}
                    >
                      <MoreVertical size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {form.description ? (
                    <Text style={styles.formDesc} numberOfLines={2}>
                      {form.description}
                    </Text>
                  ) : null}

                  {/* Badges Row */}
                  <View style={styles.badgeRow}>
                    {/* Published / Draft Pill */}
                    <View
                      style={[
                        styles.statusPill,
                        isPub ? styles.pillPublished : styles.pillDraft,
                      ]}
                    >
                      <View
                        style={[
                          styles.dot,
                          isPub ? styles.dotPublished : styles.dotDraft,
                        ]}
                      />
                      <Text
                        style={[
                          styles.pillText,
                          isPub ? styles.textPublished : styles.textDraft,
                        ]}
                      >
                        {isPub ? "Published" : "Draft"}
                      </Text>
                    </View>

                    {/* Collecting / Closed Pill */}
                    <View
                      style={[
                        styles.statusPill,
                        isAccepting ? styles.pillAccepting : styles.pillClosed,
                      ]}
                    >
                      <Radio
                        size={11}
                        color={isAccepting ? "#0284C7" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.pillText,
                          isAccepting ? styles.textAccepting : styles.textClosed,
                        ]}
                      >
                        {isAccepting ? "Accepting" : "Closed"}
                      </Text>
                    </View>

                    {/* Responses Count Pill */}
                    <View style={[styles.statusPill, styles.pillResponses]}>
                      <Users size={12} color="#4F46E5" />
                      <Text style={styles.textResponses}>
                        {form.responsesCount}{" "}
                        {form.responsesCount === 1 ? "Response" : "Responses"}
                      </Text>
                    </View>
                  </View>

                  {/* Card Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.metaItem}>
                      <Clock size={13} color="#94A3B8" />
                      <Text style={styles.metaText}>Created {form.createdAt}</Text>
                    </View>

                    <View style={styles.viewResponsesAction}>
                      <Text style={styles.viewResponsesText}>View responses</Text>
                      <ChevronRight size={14} color="#4F46E5" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 3-Dots Action Bottom Sheet */}
      <AppBottomSheet
        ref={actionSheetRef}
        snapPoints={["55%"]}
        title={selectedForm?.title || "Form Actions"}
        subtitle={selectedForm?.formId || "Manage Form"}
        onClose={() => setSelectedForm(null)}
      >
        {actionLoading ? (
          <View style={styles.sheetLoading}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.sheetLoadingText}>Updating form...</Text>
          </View>
        ) : (
          <View style={styles.sheetActionsList}>
            {/* 1. Copy URL */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={handleCopyUrl}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#EEF2FF" }]}>
                <Copy size={18} color="#4F46E5" />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemLabel}>Copy URL</Text>
                <Text style={styles.actionItemDesc}>
                  Copy public form link to share with participants
                </Text>
              </View>
            </TouchableOpacity>

            {/* 2. Publish / Unpublish */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={handleTogglePublish}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconBox,
                  {
                    backgroundColor: selectedForm?.isPublished ? "#FEF3C7" : "#ECFDF5",
                  },
                ]}
              >
                {selectedForm?.isPublished ? (
                  <EyeOff size={18} color="#D97706" />
                ) : (
                  <Eye size={18} color="#059669" />
                )}
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemLabel}>
                  {selectedForm?.isPublished ? "Unpublish Form" : "Publish Form"}
                </Text>
                <Text style={styles.actionItemDesc}>
                  {selectedForm?.isPublished
                    ? "Revert form to draft mode"
                    : "Make form live and available publicly"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Stop Collecting / Resume Collecting */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={handleToggleAccepting}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconBox,
                  {
                    backgroundColor: selectedForm?.acceptingResponses
                      ? "#FEE2E2"
                      : "#E0F2FE",
                  },
                ]}
              >
                {selectedForm?.acceptingResponses ? (
                  <ToggleLeft size={18} color="#DC2626" />
                ) : (
                  <ToggleRight size={18} color="#0284C7" />
                )}
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemLabel}>
                  {selectedForm?.acceptingResponses
                    ? "Stop Collecting"
                    : "Resume Collecting"}
                </Text>
                <Text style={styles.actionItemDesc}>
                  {selectedForm?.acceptingResponses
                    ? "Close form submissions immediately"
                    : "Allow participants to submit responses"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 4. Delete Form */}
            <TouchableOpacity
              style={[styles.sheetActionItem, styles.sheetActionItemDestructive]}
              onPress={handleDeleteForm}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#FEE2E2" }]}>
                <Trash2 size={18} color="#DC2626" />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={[styles.actionItemLabel, { color: "#DC2626" }]}>
                  Delete Form
                </Text>
                <Text style={styles.actionItemDesc}>
                  Permanently delete form and all its responses
                </Text>
              </View>
            </TouchableOpacity>
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
  toastContainer: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    height: "100%",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
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
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  formsList: {
    gap: 14,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrapper: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  formIdCode: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  threeDotBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  formDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pillPublished: {
    backgroundColor: "#ECFDF5",
  },
  pillDraft: {
    backgroundColor: "#FEF3C7",
  },
  pillAccepting: {
    backgroundColor: "#E0F2FE",
  },
  pillClosed: {
    backgroundColor: "#F1F5F9",
  },
  pillResponses: {
    backgroundColor: "#EEF2FF",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPublished: {
    backgroundColor: "#10B981",
  },
  dotDraft: {
    backgroundColor: "#F59E0B",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  textPublished: {
    color: "#059669",
  },
  textDraft: {
    color: "#D97706",
  },
  textAccepting: {
    color: "#0284C7",
  },
  textClosed: {
    color: "#64748B",
  },
  textResponses: {
    color: "#4F46E5",
    fontSize: 11,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  viewResponsesAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewResponsesText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 14,
  },
  sheetHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetLoading: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  sheetLoadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  sheetActionsList: {
    gap: 10,
  },
  sheetActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  sheetActionItemDestructive: {
    backgroundColor: "#FEF2F2",
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionItemContent: {
    flex: 1,
    gap: 2,
  },
  actionItemLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionItemDesc: {
    fontSize: 11,
    color: "#64748B",
  },
});
