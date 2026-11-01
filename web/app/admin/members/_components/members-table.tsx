/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Ban, 
  Trash2,
  Plus,
  User,
  QrCode,
  Layers,
  CheckCircle,
  XCircle,
  Loader2,
  UserCheck,
  Target,
  Shield,
  UserPen,
  FileSpreadsheet,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MemberData,
  toggleMemberBan,
  deleteMember,
  deleteMembers,
  getMemberBySlugId,
  assignMemberBatch,
  bulkAssignMembersBatch,
} from "../actions";
import { parseMemberRoles, getRoleBadgeClasses } from "@/lib/member-roles";
import { AssignRolesDomainSheet } from "./assign-roles-domain-sheet";
import { EditMemberSheet } from "./edit-member-sheet";
import { ImportExcelSidebar } from "./import-excel-sidebar";
import { getActiveBatchesList } from "@/app/admin/batches/actions";
import Link from "next/link";
import { toast } from "sonner";
import AddMemberSidebar from "@/app/admin/members/_components/add-member-sidebar";
import MemberDetails from "@/app/admin/members/[id]/_components/member-details";
import MemberQRDialog from "@/app/admin/members/_components/member-qr-dialog";

interface MembersTableProps {
  members: MemberData[];
}

type GetMemberBySlugResult = Awaited<ReturnType<typeof getMemberBySlugId>>;
type MemberFullDetails = Extract<GetMemberBySlugResult, { status: "success" }>["data"];

