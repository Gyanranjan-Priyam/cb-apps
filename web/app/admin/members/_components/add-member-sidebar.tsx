"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  createMember,
  getFormCandidateByResponseId,
  FormCandidateItem,
  getCustomRoles,
  createCustomRole,
  deleteCustomRole,
} from "../actions";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  UserPlus,
  Mail,
  Phone,
  GraduationCap,
  User,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Hash,
  Search,
  UserCheck,
  Target,
  FileSpreadsheet,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { getActiveBatchesList } from "@/app/admin/batches/actions";
import {
  ASSIGNABLE_ROLES,
  MAX_MEMBER_ROLES,
  getRoleBadgeClasses,
  type AssignableRole,
} from "@/lib/member-roles";
import {
  PREDEFINED_DOMAINS,
  parseSpecializedDomains,
  serializeSpecializedDomains,
} from "@/lib/specialized-domains";
import { BRANCH_OPTIONS, getBranchCode } from "@/lib/branch-constants";

interface AddMemberSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExcelImport?: () => void;
}

export default function AddMemberSidebar({ isOpen, onClose, onOpenExcelImport }: AddMemberSidebarProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [sameNumber, setSameNumber] = useState(true);
  const [branch, setBranch] = useState("");
  const [batchId, setBatchId] = useState<string>("none");
  const [specializedDomain, setSpecializedDomain] = useState<string>("");
  const [batchesList, setBatchesList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [customRoles, setCustomRoles] = useState<{ id: string; name: string }[]>([]);
  const [newRoleInput, setNewRoleInput] = useState<string>("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Member"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Response ID Auto-fill States
  const [responseIdInput, setResponseIdInput] = useState<string>("");
  const [isFetchingResponseId, setIsFetchingResponseId] = useState(false);
  const [autoFilledFrom, setAutoFilledFrom] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getActiveBatchesList().then((list) => setBatchesList(list));
      getCustomRoles().then((roles) => setCustomRoles(roles));
    }
  }, [isOpen]);

  const allRoles: string[] = Array.from(
    new Set([...ASSIGNABLE_ROLES, ...customRoles.map((r) => r.name)])
  );

  const handleToggleRole = (role: string) => {
    if (role === "Member") {
      setSelectedRoles(["Member"]);
      return;
    }
    const withoutMember = selectedRoles.filter((r) => r !== "Member");
    if (withoutMember.includes(role)) {
      const next = withoutMember.filter((r) => r !== role);
      setSelectedRoles(next.length === 0 ? ["Member"] : next);
    } else {
      if (withoutMember.length >= MAX_MEMBER_ROLES) {
        toast.error(`A member can have a maximum of ${MAX_MEMBER_ROLES} roles.`);
        return;
      }
      setSelectedRoles([...withoutMember, role]);
    }
  };

  const handleCreateNewRole = async () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;

    if (allRoles.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`Role "${trimmed}" already exists.`);
      if (!selectedRoles.includes(trimmed)) {
        handleToggleRole(trimmed);
      }
      setNewRoleInput("");
      return;
    }

    setIsCreatingRole(true);
    try {
      const res = await createCustomRole(trimmed);
      if (res.status === "success" && res.data) {
        toast.success(res.message);
        setCustomRoles((prev) => [...prev, res.data!]);
        const withoutMember = selectedRoles.filter((r) => r !== "Member");
        if (withoutMember.length < MAX_MEMBER_ROLES) {
          setSelectedRoles([...withoutMember, res.data.name]);
        }
        setNewRoleInput("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to create role.");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleDeleteCustomRole = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    try {
      const res = await deleteCustomRole(id);
      if (res.status === "success") {
        toast.success(res.message);
        setCustomRoles((prev) => prev.filter((r) => r.id !== id));
        setSelectedRoles((prev) => prev.filter((r) => r !== name));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete role.");
    }
  };

  const applyCandidateData = (cand: FormCandidateItem & { formTitle?: string }) => {
    setFirstName(cand.firstName || cand.name);
    setMiddleName(cand.middleName || "");
    setLastName(cand.lastName || "");
    setEmail(cand.email || "");
    setMobileNumber(cand.mobileNumber || "");
    setWhatsappNumber(cand.whatsappNumber || cand.mobileNumber || "");
    setSameNumber(
      !cand.whatsappNumber || cand.whatsappNumber === cand.mobileNumber
    );
    if (cand.branch) {
      setBranch(getBranchCode(cand.branch));
    }

    const sourceLabel = cand.formTitle
      ? `${cand.name} (${cand.formTitle})`
      : `${cand.name} (Response: ${cand.id.slice(0, 8)})`;
    setAutoFilledFrom(sourceLabel);

    if (cand.isAlreadyMember) {
      toast.warning(`${cand.name} is already registered as a member.`);
    } else {
      toast.success(`Auto-filled details for ${cand.name}!`);
    }
  };

  const handleFetchByResponseId = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!responseIdInput.trim()) {
      toast.error("Please enter a Response ID or Transaction ID.");
      return;
    }

    setIsFetchingResponseId(true);
    try {
      const res = await getFormCandidateByResponseId(responseIdInput.trim());
      if (res.success && res.data) {
        applyCandidateData(res.data);
      } else {
        toast.error(res.error || "No form response found with this ID.");
      }
    } catch {
      toast.error("An error occurred while fetching response.");
    } finally {
      setIsFetchingResponseId(false);
    }
  };

  const clearAutoFill = () => {
    setResponseIdInput("");
    setAutoFilledFrom(null);
    resetForm();
    toast.info("Form details reset.");
  };

  const resetForm = () => {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setEmail("");
    setMobileNumber("");
    setWhatsappNumber("");
    setSameNumber(true);
    setBranch("");
    setBatchId("none");
    setSpecializedDomain("");
    setSelectedRoles(["Member"]);
    setResponseIdInput("");
    setAutoFilledFrom(null);
  };

  useEffect(() => {
    if (sameNumber) {
      setWhatsappNumber(mobileNumber);
    }
  }, [mobileNumber, sameNumber]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !mobileNumber.trim() || !whatsappNumber.trim() || !branch.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createMember({
        firstName,
        middleName,
        lastName,
        email,
        mobileNumber,
        whatsappNumber: sameNumber ? mobileNumber : whatsappNumber,
        branch,
        batchId: batchId && batchId !== "none" ? batchId : null,
        specializedDomain: specializedDomain.trim() || null,
        roles: selectedRoles,
      });

      if (result.status === "success") {
        toast.success(result.message);
        resetForm();
        onClose();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An error occurred while adding the member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose} modal>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex h-dvh max-h-screen flex-col overflow-hidden">
        <div className="shrink-0 bg-background border-b">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Member
            </SheetTitle>
            <SheetDescription>
              Create a new member manually or auto-fill details from any form submission.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onWheel={(event) => event.stopPropagation()}
          onTouchMoveCapture={(event) => event.stopPropagation()}
        >
          <div className="space-y-5 pb-4">
            {/* Quick Link to Excel Import */}
            {onOpenExcelImport && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-muted-foreground">
                    Have an Excel spreadsheet?
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenExcelImport();
                  }}
                  className="h-7 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                >
                  Import from Excel
                </Button>
              </div>
            )}

            {/* Auto-Fill by Response ID Card */}
            <div className="p-3.5 rounded-lg border bg-muted/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Auto-Fill by Response ID</span>
                </div>
                {autoFilledFrom && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAutoFill}
                    className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paste any Registration / Membership form response ID or Transaction ID to auto-fill student details instantly.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="e.g. resp_abc123 or UPI Txn ID"
                    value={responseIdInput}
                    onChange={(e) => setResponseIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFetchByResponseId();
                      }
                    }}
                    disabled={isSubmitting || isFetchingResponseId}
                    className="pl-9 h-8 text-xs font-mono"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleFetchByResponseId()}
                  disabled={isSubmitting || isFetchingResponseId || !responseIdInput.trim()}
                  className="h-8 text-xs px-3 gap-1 shrink-0"
                >
                  {isFetchingResponseId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5" />
                      <span>Fetch</span>
                    </>
                  )}
                </Button>
              </div>

              {autoFilledFrom && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 bg-emerald-500/10 px-2.5 py-1.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Auto-filled: <strong>{autoFilledFrom}</strong></span>
                </div>
              )}
            </div>

            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  placeholder="Enter middle name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="mobileNumber"
                      placeholder="9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">
                    WhatsApp Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="whatsappNumber"
                      placeholder="9876543210"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      disabled={isSubmitting || sameNumber}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sameNumber"
                  checked={sameNumber}
                  onCheckedChange={setSameNumber}
                  disabled={isSubmitting}
                />
                <Label htmlFor="sameNumber" className="text-xs font-normal cursor-pointer">
                  WhatsApp number is the same as mobile number
                </Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="branch">
                    Branch <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative min-w-0">
                    <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Select value={branch} onValueChange={setBranch} disabled={isSubmitting}>
                      <SelectTrigger className="pl-10 w-full truncate">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCH_OPTIONS.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 min-w-0">
                  <Label htmlFor="batch">Assign Batch</Label>
                  <div className="relative min-w-0">
                    <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Select value={batchId} onValueChange={setBatchId} disabled={isSubmitting}>
                      <SelectTrigger className="pl-10 w-full truncate">
                        <SelectValue placeholder="Select Batch (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Batch (Unassigned)</SelectItem>
                        {batchesList.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.code} ({b.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Specialized Domain (Admin Provided) */}
              <div className="space-y-2">
                <Label htmlFor="specializedDomain" className="text-xs font-semibold flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary" />
                  Specialized Domain (Admin Provided)
                </Label>
                <div className="space-y-2">
                  <Input
                    id="specializedDomain"
                    placeholder="e.g. Web Development, AI & Machine Learning..."
                    value={specializedDomain}
                    onChange={(e) => setSpecializedDomain(e.target.value)}
                    disabled={isSubmitting}
                    className="text-xs h-9"
                  />
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 border rounded-md bg-muted/20 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {PREDEFINED_DOMAINS.map((d) => {
                      const currentDomains = parseSpecializedDomains(specializedDomain);
                      const isSelected = currentDomains.some(
                        (item) => item.toLowerCase() === d.toLowerCase()
                      );
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            let next: string[];
                            if (isSelected) {
                              next = currentDomains.filter(
                                (item) => item.toLowerCase() !== d.toLowerCase()
                              );
                            } else {
                              next = [...currentDomains, d];
                            }
                            setSpecializedDomain(serializeSpecializedDomains(next) || "");
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer select-none ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-background text-muted-foreground hover:text-foreground border-border"
                          }`}
                        >
                          {isSelected ? `✓ ${d}` : `+ ${d}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Assign Roles */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Member Roles (Max {MAX_MEMBER_ROLES})
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedRoles.filter((r) => r !== "Member").length === 0
                      ? "Member"
                      : `${selectedRoles.filter((r) => r !== "Member").length} / ${MAX_MEMBER_ROLES} selected`}
                  </span>
                </div>

                {/* Create New Custom Role Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Create new role (e.g. Design Lead)..."
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateNewRole();
                      }
                    }}
                    disabled={isSubmitting || isCreatingRole}
                    className="text-xs h-8 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleCreateNewRole}
                    disabled={!newRoleInput.trim() || isSubmitting || isCreatingRole}
                    className="h-8 text-xs gap-1 shrink-0 cursor-pointer"
                  >
                    {isCreatingRole ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    <span>Add Role</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border rounded-md bg-muted/10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {allRoles.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    const isMemberRole = role === "Member";
                    const isMemberActive =
                      isMemberRole &&
                      (selectedRoles.length === 0 ||
                        selectedRoles.includes("Member"));
                    const isMaxReached =
                      selectedRoles.filter((r) => r !== "Member").length >= MAX_MEMBER_ROLES;
                    const disabled = !isSelected && !isMemberRole && isMaxReached;
                    const { badgeClass } = getRoleBadgeClasses(role);
                    const customRoleItem = customRoles.find(
                      (cr) => cr.name.toLowerCase() === role.toLowerCase()
                    );

                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all cursor-pointer select-none group ${
                          isSelected || isMemberActive
                            ? "border-primary/50 bg-primary/5 shadow-xs"
                            : disabled
                            ? "opacity-50 cursor-not-allowed border-border/40 bg-muted/20"
                            : "border-border/60 hover:border-border hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected || isMemberActive}
                          disabled={disabled || isSubmitting}
                          onCheckedChange={() => !disabled && handleToggleRole(role)}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span className="flex-1 truncate">
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-1.5 font-normal truncate block max-w-full ${badgeClass}`}
                          >
                            {role}
                          </Badge>
                        </span>

                        {customRoleItem && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomRole(e, customRoleItem.id, customRoleItem.name)}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5 rounded transition-opacity cursor-pointer"
                            title="Delete custom role"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 px-6 py-4 border-t bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}