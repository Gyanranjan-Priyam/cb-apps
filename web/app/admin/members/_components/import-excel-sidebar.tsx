/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Search,
  Layers,
  Sparkles,
  RotateCcw,
  FileCheck,
} from "lucide-react";
import { getActiveBatchesList } from "@/app/admin/batches/actions";
import {
  checkExistingMemberEmails,
  bulkCreateMembersFromExcel,
  ExcelMemberCandidate,
} from "../actions";
import { ASSIGNABLE_ROLES } from "@/lib/member-roles";
import { PREDEFINED_DOMAINS } from "@/lib/specialized-domains";

interface ExtractedCandidate extends ExcelMemberCandidate {
  _id: string;
  _status: "ready" | "existing" | "invalid";
  _statusMessage?: string;
  _selected: boolean;
}

interface ImportExcelSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportExcelSidebar({
  isOpen,
  onClose,
  onSuccess,
}: ImportExcelSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ExtractedCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "ready" | "existing" | "invalid">("all");

  // Global Defaults
  const [defaultBatchId, setDefaultBatchId] = useState<string>("none");
  const [defaultRoles, setDefaultRoles] = useState<string[]>(["Member"]);
  const [defaultDomain, setDefaultDomain] = useState<string>("");
  const [sendWelcomeEmails, setSendWelcomeEmails] = useState(true);
  const [batchesList, setBatchesList] = useState<{ id: string; name: string; code: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      getActiveBatchesList().then((list) => setBatchesList(list));
    }
  }, [isOpen]);

  const resetState = () => {
    setFileName(null);
    setCandidates([]);
    setSearchQuery("");
    setFilterTab("all");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper: Find value from row with multiple possible header keys
  const findValue = (row: Record<string, any>, possibleKeys: string[]): string => {
    const keys = Object.keys(row);
    for (const pKey of possibleKeys) {
      const match = keys.find(
        (k) =>
          k.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ===
          pKey.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
      );
      if (match && row[match] !== undefined && row[match] !== null) {
        return String(row[match]).trim();
      }
    }
    return "";
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsParsing(true);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      if (workbook.SheetNames.length === 0) {
        toast.error("The uploaded Excel file contains no sheets.");
        setIsParsing(false);
        return;
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });

      if (rawRows.length === 0) {
        toast.error("No data rows found in the uploaded file.");
        setIsParsing(false);
        return;
      }

      // Extract raw candidates
      const parsedCandidates: ExtractedCandidate[] = rawRows
        .map((row, index) => {
          const email = findValue(row, ["email", "emailaddress", "mail", "e-mail", "email id"]);
          const fullName = findValue(row, ["name", "fullname", "studentname", "candidatename", "membername"]);
          let firstName = findValue(row, ["firstname", "first name", "fname"]);
          const middleName = findValue(row, ["middlename", "middle name", "mname"]);
          let lastName = findValue(row, ["lastname", "last name", "lname", "surname"]);

          if (!firstName && fullName) {
            const parts = fullName.split(" ").filter(Boolean);
            firstName = parts[0] || "";
            if (!lastName && parts.length > 1) {
              lastName = parts.slice(1).join(" ");
            }
          }

          const mobile = findValue(row, ["mobile", "mobilenumber", "phone", "phonenumber", "contact", "contactnumber"]);
          const whatsapp = findValue(row, ["whatsapp", "whatsappnumber", "wanumber", "wa"]) || mobile;
          const branch = findValue(row, ["branch", "department", "dept", "stream", "course"]);
          const admissionYear = findValue(row, ["admissionyear", "year", "joiningyear", "batchyear", "classof"]);
          const registration = findValue(row, ["registration", "registrationnumber", "regno", "reg_no", "reg number"]);
          const rollNumber = findValue(row, ["rollnumber", "roll no", "roll_no", "roll", "rollno"]);
          const collegeName = findValue(row, ["college", "collegename", "institute", "institutename"]);
          const collegeAddress = findValue(row, ["collegeaddress", "instituteaddress"]);
          const state = findValue(row, ["state"]);
          const district = findValue(row, ["district"]);
          const address = findValue(row, ["address", "fulladdress", "residentialaddress"]);
          const pinCode = findValue(row, ["pincode", "pin", "postalcode", "zip"]);
          const specializedDomain = findValue(row, ["domain", "specializeddomain", "domainname", "skills", "skill"]);
          const rolesRaw = findValue(row, ["role", "roles", "clubrole", "clubroles"]);
          const batchCode = findValue(row, ["batch", "batchcode", "assignedbatch", "batchname"]);

          const roles = rolesRaw
            ? rolesRaw.split(",").map((r) => r.trim()).filter(Boolean)
            : null;

          const isEmailValid = Boolean(email && /^\S+@\S+\.\S+$/.test(email));
          const isNameValid = Boolean(firstName || fullName);

          let status: "ready" | "existing" | "invalid" = "ready";
          let statusMessage = "Ready to import";

          if (!isEmailValid) {
            status = "invalid";
            statusMessage = "Missing or invalid email address";
          } else if (!isNameValid) {
            status = "invalid";
            statusMessage = "Missing member name";
          }

          return {
            _id: `cand-${index}-${Date.now()}`,
            _status: status,
            _statusMessage: statusMessage,
            _selected: status === "ready",
            firstName: firstName || fullName || "Member",
            middleName: middleName || null,
            lastName: lastName || null,
            name: fullName || [firstName, middleName, lastName].filter(Boolean).join(" "),
            email: email.toLowerCase(),
            mobileNumber: mobile || null,
            whatsappNumber: whatsapp || null,
            branch: branch || null,
            admissionYear: admissionYear || null,
            registration: registration || null,
            rollNumber: rollNumber || null,
            collegeName: collegeName || null,
            collegeAddress: collegeAddress || null,
            state: state || null,
            district: district || null,
            address: address || null,
            pinCode: pinCode || null,
            batchId: batchCode || null,
            specializedDomain: specializedDomain || null,
            roles: roles || null,
          };
        })
        .filter((c) => Boolean(c.email || c.firstName));

      if (parsedCandidates.length === 0) {
        toast.error("No valid candidate records could be parsed from the file.");
        setIsParsing(false);
        return;
      }

      // Verify emails against DB
      const emailsToCheck = parsedCandidates
        .filter((c) => c._status === "ready")
        .map((c) => c.email);

      if (emailsToCheck.length > 0) {
        const checkResult = await checkExistingMemberEmails(emailsToCheck);
        if (checkResult.status === "success" && checkResult.existingEmails.length > 0) {
          const existingSet = new Set(checkResult.existingEmails);
          parsedCandidates.forEach((c) => {
            if (existingSet.has(c.email)) {
              c._status = "existing";
              c._statusMessage = "Already registered in system";
              c._selected = false;
            }
          });
        }
      }

      setCandidates(parsedCandidates);
      toast.success(
        `Parsed ${parsedCandidates.length} candidate${parsedCandidates.length === 1 ? "" : "s"} from ${file.name}!`
      );
    } catch (err: any) {
      console.error("Error reading Excel file:", err);
      toast.error(err?.message || "Failed to parse Excel file.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "First Name": "Aarav",
        "Middle Name": "Kumar",
        "Last Name": "Sharma",
        "Email": "aarav.sharma@example.com",
        "Mobile Number": "9876543210",
        "WhatsApp Number": "9876543210",
        "Branch": "Computer Science & Engineering",
        "Admission Year": "2023",
        "Registration Number": "2301109001",
        "Roll Number": "CSE-23-01",
        "College Name": "GCEK Bhawanipatna",
        "State": "Odisha",
        "District": "Kalahandi",
        "Assigned Batch": "",
        "Club Roles": "Member",
        "Specialized Domain": "Web Development",
      },
      {
        "First Name": "Priya",
        "Middle Name": "",
        "Last Name": "Patel",
        "Email": "priya.patel@example.com",
        "Mobile Number": "9876543211",
        "WhatsApp Number": "9876543211",
        "Branch": "Electrical Engineering",
        "Admission Year": "2023",
        "Registration Number": "2301109002",
        "Roll Number": "EE-23-02",
        "College Name": "GCEK Bhawanipatna",
        "State": "Odisha",
        "District": "Kalahandi",
        "Assigned Batch": "",
        "Club Roles": "Member",
        "Specialized Domain": "AI & Machine Learning",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "codebreakers_members_template.xlsx");
    toast.success("Downloaded Excel import template!");
  };

  const toggleSelectCandidate = (id: string, checked: boolean) => {
    setCandidates((prev) =>
      prev.map((c) => (c._id === id ? { ...c, _selected: checked } : c))
    );
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    const filteredIds = new Set(filteredCandidates.map((c) => c._id));
    setCandidates((prev) =>
      prev.map((c) =>
        filteredIds.has(c._id) ? { ...c, _selected: checked } : c
      )
    );
  };

  const removeCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c._id !== id));
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filterTab !== "all" && c._status !== filterTab) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.branch?.toLowerCase().includes(q) ||
        c.rollNumber?.toLowerCase().includes(q) ||
        c.registration?.toLowerCase().includes(q) ||
        c.mobileNumber?.includes(q)
      );
    });
  }, [candidates, filterTab, searchQuery]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const ready = candidates.filter((c) => c._status === "ready").length;
    const existing = candidates.filter((c) => c._status === "existing").length;
    const invalid = candidates.filter((c) => c._status === "invalid").length;
    const selected = candidates.filter((c) => c._selected).length;
    return { total, ready, existing, invalid, selected };
  }, [candidates]);

  const handleImportSelected = async () => {
    const selectedCandidates = candidates.filter((c) => c._selected);

    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one member to import.");
      return;
    }

    setIsImporting(true);
    try {
      const candidatesToImport: ExcelMemberCandidate[] = selectedCandidates.map((c) => {
        // Resolve batchId if batch code was given in Excel
        let targetBatchId = c.batchId;
        if (targetBatchId) {
          const match = batchesList.find(
            (b) =>
              b.code.toLowerCase() === targetBatchId?.toLowerCase() ||
              b.name.toLowerCase() === targetBatchId?.toLowerCase() ||
              b.id === targetBatchId
          );
          if (match) {
            targetBatchId = match.id;
          } else {
            targetBatchId = null;
          }
        }

        return {
          firstName: c.firstName,
          middleName: c.middleName,
          lastName: c.lastName,
          name: c.name,
          email: c.email,
          mobileNumber: c.mobileNumber,
          whatsappNumber: c.whatsappNumber,
          branch: c.branch,
          admissionYear: c.admissionYear,
          registration: c.registration,
          rollNumber: c.rollNumber,
          collegeName: c.collegeName,
          collegeAddress: c.collegeAddress,
          state: c.state,
          district: c.district,
          address: c.address,
          pinCode: c.pinCode,
          batchId: targetBatchId,
          specializedDomain: c.specializedDomain,
          roles: c.roles,
        };
      });

      const result = await bulkCreateMembersFromExcel({
        members: candidatesToImport,
        defaultBatchId: defaultBatchId === "none" ? null : defaultBatchId,
        defaultRoles: defaultRoles.length > 0 ? defaultRoles : ["Member"],
        defaultDomain: defaultDomain || null,
        sendWelcomeEmails,
      });

      if (result.status === "success") {
        toast.success(result.message);
        onClose();
        resetState();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete member import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      modal
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col h-dvh max-h-screen bg-background border-l border-border z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 p-6 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Import Members from Excel
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Upload spreadsheet (.xlsx, .xls, .csv) to bulk extract and onboard members.
              </SheetDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs h-8 gap-1.5 shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Container with data-lenis-prevent */}
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onWheel={(e) => e.stopPropagation()}
          onTouchMoveCapture={(e) => e.stopPropagation()}
        >
          {/* 1. Upload Dropzone / File Picker */}
          {candidates.length === 0 ? (
            <div className="space-y-4 pt-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-all bg-muted/10 hover:bg-muted/30 flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {isParsing ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isParsing ? "Analyzing Excel File..." : "Click or drag & drop Excel file here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports .xlsx, .xls, and .csv spreadsheets with standard headers.
                  </p>
                </div>
              </div>

              {/* Supported Columns Guide */}
              <div className="rounded-lg border p-4 bg-card space-y-2.5">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Auto-Detected Header Columns:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "First Name",
                    "Middle Name",
                    "Last Name",
                    "Email",
                    "Mobile Number",
                    "WhatsApp Number",
                    "Branch",
                    "Admission Year",
                    "Registration Number",
                    "Roll Number",
                    "College Name",
                    "Assigned Batch",
                    "Specialized Domain",
                    "Club Roles",
                  ].map((col) => (
                    <Badge
                      key={col}
                      variant="secondary"
                      className="text-[11px] font-normal"
                    >
                      {col}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Tip: Columns can be in any order. The extractor automatically normalizes headers and trims whitespace.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Info & Reset */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {fileName}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {candidates.length} records
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Change File
                </Button>
              </div>

              {/* Global Defaults Bar */}
              <div className="rounded-lg border p-4 bg-card space-y-3">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Default Assignment for Imported Members:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Default Batch</Label>
                    <Select value={defaultBatchId} onValueChange={setDefaultBatchId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="No Batch (Keep as in file)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Batch Override</SelectItem>
                        {batchesList.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Default Domain</Label>
                    <Select value={defaultDomain} onValueChange={setDefaultDomain}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="No Domain (Keep as in file)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Domain Override</SelectItem>
                        {PREDEFINED_DOMAINS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Default Role</Label>
                    <Select
                      value={defaultRoles[0] || "Member"}
                      onValueChange={(val) => setDefaultRoles([val])}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Member" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Send Welcome Email</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Sends an onboarding email with login URL to each newly added member.
                    </p>
                  </div>
                  <Switch
                    checked={sendWelcomeEmails}
                    onCheckedChange={setSendWelcomeEmails}
                  />
                </div>
              </div>

              {/* Status Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    filterTab === "all"
                      ? "bg-primary/10 border-primary/40 ring-1 ring-primary/40"
                      : "bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <p className="text-[10px] text-muted-foreground font-medium">Total Extracted</p>
                  <p className="text-base font-bold text-foreground">{stats.total}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("ready")}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    filterTab === "ready"
                      ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/40"
                      : "bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready to Add</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{stats.ready}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("existing")}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    filterTab === "existing"
                      ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/40"
                      : "bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Already Exists</p>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400">{stats.existing}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("invalid")}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    filterTab === "invalid"
                      ? "bg-destructive/10 border-destructive/40 ring-1 ring-destructive/40"
                      : "bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <p className="text-[10px] text-destructive font-medium">Invalid Rows</p>
                  <p className="text-base font-bold text-destructive">{stats.invalid}</p>
                </button>
              </div>

              {/* Search and Select-All Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAllExcel"
                    checked={
                      filteredCandidates.length > 0 &&
                      filteredCandidates.every((c) => c._selected)
                    }
                    onCheckedChange={(checked) =>
                      toggleSelectAllFiltered(checked === true)
                    }
                  />
                  <Label
                    htmlFor="selectAllExcel"
                    className="text-xs font-medium cursor-pointer"
                  >
                    Select All ({filteredCandidates.length})
                  </Label>
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {stats.selected} Selected
                  </Badge>
                </div>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search candidate, email, branch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>

              {/* Candidate Cards List */}
              <div className="space-y-2.5">
                {filteredCandidates.length === 0 ? (
                  <div className="p-8 text-center rounded-lg border text-xs text-muted-foreground">
                    No candidates match the current filter or search query.
                  </div>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <div
                      key={candidate._id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        candidate._selected
                          ? "border-primary/50 bg-primary/5 shadow-2xs"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={candidate._selected}
                          onCheckedChange={(checked) =>
                            toggleSelectCandidate(candidate._id, checked === true)
                          }
                          className="mt-0.5 shrink-0"
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-foreground">
                                {candidate.name || "Unnamed"}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                ({candidate.email})
                              </span>
                            </div>

                            {candidate._status === "ready" && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            )}
                            {candidate._status === "existing" && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Already Member
                              </Badge>
                            )}
                            {candidate._status === "invalid" && (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Invalid
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            {candidate.branch && (
                              <span>Branch: {candidate.branch}</span>
                            )}
                            {candidate.rollNumber && (
                              <span className="font-mono">Roll: {candidate.rollNumber}</span>
                            )}
                            {candidate.registration && (
                              <span className="font-mono">Reg: {candidate.registration}</span>
                            )}
                            {candidate.mobileNumber && (
                              <span className="font-mono">Mob: {candidate.mobileNumber}</span>
                            )}
                            {candidate.specializedDomain && (
                              <Badge variant="secondary" className="text-[9px] py-0">
                                {candidate.specializedDomain}
                              </Badge>
                            )}
                          </div>

                          {candidate._status !== "ready" && candidate._statusMessage && (
                            <p className="text-[11px] text-destructive pt-0.5">
                              {candidate._statusMessage}
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCandidate(candidate._id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 border-t border-border bg-background px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isImporting}
            >
              Cancel
            </Button>

            {candidates.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleImportSelected}
                disabled={isImporting || stats.selected === 0}
                className="gap-1.5"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding {stats.selected} Member{stats.selected === 1 ? "" : "s"}...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Add Selected Members ({stats.selected})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
