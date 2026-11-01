/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { joinRoom, onSocketEvent } from "@/lib/socket-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  FileText,
  Loader2,
  Inbox,
  FileSpreadsheet,
  Download,
  HardDrive,
  ImageIcon,
  ExternalLink,
  Calendar as CalendarIcon,
  CalendarRange,
  ChevronDown,
  X,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import {
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  isValid,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
  updateFormResponseStatus,
  updateFormResponsesStatus,
  deleteFormResponse,
  deleteFormResponses,
  type FormResponseSummary,
  type FormDetail,
} from "@/app/admin/forms/actions";

function getResponseName(answers: Record<string, unknown> | null | undefined): string {
  if (!answers) return "N/A";
  if (typeof answers.name === "string" && answers.name.trim()) return answers.name;
  for (const [k, v] of Object.entries(answers)) {
    if (k.toLowerCase().includes("name") && typeof v === "string" && v.trim()) return v;
  }
  return "N/A";
}

function getResponseEmail(answers: Record<string, unknown> | null | undefined): string {
  if (!answers) return "N/A";
  if (typeof answers.email === "string" && answers.email.trim()) return answers.email;
  for (const [k, v] of Object.entries(answers)) {
    if (k.toLowerCase().includes("email") && typeof v === "string" && v.trim()) return v;
  }
  return "N/A";
}

function humanizeKey(key: string): string {
  if (!key) return "Question";
  return key
    .replace(/^field[-_]/i, "Question ")
    .replace(/^sub[-_]/i, "Sub ")
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractAnswerValue(
  answers: Record<string, unknown> | null | undefined,
  fieldId: string,
  subId?: string,
  subLabel?: string,
  subQuestions?: Array<{ id: string; label: string; type?: string }>,
  entryLabel?: string
): string {
  if (!answers) return "—";

  if (fieldId === "name") return getResponseName(answers);
  if (fieldId === "email") return getResponseEmail(answers);

  const raw = answers[fieldId];
  if (raw === undefined || raw === null) return "—";

  if (subId || subLabel) {
    if (typeof raw === "object" && !Array.isArray(raw)) {
      const subObj = raw as Record<string, unknown>;
      const val = subId ? subObj[subId] ?? (subLabel ? subObj[subLabel] : undefined) : subLabel ? subObj[subLabel] : undefined;
      if (val !== undefined && val !== null && String(val).trim()) {
        return String(val).trim();
      }
    }
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    return "—";
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) return "—";
    if (typeof raw[0] === "object" && raw[0] !== null && ("storedFileName" in raw[0] || "originalFileName" in raw[0] || "webViewLink" in raw[0] || "name" in raw[0])) {
      return raw
        .map((f: any) => f.originalFileName || f.storedFileName || f.name || f.webViewLink || "File")
        .filter(Boolean)
        .join(", ");
    }
    if (typeof raw[0] === "object" && raw[0] !== null) {
      return raw
        .map((member: Record<string, any>, idx: number) => {
          const prefix = `${entryLabel || "Member"} #${idx + 1}${idx === 0 ? " (Leader)" : ""}`;
          if (subQuestions && subQuestions.length > 0) {
            const parts = subQuestions
              .map((s) => `${s.label}: ${member[s.id] || "—"}`)
              .join(" | ");
            return `${prefix}: ${parts}`;
          }
          const pairs = Object.entries(member)
            .map(([k, v]) => `${humanizeKey(k)}: ${v || "—"}`)
            .join(" | ");
          return `${prefix}: ${pairs}`;
        })
        .join("\n");
    }
    return raw.map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item))).join(", ");
  }

  if (typeof raw === "object" && raw !== null) {
    const rawObj = raw as Record<string, unknown>;
    if ("storedFileName" in rawObj || "originalFileName" in rawObj || "webViewLink" in rawObj || "name" in rawObj) {
      const f = rawObj as any;
      return f.originalFileName || f.storedFileName || f.name || f.webViewLink || "File";
    }
    const pairs: string[] = [];
    for (const [k, v] of Object.entries(rawObj)) {
      if (v !== undefined && v !== null && String(v).trim()) {
        const keyLabel = subQuestions?.find((s) => s.id === k)?.label || humanizeKey(k);
        pairs.push(`${keyLabel}: ${String(v).trim()}`);
      }
    }
    return pairs.length > 0 ? pairs.join(" • ") : "—";
  }

  return String(raw).trim() || "—";
}

