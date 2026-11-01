"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TransactionItem,
  PaymentFormOption,
  FormTransactionSummary,
  resendTransactionReceipt,
} from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  Download,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Calendar,
  User,
  CreditCard,
  Tag,
  Loader2,
  MoreVertical,
  AlertTriangle,
  IndianRupee,
  Filter,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  Layers,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TransactionsClientProps {
  initialTransactions: TransactionItem[];
  initialPaymentForms?: PaymentFormOption[];
  initialFormsSummary?: FormTransactionSummary[];
}

export function TransactionsClient({
  initialTransactions,
  initialPaymentForms = [],
  initialFormsSummary = [],
}: TransactionsClientProps) {
  const router = useRouter();
  const [transactions] = useState<TransactionItem[]>(initialTransactions);
  const [paymentForms] = useState<PaymentFormOption[]>(initialPaymentForms);
  const [formsSummary] = useState<FormTransactionSummary[]>(initialFormsSummary);

  // Active form view: null means "All Forms Overview", string formId means "Viewing Form Details"
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // Filters for All Forms View
  const [formSearchQuery, setFormSearchQuery] = useState("");

  // Filters for Transactions View
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sheet / Drawer for single transaction response view
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Overall Statistics calculation (across all forms)
  const globalStats = useMemo(() => {
    let totalVerifiedRevenue = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let fakeCount = 0;

    for (const tx of transactions) {
      if (tx.paymentStatus === "verified") {
        totalVerifiedRevenue += tx.paymentAmount;
        verifiedCount++;
      } else if (tx.paymentStatus === "pending") {
        pendingCount++;
      }
      if (tx.isFakeOrSuspicious) {
        fakeCount++;
      }
    }

    return {
      totalVerifiedRevenue,
      verifiedCount,
      pendingCount,
      fakeCount,
      totalCount: transactions.length,
      totalFormsCount: formsSummary.length,
    };
  }, [transactions, formsSummary]);

  // Selected Form's Summary
  const activeFormSummary = useMemo(() => {
    if (!selectedFormId) return null;
    return formsSummary.find((f) => f.formId === selectedFormId) || null;
  }, [selectedFormId, formsSummary]);

  // Filtered Forms for the Overview View
  const filteredFormsSummary = useMemo(() => {
    if (!formSearchQuery.trim()) return formsSummary;
    const q = formSearchQuery.toLowerCase().trim();
    return formsSummary.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.formId.toLowerCase().includes(q)
    );
  }, [formsSummary, formSearchQuery]);

  // Filtered Transactions for the Selected Form's Details View
  const filteredFormTransactions = useMemo(() => {
    if (!selectedFormId) return [];

    return transactions.filter((tx) => {
      if (tx.formId !== selectedFormId) return false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.recipientName.toLowerCase().includes(q) ||
        tx.recipientEmail.toLowerCase().includes(q) ||
        tx.receiptNumber.toLowerCase().includes(q) ||
        (tx.transactionId && tx.transactionId.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === "verified") {
        matchesStatus = tx.paymentStatus === "verified";
      } else if (statusFilter === "pending") {
        matchesStatus = tx.paymentStatus === "pending";
      } else if (statusFilter === "rejected") {
        matchesStatus = tx.paymentStatus === "rejected";
      } else if (statusFilter === "fake") {
        matchesStatus =
          tx.isFakeOrSuspicious || (!tx.transactionId && tx.paymentStatus !== "verified");
      }

      return matchesSearch && matchesStatus;
    });
  }, [transactions, selectedFormId, searchQuery, statusFilter]);

  // Export CSV for a given form
  const handleExportFormCSV = (formId: string, formTitle: string) => {
    const formTxs = transactions.filter((tx) => tx.formId === formId);
    const headers = [
      "Sl No.",
      "Name",
      "Email",
      "Form Title",
      "Form ID",
      "Receipt Number",
      "Transaction ID",
      "Amount (INR)",
      "Status",
      "Validity",
      "Submitted At",
      "Verified At",
    ];
    const rows = formTxs.map((tx, idx) => [
      idx + 1,
      `"${tx.recipientName.replace(/"/g, '""')}"`,
      `"${tx.recipientEmail.replace(/"/g, '""')}"`,
      `"${tx.formTitle.replace(/"/g, '""')}"`,
      `"${tx.formId}"`,
      `"${tx.receiptNumber}"`,
      `"${tx.transactionId || "N/A"}"`,
      tx.paymentAmount.toFixed(2),
      tx.paymentStatus.toUpperCase(),
      tx.paymentStatus === "verified"
        ? "VALID"
        : tx.isFakeOrSuspicious
        ? "SUSPICIOUS/FAKE"
        : "UNVERIFIED",
      `"${new Date(tx.createdAt).toLocaleString("en-IN")}"`,
      `"${tx.verifiedAt ? new Date(tx.verifiedAt).toLocaleString("en-IN") : "N/A"}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    const formPrefix = formTitle.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute(
      "download",
      `Transactions_${formPrefix}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResendReceipt = async (txId: string) => {
    setResendingId(txId);
    try {
      const res = await resendTransactionReceipt(txId);
      if (res.success) {
        alert(res.message || "Receipt re-sent successfully!");
      } else {
        alert(res.error || "Failed to resend receipt.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* VIEW 1: ALL FORMS TRANSACTIONS & COLLECTION OVERVIEW       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {!selectedFormId && (
        <div className="space-y-6">
          {/* Top Level Global Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Verified Revenue
                  </p>
                  <h3 className="text-xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    ₹{globalStats.totalVerifiedRevenue.toFixed(2)}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Verified Transactions
                  </p>
                  <h3 className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                    {globalStats.verifiedCount}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      / {globalStats.totalCount}
                    </span>
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Payment Forms
                  </p>
                  <h3 className="text-xl font-bold mt-1 text-foreground">
                    {globalStats.totalFormsCount}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Layers className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Pending Verification
                  </p>
                  <h3 className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                    {globalStats.pendingCount}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forms List Header & Search */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Form Transactions & Collections</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Select a form to view its individual participant transaction responses and receipts.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search forms by title or ID..."
                      value={formSearchQuery}
                      onChange={(e) => setFormSearchQuery(e.target.value)}
                      className="pl-8 text-xs h-9"
                    />
                  </div>
                  <SilentRefreshButton toastMessage="Transactions refreshed silently" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredFormsSummary.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {formSearchQuery
                      ? "No forms match your search query."
                      : "No forms with payments or transactions found."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="w-[35%]">Form</TableHead>
                        <TableHead>Fee per Entry</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Status Breakdown</TableHead>
                        <TableHead className="text-right">Total Collected</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFormsSummary.map((f, index) => (
                        <TableRow
                          key={f.formId}
                          className="hover:bg-muted/40 cursor-pointer transition-colors"
                          onClick={() => setSelectedFormId(f.formId)}
                        >
                          {/* Serial Number */}
                          <TableCell className="py-4 font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>

                          {/* Form Title & ID */}
                          <TableCell className="py-4 font-medium">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground hover:underline">
                                {f.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                                  {f.formId}
                                </Badge>
                                {f.lastSubmissionDate && (
                                  <span className="text-[11px] text-muted-foreground">
                                    Last entry: {new Date(f.lastSubmissionDate).toLocaleDateString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Fee per entry */}
                          <TableCell className="py-4">
                            <span className="font-mono font-medium text-sm">
                              ₹{f.paymentAmount.toFixed(2)}
                            </span>
                          </TableCell>

                          {/* Submissions count */}
                          <TableCell className="py-4">
                            <span className="font-mono font-medium text-sm">
                              {f.totalSubmissions}
                            </span>
                          </TableCell>

                          {/* Status breakdown */}
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-xs gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                {f.verifiedCount} Paid
                              </Badge>

                              {f.pendingCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-xs gap-1"
                                >
                                  <Clock className="h-3 w-3" />
                                  {f.pendingCount} Pending
                                </Badge>
                              )}

                              {f.fakeOrSuspiciousCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/40 text-xs gap-1"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {f.fakeOrSuspiciousCount} Unverified
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Total collected */}
                          <TableCell className="py-4 text-right">
                            <div className="space-y-0.5">
                              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                ₹{f.totalCollectedRevenue.toFixed(2)}
                              </span>
                            </div>
                          </TableCell>

                          {/* Action Dropdown Menu */}
                          <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 text-xs">
                                  <DropdownMenuItem
                                    onClick={() => setSelectedFormId(f.formId)}
                                    className="cursor-pointer font-medium"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleExportFormCSV(f.formId, f.title)}
                                    className="cursor-pointer"
                                  >
                                    <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                    Export CSV
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(`/admin/forms/${f.formId}/responses`)
                                    }
                                    className="cursor-pointer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                    Open Form Responses
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* VIEW 2: SELECTED FORM TRANSACTIONS DETAILS PAGE            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedFormId && activeFormSummary && (
        <div className="space-y-6">
          {/* Back button navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFormId(null);
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="gap-2 text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Forms</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  handleExportFormCSV(activeFormSummary.formId, activeFormSummary.title)
                }
                className="h-8 text-xs gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export Form CSV ({filteredFormTransactions.length})</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(`/admin/forms/${activeFormSummary.formId}/responses`)
                }
                className="h-8 text-xs gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Form Builder & Responses</span>
              </Button>
            </div>
          </div>

          {/* Selected Form Summary Banner */}
          <Card className="border-primary/20 bg-muted/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">
                      {activeFormSummary.formId}
                    </Badge>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      Registration Fee: ₹{activeFormSummary.paymentAmount.toFixed(2)}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {activeFormSummary.title}
                  </h2>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-xs text-muted-foreground font-medium">Total Collected</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{activeFormSummary.totalCollectedRevenue.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border text-xs">
                <div>
                  <p className="text-muted-foreground">Total Transactions</p>
                  <p className="text-sm font-bold font-mono mt-0.5">
                    {activeFormSummary.totalSubmissions}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Verified & Paid</p>
                  <p className="text-sm font-bold font-mono mt-0.5 text-emerald-600 dark:text-emerald-400">
                    {activeFormSummary.verifiedCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending Verification</p>
                  <p className="text-sm font-bold font-mono mt-0.5 text-amber-600 dark:text-amber-400">
                    {activeFormSummary.pendingCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unverified / Dummy</p>
                  <p className="text-sm font-bold font-mono mt-0.5 text-red-600 dark:text-red-400">
                    {activeFormSummary.fakeOrSuspiciousCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Transactions Responses Table */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">
                    Transaction Responses ({filteredFormTransactions.length})
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Individual participant payment submissions, transaction IDs, and receipts.
                  </CardDescription>
                </div>

                <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* Status filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] text-xs h-9">
                      <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="rejected">Rejected Only</SelectItem>
                      <SelectItem value="fake">Unverified / Dummy</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Search query */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search participant, txId..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 text-xs h-9"
                    />
                  </div>

                  <SilentRefreshButton toastMessage="Form transactions refreshed silently" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredFormTransactions.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery || statusFilter !== "all"
                      ? "No transaction responses match your filter criteria."
                      : "No transaction responses recorded for this form yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead>Transaction ID / Receipt</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFormTransactions.map((tx, index) => (
                        <TableRow
                          key={tx.id}
                          className="hover:bg-muted/40 cursor-pointer"
                          onClick={() => setSelectedTx(tx)}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>

                          {/* Participant Name & Email */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm text-foreground">
                                {tx.recipientName}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {tx.recipientEmail}
                              </p>
                            </div>
                          </TableCell>

                          {/* Transaction ID & Receipt */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-mono text-xs font-semibold text-foreground">
                                {tx.transactionId || "—"}
                              </p>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                #{tx.receiptNumber}
                              </p>
                            </div>
                          </TableCell>

                          {/* Amount */}
                          <TableCell>
                            <span className="font-mono font-semibold text-sm">
                              ₹{tx.paymentAmount.toFixed(2)}
                            </span>
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            {tx.paymentStatus === "verified" ? (
                              <Badge
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 flex items-center gap-1 text-xs w-fit"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Verified</span>
                              </Badge>
                            ) : tx.paymentStatus === "rejected" ? (
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1 text-xs w-fit"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>Rejected</span>
                              </Badge>
                            ) : tx.isFakeOrSuspicious ? (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 flex items-center gap-1 text-xs w-fit"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                <span>Unverified / Dummy</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1 text-xs w-fit"
                              >
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </Badge>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setSelectedTx(tx)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => router.push(`/admin/receipt/${tx.id}`)}
                                title="View Receipt"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs">
                                  <DropdownMenuItem onClick={() => setSelectedTx(tx)}>
                                    <Eye className="h-3.5 w-3.5 mr-2" />
                                    View Response Data
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/admin/receipt/${tx.id}`)}
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-2" />
                                    Official Receipt
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={resendingId === tx.id}
                                    onClick={() => handleResendReceipt(tx.id)}
                                  >
                                    {resendingId === tx.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                    ) : (
                                      <Send className="h-3.5 w-3.5 mr-2" />
                                    )}
                                    Resend Receipt Email
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TRANSACTION DETAILS SLIDE-OVER SHEET                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Sheet open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <SheetContent
          side="right"
          className="flex h-full flex-col p-0 sm:max-w-2xl w-full overflow-hidden"
        >
          {selectedTx && (
            <>
              {/* Fixed Header */}
              <div className="shrink-0 border-b bg-background">
                <SheetHeader className="px-6 pt-6 pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Transaction Details
                  </SheetTitle>
                  <SheetDescription>
                    Receipt #{selectedTx.receiptNumber}
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* Scrollable Body */}
              <div
                data-lenis-prevent
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-6"
                onWheel={(e) => e.stopPropagation()}
                onTouchMoveCapture={(e) => e.stopPropagation()}
              >
                {/* Form Details */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Form Details
                  </p>
                  <div className="rounded-md border p-3 bg-muted/40 text-sm space-y-1">
                    <p className="font-semibold">{selectedTx.formTitle}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      Form ID: {selectedTx.formId}
                    </p>
                  </div>
                </div>

                {/* Participant Info */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Participant Details
                  </p>
                  <div className="rounded-md border divide-y text-sm">
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{selectedTx.recipientName}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-mono text-xs">{selectedTx.recipientEmail}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-muted-foreground">Mobile / Contact</span>
                      {(() => {
                        const entry = Object.entries(selectedTx.answers).find(([key]) =>
                          ["mobile", "phone", "contact", "mob", "number", "whatsapp"].some((kw) =>
                            key.toLowerCase().includes(kw)
                          )
                        );
                        const mobile = entry ? String(entry[1]).trim() : null;
                        return mobile ? (
                          <span className="font-mono text-xs">{mobile}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            Not Available
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Payment & Transaction Info
                  </p>
                  <div className="rounded-md border divide-y text-sm">
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-mono font-semibold">
                        ₹{selectedTx.paymentAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-xs font-semibold">
                        {selectedTx.transactionId || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-muted-foreground">Verification Status</span>
                      {selectedTx.paymentStatus === "verified" ? (
                        <Badge
                          variant="outline"
                          className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 flex items-center gap-1 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Verified Real Transaction
                        </Badge>
                      ) : selectedTx.paymentStatus === "rejected" ? (
                        <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                          <XCircle className="h-3 w-3" /> Rejected
                        </Badge>
                      ) : selectedTx.isFakeOrSuspicious ? (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 flex items-center gap-1 text-xs"
                        >
                          <AlertTriangle className="h-3 w-3" /> Unverified / Dummy ID
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" /> Pending Verification
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-muted-foreground">Receipt Reference</span>
                      <span className="font-mono text-xs">#{selectedTx.receiptNumber}</span>
                    </div>
                  </div>
                </div>

                {/* All Submission Answers */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Form Submission Answers
                  </p>
                  <div className="rounded-md border divide-y text-xs">
                    {(() => {
                      const answers = (selectedTx.answers || {}) as Record<string, unknown>;
                      
                      // Extract form field metadata from formDefinition
                      const fieldMap = new Map<
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
                      const orderedFieldKeys: string[] = [];

                      try {
                        const def =
                          typeof selectedTx.formDefinition === "string"
                            ? JSON.parse(selectedTx.formDefinition)
                            : selectedTx.formDefinition;
                        if (def && Array.isArray(def.sections)) {
                          const sortedSections = def.sections.slice().sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                          for (const sec of sortedSections) {
                            if (Array.isArray(sec.fields)) {
                              const sortedFields = sec.fields.slice().sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                              for (const f of sortedFields) {
                                if (!f || !f.id) continue;
                                if (f.type === "button" || f.type === "payment") continue;
                                const fLabel = f.label || f.placeholder || humanizeKey(f.id);
                                const subs: Array<{ id: string; label: string; type?: string }> = [];
                                if (Array.isArray(f.subQuestions)) {
                                  for (const sub of f.subQuestions) {
                                    if (sub && sub.id) {
                                      const sLabel = sub.label || sub.placeholder || humanizeKey(sub.id);
                                      subs.push({ id: sub.id, label: sLabel, type: sub.type });
                                      subQuestionMap.set(sub.id, { parentLabel: fLabel, subLabel: sLabel });
                                    }
                                  }
                                }
                                fieldMap.set(f.id, {
                                  id: f.id,
                                  label: fLabel,
                                  type: f.type,
                                  entryLabel: f.entryLabel,
                                  subQuestions: subs,
                                });
                                orderedFieldKeys.push(f.id);
                              }
                            }
                          }
                        }
                      } catch (e) {
                        console.error("Error parsing form definition in transaction view:", e);
                      }

                      // Determine rendering order of keys
                      const renderedKeys = new Set<string>();
                      const orderedEntries: Array<[string, unknown]> = [];

                      // 1. Name & Email first if present
                      if ("name" in answers && answers.name !== undefined && answers.name !== null && String(answers.name).trim()) {
                        orderedEntries.push(["name", answers.name]);
                        renderedKeys.add("name");
                      }
                      if ("email" in answers && answers.email !== undefined && answers.email !== null && String(answers.email).trim()) {
                        orderedEntries.push(["email", answers.email]);
                        renderedKeys.add("email");
                      }

                      // 2. Form definition fields in section/field order
                      for (const fId of orderedFieldKeys) {
                        if (fId in answers && !renderedKeys.has(fId)) {
                          orderedEntries.push([fId, answers[fId]]);
                          renderedKeys.add(fId);
                        }
                      }

                      // 3. Any remaining keys from answers
                      for (const [k, v] of Object.entries(answers)) {
                        if (!renderedKeys.has(k)) {
                          orderedEntries.push([k, v]);
                          renderedKeys.add(k);
                        }
                      }

                      if (orderedEntries.length === 0) {
                        return (
                          <div className="p-4 text-center text-muted-foreground italic">
                            No answers recorded for this submission.
                          </div>
                        );
                      }

                      return orderedEntries.map(([key, val]) => {
                        const fieldMeta = fieldMap.get(key);
                        const displayQuestionLabel =
                          key === "name"
                            ? "Full Name"
                            : key === "email"
                            ? "Email Address"
                            : fieldMeta?.label || humanizeKey(key);

                        // 1. Check for Team Members (array of objects)
                        const isTeamMembers =
                          fieldMeta?.type === "team_members" ||
                          (Array.isArray(val) &&
                            val.length > 0 &&
                            typeof val[0] === "object" &&
                            val[0] !== null &&
                            !("storedFileName" in val[0]) &&
                            !("originalFileName" in val[0]) &&
                            !("webViewLink" in val[0]));

                        if (isTeamMembers) {
                          const members = (Array.isArray(val) ? val : []).filter(
                            (m): m is Record<string, any> => typeof m === "object" && m !== null
                          );
                          const subs = fieldMeta?.subQuestions || [];
                          return (
                            <div key={key} className="p-3.5 space-y-2.5">
                              <span className="text-foreground font-bold block text-xs">
                                {displayQuestionLabel} ({members.length})
                              </span>
                              {members.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No members submitted</p>
                              ) : (
                                <div className="space-y-2">
                                  {members.map((member, mIdx) => (
                                    <div key={mIdx} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                                      <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                                        {fieldMeta?.entryLabel || "Member"} #{mIdx + 1}
                                        {mIdx === 0 ? " (Leader)" : ""}
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {subs.length > 0
                                          ? subs.map((sub) => {
                                              const subVal = member[sub.id] || "—";
                                              return (
                                                <div
                                                  key={sub.id}
                                                  className="rounded-md bg-background border px-2.5 py-1.5"
                                                >
                                                  <p className="text-[10px] text-muted-foreground font-medium">
                                                    {sub.label}
                                                  </p>
                                                  <p className="text-xs font-semibold text-foreground">
                                                    {String(subVal)}
                                                  </p>
                                                </div>
                                              );
                                            })
                                          : Object.entries(member).map(([subK, subV]) => {
                                              const subInfo = subQuestionMap.get(subK);
                                              const subLabel = subInfo ? subInfo.subLabel : humanizeKey(subK);
                                              return (
                                                <div
                                                  key={subK}
                                                  className="rounded-md bg-background border px-2.5 py-1.5"
                                                >
                                                  <p className="text-[10px] text-muted-foreground font-medium">
                                                    {subLabel}
                                                  </p>
                                                  <p className="text-xs font-semibold text-foreground">
                                                    {String(subV ?? "—")}
                                                  </p>
                                                </div>
                                              );
                                            })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // 2. Check for File Upload
                        const isFileUpload =
                          fieldMeta?.type === "file_upload" ||
                          (typeof val === "object" &&
                            val !== null &&
                            ("storedFileName" in val || "originalFileName" in val || "webViewLink" in val)) ||
                          (Array.isArray(val) &&
                            val.length > 0 &&
                            typeof val[0] === "object" &&
                            val[0] !== null &&
                            ("storedFileName" in val[0] || "originalFileName" in val[0] || "webViewLink" in val[0]));

                        if (isFileUpload) {
                          const fileItems: any[] = Array.isArray(val) ? val : val ? [val] : [];
                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 px-3 py-2.5">
                              <span className="text-muted-foreground font-medium">{displayQuestionLabel}</span>
                              <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                                {fileItems.length === 0 ? (
                                  <span className="text-muted-foreground italic">No file uploaded</span>
                                ) : (
                                  fileItems.map((fObj, fIdx) => {
                                    const fileName =
                                      fObj?.originalFileName ||
                                      fObj?.storedFileName ||
                                      fObj?.name ||
                                      `Attachment ${fIdx + 1}`;
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
                                          <FileText className="h-3 w-3" />
                                          <span className="max-w-[180px] truncate">{fileName}</span>
                                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                                        </a>
                                      );
                                    }
                                    return (
                                      <span
                                        key={fIdx}
                                        className="inline-flex items-center gap-1 font-semibold text-foreground bg-muted px-2 py-0.5 rounded text-xs"
                                      >
                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                        <span className="max-w-[180px] truncate">{fileName}</span>
                                      </span>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        }

                        // 3. Check for Sub-questions object (multi_input)
                        let parsedSub: Record<string, any> | null = null;
                        if (val && typeof val === "object" && !Array.isArray(val)) {
                          parsedSub = val as Record<string, any>;
                        } else if (typeof val === "string" && val.trim().startsWith("{") && val.trim().endsWith("}")) {
                          try {
                            const obj = JSON.parse(val);
                            if (obj && typeof obj === "object" && !Array.isArray(obj)) {
                              parsedSub = obj;
                            }
                          } catch {}
                        }

                        if (parsedSub) {
                          return (
                            <div key={key} className="p-3 space-y-1.5 bg-muted/20">
                              <span className="text-foreground font-bold block text-xs">
                                {displayQuestionLabel}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 border-l-2 border-primary/20">
                                {Object.entries(parsedSub).map(([subK, subV]) => {
                                  const subInfo = subQuestionMap.get(subK);
                                  const subLabel =
                                    fieldMeta?.subQuestions?.find((s) => s.id === subK)?.label ||
                                    subInfo?.subLabel ||
                                    humanizeKey(subK);
                                  return (
                                    <div key={subK} className="p-1.5 rounded bg-background border text-[11px]">
                                      <span className="text-muted-foreground font-medium block">
                                        {subLabel}
                                      </span>
                                      <span className="font-semibold text-foreground">
                                        {String(subV ?? "—")}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // 4. Standard Question & Answer
                        let displayValue = "—";
                        if (Array.isArray(val)) {
                          displayValue = val
                            .map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)))
                            .join(", ");
                        } else if (typeof val === "boolean") {
                          displayValue = val ? "Yes" : "No";
                        } else if (typeof val === "object" && val !== null) {
                          const pairs = Object.entries(val as Record<string, unknown>)
                            .map(([k, v]) => `${humanizeKey(k)}: ${String(v ?? "—")}`)
                            .join(" • ");
                          displayValue = pairs || "—";
                        } else if (val !== undefined && val !== null) {
                          displayValue = String(val).trim() || "—";
                        }

                        return (
                          <div key={key} className="flex justify-between items-center gap-2 px-3 py-2">
                            <span className="text-muted-foreground font-medium">
                              {displayQuestionLabel}
                            </span>
                            <span className="font-semibold text-foreground text-right">
                              {displayValue}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Timeline
                  </p>
                  <div className="rounded-md border divide-y text-sm">
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-muted-foreground">Submitted At</span>
                      <span className="font-mono text-xs">
                        {new Date(selectedTx.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                    {selectedTx.verifiedAt && (
                      <div className="flex justify-between px-3 py-2">
                        <span className="text-muted-foreground">Verified At</span>
                        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                          {new Date(selectedTx.verifiedAt).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="shrink-0 border-t p-4 bg-background flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/receipt/${selectedTx.id}`)}
                >
                  <FileText className="h-4 w-4" />
                  View Receipt
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={resendingId === selectedTx.id}
                  onClick={() => handleResendReceipt(selectedTx.id)}
                >
                  {resendingId === selectedTx.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Resend Email
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
