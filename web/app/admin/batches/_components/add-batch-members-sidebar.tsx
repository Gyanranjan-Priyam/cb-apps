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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  UserPlus,
  Loader2,
  CheckCircle2,
  Layers,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  BatchItem,
  BatchMemberItem,
  getUnassignedMembers,
  assignMembersToBatch,
} from "../actions";
import { toast } from "sonner";

interface AddBatchMembersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchItem | null;
  onMembersAdded: () => void;
}

export function AddBatchMembersSidebar({
  isOpen,
  onClose,
  batch,
  onMembersAdded,
}: AddBatchMembersSidebarProps) {
  const [unassignedMembers, setUnassignedMembers] = useState<BatchMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && batch) {
      loadUnassigned();
      setSelectedIds(new Set());
      setSearchQuery("");
    }
  }, [isOpen, batch]);

  const loadUnassigned = async () => {
    setIsLoading(true);
    try {
      const res = await getUnassignedMembers();
      if (res.success && res.data) {
        setUnassignedMembers(res.data);
      } else {
        toast.error(res.error || "Failed to load unassigned students.");
      }
    } catch {
      toast.error("An error occurred loading student list.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return unassignedMembers;
    const q = searchQuery.toLowerCase().trim();
    return unassignedMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.cbUserId && m.cbUserId.toLowerCase().includes(q)) ||
        (m.rollNumber && m.rollNumber.toLowerCase().includes(q)) ||
        (m.branch && m.branch.toLowerCase().includes(q))
    );
  }, [unassignedMembers, searchQuery]);

  const allVisibleSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.has(m.id));

  const someVisibleSelected =
    filteredMembers.some((m) => selectedIds.has(m.id)) && !allVisibleSelected;

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredMembers.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredMembers.forEach((m) => next.add(m.id));
        return next;
      });
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAssign = async () => {
    if (!batch || selectedIds.size === 0) return;

    setIsSubmitting(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await assignMembersToBatch(batch.id, ids);
      if (res.success) {
        toast.success(res.message || `Assigned ${ids.length} student(s) to ${batch.name}!`);
        onMembersAdded();
        onClose();
      } else {
        toast.error(res.error || "Failed to assign students.");
      }
    } catch {
      toast.error("An error occurred while assigning students.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()} modal>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex h-dvh max-h-screen flex-col overflow-hidden"
      >
        {batch && (
          <>
            {/* Header */}
            <div className="shrink-0 border-b bg-background px-6 pt-6 pb-4">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-base font-bold flex items-center gap-2">
                      <span>Add Students to {batch.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {batch.code}
                      </Badge>
                    </SheetTitle>
                    <SheetDescription className="text-xs mt-0.5">
                      Select unassigned students to enroll them into this cohort.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Search & Select All Bar */}
              <div className="mt-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search unassigned students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-9 text-xs h-8"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground font-medium">
                    {selectedIds.size} of {filteredMembers.length} selected
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    disabled={filteredMembers.length === 0 || isSubmitting}
                    className="h-7 text-xs px-2"
                  >
                    {allVisibleSelected ? "Deselect All" : "Select All Visible"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable Students List */}
            <div
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-2.5"
              onWheel={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-xs gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Loading unassigned students...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/60 mx-auto" />
                  <p className="text-xs font-medium">
                    {searchQuery
                      ? "No unassigned students match your search."
                      : "All registered students are currently assigned to batches!"}
                  </p>
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const isChecked = selectedIds.has(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => !isSubmitting && toggleSelectMember(m.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                          : "bg-card/60 hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleSelectMember(m.id)}
                        disabled={isSubmitting}
                        className="rounded"
                      />

                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-xs shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
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
                  );
                })
              )}
            </div>

            {/* Sticky Bottom Actions Bar */}
            <div className="shrink-0 border-t bg-background px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAssign}
                  disabled={selectedIds.size === 0 || isSubmitting}
                  className="flex-1 text-xs h-9 bg-primary text-primary-foreground font-medium gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Assign ({selectedIds.size}) Students</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
