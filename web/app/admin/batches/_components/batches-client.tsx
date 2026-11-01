"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BatchItem, deleteBatch, updateBatch, getBatches } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  GraduationCap,
  Calendar,
  Filter,
  UserPlus,
} from "lucide-react";
import { CreateBatchDialog } from "./create-batch-dialog";
import { BatchMembersSidebar } from "./batch-members-sidebar";
import { AddBatchMembersSidebar } from "./add-batch-members-sidebar";

interface BatchesClientProps {
  initialBatches: BatchItem[];
  stats?: {
    totalBatches: number;
    activeBatches: number;
    totalAssignedMembers: number;
    totalUnassignedMembers: number;
  };
  canManageBatches?: boolean;
}

export function BatchesClient({
  initialBatches,
  stats: initialStats = {
    totalBatches: 0,
    activeBatches: 0,
    totalAssignedMembers: 0,
    totalUnassignedMembers: 0,
  },
  canManageBatches = true,
}: BatchesClientProps) {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [stats, setStats] = useState(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Keep state synced with server props
  useEffect(() => {
    setBatches(initialBatches);
    setStats(initialStats);
  }, [initialBatches, initialStats]);

  const refreshBatches = async () => {
    try {
      const res = await getBatches();
      if (res.success && res.data) {
        setBatches(res.data);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch {
      // Fallback
    } finally {
      router.refresh();
    }
  };

  // Modals & Sidebars state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [viewingMembersBatch, setViewingMembersBatch] = useState<BatchItem | null>(null);
  const [addingMembersBatch, setAddingMembersBatch] = useState<BatchItem | null>(null);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.admissionYear && b.admissionYear.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && b.isActive) ||
        (statusFilter === "inactive" && !b.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [batches, searchQuery, statusFilter]);

  const handleToggleActive = async (batch: BatchItem) => {
    try {
      const res = await updateBatch(batch.id, { isActive: !batch.isActive });
      if (res.success) {
        toast.success(res.message || "Batch status updated.");
        await refreshBatches();
      } else {
        toast.error(res.error || "Failed to update batch status.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
  };

  const handleDelete = async (batch: BatchItem) => {
    if (
      !confirm(
        `Are you sure you want to delete "${batch.name}"? All ${batch.memberCount} member(s) will be unassigned.`
      )
    ) {
      return;
    }

    try {
      const res = await deleteBatch(batch.id);
      if (res.success) {
        toast.success(res.message || "Batch deleted.");
        await refreshBatches();
      } else {
        toast.error(res.error || "Failed to delete batch.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══ STATS OVERVIEW ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Batches</p>
              <h3 className="text-xl font-bold font-mono mt-1 text-foreground">
                {batches.length}
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
              <p className="text-xs font-medium text-muted-foreground">Active Cohorts</p>
              <h3 className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {batches.filter((b) => b.isActive).length}
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
              <p className="text-xs font-medium text-muted-foreground">Enrolled Students</p>
              <h3 className="text-xl font-bold font-mono mt-1 text-foreground">
                {stats.totalAssignedMembers}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Unassigned Students</p>
              <h3 className="text-xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
                {stats.totalUnassignedMembers}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ MAIN BATCHES CARD ═══ */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Student Batches & Cohorts</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Organize students into batches to target tasks, quizzes, attendance sessions, and leaderboard rankings.
              </CardDescription>
            </div>

            {canManageBatches && (
              <Button
                type="button"
                onClick={() => {
                  setEditingBatch(null);
                  setIsCreateOpen(true);
                }}
                className="h-9 px-4 text-xs font-medium gap-1.5 bg-primary text-primary-foreground cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Batch</span>
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by batch name, code, year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8 text-xs px-2.5 cursor-pointer"
              >
                All ({batches.length})
              </Button>
              <Button
                type="button"
                variant={statusFilter === "active" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className="h-8 text-xs px-2.5 cursor-pointer"
              >
                Active ({batches.filter((b) => b.isActive).length})
              </Button>
              <Button
                type="button"
                variant={statusFilter === "inactive" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("inactive")}
                className="h-8 text-xs px-2.5 cursor-pointer"
              >
                Inactive ({batches.filter((b) => !b.isActive).length})
              </Button>

              <SilentRefreshButton toastMessage="Batches list refreshed silently" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredBatches.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery
                  ? "No batches found matching your search."
                  : "No batches created yet. Click 'Create Batch' to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-[30%]">Batch Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Admission Year</TableHead>
                    <TableHead>Enrolled Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch, index) => (
                    <TableRow
                      key={batch.id}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => setViewingMembersBatch(batch)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {index + 1}
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-foreground hover:underline">
                            {batch.name}
                          </p>
                          {batch.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {batch.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
                          {batch.code}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {batch.admissionYear || "—"}
                      </TableCell>

                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingMembersBatch(batch);
                          }}
                          className="h-7 text-xs gap-1.5 font-mono text-primary hover:text-primary"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>{batch.memberCount} Students</span>
                        </Button>
                      </TableCell>

                      <TableCell>
                        {batch.isActive ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-xs"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            onClick={() => setAddingMembersBatch(batch)}
                            title="Add Students to Batch"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Add Students</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setViewingMembersBatch(batch)}
                            title="View Enrolled Students"
                          >
                            <Users className="h-4 w-4" />
                          </Button>

                          {canManageBatches && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 text-xs">
                                <DropdownMenuItem
                                  onClick={() => setViewingMembersBatch(batch)}
                                  className="cursor-pointer"
                                >
                                  <Users className="h-3.5 w-3.5 mr-2 text-primary" />
                                  View Enrolled Students
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setAddingMembersBatch(batch)}
                                  className="cursor-pointer"
                                >
                                  <UserPlus className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                  Add Students to Batch
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingBatch(batch);
                                    setIsCreateOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                                  Edit Batch Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(batch)}
                                  className="cursor-pointer"
                                >
                                  {batch.isActive ? (
                                    <>
                                      <ToggleLeft className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                      Deactivate Batch
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                      Activate Batch
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(batch)}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete Batch
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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

      {/* Create / Edit Batch Dialog */}
      <CreateBatchDialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingBatch(null);
        }}
        editingBatch={editingBatch}
        onSuccess={async (msg) => {
          if (msg) toast.success(msg);
          await refreshBatches();
        }}
      />

      {/* View Enrolled Students Right Sidebar */}
      <BatchMembersSidebar
        isOpen={!!viewingMembersBatch}
        onClose={() => setViewingMembersBatch(null)}
        batch={viewingMembersBatch}
        onMembersUpdated={async () => {
          await refreshBatches();
        }}
        onOpenAddMembers={() => {
          const currentBatch = viewingMembersBatch;
          setViewingMembersBatch(null);
          setAddingMembersBatch(currentBatch);
        }}
      />

      {/* Add Students to Batch Right Sidebar */}
      <AddBatchMembersSidebar
        isOpen={!!addingMembersBatch}
        onClose={() => setAddingMembersBatch(null)}
        batch={addingMembersBatch}
        onMembersAdded={async () => {
          await refreshBatches();
        }}
      />
    </div>
  );
}
