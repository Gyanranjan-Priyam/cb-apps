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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronRight,
  CreditCard,
  X,
} from "lucide-react-native";
import {
  fetchAdminData,
  RealFormDetail,
  RealFormResponse,
} from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function FormResponsesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; formId?: string; title?: string }>();
  const formIdOrId = params.id || params.formId || "";

  const [formDetail, setFormDetail] = useState<RealFormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");

  // Live direct database fetch
  const loadFormDetail = useCallback(
    async (isSilent = false) => {
      if (!formIdOrId) return;
      if (!isSilent) setLoading(true);
      const data = await fetchAdminData<RealFormDetail>(
        "form-detail",
        { id: formIdOrId },
        { forceFresh: true }
      );
      if (data) {
        setFormDetail(data);
      }
      setLoading(false);
    },
    [formIdOrId]
  );

  useEffect(() => {
    loadFormDetail();
  }, [loadFormDetail]);

  // Realtime updates
  useSupabaseRealtime({
    channel: "admin-forms",
    event: "form_response_change",
    onUpdate: () => {
      loadFormDetail(true);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFormDetail(true);
    setRefreshing(false);
  };

  // Compute metrics
  const metrics = useMemo(() => {
    const responses = formDetail?.responses || [];
    const total = responses.length;
    let verified = 0;
    let pending = 0;
    let rejected = 0;

    for (const r of responses) {
      if (
        r.paymentStatus === "verified" ||
        r.paymentStatus === "completed" ||
        r.paymentStatus === "approved"
      ) {
        verified++;
      } else if (r.paymentStatus === "rejected") {
        rejected++;
      } else {
        pending++;
      }
    }

    return { total, verified, pending, rejected };
  }, [formDetail]);

  // Filtered responses
  const filteredResponses = useMemo(() => {
    if (!formDetail?.responses) return [];
    return formDetail.responses.filter((r) => {
      // Status filter
      if (statusFilter === "verified") {
        if (
          r.paymentStatus !== "verified" &&
          r.paymentStatus !== "completed" &&
          r.paymentStatus !== "approved"
        )
          return false;
      } else if (statusFilter === "pending") {
        if (
          r.paymentStatus === "verified" ||
          r.paymentStatus === "completed" ||
          r.paymentStatus === "approved" ||
          r.paymentStatus === "rejected"
        )
          return false;
      } else if (statusFilter === "rejected") {
        if (r.paymentStatus !== "rejected") return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = r.submittedBy?.name?.toLowerCase() || "";
      const email = r.submittedBy?.email?.toLowerCase() || "";
      const txn = r.transactionId?.toLowerCase() || "";
      const answersStr = JSON.stringify(r.answers).toLowerCase();

      return name.includes(q) || email.includes(q) || txn.includes(q) || answersStr.includes(q);
    });
  }, [formDetail, statusFilter, searchQuery]);

  // Navigate to detailed response screen on tap
  const handleOpenDetail = (response: RealFormResponse) => {
    router.push({
      pathname: "/(admin)/forms/response-detail",
      params: {
        id: response.id,
        formTitle: formDetail?.title || params.title || "Form Response",
      },
    });
  };

  // Helper to extract primary submitter name
  const getDisplaySubmitter = (response: RealFormResponse) => {
    if (response.submittedBy?.name) return response.submittedBy.name;
    const answers = response.answers || {};
    for (const [k, v] of Object.entries(answers)) {
      if (k.toLowerCase().includes("name") && typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
    return response.submittedBy?.email?.split("@")[0] || "Anonymous Participant";
  };

  const getDisplayEmail = (response: RealFormResponse) => {
    if (response.submittedBy?.email) return response.submittedBy.email;
    const answers = response.answers || {};
    for (const [k, v] of Object.entries(answers)) {
      if (
        typeof v === "string" &&
        (k.toLowerCase().includes("email") || (v.includes("@") && v.includes(".")))
      ) {
        return v.trim();
      }
    }
    return "No email provided";
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header with Rounded Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.roundedBackBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {formDetail?.title || params.title || "Form Responses"}
          </Text>
          <Text style={styles.headerSubtitle}>
            ID: {formDetail?.formId || params.formId || "..."}
          </Text>
        </View>
      </View>

      {/* Filter Tabs & Metrics Bar */}
      <View style={styles.filterSection}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search responses by name, email, or answers..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={15} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Chips - Rounded Pills */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabChip, statusFilter === "all" && styles.tabChipActive]}
            onPress={() => setStatusFilter("all")}
          >
            <Text
              style={[
                styles.tabChipText,
                statusFilter === "all" && styles.tabChipTextActive,
              ]}
            >
              All ({metrics.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, statusFilter === "pending" && styles.tabChipActive]}
            onPress={() => setStatusFilter("pending")}
          >
            <Text
              style={[
                styles.tabChipText,
                statusFilter === "pending" && styles.tabChipTextActive,
              ]}
            >
              Pending ({metrics.pending})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, statusFilter === "verified" && styles.tabChipActive]}
            onPress={() => setStatusFilter("verified")}
          >
            <Text
              style={[
                styles.tabChipText,
                statusFilter === "verified" && styles.tabChipTextActive,
              ]}
            >
              Approved ({metrics.verified})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, statusFilter === "rejected" && styles.tabChipActive]}
            onPress={() => setStatusFilter("rejected")}
          >
            <Text
              style={[
                styles.tabChipText,
                statusFilter === "rejected" && styles.tabChipTextActive,
              ]}
            >
              Rejected ({metrics.rejected})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Responses Scrollable List */}
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
            <Text style={styles.loadingText}>Loading submitted responses...</Text>
          </View>
        ) : filteredResponses.length === 0 ? (
          <View style={styles.emptyBox}>
            <FileText size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery || statusFilter !== "all"
                ? "No matching responses found"
                : "No responses submitted yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter !== "all"
                ? "Try clearing filters or search queries."
                : "Responses submitted by students will automatically appear here."}
            </Text>
          </View>
        ) : (
          <View style={styles.responsesList}>
            {filteredResponses.map((resItem) => {
              const submitterName = getDisplaySubmitter(resItem);
              const submitterEmail = getDisplayEmail(resItem);
              const isApproved =
                resItem.paymentStatus === "verified" ||
                resItem.paymentStatus === "completed" ||
                resItem.paymentStatus === "approved";
              const isRejected = resItem.paymentStatus === "rejected";

              const formattedDate = new Date(resItem.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <TouchableOpacity
                  key={resItem.id}
                  style={styles.responseCard}
                  activeOpacity={0.7}
                  onPress={() => handleOpenDetail(resItem)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>
                        {submitterName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {submitterName}
                      </Text>
                      <Text style={styles.userEmail} numberOfLines={1}>
                        {submitterEmail}
                      </Text>
                    </View>

                    {/* Rounded Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        isApproved
                          ? styles.badgeApproved
                          : isRejected
                          ? styles.badgeRejected
                          : styles.badgePending,
                      ]}
                    >
                      {isApproved ? (
                        <CheckCircle2 size={12} color="#059669" />
                      ) : isRejected ? (
                        <XCircle size={12} color="#DC2626" />
                      ) : (
                        <Clock size={12} color="#D97706" />
                      )}
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isApproved
                            ? styles.badgeApprovedText
                            : isRejected
                            ? styles.badgeRejectedText
                            : styles.badgePendingText,
                        ]}
                      >
                        {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                      </Text>
                    </View>
                  </View>

                  {/* Transaction ID if present */}
                  {resItem.transactionId ? (
                    <View style={styles.txnRow}>
                      <CreditCard size={12} color="#0284C7" />
                      <Text style={styles.txnText}>Txn: {resItem.transactionId}</Text>
                    </View>
                  ) : null}

                  {/* Files badge if present */}
                  {resItem.files && resItem.files.length > 0 ? (
                    <View style={styles.filesRow}>
                      <FileText size={12} color="#4F46E5" />
                      <Text style={styles.filesText}>
                        {resItem.files.length} attached{" "}
                        {resItem.files.length === 1 ? "file" : "files"}
                      </Text>
                    </View>
                  ) : null}

                  {/* Footer date & right arrow */}
                  <View style={styles.cardBottom}>
                    <Text style={styles.dateText}>Submitted {formattedDate}</Text>
                    <View style={styles.detailArrowRow}>
                      <Text style={styles.viewDetailLink}>View details</Text>
                      <ChevronRight size={14} color="#4F46E5" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  roundedBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#F8FAFC",
    gap: 10,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    paddingHorizontal: 14,
    height: 40,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    height: "100%",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabChipTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
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
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  responsesList: {
    gap: 10,
  },
  responseCard: {
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
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeApproved: {
    backgroundColor: "#ECFDF5",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  badgeRejected: {
    backgroundColor: "#FEF2F2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeApprovedText: {
    color: "#059669",
  },
  badgePendingText: {
    color: "#D97706",
  },
  badgeRejectedText: {
    color: "#DC2626",
  },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  txnText: {
    fontSize: 11,
    color: "#0284C7",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  filesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  filesText: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "600",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  detailArrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewDetailLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
});