function exportResponses(
  form: FormDetail,
  responsesToExport: FormResponseSummary[],
  options?: {
    formatType?: "xlsx" | "csv";
    filterLabel?: string;
    isAll?: boolean;
    isSelectedOnly?: boolean;
  }
) {
  if (!responsesToExport || responsesToExport.length === 0) {
    toast.error("No responses available to export.");
    return;
  }

  const formatType = options?.formatType || "xlsx";
  const columns: Array<{
    header: string;
    getValue: (res: FormResponseSummary, index: number) => string;
  }> = [
    { header: "S.No.", getValue: (_, i) => String(i + 1) },
    { header: "Response ID", getValue: (r) => `#${r.id.slice(0, 8).toUpperCase()}` },
    {
      header: "Submitted Date & Time",
      getValue: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "N/A"),
    },
  ];

  const formHasPayment = form.definition?.sections?.some((s) =>
    s.fields?.some((f) => f.type === "payment")
  );

  if (formHasPayment || responsesToExport.some((r) => r.transactionId)) {
    columns.push(
      { header: "Payment Status", getValue: (r) => r.paymentStatus || "pending" },
      { header: "Transaction ID", getValue: (r) => r.transactionId || "—" }
    );
  }

  if (form.definition?.settings?.collectName) {
    columns.push({
      header: "Full Name",
      getValue: (r) => getResponseName(r.answers as Record<string, unknown>),
    });
  }

  if (form.definition?.settings?.collectEmail) {
    columns.push({
      header: "Email Address",
      getValue: (r) => getResponseEmail(r.answers as Record<string, unknown>),
    });
  }

  // Iterate sections in order, fields in order
  const sortedSections = (form.definition?.sections || []).slice().sort((a, b) => a.order - b.order);
  sortedSections.forEach((sec) => {
    const sortedFields = (sec.fields || []).slice().sort((a, b) => a.order - b.order);
    sortedFields.forEach((f) => {
      if (f.type === "button" || f.type === "payment") return;

      if (f.type === "file_upload") {
        columns.push({
          header: f.label || "File Upload (Google Drive)",
          getValue: (r) => {
            const filesForField = (r.files || []).filter((file) => file.fieldId === f.id);
            if (filesForField.length > 0) {
              return filesForField
                .map((file) => file.googleDriveWebViewLink || file.googleDriveDownloadLink || file.storedFileName)
                .filter(Boolean)
                .join(", ");
            }
            const raw = (r.answers as Record<string, unknown>)?.[f.id];
            if (Array.isArray(raw) && raw.length > 0) {
              return (
                raw
                  .map((item: any) =>
                    typeof item === "object" && item !== null
                      ? item.webViewLink || item.downloadLink || item.storedFileName || item.originalFileName || ""
                      : String(item)
                  )
                  .filter(Boolean)
                  .join(", ") || "—"
              );
            }
            if (typeof raw === "object" && raw !== null) {
              const item = raw as any;
              return item.webViewLink || item.downloadLink || item.storedFileName || item.originalFileName || "—";
            }
            return "—";
          },
        });
      } else if (f.type === "team_members") {
        const subs = f.subQuestions || [];
        if (subs.length > 0) {
          let maxCount = Math.max(1, f.minEntries || 1);
          responsesToExport.forEach((r) => {
            const rawMembers = (r.answers as Record<string, unknown>)?.[f.id];
            if (Array.isArray(rawMembers)) {
              maxCount = Math.max(maxCount, rawMembers.length);
            }
          });
          if (f.maxEntries) {
            maxCount = Math.min(maxCount, f.maxEntries);
          }

          for (let mIdx = 0; mIdx < maxCount; mIdx++) {
            const memberPrefix = `${f.entryLabel || "Member"} ${mIdx + 1}${mIdx === 0 ? " (Leader)" : ""}`;
            subs.forEach((sub) => {
              const headerLabel = `${f.label ? `${f.label} - ` : ""}${memberPrefix} - ${sub.label}`;
              columns.push({
                header: headerLabel,
                getValue: (r) => {
                  const rawMembers = (r.answers as Record<string, unknown>)?.[f.id];
                  if (!Array.isArray(rawMembers) || !rawMembers[mIdx]) return "—";
                  const member = rawMembers[mIdx];
                  const val = typeof member === "object" && member !== null ? member[sub.id] : undefined;
                  return val !== undefined && val !== null && String(val).trim() ? String(val).trim() : "—";
                },
              });
            });
          }
        } else {
          columns.push({
            header: f.label || "Team Members",
            getValue: (r) =>
              extractAnswerValue(
                r.answers as Record<string, unknown>,
                f.id,
                undefined,
                undefined,
                f.subQuestions,
                f.entryLabel
              ),
          });
        }
      } else if (f.type === "multi_input" && f.subQuestions && f.subQuestions.length > 0) {
        f.subQuestions.forEach((sub) => {
          const headerLabel = f.label ? `${f.label} - ${sub.label}` : sub.label;
          columns.push({
            header: headerLabel,
            getValue: (r) =>
              extractAnswerValue(
                r.answers as Record<string, unknown>,
                f.id,
                sub.id,
                sub.label
              ),
          });
        });
      } else {
        columns.push({
          header: f.label || "Untitled Question",
          getValue: (r) => extractAnswerValue(r.answers as Record<string, unknown>, f.id),
        });
      }
    });
  });

  const headers = columns.map((c) => c.header);
  const rows = responsesToExport.map((r, idx) => columns.map((c) => c.getValue(r, idx)));

  const sheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-adjust column widths
  const colWidths = columns.map((col, colIdx) => {
    let maxLen = col.header.length;
    rows.forEach((row) => {
      const val = String(row[colIdx] || "");
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 70) };
  });

  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

  const cleanTitle = (form.title || "Form").replace(/[^a-zA-Z0-9]/g, "_");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  let filterPart = "";
  if (options?.isSelectedOnly) {
    filterPart = "_Selected";
  } else if (options?.isAll) {
    filterPart = "_All";
  } else if (options?.filterLabel) {
    const cleanFilter = options.filterLabel.replace(/[^a-zA-Z0-9]/g, "_");
    filterPart = `_${cleanFilter}`;
  }
  const fileName = `${cleanTitle}_Responses${filterPart}_${todayStr}.${formatType}`;

  XLSX.writeFile(workbook, fileName, { bookType: formatType });
  toast.success(
    `Exported ${responsesToExport.length} responses to ${formatType.toUpperCase()}`
  );
}

