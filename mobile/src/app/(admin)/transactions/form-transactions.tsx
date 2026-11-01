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
  Receipt,
  CreditCard,
  ChevronRight,
  X,
  TrendingUp,
  User,
} from "lucide-react-native";
import {
  fetchAdminData,
  RealFormTransactionsPayload,
  RealTransactionItem,
} from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function FormTransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; formId?: string; title?: string }>();
  const formIdOrId = params.formId || params.id || "";

  const [payload, setPayload] = useState<RealFormTransactionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending" | "rejected">("all");

  const loadTransactions = useCallback(
    async (isSilent = false) => {
      if (!formIdOrId) return;
      if (!isSilent) setLoading(true);
      const data = await fetchAdminData<RealFormTransactionsPayload>(
        "form-transactions",
        { id: formIdOrId },
        { forceFresh: true }
      );
      if (data) {
        setPayload(data);
      }
      setLoading(false);
    },
    [formIdOrId]
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useSupabaseRealtime({
    channel: "admin-transactions",
    event: "transaction_change",
    onUpdate: () => {
      loadTransactions(true);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions(true);
    setRefreshing(false);
  };

  const transactions = payload?.transactions || [];
  const stats = payload?.stats || {
    totalTransactions: 0,
    verifiedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    totalRevenue: 0,
    formattedRevenue: "₹0.00",
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (statusFilter === "verified") {
        if (
          tx.paymentStatus !== "verified" &&
          tx.paymentStatus !== "completed" &&
          tx.paymentStatus !== "approved"
        )
          return false;
      } else if (statusFilter === "pending") {
        if (
          tx.paymentStatus === "verified" ||
          tx.paymentStatus === "completed" ||
          tx.paymentStatus === "approved" ||
          tx.paymentStatus === "rejected"
        )
          return false;
      } else if (statusFilter === "rejected") {
        if (tx.paymentStatus !== "rejected") return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tx.transactionId.toLowerCase().includes(q) ||
        tx.payerName.toLowerCase().includes(q) ||
        tx.payerEmail.toLowerCase().includes(q) ||
        tx.receiptNumber.toLowerCase().includes(q)
      );
    });
  }, [transactions, statusFilter, searchQuery]);

  const handleOpenReceipt = (tx: RealTransactionItem) => {
    router.push({
      pathname: "/(admin)/transactions/receipt-detail",
      params: {
        id: tx.id,
        transactionId: tx.transactionId,
        formTitle: payload?.title || params.title || "Form Registration",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* TOP HEADER: Centered title with rounded back button */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.roundedBackBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenterBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {payload?.title || params.title || "Form Transactions"}
          </Text>
          <Text style={styles.headerSubCode}>
            {payload?.formId ? `Form: ${payload.formId}` : "Transaction Entries"}
          </Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Filter Tabs & Search Bar */}
      <View style={styles.filterSection}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Txn ID, UTR, Payer name..."
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

        {/* Tab Chips - Rounded */}
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
              All ({stats.totalTransactions})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabChip,
              statusFilter === "verified" && styles.tabChipActive,
            ]}
            onPress={() => setStatusFilter("verified")}
          >
            <Text
              style={[
                styles.tabChipText,
                statusFilter === "verified" && styles.tabChipTextActive,
              ]}
            >
              Verified ({stats.verifiedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabChip,
              statusFilter === "pending" && styles.tabChipActive,
            ]}
            onPress={() => setStatusFilter("pending")}
          >
            <Text
              style={[
                styles.tabChipText,
                statusFilter === "pending" && styles.tabChipTextActive,
              ]}
            >
              Pending ({stats.pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabChip,
              statusFilter === "rejected" && styles.tabChipActive,
            ]}
            onPress={() => setStatusFilter("rejected")}
          >
            <Text
              style={[
                styles.tabChipText,
                statusFilter === "rejected" && styles.tabChipTextActive,
              ]}
            >
              Rejected ({stats.rejectedCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Transactions Scrollable List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#059669"]}
            tintColor="#059669"
          />
        }
      >
        {/* Form Stats Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Collected</Text>
            <Text style={styles.summaryRevenue}>{stats.formattedRevenue}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fee / Response</Text>
            <Text style={styles.summaryFee}>{payload?.formattedAmount || "₹0.00"}</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Fetching transaction records...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <CreditCard size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery || statusFilter !== "all"
                ? "No matching transactions"
                : "No transaction responses recorded"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search terms or filter selection."
                : "Responses containing transaction references will automatically appear here."}
            </Text>
          </View>
        ) : (
          <View style={styles.txnList}>
            {filteredTransactions.map((tx) => {
              const isApproved =
                tx.paymentStatus === "verified" ||
                tx.paymentStatus === "completed" ||
                tx.paymentStatus === "approved";
              const isRejected = tx.paymentStatus === "rejected";

              const formattedDate = new Date(tx.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.txnCard}
                  activeOpacity={0.7}
                  onPress={() => handleOpenReceipt(tx)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarLetter}>
                        {tx.payerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.payerInfo}>
                      <Text style={styles.payerName} numberOfLines={1}>
                        {tx.payerName}
                      </Text>
                      <Text style={styles.payerEmail} numberOfLines={1}>
                        {tx.payerEmail}
                      </Text>
                    </View>

                    <View style={styles.amountBox}>
                      <Text style={styles.amountText}>{tx.formattedAmount}</Text>
                    </View>
                  </View>

                  {/* Transaction ID & Status Row */}
                  <View style={styles.txRow}>
                    <View style={styles.txIdTag}>
                      <CreditCard size={12} color="#0284C7" />
                      <Text style={styles.txIdText} numberOfLines={1}>
                        Txn: {tx.transactionId}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        isApproved
                          ? styles.statusPillApproved
                          : isRejected
                          ? styles.statusPillRejected
                          : styles.statusPillPending,
                      ]}
                    >
                      {isApproved ? (
                        <CheckCircle2 size={11} color="#059669" />
                      ) : isRejected ? (
                        <XCircle size={11} color="#DC2626" />
                      ) : (
                        <Clock size={11} color="#D97706" />
                      )}
                      <Text
                        style={[
                          styles.statusText,
                          isApproved
                            ? styles.statusTextApproved
                            : isRejected
                            ? styles.statusTextRejected
                            : styles.statusTextPending,
                        ]}
                      >
                        {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                      </Text>
                    </View>
                  </View>

                  {/* Card Bottom: Date & View Receipt Link */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>Submitted {formattedDate}</Text>
                    <View style={styles.viewReceiptLink}>
                      <Text style={styles.viewReceiptText}>View receipt</Text>
                      <ChevronRight size={14} color="#059669" />
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
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
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
  headerCenterBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  headerSubCode: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 1,
  },
  headerRightSpacer: {
    width: 40,
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
    backgroundColor: "#059669",
    borderColor: "#059669",
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
    gap: 14,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryRevenue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#059669",
  },
  summaryFee: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
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
  txnList: {
    gap: 10,
  },
  txnCard: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
  },
  payerInfo: {
    flex: 1,
    gap: 2,
  },
  payerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  payerEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  amountBox: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  amountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  txIdTag: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  txIdText: {
    fontSize: 11,
    color: "#0284C7",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusPillApproved: {
    backgroundColor: "#ECFDF5",
  },
  statusPillPending: {
    backgroundColor: "#FEF3C7",
  },
  statusPillRejected: {
    backgroundColor: "#FEF2F2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextApproved: {
    color: "#059669",
  },
  statusTextPending: {
    color: "#D97706",
  },
  statusTextRejected: {
    color: "#DC2626",
  },
  cardFooter: {
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
  viewReceiptLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewReceiptText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
});
