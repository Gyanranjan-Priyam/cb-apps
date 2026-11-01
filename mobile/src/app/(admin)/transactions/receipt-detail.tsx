import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  ArrowLeft,
  MoreVertical,
  Check,
  Ban,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  CreditCard,
  FileText,
  ExternalLink,
  Users,
  Copy,
  Receipt,
  User,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck,
  X,
  Share2,
} from "lucide-react-native";
import {
  fetchAdminData,
  mutateAdminData,
  RealTransactionDetail,
  RealFormField,
} from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/ui/app-bottom-sheet";

function humanizeKey(key: string): string {
  return key
    .replace(/^sub[-_]/i, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReceiptDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    responseId?: string;
    transactionId?: string;
    formTitle?: string;
  }>();
  const idOrTxId = params.id || params.responseId || params.transactionId || "";

  const [detail, setDetail] = useState<RealTransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const actionSheetRef = useRef<AppBottomSheetRef>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const loadReceipt = useCallback(
    async (isSilent = false) => {
      if (!idOrTxId) return;
      if (!isSilent) setLoading(true);
      const data = await fetchAdminData<RealTransactionDetail>(
        "transaction-detail",
        { id: idOrTxId },
        { forceFresh: true }
      );
      if (data) {
        setDetail(data);
      }
      setLoading(false);
    },
    [idOrTxId]
  );

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  useSupabaseRealtime({
    channel: "admin-transactions",
    event: "transaction_change",
    onUpdate: () => {
      loadReceipt(true);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReceipt(true);
    setRefreshing(false);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast(`${label} copied to clipboard!`);
    } catch {
      Alert.alert(label, text);
    }
  };

  // Status Action: Approve Payment
  const handleApprove = async () => {
    if (!detail) return;
    setActionLoading(true);
    setActionMenuVisible(false);
    const res = await mutateAdminData("update-form-response-status", {
      responseId: detail.id,
      paymentStatus: "verified",
    });
    setActionLoading(false);

    if (res.success) {
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: "verified",
              verifiedAt: new Date().toISOString(),
            }
          : null
      );
      showToast("Payment verified & invoice generated!");
    } else {
      Alert.alert("Error", res.error || "Failed to verify payment");
    }
  };

  // Status Action: Reject Payment
  const handleReject = async () => {
    if (!detail) return;
    setActionLoading(true);
    setActionMenuVisible(false);
    const res = await mutateAdminData("update-form-response-status", {
      responseId: detail.id,
      paymentStatus: "rejected",
    });
    setActionLoading(false);

    if (res.success) {
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: "rejected",
              verifiedAt: null,
            }
          : null
      );
      showToast("Payment status marked as rejected.");
    } else {
      Alert.alert("Error", res.error || "Failed to reject payment");
    }
  };

  // Status Action: Delete
  const handleDelete = () => {
    if (!detail) return;
    setActionMenuVisible(false);

    Alert.alert(
      "Delete Transaction Record",
      "Are you sure you want to permanently delete this transaction record? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            const res = await mutateAdminData("delete-form-response", {
              responseId: detail.id,
            });
            setActionLoading(false);

            if (res.success) {
              Alert.alert("Deleted", "Transaction deleted successfully.", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } else {
              Alert.alert("Error", res.error || "Failed to delete transaction");
            }
          },
        },
      ]
    );
  };

  const isApproved =
    detail?.paymentStatus === "verified" ||
    detail?.paymentStatus === "completed" ||
    detail?.paymentStatus === "approved";
  const isRejected = detail?.paymentStatus === "rejected";

  // Form field definitions
  const definedFieldsList = useMemo(() => {
    const list: RealFormField[] = [];
    if (!detail?.form?.definition?.sections) return list;
    for (const sec of detail.form.definition.sections) {
      if (sec.fields && Array.isArray(sec.fields)) {
        list.push(...sec.fields);
      }
    }
    return list;
  }, [detail]);

  const definedFieldsMap = useMemo(() => {
    const map = new Map<string, RealFormField>();
    for (const f of definedFieldsList) {
      map.set(f.id, f);
      if (f.label) map.set(f.label, f);
    }
    return map;
  }, [definedFieldsList]);

  // Answer formatting helper
  const renderFormattedAnswer = (
    fieldId: string,
    label: string,
    rawAnswer: unknown,
    fieldDef?: RealFormField
  ) => {
    if (
      fieldDef?.type === "team_members" ||
      (Array.isArray(rawAnswer) &&
        rawAnswer.length > 0 &&
        typeof rawAnswer[0] === "object" &&
        rawAnswer[0] !== null &&
        !("storedFileName" in rawAnswer[0]))
    ) {
      const members = Array.isArray(rawAnswer)
        ? (rawAnswer.filter(
            (m): m is Record<string, unknown> => typeof m === "object" && m !== null
          ) as Array<Record<string, unknown>>)
        : [];

      const subs = fieldDef?.subQuestions || [];
      const entryTitle = fieldDef?.entryLabel || "MEMBER";

      return (
        <View style={styles.repeaterContainer}>
          {members.map((member, mIdx) => (
            <View key={mIdx} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <Users size={14} color="#059669" />
                <Text style={styles.memberHeaderText}>
                  {entryTitle.toUpperCase()} #{mIdx + 1}
                  {mIdx === 0 ? " (LEADER)" : ""}
                </Text>
              </View>

              <View style={styles.memberGrid}>
                {subs.length > 0
                  ? subs.map((sub) => {
                      const val = member[sub.id] ?? member[sub.label] ?? "—";
                      return (
                        <View key={sub.id} style={styles.memberSubField}>
                          <Text style={styles.memberSubLabel}>{sub.label}</Text>
                          <Text style={styles.memberSubValue}>{String(val)}</Text>
                        </View>
                      );
                    })
                  : Object.entries(member).map(([k, v]) => (
                      <View key={k} style={styles.memberSubField}>
                        <Text style={styles.memberSubLabel}>{humanizeKey(k)}</Text>
                        <Text style={styles.memberSubValue}>{String(v ?? "—")}</Text>
                      </View>
                    ))}
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (
      typeof rawAnswer === "object" &&
      rawAnswer !== null &&
      !Array.isArray(rawAnswer) &&
      !("storedFileName" in rawAnswer) &&
      !("originalFileName" in rawAnswer) &&
      !("webViewLink" in rawAnswer)
    ) {
      const rawObj = rawAnswer as Record<string, unknown>;
      const subs = fieldDef?.subQuestions || [];

      return (
        <View style={styles.multiInputContainer}>
          {Object.entries(rawObj).map(([k, v]) => {
            const subDef = subs.find((s) => s.id === k || s.label === k);
            const subLabel = subDef?.label || humanizeKey(k);
            return (
              <View key={k} style={styles.multiInputField}>
                <Text style={styles.multiInputLabel}>{subLabel}</Text>
                <Text style={styles.multiInputValue}>{String(v ?? "—")}</Text>
              </View>
            );
          })}
        </View>
      );
    }

    let displayStr = "";
    if (rawAnswer === null || rawAnswer === undefined || rawAnswer === "") {
      displayStr = "—";
    } else if (typeof rawAnswer === "boolean") {
      displayStr = rawAnswer ? "Yes" : "No";
    } else if (Array.isArray(rawAnswer)) {
      displayStr = rawAnswer.map((item) => String(item)).join(", ");
    } else {
      displayStr = String(rawAnswer);
    }

    return (
      <View style={styles.qaValueBox}>
        <Text style={styles.qaValueText}>{displayStr}</Text>
      </View>
    );
  };

  const formattedCreatedTimestamp = detail?.createdAt
    ? new Date(detail.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "—";

  const formattedVerifiedTimestamp = detail?.verifiedAt
    ? new Date(detail.verifiedAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Floating Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* TOP HEADER: Centered title with rounded buttons */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.roundedActionBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenterBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Payment Receipt
          </Text>
          <Text style={styles.headerSubCode}>
            {detail?.receiptNumber || "Official Record"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setActionMenuVisible(true);
            actionSheetRef.current?.present();
          }}
          style={styles.roundedActionBtn}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color="#0F172A" />
        </TouchableOpacity>
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
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Fetching payment receipt...</Text>
          </View>
        ) : !detail ? (
          <View style={styles.emptyBox}>
            <Receipt size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Receipt not found</Text>
            <Text style={styles.emptySubtitle}>
              This transaction record may have been deleted or moved.
            </Text>
          </View>
        ) : (
          <>
            {/* PROMINENT OFFICIAL RECEIPT CARD */}
            <View style={styles.receiptCard}>
              <View style={styles.receiptTopHeader}>
                <View style={styles.receiptBrandBox}>
                  <View style={styles.receiptLogoCircle}>
                    <Receipt size={20} color="#059669" />
                  </View>
                  <View>
                    <Text style={styles.receiptBrandName}>CodeBreakers</Text>
                    <Text style={styles.receiptDocType}>Official Payment Receipt</Text>
                  </View>
                </View>

                {/* Status Badge */}
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
                    <CheckCircle2 size={12} color="#059669" />
                  ) : isRejected ? (
                    <XCircle size={12} color="#DC2626" />
                  ) : (
                    <Clock size={12} color="#D97706" />
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
                    {isApproved ? "Verified" : isRejected ? "Rejected" : "Pending"}
                  </Text>
                </View>
              </View>

              {/* Amount Display */}
              <View style={styles.amountDisplayBox}>
                <Text style={styles.amountLabel}>Amount Paid</Text>
                <Text style={styles.amountMainValue}>{detail.formattedAmount}</Text>
              </View>

              {/* Reference & Timestamps Details Grid */}
              <View style={styles.receiptDetailsGrid}>
                {/* Receipt Number */}
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.detailLabel}>Receipt No.</Text>
                  <TouchableOpacity
                    style={styles.copyableValueRow}
                    onPress={() => copyToClipboard(detail.receiptNumber, "Receipt Number")}
                  >
                    <Text style={styles.detailValueBold}>{detail.receiptNumber}</Text>
                    <Copy size={13} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Transaction ID */}
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.detailLabel}>Transaction ID / UTR</Text>
                  <TouchableOpacity
                    style={styles.copyableValueRow}
                    onPress={() => copyToClipboard(detail.transactionId, "Transaction ID")}
                  >
                    <Text style={[styles.detailValueBold, { color: "#0284C7" }]}>
                      {detail.transactionId}
                    </Text>
                    <Copy size={13} color="#0284C7" />
                  </TouchableOpacity>
                </View>

                {/* Associated Form */}
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.detailLabel}>Associated Form</Text>
                  <Text style={styles.detailValue}>{detail.form.title}</Text>
                </View>

                {/* Exact Submission Timestamp */}
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.detailLabel}>Submitted At</Text>
                  <View style={styles.timestampBox}>
                    <Calendar size={13} color="#64748B" />
                    <Text style={styles.detailValue}>{formattedCreatedTimestamp}</Text>
                  </View>
                </View>

                {/* Verification Timestamp */}
                {formattedVerifiedTimestamp && (
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.detailLabel}>Verified At</Text>
                    <View style={styles.timestampBox}>
                      <ShieldCheck size={13} color="#059669" />
                      <Text style={[styles.detailValue, { color: "#059669" }]}>
                        {formattedVerifiedTimestamp}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* PAYER INFORMATION CARD */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <User size={16} color="#059669" />
                <Text style={styles.sectionTitle}>Payer / Student Details</Text>
              </View>

              <View style={styles.payerProfileContent}>
                <View style={styles.payerAvatarRow}>
                  <View style={styles.payerAvatar}>
                    <Text style={styles.payerAvatarText}>
                      {detail.payer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.payerMainMeta}>
                    <Text style={styles.payerFullName}>{detail.payer.name}</Text>
                    <Text style={styles.payerSubEmail}>{detail.payer.email}</Text>
                  </View>
                </View>

                <View style={styles.payerDetailsGrid}>
                  {detail.payer.phone && (
                    <View style={styles.payerInfoItem}>
                      <Phone size={13} color="#64748B" />
                      <Text style={styles.payerInfoText}>{detail.payer.phone}</Text>
                    </View>
                  )}

                  {detail.payer.college && (
                    <View style={styles.payerInfoItem}>
                      <GraduationCap size={13} color="#64748B" />
                      <Text style={styles.payerInfoText}>{detail.payer.college}</Text>
                    </View>
                  )}

                  {detail.payer.branch && (
                    <View style={styles.payerInfoItem}>
                      <Text style={styles.payerTagLabel}>Branch:</Text>
                      <Text style={styles.payerInfoText}>{detail.payer.branch}</Text>
                    </View>
                  )}

                  {detail.payer.rollNumber && (
                    <View style={styles.payerInfoItem}>
                      <Text style={styles.payerTagLabel}>Roll:</Text>
                      <Text style={styles.payerInfoText}>{detail.payer.rollNumber}</Text>
                    </View>
                  )}

                  {detail.payer.registration && (
                    <View style={styles.payerInfoItem}>
                      <Text style={styles.payerTagLabel}>Reg:</Text>
                      <Text style={styles.payerInfoText}>{detail.payer.registration}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* SUBMITTED FORM ANSWERS */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <FileText size={16} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Form Submission Answers</Text>
              </View>

              <View style={styles.qaList}>
                {Object.entries(detail.answers || {}).map(([k, v]) => {
                  const fieldDef = definedFieldsMap.get(k);
                  const label = fieldDef?.label || humanizeKey(k);
                  return (
                    <View key={k} style={styles.qaBlock}>
                      <Text style={styles.qaQuestionText}>{label}</Text>
                      {renderFormattedAnswer(k, label, v, fieldDef)}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ATTACHED FILES */}
            {detail.files && detail.files.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <FileText size={16} color="#4F46E5" />
                  <Text style={styles.sectionTitle}>
                    Attached Files ({detail.files.length})
                  </Text>
                </View>

                <View style={styles.filesList}>
                  {detail.files.map((file) => (
                    <View key={file.id} style={styles.fileRow}>
                      <View style={styles.fileIconRounded}>
                        <FileText size={18} color="#4F46E5" />
                      </View>

                      <View style={styles.fileMetadata}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.originalFileName || file.storedFileName}
                        </Text>
                        <Text style={styles.fileSub}>
                          {Math.round(file.fileSize / 1024)} KB • {file.mimeType}
                        </Text>
                      </View>

                      {(file.googleDriveWebViewLink || file.googleDriveDownloadLink) && (
                        <TouchableOpacity
                          style={styles.roundedOpenBtn}
                          onPress={() => {
                            const url =
                              file.googleDriveWebViewLink || file.googleDriveDownloadLink;
                            if (url) Linking.openURL(url);
                          }}
                        >
                          <ExternalLink size={15} color="#4F46E5" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 3-DOTS ACTION BOTTOM SHEET */}
      <AppBottomSheet
        ref={actionSheetRef}
        snapPoints={["54%"]}
        title="Receipt Actions"
        subtitle={detail?.receiptNumber || detail?.transactionId}
        onClose={() => setActionMenuVisible(false)}
      >
        {actionLoading ? (
          <View style={styles.sheetLoading}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.sheetLoadingText}>Updating status...</Text>
          </View>
        ) : (
          <View style={styles.sheetActionsList}>
            {/* 1. Approve Payment */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                actionSheetRef.current?.dismiss();
                handleApprove();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#ECFDF5" }]}>
                <Check size={18} color="#059669" />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={[styles.actionItemLabel, { color: "#059669" }]}>
                  {isApproved ? "Verified (Approved)" : "Verify & Approve Payment"}
                </Text>
                <Text style={styles.actionItemDesc}>
                  Confirm payment receipt and send invoice to student
                </Text>
              </View>
            </TouchableOpacity>

            {/* 2. Reject Payment */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                actionSheetRef.current?.dismiss();
                handleReject();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Ban size={18} color="#D97706" />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={[styles.actionItemLabel, { color: "#D97706" }]}>
                  {isRejected ? "Rejected" : "Reject Payment"}
                </Text>
                <Text style={styles.actionItemDesc}>
                  Mark transaction as invalid or rejected
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Copy Receipt Reference */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                actionSheetRef.current?.dismiss();
                setActionMenuVisible(false);
                if (detail) {
                  copyToClipboard(
                    `Receipt: ${detail.receiptNumber}\nTxn: ${detail.transactionId}\nPayer: ${detail.payer.name}\nAmount: ${detail.formattedAmount}`,
                    "Receipt Details"
                  );
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#EEF2FF" }]}>
                <Copy size={18} color="#4F46E5" />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={[styles.actionItemLabel, { color: "#4F46E5" }]}>
                  Copy Receipt Summary
                </Text>
                <Text style={styles.actionItemDesc}>
                  Copy transaction ID, receipt reference and payer details
                </Text>
              </View>
            </TouchableOpacity>

            {/* 4. Delete Record */}
            <TouchableOpacity
              style={[styles.sheetActionItem, styles.sheetActionItemDestructive]}
              onPress={() => {
                actionSheetRef.current?.dismiss();
                handleDelete();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#FEE2E2" }]}>
                <Trash2 size={18} color="#DC2626" />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={[styles.actionItemLabel, { color: "#DC2626" }]}>
                  Delete Transaction
                </Text>
                <Text style={styles.actionItemDesc}>
                  Permanently delete this payment submission
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
    top: 60,
    alignSelf: "center",
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
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
  roundedActionBtn: {
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
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
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  receiptTopHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 14,
  },
  receiptBrandBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  receiptLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptBrandName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  receiptDocType: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
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
  amountDisplayBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountMainValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: -0.5,
  },
  receiptDetailsGrid: {
    gap: 12,
  },
  receiptDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
    paddingBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },
  detailValueBold: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  copyableValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timestampBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  payerProfileContent: {
    gap: 14,
  },
  payerAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  payerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  payerAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  payerMainMeta: {
    flex: 1,
    gap: 2,
  },
  payerFullName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  payerSubEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  payerDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  payerInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  payerTagLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  payerInfoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  qaList: {
    gap: 12,
  },
  qaBlock: {
    gap: 5,
  },
  qaQuestionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  qaValueBox: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qaValueText: {
    fontSize: 13,
    color: "#0F172A",
    lineHeight: 18,
  },
  repeaterContainer: {
    gap: 8,
  },
  memberCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  memberHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  memberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  memberSubField: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  memberSubLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  memberSubValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  multiInputContainer: {
    gap: 6,
  },
  multiInputField: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  multiInputLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  multiInputValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  filesList: {
    gap: 8,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  fileIconRounded: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  fileMetadata: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  fileSub: {
    fontSize: 11,
    color: "#64748B",
  },
  roundedOpenBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  sheetActionItemDestructive: {
    backgroundColor: "#FEF2F2",
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