type DateFilterMode = "all" | "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "single" | "range";

interface ResponsesClientProps {
  form: FormDetail;
}

export default function ResponsesClient({ form }: ResponsesClientProps) {
  const router = useRouter();
  const responses = form.responses || [];
  const formHasPayment = form.definition?.sections?.some((s) =>
    s.fields?.some((f) => f.type === "payment")
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "rejected" | "pending">("all");
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("all");
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingResponse, setViewingResponse] = useState<FormResponseSummary | null>(null);
  const [viewingFile, setViewingFile] = useState<any | null>(null);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Supabase Realtime subscription for instant form responses
  useEffect(() => {
    const leaveRoom1 = joinRoom(`form-${form.id}`);
    const leaveRoom2 = joinRoom(`form-${form.formId}`);

    const cleanupListener = onSocketEvent("response-submitted", () => {
      toast.info("New form response received in real-time!");
      router.refresh();
    });

    return () => {
      leaveRoom1();
      leaveRoom2();
      cleanupListener();
    };
  }, [form.id, form.formId, router]);

  // Build ordered field list (questions and sub-questions in exact form order)
  const fieldMap = useMemo(() => {
    const list: Array<{
      fieldId: string;
      subId?: string;
      subLabel?: string;
      label: string;
      sectionTitle: string;
      type?: string;
      subQuestions?: Array<{ id: string; label: string; type?: string }>;
      entryLabel?: string;
    }> = [];

    if (form.definition?.settings?.collectName) {
      list.push({ fieldId: "name", label: "Full Name", sectionTitle: "Personal Information" });
    }
    if (form.definition?.settings?.collectEmail) {
      list.push({ fieldId: "email", label: "Email Address", sectionTitle: "Personal Information" });
    }

    const sortedSections = (form.definition?.sections || []).slice().sort((a, b) => a.order - b.order);
    sortedSections.forEach((sec) => {
      const sortedFields = (sec.fields || []).slice().sort((a, b) => a.order - b.order);
      sortedFields.forEach((f) => {
        if (f.type === "button" || f.type === "payment") return;
        if (f.type === "team_members") {
          list.push({
            fieldId: f.id,
            label: f.label || "Team Members",
            sectionTitle: sec.title,
            type: "team_members",
            subQuestions: (f.subQuestions || []).map((sub) => ({ id: sub.id, label: sub.label, type: sub.type })),
            entryLabel: f.entryLabel || "Member",
          });
        } else if (f.type === "multi_input" && f.subQuestions && f.subQuestions.length > 0) {
          f.subQuestions.forEach((sub) => {
            list.push({
              fieldId: f.id,
              subId: sub.id,
              subLabel: sub.label,
              label: f.label ? `${f.label} → ${sub.label}` : sub.label,
              sectionTitle: sec.title,
            });
          });
        } else {
          list.push({
            fieldId: f.id,
            label: f.label || "Untitled Question",
            sectionTitle: sec.title,
          });
        }
      });
    });

    return list;
  }, [form.definition]);

  // Active Date Filter Label
  const activeDateLabel = useMemo(() => {
    if (dateFilterMode === "all") return "";
    if (dateFilterMode === "today") return "Today";
    if (dateFilterMode === "yesterday") return "Yesterday";
    if (dateFilterMode === "last7") return "Last 7 Days";
    if (dateFilterMode === "last30") return "Last 30 Days";
    if (dateFilterMode === "thisMonth") return "This Month";
    if (dateFilterMode === "single" && singleDate) {
      return format(singleDate, "dd MMM yyyy");
    }
    if (dateFilterMode === "range" && dateRange?.from) {
      if (dateRange.to && !isSameDay(dateRange.from, dateRange.to)) {
        return `${format(dateRange.from, "dd MMM yyyy")} – ${format(dateRange.to, "dd MMM yyyy")}`;
      }
      return format(dateRange.from, "dd MMM yyyy");
    }
    return "";
  }, [dateFilterMode, singleDate, dateRange]);

  // Filtered responses
  const filteredResponses = useMemo(() => {
    return responses.filter((res) => {
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && res.paymentStatus !== "pending" && res.paymentStatus !== "submitted") return false;
        if (statusFilter === "verified" && res.paymentStatus !== "verified") return false;
        if (statusFilter === "rejected" && res.paymentStatus !== "rejected") return false;
      }
      if (dateFilterMode !== "all") {
        const resDate = new Date(res.createdAt);
        if (isValid(resDate)) {
          const now = new Date();
          if (dateFilterMode === "today") {
            if (!isSameDay(resDate, now)) return false;
          } else if (dateFilterMode === "yesterday") {
            if (!isSameDay(resDate, subDays(now, 1))) return false;
          } else if (dateFilterMode === "last7") {
            if (!isWithinInterval(resDate, { start: startOfDay(subDays(now, 6)), end: endOfDay(now) })) return false;
          } else if (dateFilterMode === "last30") {
            if (!isWithinInterval(resDate, { start: startOfDay(subDays(now, 29)), end: endOfDay(now) })) return false;
          } else if (dateFilterMode === "thisMonth") {
            if (!isWithinInterval(resDate, { start: startOfMonth(now), end: endOfMonth(now) })) return false;
          } else if (dateFilterMode === "single") {
            if (singleDate && !isSameDay(resDate, singleDate)) return false;
          } else if (dateFilterMode === "range") {
            if (dateRange?.from) {
              const start = startOfDay(dateRange.from);
              const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
              if (!isWithinInterval(resDate, { start, end })) return false;
            }
          }
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = getResponseName(res.answers as Record<string, unknown>).toLowerCase();
        const email = getResponseEmail(res.answers as Record<string, unknown>).toLowerCase();
        const txId = (res.transactionId || "").toLowerCase();
        return res.id.toLowerCase().includes(q) || name.includes(q) || email.includes(q) || txId.includes(q);
      }
      return true;
    });
  }, [responses, statusFilter, dateFilterMode, singleDate, dateRange, searchQuery]);

  const isAllSelected = filteredResponses.length > 0 && filteredResponses.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResponses.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSingleStatusUpdate = async (id: string, status: string) => {
    setIsLoading(true);
    const r = await updateFormResponseStatus(id, status);
    if (r.status === "success") { toast.success(r.message); router.refresh(); }
    else toast.error(r.message);
    setIsLoading(false);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    const r = await updateFormResponsesStatus(Array.from(selectedIds), status);
    if (r.status === "success") { toast.success(r.message); setSelectedIds(new Set()); router.refresh(); }
    else toast.error(r.message);
    setIsLoading(false);
  };

  const handleSingleDelete = async () => {
    if (!singleDeleteId) return;
    setIsLoading(true);
    const r = await deleteFormResponse(singleDeleteId);
    if (r.status === "success") { toast.success(r.message); setSingleDeleteId(null); router.refresh(); }
    else toast.error(r.message);
    setIsLoading(false);
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    const r = await deleteFormResponses(Array.from(selectedIds));
    if (r.status === "success") {
      toast.success(r.message);
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
      router.refresh();
    } else toast.error(r.message);
    setIsLoading(false);
  };

  const clearAllFilters = () => {
    setDateFilterMode("all");
    setSingleDate(undefined);
    setDateRange(undefined);
    setStatusFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = dateFilterMode !== "all" || statusFilter !== "all" || Boolean(searchQuery.trim());

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <span>Responses</span>
                <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 font-bold">
                  {filteredResponses.length}
                  {filteredResponses.length !== responses.length && ` of ${responses.length}`}
                </Badge>
              </CardTitle>
            </div>

            <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2.5 sm:items-center flex-wrap">
              {/* Bulk actions */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md">
                  <span className="text-xs font-semibold text-primary mr-1">{selectedIds.size} selected</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                    onClick={() => handleBulkStatusUpdate("verified")} disabled={isLoading}>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                    onClick={() => handleBulkStatusUpdate("rejected")} disabled={isLoading}>
                    <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs"
                    onClick={() => setShowBulkDeleteDialog(true)} disabled={isLoading}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              )}

              {/* Date Filter Popover */}
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 text-xs justify-start gap-2 font-normal border-border/80 cursor-pointer",
                      dateFilterMode !== "all"
                        ? "border-primary/50 bg-primary/10 text-primary font-medium hover:bg-primary/15"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate max-w-[170px]">
                      {dateFilterMode === "all" ? "Filter by Date" : activeDateLabel}
                    </span>
                    {dateFilterMode !== "all" ? (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateFilterMode("all");
                          setSingleDate(undefined);
                          setDateRange(undefined);
                        }}
                        className="ml-1 p-0.5 rounded-full hover:bg-primary/20 cursor-pointer"
                        title="Clear date filter"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-auto" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 shadow-2xl border-border" align="end">
                  <div className="p-3 border-b border-border/60 bg-muted/20 flex flex-col gap-2.5 max-w-[340px]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                        Date Filter
                      </span>
                      {dateFilterMode !== "all" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDateFilterMode("all");
                            setSingleDate(undefined);
                            setDateRange(undefined);
                          }}
                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <Button
                        variant={dateFilterMode === "today" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateFilterMode("today")}
                        className="h-7 text-[11px] px-2 cursor-pointer"
                      >
                        Today
                      </Button>
                      <Button
                        variant={dateFilterMode === "yesterday" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateFilterMode("yesterday")}
                        className="h-7 text-[11px] px-2 cursor-pointer"
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant={dateFilterMode === "last7" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateFilterMode("last7")}
                        className="h-7 text-[11px] px-2 cursor-pointer"
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        variant={dateFilterMode === "last30" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateFilterMode("last30")}
                        className="h-7 text-[11px] px-2 cursor-pointer"
                      >
                        Last 30 Days
                      </Button>
                      <Button
                        variant={dateFilterMode === "thisMonth" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateFilterMode("thisMonth")}
                        className="h-7 text-[11px] px-2 cursor-pointer"
                      >
                        This Month
                      </Button>
                      <Button
                        variant={dateFilterMode === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setDateFilterMode("all");
                          setSingleDate(undefined);
                          setDateRange(undefined);
                        }}
                        className="h-7 text-[11px] px-2 cursor-pointer"
                      >
                        All Time
                      </Button>
                    </div>

                    {/* Mode Toggle: Single Day vs Date Range */}
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg text-xs mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDateFilterMode("single");
                          if (!singleDate) setSingleDate(new Date());
                        }}
                        className={cn(
                          "flex-1 py-1 px-2 text-center font-medium rounded-md transition-all cursor-pointer text-xs",
                          dateFilterMode === "single"
                            ? "bg-background text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Single Day
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDateFilterMode("range");
                          if (!dateRange?.from) {
                            setDateRange({ from: subDays(new Date(), 7), to: new Date() });
                          }
                        }}
                        className={cn(
                          "flex-1 py-1 px-2 text-center font-medium rounded-md transition-all cursor-pointer text-xs",
                          dateFilterMode === "range"
                            ? "bg-background text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Date Range
                      </button>
                    </div>
                  </div>

                  {/* Calendar view for custom selection */}
                  <div className="p-2 flex justify-center">
                    {dateFilterMode === "range" ? (
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateFilterMode("range");
                          setDateRange(range);
                        }}
                        numberOfMonths={1}
                        className="rounded-md"
                      />
                    ) : (
                      <Calendar
                        mode="single"
                        selected={singleDate}
                        onSelect={(day) => {
                          if (day) {
                            setDateFilterMode("single");
                            setSingleDate(day);
                          }
                        }}
                        className="rounded-md"
                      />
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground truncate max-w-[200px] font-mono">
                      {activeDateLabel ? `Filtered: ${activeDateLabel}` : "No date filter"}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs cursor-pointer"
                      onClick={() => setIsDatePopoverOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Enhanced Export Dropdown with Date Filter Support */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 rounded-md shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export ({filteredResponses.length})</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-80 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-xs">
                    Export Filtered ({filteredResponses.length} rows)
                    {activeDateLabel && (
                      <span className="block text-[10px] font-normal text-muted-foreground font-mono mt-0.5">
                        📅 {activeDateLabel}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      exportResponses(form, filteredResponses, {
                        formatType: "xlsx",
                        filterLabel: activeDateLabel,
                      })
                    }
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                    <span>Export to Excel (.xlsx)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      exportResponses(form, filteredResponses, {
                        formatType: "csv",
                        filterLabel: activeDateLabel,
                      })
                    }
                  >
                    <FileText className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Export to CSV (.csv)</span>
                  </DropdownMenuItem>

                  {selectedIds.size > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">
                        Export Selected ({selectedIds.size} rows)
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          const selectedList = responses.filter((r) => selectedIds.has(r.id));
                          exportResponses(form, selectedList, {
                            formatType: "xlsx",
                            filterLabel: "Selected",
                            isSelectedOnly: true,
                          });
                        }}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                        <span>Export Selected to Excel</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          const selectedList = responses.filter((r) => selectedIds.has(r.id));
                          exportResponses(form, selectedList, {
                            formatType: "csv",
                            filterLabel: "Selected",
                            isSelectedOnly: true,
                          });
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4 text-blue-600" />
                        <span>Export Selected to CSV</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {hasActiveFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">
                        Export All Records ({responses.length} total)
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          exportResponses(form, responses, {
                            formatType: "xlsx",
                            isAll: true,
                          })
                        }
                      >
                        <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Export All to Excel (.xlsx)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          exportResponses(form, responses, {
                            formatType: "csv",
                            isAll: true,
                          })
                        }
                      >
                        <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Export All to CSV (.csv)</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search */}
              <div className="relative w-full sm:w-auto sm:min-w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              <SilentRefreshButton toastMessage="Form responses refreshed silently" />
            </div>
          </div>

          {/* Active Filter Chips & Clear All */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Active Filters:
              </span>
              {dateFilterMode !== "all" && (
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-normal bg-primary/10 text-primary border border-primary/25">
                  <CalendarIcon className="h-3 w-3 text-primary" />
                  <span>Date: {activeDateLabel}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilterMode("all");
                      setSingleDate(undefined);
                      setDateRange(undefined);
                    }}
                    className="hover:text-destructive cursor-pointer ml-1"
                    title="Remove date filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-normal">
                  <span>Status: {statusFilter === "verified" ? "Approved" : statusFilter}</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className="hover:text-destructive cursor-pointer ml-1"
                    title="Remove status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchQuery.trim() && (
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-normal">
                  <span>Search: &quot;{searchQuery}&quot;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:text-destructive cursor-pointer ml-1"
                    title="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Reset all
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-16">S.No.</TableHead>
                  <TableHead className="min-w-28">Response ID</TableHead>
                  <TableHead className="min-w-40">Name</TableHead>
                  <TableHead className="min-w-48">Email</TableHead>
                  {(formHasPayment || responses.some((r) => r.transactionId)) && (
                    <TableHead className="min-w-36">Transaction ID</TableHead>
                  )}
                  <TableHead className="min-w-24">Status</TableHead>
                  <TableHead className="min-w-28">Submitted</TableHead>
                  <TableHead className="text-right min-w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="h-8 w-8 opacity-30" />
                        <p>{searchQuery || statusFilter !== "all" ? "No responses match your filters." : "No responses yet."}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResponses.map((res, index) => {
                    const resAns = (res.answers as Record<string, unknown>) || {};
                    const nameStr = getResponseName(resAns);
                    const emailStr = getResponseEmail(resAns);
                    const isChecked = selectedIds.has(res.id);

                    return (
                      <TableRow key={res.id} className={isChecked ? "bg-primary/5" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleSelect(res.id)}
                            aria-label={`Select response ${res.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          #{res.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium">{nameStr}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{emailStr}</TableCell>

                        {(formHasPayment || responses.some((r) => r.transactionId)) && (
                          <TableCell className="font-mono text-sm">
                            {res.transactionId ? (
                              <span className="bg-muted px-2 py-0.5 rounded-md font-semibold">{res.transactionId}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )}

                        <TableCell>
                          <Badge
                            variant={res.paymentStatus === "verified" ? "default" : res.paymentStatus === "rejected" ? "destructive" : "secondary"}
                            className="capitalize"
                          >
                            {res.paymentStatus === "verified" ? "Approved" : res.paymentStatus}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(res.createdAt).toLocaleDateString("en-IN")}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingResponse(res)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              {res.paymentStatus === "verified" && Boolean(res.transactionId) && (
                                <DropdownMenuItem className="cursor-pointer"
                                  onClick={() => router.push(`/admin/receipt/${res.id}`)}>
                                  <FileText className="mr-2 h-4 w-4" /> View Receipt
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer text-emerald-600"
                                onClick={() => handleSingleStatusUpdate(res.id, "verified")} disabled={isLoading}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-amber-600"
                                onClick={() => handleSingleStatusUpdate(res.id, "rejected")} disabled={isLoading}>
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => setSingleDeleteId(res.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── RESPONSE DETAILS SHEET ─── */}
      <Sheet open={Boolean(viewingResponse)} onOpenChange={(open) => { if (!open) setViewingResponse(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex h-dvh max-h-screen flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-background">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="flex items-center justify-between">
                <span>Response {viewingResponse ? `#${viewingResponse.id.slice(0, 8).toUpperCase()}` : ""}</span>
                {viewingResponse && (
                  <Badge
                    variant={viewingResponse.paymentStatus === "verified" ? "default" : viewingResponse.paymentStatus === "rejected" ? "destructive" : "secondary"}
                    className="text-xs capitalize mr-12"
                  >
                    {viewingResponse.paymentStatus === "verified" ? "Approved" : viewingResponse.paymentStatus}
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription>
                Submitted on {viewingResponse ? new Date(viewingResponse.createdAt).toLocaleString("en-IN") : ""}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-4"
            onWheel={(e) => e.stopPropagation()}
            onTouchMoveCapture={(e) => e.stopPropagation()}
          >
            {viewingResponse && (
              <div className="space-y-4">
                {viewingResponse.transactionId && (
                  <div className="rounded-md border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Transaction ID</p>
                      <p className="text-sm font-mono font-semibold">{viewingResponse.transactionId}</p>
                    </div>
                    {viewingResponse.paymentStatus === "verified" && (
                      <Button type="button" size="sm" variant="outline"
                        onClick={() => router.push(`/admin/receipt/${viewingResponse.id}`)}>
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> View Receipt
                      </Button>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submitted Answers (In Question Order)</p>
                  <div className="rounded-md border divide-y bg-background">
                    {fieldMap.map((item) => {
                      // Team Members: render as expandable member cards
                      if (item.type === "team_members") {
                        const rawMembers = (viewingResponse.answers as Record<string, unknown>)?.[item.fieldId];
                        const members: Array<Record<string, string>> = Array.isArray(rawMembers)
                          ? rawMembers.filter((m): m is Record<string, string> => typeof m === "object" && m !== null)
                          : [];
                        const subs = item.subQuestions || [];
                        return (
                          <div key={item.fieldId} className="px-3.5 py-3 space-y-2.5">
                            <p className="text-xs font-semibold text-muted-foreground">{item.label} ({members.length})</p>
                            {members.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">No members submitted</p>
                            ) : (
                              <div className="space-y-2">
                                {members.map((member, mIdx) => (
                                  <div key={mIdx} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                                      {item.entryLabel || "Member"} #{mIdx + 1}{mIdx === 0 ? " (Leader)" : ""}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {subs.length > 0 ? subs.map((sub) => {
                                        const val = member[sub.id] || "—";
                                        return (
                                          <div key={sub.id} className="rounded-md bg-background border px-2.5 py-1.5">
                                            <p className="text-[10px] text-muted-foreground font-medium">{sub.label}</p>
                                            <p className="text-xs font-semibold text-foreground">{val}</p>
                                          </div>
                                        );
                                      }) : Object.entries(member).map(([k, v]) => (
                                        <div key={k} className="rounded-md bg-background border px-2.5 py-1.5">
                                          <p className="text-[10px] text-muted-foreground font-medium">
                                            {k.replace(/^sub[-_]/i, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                          </p>
                                          <p className="text-xs font-semibold text-foreground">{String(v || "—")}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const ansVal = extractAnswerValue(
                        viewingResponse.answers as Record<string, unknown>,
                        item.fieldId,
                        item.subId,
                        item.subLabel
                      );
                      return (
                        <div
                          key={item.subId ? `${item.fieldId}:${item.subId}` : item.fieldId}
                          className="px-3.5 py-2.5 space-y-1"
                        >
                          <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium text-foreground">{ansVal}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Attached Files Section */}
                {viewingResponse.files && viewingResponse.files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5 text-primary" />
                      Attached Files ({viewingResponse.files.length})
                    </p>
                    <div className="space-y-2">
                      {viewingResponse.files.map((file) => (
                        <div
                          key={file.id}
                          className="rounded-xl border border-border/80 bg-background p-3 flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              {file.mimeType.startsWith("image/") ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <p className="text-xs font-semibold text-foreground font-mono truncate">
                                {file.storedFileName}
                              </p>
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <span className="truncate max-w-[140px]">{file.originalFileName}</span>
                                <span>•</span>
                                <span>{(file.fileSize / 1024).toFixed(0)} KB</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingFile(file)}
                              className="h-8 text-xs gap-1.5 rounded-lg"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                window.open(
                                  `/api/admin/forms/${form.formId}/files/${file.id}?download=true`,
                                  "_blank"
                                )
                              }
                              className="h-8 text-xs gap-1.5 rounded-lg"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {viewingResponse && (
            <div className="shrink-0 border-t p-4 bg-background flex gap-2">
              <Button size="sm" variant="outline" className="flex-1"
                onClick={() => handleSingleStatusUpdate(viewingResponse.id, "verified")} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />}
                Approve
              </Button>
              <Button size="sm" variant="outline" className="flex-1"
                onClick={() => handleSingleStatusUpdate(viewingResponse.id, "rejected")} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" />}
                Reject
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => { setSingleDeleteId(viewingResponse.id); setViewingResponse(null); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Single Delete Dialog */}
      <AlertDialog open={Boolean(singleDeleteId)} onOpenChange={(open) => { if (!open) setSingleDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Response?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this form response. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDelete} disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Responses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {selectedIds.size} selected responses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Delete (${selectedIds.size})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Interactive File Preview Dialog */}
      <Dialog open={Boolean(viewingFile)} onOpenChange={(open) => { if (!open) setViewingFile(null); }}>
        <DialogContent className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden rounded-2xl border bg-background shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-3 border-b">
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-base font-semibold font-mono">
                  {viewingFile?.storedFileName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                  Original: {viewingFile?.originalFileName} • {viewingFile ? (viewingFile.fileSize / 1024).toFixed(0) : 0} KB
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 bg-muted/20 flex items-center justify-center min-h-[320px] max-h-[68vh] overflow-auto">
            {viewingFile && viewingFile.mimeType?.startsWith("image/") ? (
              // eslint-disable-next-html-img-element
              <img
                src={`/api/admin/forms/${form.formId}/files/${viewingFile.id}`}
                alt={viewingFile.originalFileName}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-md border bg-background"
              />
            ) : viewingFile ? (
              <iframe
                src={`/api/admin/forms/${form.formId}/files/${viewingFile.id}`}
                className="w-full h-[60vh] rounded-xl border bg-background shadow-md"
                title={viewingFile.storedFileName}
              />
            ) : null}
          </div>

          <DialogFooter className="px-6 py-3.5 border-t bg-background flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground font-mono">
              Format: {viewingFile?.mimeType || "image"}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {viewingFile?.googleDriveWebViewLink && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(viewingFile.googleDriveWebViewLink!, "_blank")}
                  className="text-xs gap-1.5 rounded-xl h-9 flex-1 sm:flex-initial"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Google Drive
                </Button>
              )}
              {viewingFile && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/api/admin/forms/${form.formId}/files/${viewingFile.id}?download=true`,
                      "_blank"
                    )
                  }
                  className="text-xs gap-1.5 rounded-xl h-9 flex-1 sm:flex-initial"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
