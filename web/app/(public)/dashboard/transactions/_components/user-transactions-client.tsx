"use client";

import { useState, useMemo } from "react";
import {
  ReceiptText,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Printer,
  Copy,
  Check,
  Mail,
  Calendar,
  Bell,
  Send,
  Eye,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import type {
  UserTransactionsResponse,
  UserTransactionItem,
  TransactionNotification,
} from "../actions";

interface UserTransactionsClientProps {
  initialData: UserTransactionsResponse;
}

/**
 * Parses and extracts a human-readable dictionary of field labels and sub-question labels from form definition.
 */
/**
 * Parses and extracts a human-readable dictionary of field labels and sub-question labels from form definition.
 */
function extractFormQuestionMaps(formDefinition: any) {
  const fieldLabelMap = new Map<string, string>();
  const fieldMetaMap = new Map<
    string,
    {
      id: string;
      label: string;
      type?: string;
      entryLabel?: string;
      subQuestions?: Array<{ id: string; label: string; type?: string }>;
    }
  >();
  const subQuestionMap = new Map<string, { parentLabel: string; subLabel: string }>();

  if (!formDefinition) return { fieldLabelMap, fieldMetaMap, subQuestionMap };

  try {
    const def = typeof formDefinition === "string" ? JSON.parse(formDefinition) : formDefinition;
    if (def && Array.isArray(def.sections)) {
      for (const section of def.sections) {
        if (Array.isArray(section.fields)) {
          for (const field of section.fields) {
            if (!field || !field.id) continue;
            const fieldLabel = field.label || field.placeholder || "Question";
            fieldLabelMap.set(field.id, fieldLabel);

            const subs: Array<{ id: string; label: string; type?: string }> = [];
            if (Array.isArray(field.subQuestions)) {
              for (const sub of field.subQuestions) {
                if (sub && sub.id) {
                  const subLabel = sub.label || sub.placeholder || "Sub-question";
                  subs.push({ id: sub.id, label: subLabel, type: sub.type });
                  subQuestionMap.set(sub.id, {
                    parentLabel: fieldLabel,
                    subLabel: subLabel,
                  });
                }
              }
            }

            fieldMetaMap.set(field.id, {
              id: field.id,
              label: fieldLabel,
              type: field.type,
              entryLabel: field.entryLabel,
              subQuestions: subs,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Error parsing form definition for question labels:", e);
  }

  return { fieldLabelMap, fieldMetaMap, subQuestionMap };
}

/**
 * Cleans up raw keys or subquestion IDs into readable labels.
 */
function humanizeKey(key: string): string {
  if (!key) return "Field";
  return key
    .replace(/^sub[-_]/i, "Sub ")
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function UserTransactionsClient({
  initialData,
}: UserTransactionsClientProps) {
  const router = useRouter();
  const { transactions, summary } = initialData;
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<UserTransactionItem | null>(null);
  const [receiptModalItem, setReceiptModalItem] =
    useState<UserTransactionItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.formTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.transactionId &&
          tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.recipientEmail &&
          tx.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === "verified") return tx.paymentStatus === "verified";
      if (activeTab === "pending") return tx.paymentStatus === "pending";
      if (activeTab === "rejected") return tx.paymentStatus === "rejected";
      return true;
    });
  }, [transactions, searchTerm, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 font-medium">
            <CreditCard className="w-3.5 h-3.5" />
            Submitted
          </Badge>
        );
    }
  };

  const getNotificationIcon = (type: TransactionNotification["type"]) => {
    switch (type) {
      case "PAYMENT_VERIFIED":
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case "EMAIL_SENT":
        return <Mail className="w-4 h-4 text-blue-500" />;
      case "PAYMENT_PENDING":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "PAYMENT_REJECTED":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Send className="w-4 h-4 text-purple-500" />;
    }
  };

  /**
   * Helper component to render clean answers and sub-questions without raw JSON
   */
  const renderFormattedAnswers = (tx: UserTransactionItem) => {
    const { fieldLabelMap, fieldMetaMap, subQuestionMap } = extractFormQuestionMaps(tx.formDefinition);
    const entries = Object.entries(tx.answers || {});

    if (entries.length === 0) {
      return (
        <p className="text-xs text-muted-foreground italic py-2">
          No form response data recorded for this submission.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => {
          const fieldMeta = fieldMetaMap.get(key);
          const parentLabel =
            key === "name"
              ? "Full Name"
              : key === "email"
              ? "Email Address"
              : fieldLabelMap.get(key) || humanizeKey(key);

          // CASE 1: Team Members (array of objects)
          const isTeamMembers =
            fieldMeta?.type === "team_members" ||
            (Array.isArray(value) &&
              value.length > 0 &&
              typeof value[0] === "object" &&
              value[0] !== null &&
              !("storedFileName" in value[0]) &&
              !("originalFileName" in value[0]) &&
              !("webViewLink" in value[0]));

          if (isTeamMembers) {
            const members = (Array.isArray(value) ? value : []).filter(
              (m): m is Record<string, any> => typeof m === "object" && m !== null
            );
            const subs = fieldMeta?.subQuestions || [];
            return (
              <div
                key={key}
                className="p-3.5 rounded-xl border border-border/70 bg-card/60 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>{parentLabel} ({members.length})</span>
                </div>

                <div className="space-y-2">
                  {members.map((member, mIdx) => (
                    <div key={mIdx} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                      <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                        {fieldMeta?.entryLabel || "Member"} #{mIdx + 1}{mIdx === 0 ? " (Leader)" : ""}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {subs.length > 0
                          ? subs.map((sub) => (
                              <div key={sub.id} className="p-2 rounded-lg bg-background border text-xs">
                                <span className="text-[10px] text-muted-foreground font-medium block">
                                  {sub.label}
                                </span>
                                <span className="font-semibold text-foreground mt-0.5">
                                  {String(member[sub.id] || "—")}
                                </span>
                              </div>
                            ))
                          : Object.entries(member).map(([subK, subV]) => {
                              const subInfo = subQuestionMap.get(subK);
                              const subLabel = subInfo ? subInfo.subLabel : humanizeKey(subK);
                              return (
                                <div key={subK} className="p-2 rounded-lg bg-background border text-xs">
                                  <span className="text-[10px] text-muted-foreground font-medium block">
                                    {subLabel}
                                  </span>
                                  <span className="font-semibold text-foreground mt-0.5">
                                    {String(subV ?? "—")}
                                  </span>
                                </div>
                              );
                            })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // CASE 2: File Upload
          const isFileUpload =
            fieldMeta?.type === "file_upload" ||
            (typeof value === "object" &&
              value !== null &&
              ("storedFileName" in value || "originalFileName" in value || "webViewLink" in value)) ||
            (Array.isArray(value) &&
              value.length > 0 &&
              typeof value[0] === "object" &&
              value[0] !== null &&
              ("storedFileName" in value[0] || "originalFileName" in value[0] || "webViewLink" in value[0]));

          if (isFileUpload) {
            const fileItems: any[] = Array.isArray(value) ? value : value ? [value] : [];
            return (
              <div
                key={key}
                className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
              >
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  {parentLabel}
                </span>
                <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end pl-3 sm:pl-0">
                  {fileItems.length === 0 ? (
                    <span className="text-muted-foreground italic">No file uploaded</span>
                  ) : (
                    fileItems.map((fObj, fIdx) => {
                      const fileName =
                        fObj?.originalFileName || fObj?.storedFileName || fObj?.name || `Attachment ${fIdx + 1}`;
                      const link = fObj?.webViewLink || fObj?.downloadLink;
                      if (link) {
                        return (
                          <a
                            key={fIdx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline bg-primary/10 px-2 py-0.5 rounded text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="max-w-[180px] truncate">{fileName}</span>
                          </a>
                        );
                      }
                      return (
                        <span
                          key={fIdx}
                          className="inline-flex items-center gap-1 font-semibold text-foreground bg-muted px-2 py-0.5 rounded text-xs"
                        >
                          <span className="max-w-[180px] truncate">{fileName}</span>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            );
          }

          // CASE 3: Sub-Questions Object (e.g. { "sub-9d4kvxbu": "MALE", "sub-123": "CSE" })
          let parsedSubObj: Record<string, any> | null = null;
          if (value && typeof value === "object" && !Array.isArray(value)) {
            parsedSubObj = value as Record<string, any>;
          } else if (typeof value === "string" && (value.trim().startsWith("{") && value.trim().endsWith("}"))) {
            try {
              const obj = JSON.parse(value);
              if (obj && typeof obj === "object" && !Array.isArray(obj)) {
                parsedSubObj = obj;
              }
            } catch {}
          }

          if (parsedSubObj) {
            const subEntries = Object.entries(parsedSubObj);
            return (
              <div
                key={key}
                className="p-3.5 rounded-xl border border-border/70 bg-card/60 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>{parentLabel}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 border-l-2 border-primary/20">
                  {subEntries.map(([subId, subVal]) => {
                    const subInfo = subQuestionMap.get(subId);
                    const subLabel =
                      fieldMeta?.subQuestions?.find((s) => s.id === subId)?.label ||
                      subInfo?.subLabel ||
                      humanizeKey(subId);
                    const valText = typeof subVal === "object" ? JSON.stringify(subVal) : String(subVal ?? "N/A");

                    return (
                      <div
                        key={subId}
                        className="p-2 rounded-lg bg-muted/40 border border-border/40 text-xs flex flex-col justify-center"
                      >
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {subLabel}
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 break-words">
                          {valText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // CASE 4: Single question / value
          const subInfo = subQuestionMap.get(key);
          const displayLabel = subInfo ? `${subInfo.parentLabel} → ${subInfo.subLabel}` : parentLabel;
          let displayValue = "N/A";
          if (Array.isArray(value)) {
            displayValue = value
              .map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)))
              .join(", ");
          } else if (typeof value === "boolean") {
            displayValue = value ? "Yes" : "No";
          } else if (typeof value === "object" && value !== null) {
            const pairs = Object.entries(value as Record<string, unknown>)
              .map(([k, v]) => `${humanizeKey(k)}: ${String(v ?? "N/A")}`)
              .join(" • ");
            displayValue = pairs || "N/A";
          } else if (value !== undefined && value !== null) {
            displayValue = String(value).trim() || "N/A";
          }

          return (
            <div
              key={key}
              className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
            >
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                {displayLabel}
              </span>
              <span className="font-semibold text-foreground sm:text-right break-all pl-3 sm:pl-0">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      {/* ── Top Header & Title ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Transaction History
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your payment records, view transaction receipts, and track
            verification updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs h-9 gap-1.5 rounded-xl border-border/80 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            Refresh Records
          </Button>
        </div>
      </div>

      {/* ── Financial Stats Overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
              <ReceiptText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total Transactions
              </p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                {summary.totalTransactions}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Verified Payments
              </p>
              <p className="text-xl sm:text-2xl font-black text-emerald-500 mt-0.5">
                {summary.verifiedCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Pending Review
              </p>
              <p className="text-xl sm:text-2xl font-black text-amber-500 mt-0.5">
                {summary.pendingCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total Paid Amount
              </p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                ₹{summary.totalPaidAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-xs rounded-lg">
              All ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="text-xs rounded-lg">
              Verified ({summary.verifiedCount})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs rounded-lg">
              Pending ({summary.pendingCount})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs rounded-lg">
              Rejected ({summary.rejectedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Form, Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-9 bg-card border-border/80 rounded-xl"
            />
          </div>
          <SilentRefreshButton toastMessage="Transactions refreshed silently" />
        </div>
      </div>

      {/* ── Transactions List ── */}
      {filteredTransactions.length === 0 ? (
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No Transactions Found
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
              {searchTerm
                ? "No transactions matched your search query. Try searching with different terms."
                : "You haven't submitted any payment-linked forms with a valid Transaction ID yet. Your transactions will appear here once submitted."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTransactions.map((tx) => (
            <Card
              key={tx.id}
              className="border-border/60 hover:border-primary/40 transition-colors shadow-xs group rounded-2xl"
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Title & Reference Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {tx.formTitle}
                      </h3>
                      {getStatusBadge(tx.paymentStatus)}
                      {tx.paymentAmount > 0 && (
                        <span className="font-bold text-base text-foreground sm:hidden">
                          ₹{tx.paymentAmount}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-foreground">
                          {tx.referenceNumber}
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(tx.referenceNumber, `ref-${tx.id}`)
                          }
                          className="hover:text-foreground cursor-pointer transition-colors"
                          title="Copy reference number"
                        >
                          {copiedKey === `ref-${tx.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {tx.transactionId && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">
                            UPI Ref:
                          </span>
                          <span className="font-mono text-foreground font-medium">
                            {tx.transactionId}
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(tx.transactionId!, `tx-${tx.id}`)
                            }
                            className="hover:text-foreground cursor-pointer transition-colors"
                            title="Copy transaction ID"
                          >
                            {copiedKey === `tx-${tx.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Latest status / message notification snippet */}
                    {tx.notifications.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          {
                            tx.notifications[tx.notifications.length - 1]
                              .message
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Amount & Action Buttons */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                    <div className="hidden sm:block text-right mr-3">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-xl font-bold text-foreground">
                        ₹{tx.paymentAmount.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTransaction(tx)}
                        className="text-xs h-9 gap-1.5 flex-1 sm:flex-none border-border/80 rounded-xl cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details &amp; Msgs
                      </Button>

                      {tx.paymentStatus === "verified" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push(`/dashboard/tranasction/reciept/${tx.id}`)}
                          className="text-xs h-9 gap-1.5 flex-1 sm:flex-none rounded-xl cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Transaction Details & Messages Right Sidebar Drawer ── */}
      <Sheet
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl overflow-hidden"
        >
          {selectedTransaction && (
            <>
              {/* Drawer Header */}
              <div className="p-6 border-b border-border/60 bg-muted/20 shrink-0">
                <SheetHeader>
                  <div className="flex items-start justify-between gap-3 pr-6">
                    <div>
                      <SheetTitle className="text-lg font-bold text-foreground leading-tight">
                        {selectedTransaction.formTitle}
                      </SheetTitle>
                      <SheetDescription className="text-xs mt-1 font-mono">
                        Invoice Ref: {selectedTransaction.referenceNumber}
                      </SheetDescription>
                    </div>
                    {getStatusBadge(selectedTransaction.paymentStatus)}
                  </div>
                </SheetHeader>
              </div>

              {/* Drawer Body with Smooth Independent Scrolling and Hidden Scrollbar */}
              <div
                data-lenis-prevent
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                onWheel={(event) => event.stopPropagation()}
                onTouchMoveCapture={(event) => event.stopPropagation()}
              >
                {/* Key Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                    <p className="text-xs text-muted-foreground font-medium">Amount Paid</p>
                    <p className="text-lg font-black text-foreground mt-0.5">
                      ₹{selectedTransaction.paymentAmount}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                    <p className="text-xs text-muted-foreground font-medium">
                      Transaction ID
                    </p>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <p className="text-xs font-mono font-bold text-foreground truncate">
                        {selectedTransaction.transactionId || "N/A"}
                      </p>
                      {selectedTransaction.transactionId && (
                        <button
                          onClick={() =>
                            handleCopy(
                              selectedTransaction.transactionId!,
                              "drawer-tx"
                            )
                          }
                          className="hover:text-foreground cursor-pointer text-muted-foreground"
                          title="Copy ID"
                        >
                          {copiedKey === "drawer-tx" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 col-span-2 sm:col-span-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Submission Date
                    </p>
                    <p className="text-xs font-semibold text-foreground mt-1">
                      {new Date(
                        selectedTransaction.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Messages & Notifications Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-bold text-foreground">
                      Messages &amp; Notification Timeline
                    </h4>
                  </div>

                  <div className="space-y-3 border-l-2 border-primary/20 pl-4 ml-2">
                    {selectedTransaction.notifications.map((notif) => (
                      <div key={notif.id} className="relative group space-y-1">
                        <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-background border-2 border-primary flex items-center justify-center" />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            {getNotificationIcon(notif.type)}
                            {notif.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(notif.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submitted Answers with Sub-Question Formatting */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      Submitted Form Responses
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      {Object.keys(selectedTransaction.answers || {}).length} responses
                    </span>
                  </div>

                  {renderFormattedAnswers(selectedTransaction)}
                </div>
              </div>

              {/* Drawer Sticky Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                  className="rounded-xl text-xs"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {selectedTransaction.paymentStatus === "verified" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        const txId = selectedTransaction.id;
                        setSelectedTransaction(null);
                        router.push(`/dashboard/tranasction/reciept/${txId}`);
                      }}
                      className="gap-1.5 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Receipt Page
                    </Button>
                  ) : (
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border">
                      {selectedTransaction.paymentStatus === "rejected"
                        ? "Transaction Rejected"
                        : "Receipt available once approved"}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Official Printable Receipt Viewer Dialog (Matching Admin Layout) ── */}
      <Dialog
        open={!!receiptModalItem}
        onOpenChange={(open) => !open && setReceiptModalItem(null)}
      >
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:border-none print:shadow-none bg-background">
          {receiptModalItem && (
            <div className="space-y-6">
              {/* Receipt Header Toolbar */}
              <div className="flex items-center justify-between gap-4 print:hidden border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Official Payment Receipt
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Ref: {receiptModalItem.referenceNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/tranasction/reciept/${receiptModalItem.id}`)}
                    className="h-8 text-xs gap-1.5 rounded-xl bg-primary text-primary-foreground cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Full Page
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReceiptModalItem(null)}
                    className="h-8 text-xs rounded-xl cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Printable Receipt Paper Body (Admin Consistent Design) */}
              <article
                id="printable-receipt-card"
                className="w-full bg-[#FAF9F5] text-[#0C0A09] rounded-2xl border border-[#E7E5DE] p-8 sm:p-12 font-mono shadow-xl relative overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0"
              >
                {/* Verified Watermark Stamp */}
                <div className="absolute top-8 right-8 sm:top-12 sm:right-12 opacity-10 pointer-events-none select-none rotate-[-12deg]">
                  <div className="border-4 border-[#16A34A] text-[#16A34A] rounded-xl px-4 py-2 text-3xl font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="h-8 w-8" />
                    VERIFIED
                  </div>
                </div>

                {/* Header */}
                <header className="flex flex-col gap-8 pb-8 border-b border-[#E7E5DE]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0p-1">
                        <Image
                          src="/assets/logo.png"
                          alt="CodeBreakers Logo"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-base text-[#0C0A09] leading-tight">
                          CodeBreakers
                        </h3>
                        <p className="text-[11px] text-[#57534E] font-sans">
                          GCEK Bhawanipatna
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest text-[#0C0A09]">
                        INVOICE
                      </h2>
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full font-sans">
                        <CheckCircle2 className="h-3.5 w-3.5" /> PAID &amp; APPROVED
                      </span>
                    </div>
                  </div>

                  {/* Invoice Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed text-[#44403C] pt-2">
                    <div>
                      <p>
                        <span className="text-[#78716C] uppercase text-[10px] font-bold tracking-wider block">
                          Reference Number
                        </span>{" "}
                        <strong className="text-[#0C0A09]">
                          {receiptModalItem.referenceNumber}
                        </strong>
                      </p>
                      <p className="mt-1">
                        <span className="text-[#78716C] uppercase text-[10px] font-bold tracking-wider block">
                          Date Issued
                        </span>{" "}
                        {new Date(receiptModalItem.verifiedAt || receiptModalItem.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p>
                        <span className="text-[#78716C] uppercase text-[10px] font-bold tracking-wider block">
                          Payment Method
                        </span>{" "}
                        UPI
                      </p>
                      <p className="mt-1">
                        <span className="text-[#78716C] uppercase text-[10px] font-bold tracking-wider block">
                          Transaction ID
                        </span>{" "}
                        <span className="font-semibold text-[#0C0A09] font-mono">
                          {receiptModalItem.transactionId || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                </header>

                {/* Addresses Section */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-[#E7E5DE] text-xs leading-relaxed">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[10px] text-[#78716C] mb-2 font-sans">
                      FROM
                    </p>
                    <p className="font-bold text-[#0C0A09]">CodeBreakers</p>
                    <p>Government College of Engineering Kalahandi</p>
                    <p>Bhawanipatna, Odisha 766002</p>
                    <p className="text-[#78716C] mt-1">Tax ID: CB-1029384756</p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-bold uppercase tracking-wider text-[10px] text-[#78716C] mb-2 font-sans">
                      BILL TO
                    </p>
                    <p className="font-bold text-[#0C0A09]">
                      {receiptModalItem.recipientName}
                    </p>
                    <p className="text-[#44403C]">{receiptModalItem.recipientEmail}</p>
                    {receiptModalItem.recipientPhone && (
                      <p className="text-[#44403C]">{receiptModalItem.recipientPhone}</p>
                    )}
                  </div>
                </section>

                {/* Line Items Table */}
                <section className="py-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#E7E5DE] text-[#0C0A09] font-bold uppercase text-[11px]">
                          <th className="p-3 rounded-l-lg">Description</th>
                          <th className="p-3 text-right">Units</th>
                          <th className="p-3 text-right">Unit Cost</th>
                          <th className="p-3 text-right rounded-r-lg">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7E5DE]">
                        <tr>
                          <td className="p-3 font-semibold text-[#0C0A09]">
                            {receiptModalItem.formTitle}
                          </td>
                          <td className="p-3 text-right text-[#44403C]">1</td>
                          <td className="p-3 text-right text-[#44403C]">
                            ₹{(receiptModalItem.paymentAmount || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold text-[#0C0A09]">
                            ₹{(receiptModalItem.paymentAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Calculations & Totals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                    <div className="text-xs text-[#78716C] space-y-1">
                      <p>
                        Form ID:{" "}
                        <span className="font-mono text-[#0C0A09]">
                          {receiptModalItem.formId}
                        </span>
                      </p>
                      <p>
                        Status:{" "}
                        <span className="text-[#16A34A] font-semibold">
                          Payment Verified &amp; Official Receipt Issued
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-[#44403C]">
                        <span>Net Amount:</span>
                        <span>₹{(receiptModalItem.paymentAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#44403C]">
                        <span>Discount:</span>
                        <span>₹0.00</span>
                      </div>
                      <div className="border-y-2 border-[#0C0A09] py-2.5 flex justify-between font-bold text-sm text-[#0C0A09] uppercase">
                        <span>Total Amount Paid:</span>
                        <span>₹{(receiptModalItem.paymentAmount || 0).toFixed(2)} (PAID)</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Footer Notes */}
                <footer className="pt-8 border-t border-[#E7E5DE] text-[11px] text-[#78716C] leading-relaxed">
                  <p className="font-bold text-[#0C0A09] mb-1">
                    Thank you for your registration and support!
                  </p>
                  <p>
                    This is a computer-generated receipt issued by CodeBreakers, Government College of Engineering Kalahandi.
                  </p>
                </footer>
              </article>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
