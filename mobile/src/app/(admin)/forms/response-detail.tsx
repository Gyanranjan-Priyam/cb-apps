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
import {
  ArrowLeft,
  MoreVertical,
  Check,
  Ban,
  Trash2,
  CheckCircle2,
  Calendar,
  CreditCard,
  FileText,
  ExternalLink,
  Users,
  Clock,
  X,
  ShieldCheck,
  Download,
} from "lucide-react-native";
import {
  fetchAdminData,
  mutateAdminData,
  RealFormField,
  RealFormDefinition,
} from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/ui/app-bottom-sheet";

interface SingleResponsePayload {
  id: string;
  formId: string;
  formTitle: string;
  formCode: string;
  formDefinition: RealFormDefinition;
  answers: Record<string, unknown>;
  transactionId: string | null;
  paymentStatus: string;
  verifiedAt: string | null;
  createdAt: string;
  submittedBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    branch?: string | null;
    rollNumber?: string | null;
    registration?: string | null;
  } | null;
  files: {
    id: string;
    fieldId: string;
    originalFileName: string;
    storedFileName: string;
    mimeType: string;
    fileSize: number;
    googleDriveWebViewLink: string | null;
    googleDriveDownloadLink: string | null;
  }[];
}

function humanizeKey(key: string): string {
  return key
    .replace(/^sub[-_]/i, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ResponseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; responseId?: string; formTitle?: string }>();
  const responseId = params.id || params.responseId || "";

  const [responseDetail, setResponseDetail] = useState<SingleResponsePayload | null>(null);
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

  // Live direct database fetch
  const loadResponse = useCallback(
    async (isSilent = false) => {
      if (!responseId) return;
      if (!isSilent) setLoading(true);
      const data = await fetchAdminData<SingleResponsePayload>(
        "form-response-detail",
        { id: responseId },
        { forceFresh: true }
      );
      if (data) {
        setResponseDetail(data);
      }
      setLoading(false);
    },
    [responseId]
  );

  useEffect(() => {
    loadResponse();
  }, [loadResponse]);

  // Realtime update listener
  useSupabaseRealtime({
    channel: "admin-forms",
    event: "form_response_change",
    onUpdate: () => {
      loadResponse(true);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResponse(true);
    setRefreshing(false);
  };

  // Map defined fields to labels & subQuestions
  const definedFieldsList = useMemo(() => {
    const list: RealFormField[] = [];
    if (!responseDetail?.formDefinition?.sections) return list;
    const sortedSections = [...responseDetail.formDefinition.sections].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    for (const sec of sortedSections) {
      if (sec.fields && Array.isArray(sec.fields)) {
        const sortedFields = [...sec.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        list.push(...sortedFields);
      }
    }
    return list;
  }, [responseDetail]);

  const definedFieldsMap = useMemo(() => {
    const map = new Map<string, RealFormField>();
    for (const f of definedFieldsList) {
      map.set(f.id, f);
      if (f.label) map.set(f.label, f);
    }
    return map;
  }, [definedFieldsList]);

  // Attached files map by fieldId
  const filesByFieldMap = useMemo(() => {
    const map = new Map<string, SingleResponsePayload["files"]>();
    if (!responseDetail?.files) return map;
    for (const f of responseDetail.files) {
      const existing = map.get(f.fieldId) || [];
      existing.push(f);
      map.set(f.fieldId, existing);
    }
    return map;
  }, [responseDetail]);

  // Status Action: Approve
  const handleApprove = async () => {
    if (!responseDetail) return;
    setActionLoading(true);
    setActionMenuVisible(false);
    const res = await mutateAdminData("update-form-response-status", {
      responseId: responseDetail.id,
      paymentStatus: "verified",
    });
    setActionLoading(false);

    if (res.success) {
      setResponseDetail((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: "verified",
              verifiedAt: new Date().toISOString(),
            }
          : null
      );
      showToast("Response approved & verified successfully!");
    } else {
      Alert.alert("Error", res.error || "Failed to approve response");
    }
  };

  // Status Action: Reject
  const handleReject = async () => {
    if (!responseDetail) return;
    setActionLoading(true);
    setActionMenuVisible(false);
    const res = await mutateAdminData("update-form-response-status", {
      responseId: responseDetail.id,
      paymentStatus: "rejected",
    });
    setActionLoading(false);

    if (res.success) {
      setResponseDetail((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: "rejected",
              verifiedAt: null,
            }
          : null
      );
      showToast("Response marked as rejected.");
    } else {
      Alert.alert("Error", res.error || "Failed to reject response");
    }
  };

  // Status Action: Delete
  const handleDelete = () => {
    if (!responseDetail) return;
    setActionMenuVisible(false);

    Alert.alert(
      "Delete Response",
      "Are you sure you want to permanently delete this response submission? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            const res = await mutateAdminData("delete-form-response", {
              responseId: responseDetail.id,
            });
            setActionLoading(false);

            if (res.success) {
              Alert.alert("Deleted", "Response deleted successfully.", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } else {
              Alert.alert("Error", res.error || "Failed to delete response");
            }
          },
        },
      ]
    );
  };

  const getDisplaySubmitter = () => {
    if (!responseDetail) return "Participant";
    if (responseDetail.submittedBy?.name) return responseDetail.submittedBy.name;
    const answers = responseDetail.answers || {};
    for (const [k, v] of Object.entries(answers)) {
      if (k.toLowerCase().includes("name") && typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
    return responseDetail.submittedBy?.email?.split("@")[0] || "Anonymous Participant";
  };

  const getDisplayEmail = () => {
    if (!responseDetail) return "";
    if (responseDetail.submittedBy?.email) return responseDetail.submittedBy.email;
    const answers = responseDetail.answers || {};
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

  const isApproved =
    responseDetail?.paymentStatus === "verified" ||
    responseDetail?.paymentStatus === "completed" ||
    responseDetail?.paymentStatus === "approved";
  const isRejected = responseDetail?.paymentStatus === "rejected";

  // Build the list of Q&A items in correct form definition order + any extra answer keys
  const orderedQAItems = useMemo(() => {
    if (!responseDetail) return [];
    const answers = responseDetail.answers || {};
    const items: Array<{
      fieldId: string;
      label: string;
      fieldDef?: RealFormField;
      rawAnswer: unknown;
    }> = [];

    const processedKeys = new Set<string>();

    // 1. First add all defined fields from the form schema
    for (const f of definedFieldsList) {
      if (f.type === "button") continue;
      const val = answers[f.id] !== undefined ? answers[f.id] : answers[f.label];
      items.push({
        fieldId: f.id,
        label: f.label || humanizeKey(f.id),
        fieldDef: f,
        rawAnswer: val,
      });
      processedKeys.add(f.id);
      if (f.label) processedKeys.add(f.label);
    }

    // 2. Add any remaining keys in answers that were not in definition
    for (const [k, v] of Object.entries(answers)) {
      if (!processedKeys.has(k)) {
        const fieldDef = definedFieldsMap.get(k);
        items.push({
          fieldId: k,
          label: fieldDef?.label || humanizeKey(k),
          fieldDef,
          rawAnswer: v,
        });
      }
    }

    return items;
  }, [responseDetail, definedFieldsList, definedFieldsMap]);

  // Helper to render individual answer block based on type
  const renderFormattedAnswer = (
    fieldId: string,
    label: string,
    rawAnswer: unknown,
    fieldDef?: RealFormField
  ) => {
    // Check if there are attached files for this fieldId
    const attachedFiles = filesByFieldMap.get(fieldId) || [];

    // Case 1: Team Members / Repeater (Array of Member Objects)
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
          {members.length === 0 ? (
            <Text style={styles.emptyAnswerText}>No members submitted</Text>
          ) : (
            members.map((member, mIdx) => (
              <View key={mIdx} style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <Users size={14} color="#4F46E5" />
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
            ))
          )}
        </View>
      );
    }

    // Case 2: Multi-input / Sub-questions Object (Key-Value Dictionary)
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

    // Case 3: File Upload (Object or Array of File objects or from attached files)
    if (
      fieldDef?.type === "file_upload" ||
      attachedFiles.length > 0 ||
      (typeof rawAnswer === "object" &&
        rawAnswer !== null &&
        ("storedFileName" in rawAnswer ||
          "originalFileName" in rawAnswer ||
          "webViewLink" in rawAnswer)) ||
      (Array.isArray(rawAnswer) &&
        rawAnswer.length > 0 &&
        typeof rawAnswer[0] === "object" &&
        rawAnswer[0] !== null &&
        ("storedFileName" in rawAnswer[0] || "originalFileName" in rawAnswer[0]))
    ) {
      // Gather files either from attachedFiles or from the answer payload
      const fileItems: Array<{
        name: string;
        link?: string | null;
        size?: number | null;
      }> = [];

      if (attachedFiles.length > 0) {
        attachedFiles.forEach((f) => {
          fileItems.push({
            name: f.originalFileName || f.storedFileName,
            link: f.googleDriveWebViewLink || f.googleDriveDownloadLink,
            size: f.fileSize,
          });
        });
      } else if (Array.isArray(rawAnswer)) {
        rawAnswer.forEach((f: any) => {
          if (typeof f === "object" && f !== null) {
            fileItems.push({
              name: f.originalFileName || f.storedFileName || f.name || "File",
              link: f.webViewLink || f.googleDriveWebViewLink || f.url,
              size: f.fileSize || f.size,
            });
          } else if (typeof f === "string") {
            fileItems.push({ name: f });
          }
        });
      } else if (typeof rawAnswer === "object" && rawAnswer !== null) {
        const f = rawAnswer as any;
        fileItems.push({
          name: f.originalFileName || f.storedFileName || f.name || "File",
          link: f.webViewLink || f.googleDriveWebViewLink || f.url,
          size: f.fileSize || f.size,
        });
      } else if (typeof rawAnswer === "string" && rawAnswer.trim()) {
        fileItems.push({ name: rawAnswer.trim() });
      }

      if (fileItems.length === 0) {
        return <Text style={styles.emptyAnswerText}>No file uploaded</Text>;
      }

      return (
        <View style={styles.fileAnswersList}>
          {fileItems.map((file, fIdx) => (
            <View key={fIdx} style={styles.fileAnswerCard}>
              <View style={styles.fileIconCircle}>
                <FileText size={16} color="#4F46E5" />
              </View>
              <View style={styles.fileAnswerMeta}>
                <Text style={styles.fileAnswerName} numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size ? (
                  <Text style={styles.fileAnswerSub}>
                    {Math.round(file.size / 1024)} KB
                  </Text>
                ) : null}
              </View>
              {file.link && (
                <TouchableOpacity
                  style={styles.fileDownloadCircle}
                  onPress={() => {
                    if (file.link) Linking.openURL(file.link);
                  }}
                >
                  <ExternalLink size={14} color="#4F46E5" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      );
    }

    // Case 4: Standard Text / Date / Number / Boolean / Options
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

      {/* TOP HEADER: Left rounded back, Center Title & Subtitle, Right rounded 3-dot action button */}
      <View style={styles.headerBar}>
        {/* Left: Rounded Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.roundedActionBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        {/* Center: Form Title & ID */}
        <View style={styles.headerCenterTitleBox}>
          <Text style={styles.headerCenteredTitle} numberOfLines={1}>
            {responseDetail?.formTitle || params.formTitle || "Untitled form"}
          </Text>
          <Text style={styles.headerCenteredSubtitle}>
            {responseDetail?.formCode
              ? `Form: ${responseDetail.formCode}`
              : "Form Response"}
          </Text>
        </View>

        {/* Right: Rounded 3-Dot Action Menu Button */}
        <TouchableOpacity
          onPress={() => actionSheetRef.current?.present()}
          style={styles.roundedActionBtn}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
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
            <Text style={styles.loadingText}>Fetching response details...</Text>
          </View>
        ) : !responseDetail ? (
          <View style={styles.emptyBox}>
            <FileText size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Response not found</Text>
            <Text style={styles.emptySubtitle}>
              This submission might have been deleted or moved.
            </Text>
          </View>
        ) : (
          <>
            {/* Submitter Profile Summary Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.roundedAvatar}>
                  <Text style={styles.avatarLetter}>
                    {getDisplaySubmitter().charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.profileMeta}>
                  <Text style={styles.profileName}>{getDisplaySubmitter()}</Text>
                  <Text style={styles.profileEmail}>{getDisplayEmail()}</Text>
                  {responseDetail.submittedBy?.branch && (
                    <Text style={styles.profileDetailTag}>
                      Branch: {responseDetail.submittedBy.branch}
                    </Text>
                  )}
                  {responseDetail.submittedBy?.rollNumber && (
                    <Text style={styles.profileDetailTag}>
                      Roll: {responseDetail.submittedBy.rollNumber}
                    </Text>
                  )}
                  {responseDetail.submittedBy?.registration && (
                    <Text style={styles.profileDetailTag}>
                      Reg: {responseDetail.submittedBy.registration}
                    </Text>
                  )}
                </View>
              </View>

              {/* Status and Submission Pills */}
              <View style={styles.profileFooterPills}>
                <View
                  style={[
                    styles.roundedStatusTag,
                    isApproved
                      ? styles.statusTagApproved
                      : isRejected
                      ? styles.statusTagRejected
                      : styles.statusTagPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      isApproved
                        ? styles.statusTagTextApproved
                        : isRejected
                        ? styles.statusTagTextRejected
                        : styles.statusTagTextPending,
                    ]}
                  >
                    Status: {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                  </Text>
                </View>

                <View style={styles.roundedMetaTag}>
                  <Calendar size={12} color="#64748B" />
                  <Text style={styles.metaTagText}>
                    {new Date(responseDetail.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                </View>

                {responseDetail.transactionId && (
                  <View style={[styles.roundedMetaTag, styles.metaTagTxn]}>
                    <CreditCard size={12} color="#0284C7" />
                    <Text style={[styles.metaTagText, { color: "#0284C7" }]}>
                      Txn: {responseDetail.transactionId}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Questions & Form Answers */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <FileText size={16} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Questions & Answers</Text>
              </View>

              {orderedQAItems.length === 0 ? (
                <Text style={styles.emptyAnswersText}>
                  No form answers recorded for this entry.
                </Text>
              ) : (
                <View style={styles.qaList}>
                  {orderedQAItems.map((item) => (
                    <View key={item.fieldId} style={styles.qaBlock}>
                      <Text style={styles.qaQuestionText}>{item.label}</Text>
                      {renderFormattedAnswer(
                        item.fieldId,
                        item.label,
                        item.rawAnswer,
                        item.fieldDef
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Attached Files Section (if any files uploaded) */}
            {responseDetail.files && responseDetail.files.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <FileText size={16} color="#4F46E5" />
                  <Text style={styles.sectionTitle}>
                    Attached Files ({responseDetail.files.length})
                  </Text>
                </View>

                <View style={styles.filesList}>
                  {responseDetail.files.map((file) => (
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
        snapPoints={["50%"]}
        title="Response Actions"
        subtitle={`ID: ${responseDetail?.id || "Form Submission"}`}
        onClose={() => setActionMenuVisible(false)}
      >
        {actionLoading ? (
          <View style={styles.sheetLoading}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.sheetLoadingText}>Updating status...</Text>
          </View>
        ) : (
          <View style={styles.sheetActionsList}>
            {/* 1. Approve / Verify */}
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
                  {isApproved ? "Approved (Verified)" : "Approve Response"}
                </Text>
                <Text style={styles.actionItemDesc}>
                  Mark response as verified and generate invoice if applicable
                </Text>
              </View>
            </TouchableOpacity>

            {/* 2. Reject */}
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
                  {isRejected ? "Rejected" : "Reject Response"}
                </Text>
                <Text style={styles.actionItemDesc}>
                  Mark response submission as rejected
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Delete */}
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
                  Delete Response
                </Text>
                <Text style={styles.actionItemDesc}>
                  Permanently remove this submission from database
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
  headerCenterTitleBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  headerCenteredTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  headerCenteredSubtitle: {
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
  profileCard: {
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  roundedAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  profileEmail: {
    fontSize: 13,
    color: "#64748B",
  },
  profileDetailTag: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  profileFooterPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  roundedStatusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusTagApproved: {
    backgroundColor: "#ECFDF5",
  },
  statusTagPending: {
    backgroundColor: "#FEF3C7",
  },
  statusTagRejected: {
    backgroundColor: "#FEF2F2",
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTagTextApproved: {
    color: "#059669",
  },
  statusTagTextPending: {
    color: "#D97706",
  },
  statusTagTextRejected: {
    color: "#DC2626",
  },
  roundedMetaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metaTagTxn: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  metaTagText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
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
  emptyAnswersText: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    paddingVertical: 10,
  },
  qaList: {
    gap: 14,
  },
  qaBlock: {
    gap: 6,
  },
  qaQuestionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  qaValueBox: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qaValueText: {
    fontSize: 13,
    color: "#0F172A",
    lineHeight: 18,
  },
  emptyAnswerText: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  repeaterContainer: {
    gap: 10,
  },
  memberCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 6,
  },
  memberHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
    letterSpacing: 0.5,
  },
  memberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  memberSubField: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 2,
  },
  memberSubLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "capitalize",
  },
  memberSubValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  multiInputContainer: {
    gap: 8,
  },
  multiInputField: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 2,
  },
  multiInputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  multiInputValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  fileAnswersList: {
    gap: 8,
  },
  fileAnswerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  fileIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  fileAnswerMeta: {
    flex: 1,
    gap: 2,
  },
  fileAnswerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  fileAnswerSub: {
    fontSize: 11,
    color: "#64748B",
  },
  fileDownloadCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  filesList: {
    gap: 10,
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
