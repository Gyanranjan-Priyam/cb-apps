"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DataCleanupOptions {
  participants: boolean;
  users: boolean;
  payments: boolean;
  s3Files: boolean;
}

export function DataCleanup() {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cleanupOptions, setCleanupOptions] = useState<DataCleanupOptions>({
    participants: false,
    users: false,
    payments: false,
    s3Files: false,
  });

  const handleOptionChange = (option: keyof DataCleanupOptions, checked: boolean) => {
    setCleanupOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  const getSelectedCount = () => {
    return Object.values(cleanupOptions).filter(Boolean).length;
  };

  const handleDataCleanup = async () => {
    if (getSelectedCount() === 0) {
      toast.error("Please select at least one data type to clean up");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/data-cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanupOptions),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
        // Reset options
        setCleanupOptions({
          participants: false,
          users: false,
          payments: false,
          s3Files: false,
        });
        // Optionally refresh the page or update UI
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to clean up data");
      }
    } catch (error) {
      console.error("Data cleanup error:", error);
      toast.error("An error occurred during data cleanup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm"
            className="w-fit"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clean Up Data
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Data Cleanup
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete selected data from the system and cannot be undone. 
              Please select which data types to remove:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>Warning:</strong> This action is irreversible. Admin accounts will not be affected.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="participants"
                  checked={cleanupOptions.participants}
                  onCheckedChange={(checked) => handleOptionChange("participants", checked as boolean)}
                />
                <label htmlFor="participants" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Participant Details
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="users"
                  checked={cleanupOptions.users}
                  onCheckedChange={(checked) => handleOptionChange("users", checked as boolean)}
                />
                <label htmlFor="users" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Non-Admin User Accounts
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="payments"
                  checked={cleanupOptions.payments}
                  onCheckedChange={(checked) => handleOptionChange("payments", checked as boolean)}
                />
                <label htmlFor="payments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Payment Records & Receipts
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="s3Files"
                  checked={cleanupOptions.s3Files}
                  onCheckedChange={(checked) => handleOptionChange("s3Files", checked as boolean)}
                />
                <label htmlFor="s3Files" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  S3 Files & Attachments
                </label>
              </div>
            </div>

            {getSelectedCount() > 0 && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <strong>{getSelectedCount()}</strong> data type(s) selected for deletion.
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDataCleanup}
              disabled={loading || getSelectedCount() === 0}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected Data
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}