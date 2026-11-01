"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Ban, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { toggleMemberBan, deleteMember } from "../../actions";

interface MemberActionsProps {
  member: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    banned: boolean | null;
  };
}

export default function MemberActions({ member }: MemberActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [banReason, setBanReason] = useState("");

  const handleToggleBan = async () => {
    if (!member.banned && !banReason.trim()) {
      toast.error("Please provide a reason for banning this member");
      return;
    }

    setIsLoading(true);
    try {
      const result = await toggleMemberBan(member.id, banReason);
      
      if (result.status === "success") {
        toast.success(result.message);
        setBanReason("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteMember(member.id);
      
      if (result.status === "success") {
        toast.success(result.message);
        router.push("/admin/members");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Actions</CardTitle>
        <CardDescription>Manage this member's account status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Ban/Unban Member */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant={member.banned ? "outline" : "destructive"}
                className="flex-1"
                disabled={isLoading}
              >
                {member.banned ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Unban Member
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Ban Member
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {member.banned ? "Unban Member?" : "Ban Member?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {member.banned ? (
                    <>
                      This will restore <strong>{member.name}</strong>'s access to the platform.
                    </>
                  ) : (
                    <>
                      This will restrict <strong>{member.name}</strong>'s access to the platform.
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                    `Confirm ${member.banned ? "Unban" : "Ban"}`
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Member */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1" disabled={isLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Member
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Member?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{member.name}</strong> ({member.email}) from the system.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
        </div>
      </CardContent>
    </Card>
  );
}
