/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { 
  Ban, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  Trophy,
  Calendar,
  Mail,
  UserCog,
  TrendingUp,
  Award,
  Target,
  Hash,
  UserCheck,
  UserPen,
} from "lucide-react";
import { toggleMemberBan, deleteMember } from "../../actions";
import { format } from "date-fns";
import EmailComposeSidebar from "./email-compose-sidebar";
import { AssignRolesDomainSheet } from "../../_components/assign-roles-domain-sheet";
import { EditMemberSheet } from "../../_components/edit-member-sheet";

interface MemberSidebarProps {
  member: any;
  stats: {
    totalPoints: number;
    currentRanking: number;
    totalMembers: number;
    monthlyPoints: number;
    monthlyRanking: number;
    attendancePoints: number;
    taskPoints: number;
    eventPoints: number;
    quizPoints: number;
  } | null;
}

export default function MemberSidebar({ member, stats }: MemberSidebarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isEmailSidebarOpen, setIsEmailSidebarOpen] = useState(false);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);

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
    <div className="lg:sticky lg:top-6 space-y-4">
      {/* Points & Ranking Card */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Points & Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Points */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-yellow-50 to-orange-50 border border-yellow-200">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.totalPoints}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>

            {/* Overall Ranking */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <div>
                <p className="text-sm text-muted-foreground">Overall Rank</p>
                <p className="text-2xl font-bold text-blue-700">
                  #{stats.currentRanking}
                  <span className="text-sm text-muted-foreground ml-1">
                    / {stats.totalMembers}
                  </span>
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>

            <Separator />

            {/* Monthly Stats */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">This Month</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground">Points</p>
                  <p className="text-lg font-bold">{stats.monthlyPoints}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <p className="text-lg font-bold">#{stats.monthlyRanking}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Points Breakdown */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Points Breakdown</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Attendance
                  </span>
                  <span className="font-semibold">{stats.attendancePoints}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Tasks
                  </span>
                  <span className="font-semibold">{stats.taskPoints}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Events
                  </span>
                  <span className="font-semibold">{stats.eventPoints}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    Quizzes
                  </span>
                  <span className="font-semibold">{stats.quizPoints}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Member Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {member.cbUserId && (
            <>
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CB User ID</p>
                  <p className="text-sm font-medium font-mono">{member.cbUserId}</p>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Joining Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Joined</p>
              <p className="text-sm font-medium">
                {format(new Date(member.createdAt), "MMM dd, yyyy")}
              </p>
            </div>
          </div>

          <Separator />

          {/* GitHub Username */}
          {member.githubUsername && (
            <>
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-muted-foreground mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">GitHub</p>
                  <a 
                    href={`https://github.com/${member.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    @{member.githubUsername}
                  </a>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Account Status */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Account Status</p>
            <div className="flex flex-wrap gap-2">
              {member.emailVerified ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Unverified
                </Badge>
              )}
              {member.banned ? (
                <Badge variant="destructive">
                  <Ban className="h-3 w-3 mr-1" />
                  Banned
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Email Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full cursor-pointer" 
            variant="outline"
            onClick={() => setIsEmailSidebarOpen(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </CardContent>
      </Card>

      {/* Email Compose Sidebar */}
      <EmailComposeSidebar
        isOpen={isEmailSidebarOpen}
        onClose={() => setIsEmailSidebarOpen(false)}
        recipientEmail={member.email}
        recipientName={member.name}
      />

      {/* Member Actions Card */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Member Actions
          </CardTitle>
          <CardDescription className="text-xs">
            Manage member account status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Edit Member Details */}
          <Button
            variant="outline"
            className="w-full justify-start text-xs font-medium"
            onClick={() => setShowEditSheet(true)}
          >
            <UserPen className="mr-2 h-4 w-4 text-primary" />
            <span>Edit Member Details</span>
          </Button>

          {/* Assign Batch, Roles & Domain */}
          <Button
            variant="outline"
            className="w-full justify-start text-xs font-medium"
            onClick={() => setShowAssignSheet(true)}
          >
            <UserCheck className="mr-2 h-4 w-4 text-primary" />
            <span>Assign Batch, Roles & Domain</span>
          </Button>

          {/* Ban/Unban Member */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant={member.banned ? "outline" : "destructive"}
                className="w-full"
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
              <Button 
                variant="outline" 
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                disabled={isLoading}
              >
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
        </CardContent>
      </Card>

      <AssignRolesDomainSheet
        isOpen={showAssignSheet}
        onClose={() => setShowAssignSheet(false)}
        member={member}
        onSuccess={() => router.refresh()}
      />

      <EditMemberSheet
        isOpen={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        member={member}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
