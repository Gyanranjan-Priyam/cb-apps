"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  UserPlus,
  Trash2,
  FileSpreadsheet,
  Loader2,
  UserX,
  Layers,
  GraduationCap,
  Mail,
  UserCheck,
} from "lucide-react";
import {
  BatchItem,
  BatchMemberItem,
  getBatchMembers,
  removeMembersFromBatch,
} from "../actions";
import { toast } from "sonner";

interface BatchMembersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchItem | null;
  onMembersUpdated: () => void;
  onOpenAddMembers: () => void;
}

export function BatchMembersSidebar({
  isOpen,
  onClose,
  batch,
  onMembersUpdated,
  onOpenAddMembers,
}: BatchMembersSidebarProps) {
  const [members, setMembers] = useState<BatchMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && batch) {
      loadMembers(batch.id);
      setSearchQuery("");
    }
  }, [isOpen, batch]);

  const loadMembers = async (batchId: string) => {
    setIsLoading(true);
    try {
      const res = await getBatchMembers(batchId);
      if (res.success && res.data) {
        setMembers(res.data);
      } else {
        toast.error(res.error || "Failed to load batch members.");
      }
    } catch {
      toast.error("An error occurred loading batch roster.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.cbUserId && m.cbUserId.toLowerCase().includes(q)) ||
        (m.rollNumber && m.rollNumber.toLowerCase().includes(q)) ||
        (m.branch && m.branch.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!batch) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from "${batch.name}"?`)) return;

    setIsRemovingId(userId);
    try {
      const res = await removeMembersFromBatch([userId]);
      if (res.success) {
        toast.success(`Removed ${memberName} from batch.`);
        setMembers((prev) => prev.filter((m) => m.id !== userId));
        onMembersUpdated();
      } else {
        toast.error(res.error || "Failed to remove member.");
      }
    } catch {
      toast.error("Error removing member.");
    } finally {
      setIsRemovingId(null);
    }
  };

  const handleExportRosterCSV = () => {
    if (!batch) return;
    const headers = ["Sl No.", "Name", "CB User ID", "Email", "Branch", "Roll No.", "Admission Year", "Role"];
    const rows = members.map((m, idx) => [
      idx + 1,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.cbUserId || "N/A"}"`,
      `"${m.email}"`,
      `"${m.branch || "N/A"}"`,
      `"${m.rollNumber || "N/A"}"`,
      `"${m.admissionYear || "N/A"}"`,
      `"${m.role || "member"}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Batch_Roster_${batch.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex h-dvh max-h-screen flex-col overflow-hidden"
      >
        {batch && (
          <>
            {/* Header */}
            <div className="shrink-0 border-b bg-background px-6 pt-6 pb-4">
              <SheetHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <SheetTitle className="text-base font-bold flex items-center gap-2">
                        <span>{batch.name}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {batch.code}
                        </Badge>
                      </SheetTitle>
                      <SheetDescription className="text-xs mt-0.5">
                        {members.length} enrolled student{members.length !== 1 ? "s" : ""} in this cohort
                      </SheetDescription>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Search Bar & Quick Add */}
              <div className="mt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search name, roll, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs h-8"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={onOpenAddMembers}
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-medium shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add Students</span>
                </Button>
              </div>
            </div>

            {/* Scrollable Members List */}
            <div
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-3"
              onWheel={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-xs gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Loading enrolled students...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center space-y-3">
                  <UserX className="h-10 w-10 opacity-30 mx-auto" />
                  <p className="text-xs font-medium">
                    {searchQuery
                      ? "No students match your search filter."
                      : "No students currently enrolled in this batch."}
                  </p>
                  {!searchQuery && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onOpenAddMembers}
                      className="text-xs gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add First Member</span>
                    </Button>
                  )}
                </div>
              ) : (
                filteredMembers.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/60 hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                          {m.branch && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                              {m.branch}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono truncate">
                          {m.cbUserId && <span>{m.cbUserId}</span>}
                          {m.rollNumber && <span>Roll: {m.rollNumber}</span>}
                          <span className="truncate">{m.email}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      disabled={isRemovingId === m.id}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      title="Remove from batch"
                    >
                      {isRemovingId === m.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Sticky Bottom Actions Bar */}
            <div className="shrink-0 border-t bg-background px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportRosterCSV}
                  disabled={members.length === 0}
                  className="flex-1 text-xs h-9 gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export CSV Roster</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 text-xs h-9"
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