export default function MembersTable({ members }: MembersTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<MemberFullDetails | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [showMemberSidebar, setShowMemberSidebar] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showAddMemberSidebar, setShowAddMemberSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "pending">("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [batchesList, setBatchesList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [showAssignBatchDialog, setShowAssignBatchDialog] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState<string>("none");
  const [isAssigningBatch, setIsAssigningBatch] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrMember, setQrMember] = useState<MemberData | null>(null);
  const [showAssignRolesDomainSheet, setShowAssignRolesDomainSheet] = useState(false);
  const [rolesDomainMember, setRolesDomainMember] = useState<MemberData | null>(null);
  const [showEditMemberSheet, setShowEditMemberSheet] = useState(false);
  const [editMemberData, setEditMemberData] = useState<any | null>(null);
  const [showImportExcelSidebar, setShowImportExcelSidebar] = useState(false);

  const openEditMember = async (member: MemberData) => {
    try {
      const res = await getMemberBySlugId(member.id);
      if (res.status === "success" && res.data) {
        setEditMemberData(res.data);
      } else {
        setEditMemberData(member);
      }
      setShowEditMemberSheet(true);
    } catch {
      setEditMemberData(member);
      setShowEditMemberSheet(true);
    }
  };

  useEffect(() => {
    getActiveBatchesList().then((list) => setBatchesList(list));
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const pendingMembers = members.filter((member) => !member.profileComplete).length;

  const filteredMembers = useMemo(() => {
    let list =
      viewMode === "pending"
        ? members.filter((member) => !member.profileComplete)
        : members;

    if (batchFilter !== "all") {
      if (batchFilter === "unassigned") {
        list = list.filter((m) => !m.batchId);
      } else {
        list = list.filter((m) => m.batchId === batchFilter);
      }
    }

    if (!searchQuery.trim()) {
      return list;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    return list.filter((member) => {
      return (
        member.cbUserId?.toLowerCase().includes(lowercaseQuery) ||
        member.name.toLowerCase().includes(lowercaseQuery) ||
        member.email.toLowerCase().includes(lowercaseQuery) ||
        member.role?.toLowerCase().includes(lowercaseQuery) ||
        member.username?.toLowerCase().includes(lowercaseQuery) ||
        member.firstName?.toLowerCase().includes(lowercaseQuery) ||
        member.lastName?.toLowerCase().includes(lowercaseQuery) ||
        member.registration?.toLowerCase().includes(lowercaseQuery) ||
        member.rollNumber?.toLowerCase().includes(lowercaseQuery) ||
        member.branch?.toLowerCase().includes(lowercaseQuery) ||
        member.batch?.name?.toLowerCase().includes(lowercaseQuery) ||
        member.batch?.code?.toLowerCase().includes(lowercaseQuery) ||
        member.collegeName?.toLowerCase().includes(lowercaseQuery)
      );
    });
  }, [members, searchQuery, viewMode, batchFilter]);

  const allVisibleSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((member) => selectedMemberIds.has(member.id));

  const someVisibleSelected =
    filteredMembers.some((member) => selectedMemberIds.has(member.id)) &&
    !allVisibleSelected;

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);

      if (checked) {
        filteredMembers.forEach((member) => next.add(member.id));
      } else {
        filteredMembers.forEach((member) => next.delete(member.id));
      }

      return next;
    });
  };

  const toggleSelectMember = (memberId: string, checked: boolean) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);

      if (checked) {
        next.add(memberId);
      } else {
        next.delete(memberId);
      }

      return next;
    });
  };

  const handleToggleBan = async () => {
    if (!selectedMember) return;
    
    if (!selectedMember.banned && !banReason.trim()) {
      toast.error("Please provide a reason for banning");
      return;
    }

    setIsLoading(true);
    try {
      const result = await toggleMemberBan(selectedMember.id, banReason);
      
      if (result.status === "success") {
        toast.success(result.message);
        setBanReason("");
        setShowBanDialog(false);
        setSelectedMember(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      const result = await deleteMember(selectedMember.id);
      
      if (result.status === "success") {
        toast.success(result.message);
        setShowDeleteDialog(false);
        setSelectedMember(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openMemberSidebar = async (member: MemberData) => {
    setSelectedMember(member);
    setSelectedMemberDetails(null);
    setShowMemberSidebar(true);

    setIsDetailsLoading(true);
    try {
      const result = await getMemberBySlugId(member.id);
      if (result.status === "success") {
        setSelectedMemberDetails(result.data);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to load member details.");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const openBanDialogFromSidebar = () => {
    setShowMemberSidebar(false);
    setShowBanDialog(true);
  };

  const openDeleteDialogFromSidebar = () => {
    setShowMemberSidebar(false);
    setShowDeleteDialog(true);
  };

  const handleMemberSidebarOpenChange = (open: boolean) => {
    if (!open) {
      closeMemberSidebar();
      return;
    }

    setShowMemberSidebar(true);
  };

  const closeMemberSidebar = () => {
    setShowMemberSidebar(false);
    setSelectedMember(null);
    setSelectedMemberDetails(null);
  };

  useEffect(() => {
    if (!showMemberSidebar) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showMemberSidebar]);

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedMemberIds);
    if (ids.length === 0) return;

    setIsLoading(true);
    try {
      const result = await deleteMembers(ids);

      if (result.status === "success") {
        toast.success(result.message);
        setSelectedMemberIds(new Set());
        setShowBulkDeleteDialog(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>
            {viewMode === "pending" ? "Pending Members" : "All Members"} ({filteredMembers.length})
          </CardTitle>

          <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3 sm:items-center">
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-full sm:w-44 text-xs h-9">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                <SelectItem value="unassigned">Unassigned Only</SelectItem>
                {batchesList.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant={viewMode === "pending" ? "default" : "outline"}
              onClick={() => setViewMode(viewMode === "pending" ? "all" : "pending")}
              className="w-full sm:w-auto h-9 text-xs"
            >
              Pending
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {pendingMembers}
              </Badge>
            </Button>

            <Button
              type="button"
              onClick={() => setShowAddMemberSidebar(true)}
              className="w-full sm:w-auto h-9 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Member
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImportExcelSidebar(true)}
              className="w-full sm:w-auto h-9 text-xs gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Import from Excel
            </Button>

            {selectedMemberIds.size > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTargetBatchId("none");
                    setShowAssignBatchDialog(true);
                  }}
                  className="w-full sm:w-auto h-9 text-xs gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Set Batch ({selectedMemberIds.size})
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="w-full sm:w-auto h-9 text-xs gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete ({selectedMemberIds.size})
                </Button>
              </>
            )}

            <div className="relative w-full sm:w-auto sm:min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search members, batch, roll..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 text-xs h-9"
              />
            </div>

            <SilentRefreshButton toastMessage="Members list refreshed silently" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => toggleSelectAllVisible(checked === true)}
                    aria-label="Select all members"
                  />
                </TableHead>
                <TableHead className="w-14">#</TableHead>
                <TableHead className="min-w-36">Name</TableHead>
                <TableHead className="min-w-28">User ID</TableHead>
                <TableHead className="min-w-28">Batch</TableHead>
                <TableHead className="min-w-20">Role</TableHead>
                <TableHead className="min-w-44">Email</TableHead>
                <TableHead className="min-w-24">Branch</TableHead>
                <TableHead className="min-w-28">Mobile</TableHead>
                <TableHead className="min-w-24">Status</TableHead>
                <TableHead className="text-right min-w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-muted-foreground text-xs">
                    {searchQuery ? "No members found matching your search." : "No members found matching filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member, index) => (
                  <TableRow key={member.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Checkbox
                        checked={selectedMemberIds.has(member.id)}
                        onCheckedChange={(checked) => toggleSelectMember(member.id, checked === true)}
                        aria-label={`Select ${member.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      <Link 
                        href={`/admin/members/${member.cbUserId || member.registration || member.username || member.id}`}
                        className="flex items-center gap-1.5 hover:underline cursor-pointer"
                      >
                        <span>{member.name}</span>
                        {member.emailVerified && (
                          <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">
                      {member.cbUserId || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {member.batch ? (
                        <Badge variant="outline" className="font-mono text-[11px] bg-primary/5 text-primary border-primary/20">
                          {member.batch.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const roles = parseMemberRoles(member.role);
                        const mainRole = roles[0] || "Member";
                        const extraCount = roles.length - 1;
                        const { badgeClass: mainBadgeClass } = getRoleBadgeClasses(mainRole);

                        return (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] py-0 px-1.5 font-normal truncate max-w-[120px] ${mainBadgeClass}`}
                              title={mainRole}
                            >
                              {mainRole}
                            </Badge>

                            {extraCount > 0 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center text-[10px] font-bold h-4.5 px-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 shadow-2xs"
                                    title={`Click to view all ${roles.length} roles`}
                                  >
                                    +{extraCount}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-64 p-3 shadow-xl border-border bg-popover z-50"
                                  align="start"
                                >
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between border-b pb-2">
                                      <div className="min-w-0 flex-1 pr-2">
                                        <p className="text-xs font-semibold text-foreground truncate">
                                          {member.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                          All Assigned Roles ({roles.length})
                                        </p>
                                      </div>
                                      <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {roles.map((r, rIdx) => {
                                        const { badgeClass } = getRoleBadgeClasses(r);
                                        return (
                                          <Badge
                                            key={rIdx}
                                            variant="outline"
                                            className={`text-[11px] py-0.5 px-2 font-normal ${badgeClass} ${
                                              rIdx === 0
                                                ? "ring-1 ring-primary/40 font-semibold"
                                                : ""
                                            }`}
                                          >
                                            {r}
                                            {rIdx === 0 && (
                                              <span className="ml-1 text-[9px] opacity-75 font-mono">
                                                (Main)
                                              </span>
                                            )}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{member.email}</TableCell>
                    <TableCell className="text-xs">
                      {member.branch || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {member.mobileNumber || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {member.banned ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit text-[10px]">
                          <XCircle className="h-3 w-3" />
                          Banned
                        </Badge>
                      ) : !member.profileComplete ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit text-[10px]">
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit text-[10px] text-emerald-600 border-emerald-200">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs w-44">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openMemberSidebar(member)}
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openEditMember(member)}
                          >
                            <UserPen className="mr-2 h-3.5 w-3.5 text-primary" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setRolesDomainMember(member);
                              setShowAssignRolesDomainSheet(true);
                            }}
                          >
                            <UserCheck className="mr-2 h-3.5 w-3.5 text-primary" />
                            Assign Batch, Roles & Domain
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setQrMember(member);
                              setShowQrDialog(true);
                            }}
                          >
                            <QrCode className="mr-2 h-3.5 w-3.5" />
                            View QR
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowBanDialog(true);
                            }}
                          >
                            <Ban className="mr-2 h-3.5 w-3.5" />
                            {member.banned ? "Unban" : "Ban"} Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedMemberIds(new Set());
                              setSelectedMember(member);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Ban Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedMember?.banned ? "Unban Member?" : "Ban Member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember?.banned ? (
                <>
                  This will restore <strong>{selectedMember.name}</strong>&apos;s access to the platform.
                </>
              ) : (
                <>
                  This will restrict <strong>{selectedMember?.name}</strong>&apos;s access to the platform.
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="banReason">Reason for banning (required)</Label>
                    <Input
                      id="banReason"
                      placeholder="Enter reason..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBanReason("");
              setSelectedMember(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleToggleBan();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${selectedMember?.banned ? "Unban" : "Ban"}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Members?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedMemberIds.size} selected member{selectedMemberIds.size > 1 ? "s" : ""} from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={showMemberSidebar} onOpenChange={handleMemberSidebarOpenChange} modal>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex h-dvh max-h-screen flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-background">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedMember?.name || "Member Details"}
              </SheetTitle>
              <SheetDescription>
                Quick member actions and profile summary.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onWheel={(event) => event.stopPropagation()} onTouchMoveCapture={(event) => event.stopPropagation()}>
            {isDetailsLoading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Loading member details...
              </div>
            )}

            {!isDetailsLoading && selectedMemberDetails && (
              <MemberDetails member={selectedMemberDetails} />
            )}

            {!isDetailsLoading && !selectedMemberDetails && (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Unable to load member details.
              </div>
            )}
          </div>

          <div className="shrink-0 border-t bg-background px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={openBanDialogFromSidebar}
                disabled={!selectedMember || isLoading}
                className="flex-1"
              >
                <Ban className="h-4 w-4 mr-2" />
                {selectedMember?.banned ? "Unban" : "Ban"}
              </Button>
              <Button
                variant="destructive"
                onClick={openDeleteDialogFromSidebar}
                disabled={!selectedMember || isLoading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={closeMemberSidebar}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedMember?.name}</strong> ({selectedMember?.email}) from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMember(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Batch Dialog */}
      <AlertDialog open={showAssignBatchDialog} onOpenChange={setShowAssignBatchDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Assign Batch
            </AlertDialogTitle>
            <AlertDialogDescription>
              Assign {selectedMemberIds.size} selected student(s) to a cohort batch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3 space-y-3">
            <Label className="text-xs font-medium">Select Target Batch</Label>
            <Select value={targetBatchId} onValueChange={setTargetBatchId} disabled={isAssigningBatch}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Batch (Remove / Unassigned)</SelectItem>
                {batchesList.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssigningBatch} onClick={() => setShowAssignBatchDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                setIsAssigningBatch(true);
                try {
                  const ids = Array.from(selectedMemberIds);
                  const bId = targetBatchId === "none" ? null : targetBatchId;
                  const res = await bulkAssignMembersBatch(ids, bId);
                  if (res.status === "success") {
                    toast.success(res.message);
                    setShowAssignBatchDialog(false);
                    setSelectedMemberIds(new Set());
                    setSelectedMember(null);
                    router.refresh();
                  } else {
                    toast.error(res.message);
                  }
                } catch {
                  toast.error("Failed to assign batch.");
                } finally {
                  setIsAssigningBatch(false);
                }
              }}
              disabled={isAssigningBatch}
              className="bg-primary text-primary-foreground font-medium"
            >
              {isAssigningBatch ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Batch Assignment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMemberSidebar
        isOpen={showAddMemberSidebar}
        onClose={() => setShowAddMemberSidebar(false)}
        onOpenExcelImport={() => setShowImportExcelSidebar(true)}
      />

      {qrMember && (
        <MemberQRDialog
          open={showQrDialog}
          onOpenChange={(open) => {
            setShowQrDialog(open);
            if (!open) setQrMember(null);
          }}
          member={qrMember}
        />
      )}

      <AssignRolesDomainSheet
        isOpen={showAssignRolesDomainSheet}
        onClose={() => {
          setShowAssignRolesDomainSheet(false);
          setRolesDomainMember(null);
        }}
        member={rolesDomainMember}
        onSuccess={() => router.refresh()}
      />

      <EditMemberSheet
        isOpen={showEditMemberSheet}
        onClose={() => {
          setShowEditMemberSheet(false);
          setEditMemberData(null);
        }}
        member={editMemberData}
        onSuccess={() => router.refresh()}
      />

      <ImportExcelSidebar
        isOpen={showImportExcelSidebar}
        onClose={() => setShowImportExcelSidebar(false)}
        onSuccess={() => router.refresh()}
      />
    </Card>
  );
}
