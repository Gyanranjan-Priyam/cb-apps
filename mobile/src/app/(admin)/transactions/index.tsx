import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter } from "expo-router";
import {
  Receipt,
  Search,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  FileText,
  TrendingUp,
} from "lucide-react-native";
import { AdminTopBar } from "@/components/admin/admin-header";
import {
  fetchAdminData,
  RealTransactionFormsPayload,
  RealTransactionForm,
} from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";

export default function AdminTransactionsScreen() {
  const router = useRouter();
  const [payload, setPayload] = useState<RealTransactionFormsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTransactions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    const data = await fetchAdminData<RealTransactionFormsPayload>(
      "transaction-forms",
      undefined,
      { forceFresh: true }
    );
    if (data) {
      setPayload(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Realtime updates for live payment verification
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

  const forms = payload?.forms || [];
  const stats = payload?.stats || {
    totalRevenue: 0,
    formattedTotalRevenue: "₹0.00",
    totalTransactions: 0,
    totalVerified: 0,
    totalPending: 0,
  };

  const filteredForms = forms.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      f.formId.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  const handleSelectForm = (form: RealTransactionForm) => {
    router.push({
      pathname: "/(admin)/transactions/form-transactions",
      params: {
        formId: form.formId,
        id: form.id,
        title: form.title,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <AdminTopBar
        title="Transactions & Receipts"
        subtitle={`${forms.length} payment forms`}
      />

      {/* Search Input - Fully Rounded */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search payment forms by title or ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
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
            colors={["#059669"]}
            tintColor="#059669"
          />
        }
      >
        {/* Total Overall Revenue Summary Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueTop}>
            <View style={styles.revenueIconBox}>
              <IndianRupee size={22} color="#059669" />
            </View>
            <View style={styles.revenueTextBox}>
              <Text style={styles.revenueLabel}>Total Collected Revenue</Text>
              <Text style={styles.revenueValue}>{stats.formattedTotalRevenue}</Text>
            </View>
          </View>

          <View style={styles.revenueStatsRow}>
            <View style={styles.statPill}>
              <Receipt size={13} color="#4F46E5" />
              <Text style={styles.statPillText}>
                {stats.totalTransactions} Total Payments
              </Text>
            </View>

            <View style={[styles.statPill, styles.statPillVerified]}>
              <CheckCircle2 size={13} color="#059669" />
              <Text style={[styles.statPillText, { color: "#059669" }]}>
                {stats.totalVerified} Verified
              </Text>
            </View>

            {stats.totalPending > 0 && (
              <View style={[styles.statPill, styles.statPillPending]}>
                <Clock size={13} color="#D97706" />
                <Text style={[styles.statPillText, { color: "#D97706" }]}>
                  {stats.totalPending} Pending
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Receipt size={16} color="#4F46E5" />
          <Text style={styles.sectionHeadingTitle}>
            Payment & Registration Forms
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Loading payment forms...</Text>
          </View>
        ) : filteredForms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Receipt size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matching forms found" : "No payment forms recorded"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try searching with a different keyword."
                : "Forms configured with payment fields or responses containing transactions will appear here."}
            </Text>
          </View>
        ) : (
          <View style={styles.formsList}>
            {filteredForms.map((form) => (
              <TouchableOpacity
                key={form.id}
                style={styles.formCard}
                activeOpacity={0.7}
                onPress={() => handleSelectForm(form)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.formIconWrapper}>
                    <CreditCard size={20} color="#059669" />
                  </View>

                  <View style={styles.formTitleWrapper}>
                    <Text style={styles.formTitle} numberOfLines={1}>
                      {form.title}
                    </Text>
                    <Text style={styles.formIdCode}>ID: {form.formId}</Text>
                  </View>

                  <View style={styles.amountPill}>
                    <Text style={styles.amountText}>{form.formattedAmount}</Text>
                  </View>
                </View>

                {form.description ? (
                  <Text style={styles.formDesc} numberOfLines={2}>
                    {form.description}
                  </Text>
                ) : null}

                {/* Metrics Badges Row */}
                <View style={styles.metricsRow}>
                  <View style={[styles.roundedBadge, styles.badgeTotal]}>
                    <Receipt size={12} color="#4F46E5" />
                    <Text style={[styles.badgeText, { color: "#4F46E5" }]}>
                      {form.totalTransactions}{" "}
                      {form.totalTransactions === 1 ? "Txn" : "Txns"}
                    </Text>
                  </View>

                  <View style={[styles.roundedBadge, styles.badgeVerified]}>
                    <CheckCircle2 size={12} color="#059669" />
                    <Text style={[styles.badgeText, { color: "#059669" }]}>
                      {form.verifiedCount} Verified
                    </Text>
                  </View>

                  {form.pendingCount > 0 && (
                    <View style={[styles.roundedBadge, styles.badgePending]}>
                      <Clock size={12} color="#D97706" />
                      <Text style={[styles.badgeText, { color: "#D97706" }]}>
                        {form.pendingCount} Pending
                      </Text>
                    </View>
                  )}

                  {form.totalRevenue > 0 && (
                    <View style={[styles.roundedBadge, styles.badgeRevenue]}>
                      <TrendingUp size={12} color="#047857" />
                      <Text style={[styles.badgeText, { color: "#047857" }]}>
                        {form.formattedRevenue}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.metaItem}>
                    <Clock size={13} color="#94A3B8" />
                    <Text style={styles.metaText}>
                      {form.lastTransactionDate
                        ? `Last txn ${new Date(form.lastTransactionDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}`
                        : `Created ${new Date(form.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}`}
                    </Text>
                  </View>

                  <View style={styles.viewTransactionsLink}>
                    <Text style={styles.viewTransactionsText}>View transactions</Text>
                    <ChevronRight size={14} color="#059669" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    borderRadius: 9999,
    paddingHorizontal: 14,
    height: 42,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  revenueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  revenueTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  revenueIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueTextBox: {
    flex: 1,
    gap: 2,
  },
  revenueLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  revenueStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statPillVerified: {
    backgroundColor: "#ECFDF5",
    borderColor: "#D1FAE5",
  },
  statPillPending: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  statPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  sectionHeadingTitle: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  formsList: {
    gap: 12,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  formIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  formTitleWrapper: {
    flex: 1,
    gap: 2,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  formIdCode: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  amountPill: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  amountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  formDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roundedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeTotal: {
    backgroundColor: "#EEF2FF",
  },
  badgeVerified: {
    backgroundColor: "#ECFDF5",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  badgeRevenue: {
    backgroundColor: "#D1FAE5",
  },
  badgeText: {
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
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  viewTransactionsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewTransactionsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
});
