"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getStudentDetailsByResponseId, assignStudentToSystem } from "@/app/admin/quizzes/actions";
import { Loader2, Search, Monitor, User, Mail, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface System {
  id: string;
  systemCode: string;
  systemNumber: string;
  status: string;
  assignedStudentName: string | null;
  assignedStudentEmail: string | null;
  assignedSet: string | null;
}

interface FormResponse {
  id: string;
  submittedByName?: string;
  submittedByEmail?: string;
}

interface AssignStudentFormProps {
  quizId: string;
  quizSlug: string;
  sets: number;
  systems: System[];
  formResponses: FormResponse[];
  initialSystemCode?: string;
  hasLinkedForm: boolean;
}

export default function AssignStudentForm({
  quizId,
  quizSlug,
  sets,
  systems,
  formResponses,
  initialSystemCode,
  hasLinkedForm,
}: AssignStudentFormProps) {
  const router = useRouter();

  const [selectedSystemCode, setSelectedSystemCode] = useState(initialSystemCode || "");
  const [responseId, setResponseId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedSet, setSelectedSet] = useState("A");
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFetchStudent = async () => {
    if (!responseId.trim()) { toast.error("Enter a Response ID first"); return; }
    setIsFetching(true);
    const res = await getStudentDetailsByResponseId(responseId.trim());
    if (res.status === "success" && res.data) {
      setStudentName(res.data.studentName || (res.data as any).name || "");
      setStudentEmail(res.data.studentEmail || (res.data as any).email || "");
      toast.success("Student details fetched");
    } else {
      toast.error(res.message || "Response not found");
    }
    setIsFetching(false);
  };

  const handleAssign = async () => {
    if (!selectedSystemCode) { toast.error("Select a system first"); return; }
    if (!studentName.trim()) { toast.error("Student name is required"); return; }
    if (!studentEmail.trim()) { toast.error("Student email is required"); return; }

    setIsSubmitting(true);
    const res = await assignStudentToSystem({
      systemCode: selectedSystemCode,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      assignedSet: selectedSet,
    });

    if (res.status === "success") {
      toast.success("Student assigned successfully");
      router.push(`/admin/quizzes/${quizSlug}/systems`);
      router.refresh();
    } else {
      toast.error(res.message || "Failed to assign student");
    }
    setIsSubmitting(false);
  };

  const selectedSystem = systems.find(s => s.systemCode === selectedSystemCode);
  const availableSystems = systems.filter(s => s.status === "REGISTERED" || s.status === "ASSIGNED");

  return (
    <div className="space-y-6">
      {/* Step 1: Select system */}
      <div className="space-y-2">
        <Label>System / Desk *</Label>
        <Select value={selectedSystemCode} onValueChange={setSelectedSystemCode}>
          <SelectTrigger>
            <SelectValue placeholder="Select a registered system..." />
          </SelectTrigger>
          <SelectContent>
            {availableSystems.map((s) => (
              <SelectItem key={s.systemCode} value={s.systemCode}>
                <span className="flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5" />
                  {s.systemNumber}
                  <span className="font-mono text-xs text-muted-foreground">{s.systemCode}</span>
                  {s.status === "ASSIGNED" && <Badge variant="secondary" className="text-xs ml-1">Reassigning</Badge>}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSystem && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Monitor className="h-3 w-3" />
            System code: <span className="font-mono">{selectedSystem.systemCode}</span>
            {selectedSystem.assignedStudentName && (
              <> · Currently: {selectedSystem.assignedStudentName}</>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Step 2: Fetch by Response ID */}
      {hasLinkedForm && (
        <div className="space-y-3">
          <Label>Auto-fetch by Response ID</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Paste Response ID..."
              value={responseId}
              onChange={(e) => setResponseId(e.target.value)}
              className="font-mono text-sm"
            />
            <Button type="button" variant="outline" onClick={handleFetchStudent} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Name and email will be auto-filled from the registration form response.</p>

          {/* Quick response picker */}
          {formResponses.length > 0 && (
            <div className="max-h-36 overflow-y-auto space-y-1 border rounded-md p-2">
              {formResponses.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className="w-full flex items-center justify-between text-xs p-2 rounded hover:bg-muted text-left"
                  onClick={() => {
                    setResponseId(r.id);
                    setStudentName(r.submittedByName || "");
                    setStudentEmail(r.submittedByEmail || "");
                  }}
                >
                  <span>{r.submittedByName || r.id.slice(0, 8)}</span>
                  <span className="text-muted-foreground font-mono">{r.id.slice(0, 8)}...</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Student details */}
      <div className="space-y-3">
        <Label>Student Details *</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Email address"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
            />
          </div>
        </div>

        {studentName && studentEmail && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>{studentName}</strong> · {studentEmail}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Step 4: Assign set */}
      <div className="space-y-2">
        <Label>Assign Set *</Label>
        <Select value={selectedSet} onValueChange={setSelectedSet}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: sets }, (_, i) => {
              const letter = String.fromCharCode(65 + i);
              return <SelectItem key={letter} value={letter}>Set {letter}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => router.push(`/admin/quizzes/${quizSlug}/systems`)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleAssign} disabled={isSubmitting || !selectedSystemCode || !studentName || !studentEmail}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Assign Student
        </Button>
      </div>
    </div>
  );
}
