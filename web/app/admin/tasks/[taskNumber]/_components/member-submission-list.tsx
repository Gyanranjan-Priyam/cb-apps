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
import { Search, CheckCircle, XCircle, Clock, Eye, ExternalLink, Image as ImageIcon } from "lucide-react";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import { MemberForTask, evaluateSubmission } from "../../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface MemberSubmissionListProps {
  members: MemberForTask[];
  taskId: string;
  taskPoints: number;
  initialSubmissions: Record<string, {
    status: string;
    pointsAwarded: number;
    feedback: string | null;
    submittedAt: Date | null;
    evaluatedAt: Date | null;
    projectUrl: string | null;
    screenshotKey: string | null;
  }>;
  adminId: string;
}

export default function MemberSubmissionList({ 
  members, 
  taskId, 
  taskPoints,
  initialSubmissions, 
  adminId 
}: MemberSubmissionListProps) {
  const router = useRouter();
  
  // Helper function to construct S3 URL
  const getS3Url = (key: string) => {
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    if (!bucketName) return '';
    return `https://${bucketName}.t3.storage.dev/${key}`;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, any>>(initialSubmissions);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  
  // Evaluation dialog state
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberForTask | null>(null);
  const [evalStatus, setEvalStatus] = useState<string>("approved");
  const [evalPoints, setEvalPoints] = useState<number>(taskPoints);
  const [evalFeedback, setEvalFeedback] = useState<string>("");
  
  // View details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const handleEvaluate = (member: MemberForTask) => {
    setSelectedMember(member);
    const currentSub = submissionStatus[member.id];
    if (currentSub) {
      setEvalStatus(currentSub.status);
      setEvalPoints(currentSub.pointsAwarded || taskPoints);
      setEvalFeedback(currentSub.feedback || "");
    } else {
      setEvalStatus("approved");
      setEvalPoints(taskPoints);
      setEvalFeedback("");
    }
    setEvalDialogOpen(true);
  };

  const handleViewDetails = (member: MemberForTask) => {
    setSelectedMember(member);
    const submission = submissionStatus[member.id];
    setSelectedSubmission(submission);
    setDetailsDialogOpen(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedMember) return;

    setEvaluatingId(selectedMember.id);

    // Force points to 0 if status is rejected or pending
    const finalPoints = (evalStatus === "rejected" || evalStatus === "pending") ? 0 : evalPoints;

    try {
      const result = await evaluateSubmission(
        taskId, 
        selectedMember.id, 
        evalStatus,
        finalPoints,
        evalFeedback || null,
        adminId
      );

      if (result.status === "success") {
        toast.success(result.message);
        setSubmissionStatus((prev) => ({
          ...prev,
          [selectedMember.id]: {
            status: evalStatus,
            pointsAwarded: finalPoints,
            feedback: evalFeedback,
            submittedAt: prev[selectedMember.id]?.submittedAt || new Date(),
            evaluatedAt: new Date(),
          },
        }));
        setEvalDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to evaluate submission");
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
      
      const memberStatus = submissionStatus[member.id]?.status || "pending";
      const matchesStatus = selectedStatus === "all" || memberStatus === selectedStatus;

      return matchesSearch && matchesYear && matchesBranch && matchesStatus;
    });
  }, [members, searchQuery, selectedYear, selectedBranch, selectedStatus, submissionStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case "submitted":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Submitted</Badge>;
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
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <SilentRefreshButton toastMessage="Task submissions refreshed silently" />
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No submissions yet. Be patient, students will submit soon!
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No members match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const submission = submissionStatus[member.id];
                  const status = submission?.status || "pending";
                  const points = submission?.pointsAwarded || 0;
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="cursor-pointer"
                            onClick={() => handleViewDetails(member)}
                            title="View submission details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEvaluate(member)}
                            className="cursor-pointer"
                            disabled={isEvaluating}
                          >
                            {isEvaluating ? "..." : "Evaluate"}
                          </Button>
                        </div>
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
            <DialogTitle>Evaluate Submission</DialogTitle>
            <DialogDescription>
              {selectedMember && `Evaluating submission for ${selectedMember.name}`}
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
                  <SelectItem value="submitted">Submitted (Not Reviewed)</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending (Not Submitted)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points Awarded</Label>
              <Input
                id="points"
                type="number"
                min="0"
                max={taskPoints}
                value={evalStatus === "rejected" || evalStatus === "pending" ? 0 : evalPoints}
                onChange={(e) => setEvalPoints(parseInt(e.target.value) || 0)}
                placeholder="Enter points"
                disabled={evalStatus === "rejected" || evalStatus === "pending"}
              />
              <p className="text-xs text-muted-foreground">
                {evalStatus === "rejected" || evalStatus === "pending" 
                  ? "No points awarded for rejected/pending submissions" 
                  : `Max points: ${taskPoints}`}
              </p>
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

            {selectedMember && submissionStatus[selectedMember.id] && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm font-medium">Submission Details:</p>
                
                {/* Project URL */}
                {submissionStatus[selectedMember.id].projectUrl && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Project Repository:</p>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs break-all">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <a
                        href={submissionStatus[selectedMember.id].projectUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {submissionStatus[selectedMember.id].projectUrl}
                      </a>
                    </div>
                  </div>
                )}

                {/* Screenshot */}
                {submissionStatus[selectedMember.id].screenshotKey && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Screenshot:</p>
                    <div className="relative rounded border overflow-hidden bg-muted">
                      <img
                        src={getS3Url(submissionStatus[selectedMember.id].screenshotKey!)}
                        alt="Submission screenshot"
                        className="w-full h-auto max-h-[200px] object-contain cursor-pointer"
                        onClick={() => window.open(getS3Url(submissionStatus[selectedMember.id].screenshotKey!), '_blank')}
                        title="Click to view full size"
                      />
                    </div>
                  </div>
                )}

                {/* Submission Times */}
                {submissionStatus[selectedMember.id].submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    Submitted: {format(new Date(submissionStatus[selectedMember.id].submittedAt!), "MMM dd, yyyy hh:mm a")}
                  </p>
                )}
                {submissionStatus[selectedMember.id].evaluatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last Evaluated: {format(new Date(submissionStatus[selectedMember.id].evaluatedAt!), "MMM dd, yyyy hh:mm a")}
                  </p>
                )}
                {submissionStatus[selectedMember.id].feedback && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Previous Feedback:</p>
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{submissionStatus[selectedMember.id].feedback}</p>
                  </div>
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

      {/* Submission Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedMember && `Viewing submission details for ${selectedMember.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Student Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Student Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedMember?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Username</p>
                  <p className="font-medium">{selectedMember?.username || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registration</p>
                  <p className="font-medium">{selectedMember?.registration || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Branch</p>
                  <p className="font-medium">{selectedMember?.branch || "-"}</p>
                </div>
              </div>
            </div>

            {/* Submission Status */}
            <div className="space-y-3 pt-3 border-t">
              <h3 className="text-sm font-semibold text-foreground">Submission Status</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {selectedSubmission && getStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Points Awarded</p>
                  <p className="font-medium text-lg">{selectedSubmission?.pointsAwarded || 0} pts</p>
                </div>
                {selectedSubmission?.submittedAt && (
                  <div>
                    <p className="text-muted-foreground">Submitted At</p>
                    <p className="font-medium">{format(new Date(selectedSubmission.submittedAt), "MMM dd, yyyy hh:mm a")}</p>
                  </div>
                )}
                {selectedSubmission?.evaluatedAt && (
                  <div>
                    <p className="text-muted-foreground">Evaluated At</p>
                    <p className="font-medium">{format(new Date(selectedSubmission.evaluatedAt), "MMM dd, yyyy hh:mm a")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project URL */}
            {selectedSubmission?.projectUrl && (
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-sm font-semibold text-foreground">Project Repository</h3>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={selectedSubmission.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    {selectedSubmission.projectUrl}
                  </a>
                </div>
              </div>
            )}

            {/* Screenshot */}
            {selectedSubmission?.screenshotKey && (
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Screenshot
                </h3>
                <div className="relative rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={getS3Url(selectedSubmission.screenshotKey)}
                    alt="Submission screenshot"
                    className="w-full h-auto max-h-[400px] object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "";
                      target.alt = "Failed to load screenshot";
                      target.className = "w-full h-32 flex items-center justify-center text-muted-foreground";
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={getS3Url(selectedSubmission.screenshotKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
            )}

            {/* Feedback */}
            {selectedSubmission?.feedback && (
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-sm font-semibold text-foreground">Feedback</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedSubmission.feedback}</p>
                </div>
              </div>
            )}

            {/* No submission data */}
            {!selectedSubmission?.projectUrl && !selectedSubmission?.screenshotKey && !selectedSubmission?.feedback && (
              <div className="py-8 text-center text-muted-foreground">
                <p>No additional submission details available</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button 
            className="cursor-pointer"
               onClick={() => {
              setDetailsDialogOpen(false);
              if (selectedMember) {
                handleEvaluate(selectedMember);
              }
            }}>
              Evaluate Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
