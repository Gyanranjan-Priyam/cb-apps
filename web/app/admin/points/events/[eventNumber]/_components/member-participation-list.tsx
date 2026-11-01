"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import { MemberForEvent, evaluateParticipation } from "../../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface MemberParticipationListProps {
  members: MemberForEvent[];
  eventId: string;
  eventPoints: number;
  initialParticipations: Record<string, {
    status: string;
    pointsAwarded: number;
    feedback: string | null;
    participatedAt: Date | null;
    evaluatedAt: Date | null;
  }>;
  adminId: string;
}

export default function MemberParticipationList({ 
  members, 
  eventId, 
  eventPoints,
  initialParticipations, 
  adminId 
}: MemberParticipationListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [participationStatus, setParticipationStatus] = useState<Record<string, any>>(initialParticipations);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  
  // Evaluation dialog state
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberForEvent | null>(null);
  const [evalStatus, setEvalStatus] = useState<string>("approved");
  const [evalPoints, setEvalPoints] = useState<number>(eventPoints);
  const [evalFeedback, setEvalFeedback] = useState<string>("");

  const handleEvaluate = (member: MemberForEvent) => {
    setSelectedMember(member);
    const currentPart = participationStatus[member.id];
    if (currentPart) {
      setEvalStatus(currentPart.status);
      setEvalPoints(currentPart.pointsAwarded || eventPoints);
      setEvalFeedback(currentPart.feedback || "");
    } else {
      setEvalStatus("approved");
      setEvalPoints(eventPoints);
      setEvalFeedback("");
    }
    setEvalDialogOpen(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedMember) return;

    setEvaluatingId(selectedMember.id);

    try {
      const result = await evaluateParticipation(
        eventId, 
        selectedMember.id, 
        evalStatus,
        evalPoints,
        evalFeedback || null,
        adminId
      );

      if (result.status === "success") {
        toast.success(result.message);
        setParticipationStatus((prev) => ({
          ...prev,
          [selectedMember.id]: {
            status: evalStatus,
            pointsAwarded: evalPoints,
            feedback: evalFeedback,
            participatedAt: prev[selectedMember.id]?.participatedAt || new Date(),
            evaluatedAt: new Date(),
          },
        }));
        setEvalDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to evaluate participation");
    } finally {
      setEvaluatingId(null);
    }
  };

  // Get unique years and branches
  const years = useMemo(() => {
    const uniqueYears = new Set(members.map(m => m.admissionYear).filter(Boolean));
    return Array.from(uniqueYears).sort().reverse();
  }, [members]);

  const branches = useMemo(() => {
    const uniqueBranches = new Set(members.map(m => m.branch).filter(Boolean));
    return Array.from(uniqueBranches).sort();
  }, [members]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.registration?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesYear = selectedYear === "all" || member.admissionYear === selectedYear;
      const matchesBranch = selectedBranch === "all" || member.branch === selectedBranch;
      
      const memberStatus = participationStatus[member.id]?.status || "pending";
      const matchesStatus = selectedStatus === "all" || memberStatus === selectedStatus;

      return matchesSearch && matchesYear && matchesBranch && matchesStatus;
    });
  }, [members, searchQuery, selectedYear, selectedBranch, selectedStatus, participationStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case "participated":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Participated</Badge>;
      default:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, username, or registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year!}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch} value={branch!}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="participated">Participated</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <SilentRefreshButton toastMessage="Participation records refreshed silently" />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const participation = participationStatus[member.id];
                  const status = participation?.status || "pending";
                  const points = participation?.pointsAwarded || 0;
                  const isEvaluating = evaluatingId === member.id;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.username || "-"}</TableCell>
                      <TableCell>{member.registration || "-"}</TableCell>
                      <TableCell>{member.branch || "-"}</TableCell>
                      <TableCell>{member.admissionYear || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          {getStatusBadge(status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {points > 0 ? (
                          <Badge variant="secondary">{points} pts</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEvaluate(member)}
                          disabled={isEvaluating}
                        >
                          {isEvaluating ? "..." : "Evaluate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredMembers.length} of {members.length} members
          </p>
        </div>
      </div>

      {/* Evaluation Dialog */}
      <Dialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Evaluate Participation</DialogTitle>
            <DialogDescription>
              {selectedMember && `Evaluating participation for ${selectedMember.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={evalStatus} onValueChange={setEvalStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participated">Participated (Not Reviewed)</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending (Did Not Participate)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points Awarded</Label>
              <Input
                id="points"
                type="number"
                min="0"
                max={eventPoints}
                value={evalPoints}
                onChange={(e) => setEvalPoints(parseInt(e.target.value) || 0)}
                placeholder="Enter points"
              />
              <p className="text-xs text-muted-foreground">Max points: {eventPoints}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={evalFeedback}
                onChange={(e) => setEvalFeedback(e.target.value)}
                placeholder="Provide feedback for the member..."
                rows={4}
              />
            </div>

            {selectedMember && participationStatus[selectedMember.id] && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">Current Participation Info:</p>
                {participationStatus[selectedMember.id].participatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Participated: {format(new Date(participationStatus[selectedMember.id].participatedAt!), "MMM dd, yyyy hh:mm a")}
                  </p>
                )}
                {participationStatus[selectedMember.id].evaluatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last Evaluated: {format(new Date(participationStatus[selectedMember.id].evaluatedAt!), "MMM dd, yyyy hh:mm a")}
                  </p>
                )}
                {participationStatus[selectedMember.id].feedback && (
                  <p className="text-xs text-muted-foreground">
                    Previous Feedback: {participationStatus[selectedMember.id].feedback}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="cursor-pointer" variant="outline" onClick={() => setEvalDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleSubmitEvaluation} disabled={evaluatingId !== null}>
              {evaluatingId ? "Saving..." : "Save Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
