"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Layers } from "lucide-react";
import { BatchItem, createBatch, updateBatch } from "../actions";

interface CreateBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingBatch?: BatchItem | null;
  onSuccess: (message: string) => void;
}

export function CreateBatchDialog({
  isOpen,
  onClose,
  editingBatch,
  onSuccess,
}: CreateBatchDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBatch) {
      setName(editingBatch.name);
      setCode(editingBatch.code);
      setDescription(editingBatch.description || "");
      setAdmissionYear(editingBatch.admissionYear || "");
      setIsActive(editingBatch.isActive);
    } else {
      setName("");
      setCode("");
      setDescription("");
      setAdmissionYear(new Date().getFullYear().toString());
      setIsActive(true);
    }
    setError(null);
  }, [editingBatch, isOpen]);

  // Auto-generate code slug suggestion from name if creating
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingBatch && !code) {
      const suggested = val
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 15);
      setCode(suggested);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Batch name is required.");
      return;
    }
    if (!code.trim()) {
      setError("Batch code is required.");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      if (editingBatch) {
        const res = await updateBatch(editingBatch.id, {
          name,
          code,
          description,
          admissionYear,
          isActive,
        });
        if (res.success) {
          onSuccess(res.message || "Batch updated successfully!");
          onClose();
        } else {
          setError(res.error || "Failed to update batch.");
        }
      } else {
        const res = await createBatch({
          name,
          code,
          description,
          admissionYear,
          isActive,
        });
        if (res.success) {
          onSuccess(res.message || "Batch created successfully!");
          onClose();
        } else {
          setError(res.error || "Failed to create batch.");
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {editingBatch ? "Edit Batch" : "Create New Batch"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {editingBatch
                  ? "Update batch parameters and active status."
                  : "Create a cohort/batch to group students and assign tasks or quizzes."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="batch-name" className="text-xs font-medium">
              Batch Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="batch-name"
              placeholder="e.g., Batch 2024-28 (CSE) / Alpha Cohort"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isPending}
              className="text-xs h-9"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="batch-code" className="text-xs font-medium">
                Batch Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="batch-code"
                placeholder="e.g., B24-CSE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isPending}
                className="text-xs h-9 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admission-year" className="text-xs font-medium">
                Admission Year / Cohort
              </Label>
              <Input
                id="admission-year"
                placeholder="e.g., 2024"
                value={admissionYear}
                onChange={(e) => setAdmissionYear(e.target.value)}
                disabled={isPending}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="batch-description" className="text-xs font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="batch-description"
              placeholder="Brief info about this student cohort or branch specialization..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              className="text-xs resize-none h-20"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="is-active" className="text-xs font-medium cursor-pointer">
                Active Batch
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Active batches are available when assigning tasks, quizzes, and attendance.
              </p>
            </div>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="text-xs h-9 bg-primary text-primary-foreground font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : editingBatch ? (
                "Save Changes"
              ) : (
                "Create Batch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
