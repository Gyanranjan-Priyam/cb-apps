/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { createQuiz } from "../../actions";
import { generateQuizId } from "../../utils";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Globe,
  Key,
  RefreshCw,
  Award,
  Eye,
  Layers,
  Edit3,
} from "lucide-react";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  targetAudience: z.enum(["INTERNAL", "EXTERNAL"]),
  accessCode: z.string().optional(),
  formId: z.string().optional(),
  feedbackFormId: z.string().optional(),
  sets: z.number().min(1).max(8),
  shifts: z.number().min(1).max(10).optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  pointsPerQuestion: z.number().min(0.01, "Points must be greater than 0"),
  cutoffMarks: z.number().min(0).optional(),
  cutoffType: z.enum(["PERCENTAGE", "MARKS", "TOP_N"]).optional(),
  topSelectCount: z.number().min(1).optional(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  questionsJson: z.string().optional(),
}).refine((data) => data.endDateTime > data.startDateTime, {
  message: "End date must be after start date",
  path: ["endDateTime"],
});

type FormData = z.infer<typeof formSchema>;

interface CreateQuizFormProps {
  userId: string;
  forms?: Array<{ id: string; formId: string; title: string }>;
  initialAudience?: "INTERNAL" | "EXTERNAL";
}

interface ShiftItem {
  shiftNumber: number;
  name: string;
  set: string;
  sets: string[];
}

export default function CreateQuizForm({ userId, forms = [], initialAudience = "INTERNAL" }: CreateQuizFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // Shift-isolated questions: { [shiftNumber]: { [setLetter]: Question[] } }
  const [shiftQuestions, setShiftQuestions] = useState<Record<number, Record<string, any[]>>>({
    1: { A: [] }
  });
  // Textarea values keyed by `shift_${shiftNumber}_${setLetter}`
  const [textareaValues, setTextareaValues] = useState<Record<string, string>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSet, setPreviewSet] = useState<string>("ALL");
  const [selectedShiftForSidebar, setSelectedShiftForSidebar] = useState<number | null>(null);
  const [isShiftSidebarOpen, setIsShiftSidebarOpen] = useState(false);
  const [activeSidebarSet, setActiveSidebarSet] = useState<string>("A");
  const [activePreviewShiftTab, setActivePreviewShiftTab] = useState<string>("shift-1");
  const [shiftsConfig, setShiftsConfig] = useState<ShiftItem[]>([
    { shiftNumber: 1, name: "Shift 1", set: "A", sets: ["A"] }
  ]);

  const generate6DigitCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quizId: "",
      title: "",
      description: "",
      targetAudience: initialAudience,
      accessCode: generate6DigitCode(),
      formId: "",
      feedbackFormId: "",
      sets: 1,
      shifts: 1,
      duration: 30,
      pointsPerQuestion: 1,
      cutoffMarks: 50,
      cutoffType: "PERCENTAGE",
      topSelectCount: 10,
      startDateTime: new Date(),
      endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      questionsJson: "",
    },
  });

  useEffect(() => {
    const id = generateQuizId();
    form.setValue("quizId", id);
  }, []);

  const watchTitle = form.watch("title");
  const watchDescription = form.watch("description");
  const watchAudience = form.watch("targetAudience");
  const watchAccessCode = form.watch("accessCode");
  const watchDuration = form.watch("duration");
  const watchPoints = form.watch("pointsPerQuestion");
  const watchSets = form.watch("sets");
  const watchShifts = form.watch("shifts") || 1;

  // Initialize/sync shiftQuestions map when shifts or sets count change
  useEffect(() => {
    const numShifts = watchShifts;
    const numSets = watchSets || 1;

    setShiftQuestions((prev) => {
      const next: Record<number, Record<string, any[]>> = {};
      for (let s = 1; s <= numShifts; s++) {
        next[s] = {};
        for (let i = 0; i < numSets; i++) {
          const letter = String.fromCharCode(65 + i);
          next[s][letter] = prev[s]?.[letter] || [];
        }
      }
      return next;
    });
  }, [watchShifts, watchSets]);

  const prevSetsRef = useRef(watchSets);

  useEffect(() => {
    const numShifts = watchShifts;
    const numSets = watchSets || 1;
    const availableSetLetters = Array.from({ length: numSets }, (_, i) => String.fromCharCode(65 + i));
    const setsCountChanged = prevSetsRef.current !== watchSets;
    prevSetsRef.current = watchSets;

    setShiftsConfig((prev) => {
      const next: ShiftItem[] = [];
      for (let i = 1; i <= numShifts; i++) {
        const existing = prev.find((p) => p.shiftNumber === i);
        let assignedSets: string[] = [];
        if (setsCountChanged || !existing) {
          assignedSets = [...availableSetLetters];
        } else if (existing?.sets && Array.isArray(existing.sets)) {
          assignedSets = existing.sets.filter((s) => availableSetLetters.includes(s));
          if (assignedSets.length === 0) assignedSets = [...availableSetLetters];
        } else {
          assignedSets = [...availableSetLetters];
        }
        next.push({
          shiftNumber: i,
          name: existing?.name || `Shift ${i}`,
          set: assignedSets[0] || "A",
          sets: assignedSets,
        });
      }
      return next;
    });
  }, [watchShifts, watchSets]);

  const openShiftSidebar = (shiftNum: number, defaultSetLetter?: string) => {
    setSelectedShiftForSidebar(shiftNum);
    const targetShift = shiftsConfig.find((s) => s.shiftNumber === shiftNum);
    const availableShiftSets = targetShift?.sets && targetShift.sets.length > 0 ? targetShift.sets : ["A"];
    const setLetterToUse = defaultSetLetter || availableShiftSets[0] || "A";
    setActiveSidebarSet(setLetterToUse);
    setJsonError(null);
    setIsShiftSidebarOpen(true);
  };

  const validateAndUpdateSet = (jsonString: string, shiftNum: number, setLetter: string) => {
    const storageKey = `shift_${shiftNum}_${setLetter}`;
    if (!jsonString.trim()) {
      setShiftQuestions((prev) => ({
        ...prev,
        [shiftNum]: {
          ...(prev[shiftNum] || {}),
          [setLetter]: [],
        },
      }));
      setTextareaValues((prev) => ({ ...prev, [storageKey]: "" }));
      setJsonError(null);
      toast.info(`Shift ${shiftNum} · Set ${setLetter} questions cleared`);
      return;
    }
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        setJsonError("Questions must be an array of objects [ { ... } ]");
        return;
      }
      const isValid = parsed.every(
        (q: any) =>
          q.id !== undefined &&
          q.question &&
          Array.isArray(q.options) &&
          q.options.length > 0 &&
          q.answer !== undefined
      );
      if (!isValid) {
        setJsonError("Each question must have: id, question, options array, and answer");
        return;
      }
      setShiftQuestions((prev) => ({
        ...prev,
        [shiftNum]: {
          ...(prev[shiftNum] || {}),
          [setLetter]: parsed,
        },
      }));
      setTextareaValues((prev) => ({ ...prev, [storageKey]: jsonString }));
      setJsonError(null);
      toast.success(`Shift ${shiftNum} · Set ${setLetter}: ${parsed.length} questions saved!`);
    } catch {
      setJsonError("Invalid JSON format. Please check for syntax errors.");
    }
  };

  const combineAllSets = () => {
    const output: Record<string, any> = {};
    Object.entries(shiftQuestions).forEach(([sNumStr, setsMap]) => {
      const sNum = parseInt(sNumStr, 10);
      output[`shift_${sNum}`] = setsMap;
      Object.entries(setsMap).forEach(([sLetter, qList]) => {
        output[`shift_${sNum}_${sLetter}`] = qList;
        output[`${sNum}_${sLetter}`] = qList;
      });
    });
    // Legacy fallback for Shift 1
    if (shiftQuestions[1]) {
      Object.entries(shiftQuestions[1]).forEach(([sLetter, qList]) => {
        output[sLetter] = qList;
      });
    }
    return JSON.stringify(output);
  };

  const onSubmit = async (data: FormData) => {
    const totalQCount = Object.values(shiftQuestions).reduce(
      (acc, setsMap) => acc + Object.values(setsMap).reduce((sum, qList) => sum + (qList?.length || 0), 0),
      0
    );
    if (totalQCount === 0) {
      toast.error("Please add questions for at least one shift in the Shift sidebar");
      return;
    }
    setIsLoading(true);

    const questionsJson = combineAllSets();
    const numShifts = data.shifts || shiftsConfig.length || 1;
    const shiftsJson = JSON.stringify(shiftsConfig);

    try {
      const result = await createQuiz({
        ...data,
        questionsJson,
        shifts: numShifts,
        shiftsJson,
        activeShift: 1,
        createdBy: userId,
        accessCode: data.targetAudience === "EXTERNAL" ? data.accessCode || null : null,
        formId: data.targetAudience === "EXTERNAL" ? (data.formId === "none" || !data.formId ? null : data.formId) : null,
        feedbackFormId: data.targetAudience === "EXTERNAL" ? (data.feedbackFormId === "none" || !data.feedbackFormId ? null : data.feedbackFormId) : null,
      });

      if (result.status === "success") {
        toast.success("Quiz created successfully!");
        router.push("/admin/quizzes");
      } else {
        toast.error(result.message || "Failed to create quiz");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const totalQuestions = Object.values(shiftQuestions).reduce(
    (acc, setsMap) => acc + Object.values(setsMap).reduce((sum, qList) => sum + (qList?.length || 0), 0),
    0
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-7xl mx-auto w-full">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quiz Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Campus Coding Challenge 2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the topics covered, instructions, etc." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="p-4 border rounded-xl bg-muted/20">
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Target Audience *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INTERNAL">Internal Members (Club Quiz)</SelectItem>
                    <SelectItem value="EXTERNAL">External / Non-members (Kiosk Quiz)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {watchAudience === "EXTERNAL" && (
          <div className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
              <Key className="h-4 w-4" />
              <span>External Kiosk Settings</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="accessCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Code</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          className="font-mono text-center tracking-widest text-lg font-bold bg-background"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => form.setValue("accessCode", generate6DigitCode())}
                        title="Regenerate code"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription className="text-xs">Required to connect kiosk laptops</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Registration Form</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a form" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (Direct Registration)</SelectItem>
                        {forms.map((f) => (
                          <SelectItem key={f.id} value={f.formId}>
                            {f.title} ({f.formId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Link candidate details</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedbackFormId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback Form (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {forms.map((f) => (
                          <SelectItem key={f.id} value={f.formId}>
                            {f.title} ({f.formId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Shown after submission</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="sets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Question Sets</FormLabel>
                <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Set{num > 1 ? "s" : ""} ({Array.from({ length: num }, (_, i) => String.fromCharCode(65 + i)).join(", ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shifts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Shifts</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val, 10))}
                  value={(field.value || 1).toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shifts" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Shift{num > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pointsPerQuestion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points / Question</FormLabel>
                <FormControl>
                  <Input type="number" step="any" min={0.01} {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Multi-Shift Configuration</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Click on any shift to open the Right Sidebar where you can assign sets and set Question JSON.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {shiftsConfig.length} Shift{shiftsConfig.length > 1 ? "s" : ""} Configured
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shiftsConfig.map((shift) => {
                const currentShiftSets = shift.sets && shift.sets.length > 0 ? shift.sets : [shift.set || "A"];
                const shiftQuestionsCount = currentShiftSets.reduce(
                  (sum, sLetter) => sum + (shiftQuestions[shift.shiftNumber]?.[sLetter]?.length || 0),
                  0
                );

                return (
                  <div
                    key={shift.shiftNumber}
                    onClick={() => openShiftSidebar(shift.shiftNumber)}
                    className="p-4 border rounded-xl bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold flex items-center gap-1.5 group-hover:text-primary transition-colors">
                        <Layers className="h-4 w-4 text-primary" />
                        Shift {shift.shiftNumber}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs font-medium text-primary hover:bg-primary/10 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openShiftSidebar(shift.shiftNumber);
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit in Sidebar
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground">Assigned Question Sets:</div>
                      <div className="flex flex-wrap gap-1">
                        {currentShiftSets.map((letter) => {
                          const qCount = shiftQuestions[shift.shiftNumber]?.[letter]?.length || 0;
                          return (
                            <Badge
                              key={letter}
                              variant="secondary"
                              className="text-[11px] font-semibold bg-primary/10 text-primary border-primary/20"
                            >
                              Set {letter} ({qCount} Qs)
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Total Shift Questions: <strong>{shiftQuestionsCount}</strong></span>
                      <span className="text-primary font-medium group-hover:underline">Open Sidebar →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span>Passing & Qualification Criteria</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cutoffType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "PERCENTAGE"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Minimum Percentage Score (%)</SelectItem>
                        <SelectItem value="MARKS">Minimum Marks / Points Cutoff</SelectItem>
                        <SelectItem value="TOP_N">Top Ranked Candidates (Top N)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("cutoffType") === "TOP_N" ? (
                <FormField
                  control={form.control}
                  name="topSelectCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Top Candidate Selection Count</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="cutoffMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{form.watch("cutoffType") === "MARKS" ? "Cutoff Marks" : "Cutoff Percentage"}</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" min={0} {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── SHIFT TABS WITH SETS IN ACCORDION PREVIEW ── */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span>Questions Preview (Shift Tabs & Sets)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Select a shift tab to preview its question sets in an accordion.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-mono">
                {totalQuestions} Total Questions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {shiftsConfig.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No shifts configured yet.
              </div>
            ) : (
              <Tabs
                value={activePreviewShiftTab}
                onValueChange={setActivePreviewShiftTab}
                className="w-full space-y-4"
              >
                {/* Tabs of Shifts */}
                <TabsList
                  className="grid w-full h-auto p-1 bg-muted/60 rounded-xl gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(shiftsConfig.length, 6)}, minmax(0, 1fr))`,
                  }}
                >
                  {shiftsConfig.map((shift) => {
                    const currentShiftSets = shift.sets && shift.sets.length > 0 ? shift.sets : [shift.set || "A"];
                    const shiftTotalQ = currentShiftSets.reduce(
                      (sum, sLetter) => sum + (shiftQuestions[shift.shiftNumber]?.[sLetter]?.length || 0),
                      0
                    );
                    return (
                      <TabsTrigger
                        key={shift.shiftNumber}
                        value={`shift-${shift.shiftNumber}`}
                        className="py-2 px-3 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>Shift {shift.shiftNumber}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">
                          {shiftTotalQ} Qs
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Tab Content for Each Shift */}
                {shiftsConfig.map((shift) => {
                  const availableLetters = Array.from({ length: watchSets || 1 }, (_, i) => String.fromCharCode(65 + i));
                  const assignedSets = shift.sets && shift.sets.length > 0 ? shift.sets : [shift.set || "A"];
                  const existingQuestionsSets = Object.keys(shiftQuestions[shift.shiftNumber] || {}).filter(
                    (k) => (shiftQuestions[shift.shiftNumber]?.[k]?.length || 0) > 0
                  );
                  const displaySets = Array.from(new Set([...assignedSets, ...existingQuestionsSets])).sort();

                  const shiftTotalQ = displaySets.reduce(
                    (sum, sLetter) => sum + (shiftQuestions[shift.shiftNumber]?.[sLetter]?.length || 0),
                    0
                  );

                  return (
                    <TabsContent
                      key={shift.shiftNumber}
                      value={`shift-${shift.shiftNumber}`}
                      className="space-y-4 focus-visible:outline-none"
                    >
                      {/* Shift Header Bar */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">Shift {shift.shiftNumber} Question Sets</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {displaySets.map((sLetter) => {
                              const qCount = shiftQuestions[shift.shiftNumber]?.[sLetter]?.length || 0;
                              return (
                                <Badge
                                  key={sLetter}
                                  variant="outline"
                                  className="text-[10px] bg-primary/5 text-primary border-primary/20"
                                >
                                  Set {sLetter} ({qCount} Qs)
                                </Badge>
                              );
                            })}
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {shiftTotalQ} Total Questions
                          </Badge>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openShiftSidebar(shift.shiftNumber)}
                          className="h-7 text-xs font-semibold gap-1 text-primary cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          Configure Shift {shift.shiftNumber} in Sidebar
                        </Button>
                      </div>

                      {/* Sets in Accordion */}
                      <Accordion
                        type="multiple"
                        defaultValue={displaySets.map((s) => `set-${s}`)}
                        className="w-full space-y-2.5"
                      >
                        {displaySets.map((sLetter) => {
                          const list = shiftQuestions[shift.shiftNumber]?.[sLetter] || [];
                          return (
                            <AccordionItem
                              key={sLetter}
                              value={`set-${sLetter}`}
                              className="border rounded-xl bg-card overflow-hidden"
                            >
                              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/20 hover:bg-muted/30">
                                <div className="flex items-center justify-between w-full pr-3 gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-foreground">
                                      Question Set {sLetter}
                                    </span>
                                    <Badge variant={list.length > 0 ? "default" : "outline"} className="text-[10px]">
                                      {list.length} Question{list.length !== 1 ? "s" : ""}
                                    </Badge>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openShiftSidebar(shift.shiftNumber, sLetter);
                                    }}
                                  >
                                    Edit Set {sLetter} JSON →
                                  </Button>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 pt-3 space-y-3">
                                {list.length === 0 ? (
                                  <div className="p-4 text-center border border-dashed rounded-lg bg-muted/20 text-xs text-muted-foreground">
                                    <span>No questions added for Shift {shift.shiftNumber} · Set {sLetter} yet. </span>
                                    <button
                                      type="button"
                                      onClick={() => openShiftSidebar(shift.shiftNumber, sLetter)}
                                      className="text-primary font-semibold hover:underline cursor-pointer ml-1"
                                    >
                                      Add Question JSON in Sidebar →
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {list.map((qItem: any, qIdx: number) => {
                                      const questionText =
                                        qItem.question || qItem.title || qItem.text || qItem.questionText || `Question ${qIdx + 1}`;
                                      return (
                                        <div key={qIdx} className="p-3.5 border rounded-xl bg-muted/20 space-y-2.5 text-xs">
                                          <div className="flex items-start gap-2">
                                            <Badge variant="outline" className="text-[10px] shrink-0 font-mono mt-0.5">
                                              Q{qItem.id !== undefined ? qItem.id : qIdx + 1}
                                            </Badge>
                                            <p className="font-semibold text-xs text-foreground flex-1 leading-relaxed">
                                              {questionText}
                                            </p>
                                          </div>
                                          {Array.isArray(qItem.options) && qItem.options.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-6">
                                              {qItem.options.map((opt: string, optIdx: number) => {
                                                const isCorrect =
                                                  qItem.answer === optIdx ||
                                                  String(qItem.answer) === String(optIdx) ||
                                                  (typeof qItem.answer === "string" &&
                                                    qItem.answer.toUpperCase() === String.fromCharCode(65 + optIdx)) ||
                                                  qItem.answer === opt ||
                                                  String(qItem.answer).trim().toLowerCase() === String(opt).trim().toLowerCase();
                                                return (
                                                  <div
                                                    key={optIdx}
                                                    className={`p-2 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                                                      isCorrect
                                                        ? "border-green-600/40 bg-green-500/10 text-green-700 dark:text-green-400 font-medium"
                                                        : "border-border/60 bg-background text-muted-foreground"
                                                    }`}
                                                  >
                                                    <span className="flex-1">
                                                      <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                                                    </span>
                                                    {isCorrect && (
                                                      <Badge variant="outline" className="text-[9px] border-green-600 text-green-600 py-0 shrink-0">
                                                        ✓ Correct
                                                      </Badge>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                          {qItem.explanation && (
                                            <div className="text-[11px] text-muted-foreground bg-background/50 p-2 rounded border border-border/40 pl-6 mt-1">
                                              <span className="font-semibold text-foreground">Explanation: </span>
                                              {qItem.explanation}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>

        <FormField control={form.control} name="questionsJson" render={({ field }) => (
          <FormItem className="hidden"><FormControl><Input {...field} type="hidden" /></FormControl></FormItem>
        )} />

        <div className="flex items-center justify-between gap-3 pt-6 border-t border-border">
          <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)} className="cursor-pointer">
            <Eye className="h-4 w-4 mr-1.5" /> Full Quiz Live Preview
          </Button>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/quizzes")} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="cursor-pointer font-bold">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Quiz
            </Button>
          </div>
        </div>

        <Sheet open={isShiftSidebarOpen} onOpenChange={setIsShiftSidebarOpen}>
          <SheetContent
            side="right"
            className="sm:max-w-xl w-full p-0 flex h-dvh max-h-screen flex-col overflow-hidden bg-background border-l shadow-2xl"
          >
            <div className="shrink-0 border-b bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mt-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <SheetTitle className="text-base font-bold">
                      Shift {selectedShiftForSidebar} Configuration
                    </SheetTitle>
                  </div>
                  <SheetDescription className="text-xs mt-0.5">
                    Select a question set, assign sets, and paste question JSON for Shift {selectedShiftForSidebar}
                  </SheetDescription>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (selectedShiftForSidebar) {
                      const curKey = `shift_${selectedShiftForSidebar}_${activeSidebarSet}`;
                      const currentText =
                        textareaValues[curKey] ??
                        (shiftQuestions[selectedShiftForSidebar]?.[activeSidebarSet]?.length > 0
                          ? JSON.stringify(shiftQuestions[selectedShiftForSidebar][activeSidebarSet], null, 2)
                          : "");
                      validateAndUpdateSet(currentText, selectedShiftForSidebar, activeSidebarSet);
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs cursor-pointer shadow-xs gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Update Set {activeSidebarSet}
                </Button>
              </div>
            </div>

            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onWheel={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Select Question Set to Edit *</Label>
                  {selectedShiftForSidebar && shiftQuestions[selectedShiftForSidebar]?.[activeSidebarSet]?.length > 0 && (
                    <Badge variant="outline" className="text-[10px] border-green-600 text-green-600 font-medium">
                      ✓ {shiftQuestions[selectedShiftForSidebar][activeSidebarSet].length} Validated Questions
                    </Badge>
                  )}
                </div>
                <Select value={activeSidebarSet} onValueChange={setActiveSidebarSet}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select Set" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: watchSets }, (_, i) => {
                      const sLetter = String.fromCharCode(65 + i);
                      const qCount = selectedShiftForSidebar ? (shiftQuestions[selectedShiftForSidebar]?.[sLetter]?.length || 0) : 0;
                      return (
                        <SelectItem key={sLetter} value={sLetter} className="text-xs">
                          Question Set {sLetter} ({qCount} question{qCount !== 1 ? "s" : ""})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedShiftForSidebar && (
                <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      Sets Assigned to Shift {selectedShiftForSidebar}
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Click to toggle sets</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: watchSets }, (_, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const currentShift = shiftsConfig.find((s) => s.shiftNumber === selectedShiftForSidebar);
                      const isAssigned = currentShift?.sets?.includes(letter) || false;
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => {
                            setShiftsConfig((prev) =>
                              prev.map((s) => {
                                if (s.shiftNumber !== selectedShiftForSidebar) return s;
                                const existingSets = s.sets || [];
                                let nextSets = existingSets.includes(letter)
                                  ? existingSets.filter((x) => x !== letter)
                                  : [...existingSets, letter];
                                if (nextSets.length === 0) nextSets = [letter];
                                nextSets.sort();
                                return { ...s, sets: nextSets, set: nextSets[0] || "A" };
                              })
                            );
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                            isAssigned
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-background text-muted-foreground border-border/80 hover:border-primary/50"
                          }`}
                        >
                          {isAssigned ? `✓ Set ${letter}` : `Set ${letter}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Question JSON for Shift {selectedShiftForSidebar} · Set {activeSidebarSet} *
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">JSON Array format</span>
                </div>
                <Textarea
                  value={
                    selectedShiftForSidebar
                      ? (textareaValues[`shift_${selectedShiftForSidebar}_${activeSidebarSet}`] ??
                          (shiftQuestions[selectedShiftForSidebar]?.[activeSidebarSet]?.length > 0
                            ? JSON.stringify(shiftQuestions[selectedShiftForSidebar][activeSidebarSet], null, 2)
                            : ""))
                      : ""
                  }
                  onChange={(e) => {
                    if (selectedShiftForSidebar) {
                      const val = e.target.value;
                      const curKey = `shift_${selectedShiftForSidebar}_${activeSidebarSet}`;
                      setTextareaValues((prev) => ({ ...prev, [curKey]: val }));
                    }
                  }}
                  rows={14}
                  placeholder={`[\n  {\n    "id": 1,\n    "question": "Sample question for Shift ${selectedShiftForSidebar} Set ${activeSidebarSet}?",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "answer": 0\n  }\n]`}
                  className="font-mono text-xs leading-relaxed"
                />
              </div>

              {jsonError && (
                <Alert variant="destructive" className="py-2.5">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{jsonError}</AlertDescription>
                </Alert>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <SheetContent
            side="right"
            className="sm:max-w-xl w-full p-0 flex h-dvh max-h-screen flex-col overflow-hidden bg-background border-l shadow-2xl"
          >
            <div className="shrink-0 border-b bg-card">
              <SheetHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <SheetTitle className="text-lg">Quiz Live Preview</SheetTitle>
                </div>
                <SheetDescription className="text-xs">
                  Real-time preview of quiz details, settings, and shift-wise question sets.
                </SheetDescription>
              </SheetHeader>
            </div>

            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onWheel={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={watchAudience === "EXTERNAL" ? "secondary" : "outline"}>
                    {watchAudience === "EXTERNAL" ? (
                      <>
                        <Globe className="h-3 w-3 mr-1" />
                        External Kiosk
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-1" />
                        Internal Members
                      </>
                    )}
                  </Badge>
                  {watchAudience === "EXTERNAL" && watchAccessCode && (
                    <Badge variant="outline" className="font-mono text-xs">
                      Access Code: {watchAccessCode}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold">{watchTitle || "Untitled Quiz"}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {watchDescription || "No description provided yet."}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Duration</p>
                  <p className="text-base font-bold">{watchDuration || 0} mins</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Shifts / Sets</p>
                  <p className="text-base font-bold">{watchShifts} Shifts · {watchSets} Sets</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Points/Q</p>
                  <p className="text-base font-bold">{watchPoints || 1}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Questions</p>
                  <p className="text-base font-bold">{totalQuestions}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Shift-wise Question Sets Breakdown</h4>
                {totalQuestions === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed rounded-xl bg-muted/30">
                    <p className="text-sm text-muted-foreground">No questions added yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add and validate question JSON in the shift sidebar to see preview.
                    </p>
                  </div>
                ) : (
                  shiftsConfig.map((shift) => {
                    const currentShiftSets = shift.sets && shift.sets.length > 0 ? shift.sets : [shift.set || "A"];
                    return (
                      <div key={shift.shiftNumber} className="space-y-3 p-3.5 border rounded-xl bg-muted/10">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Shift {shift.shiftNumber}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {currentShiftSets.reduce((sum, s) => sum + (shiftQuestions[shift.shiftNumber]?.[s]?.length || 0), 0)} Questions
                          </Badge>
                        </div>
                        {currentShiftSets.map((sLetter) => {
                          const setList = shiftQuestions[shift.shiftNumber]?.[sLetter] || [];
                          return (
                            <Card key={sLetter} className="overflow-hidden border">
                              <CardHeader className="p-3 bg-muted/50 border-b">
                                <CardTitle className="text-xs flex items-center justify-between">
                                  <span>Shift {shift.shiftNumber} · Set {sLetter}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {setList.length} Question{setList.length !== 1 ? "s" : ""}
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 space-y-3">
                                {setList.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">No questions in this set.</p>
                                ) : (
                                  setList.map((qItem: any, qIdx: number) => (
                                    <div key={qIdx} className="p-2.5 border rounded-lg bg-card space-y-1.5 text-xs">
                                      <p className="font-semibold text-xs">
                                        Q{qIdx + 1}. {qItem.question}
                                      </p>
                                      {Array.isArray(qItem.options) && (
                                        <div className="space-y-1 pl-2">
                                          {qItem.options.map((opt: string, optIdx: number) => {
                                            const isCorrect =
                                              qItem.answer === optIdx ||
                                              qItem.answer === String.fromCharCode(65 + optIdx) ||
                                              qItem.answer === opt;
                                            return (
                                              <div
                                                key={optIdx}
                                                className={`p-1.5 rounded border flex items-center justify-between text-[11px] ${
                                                  isCorrect
                                                    ? "border-green-600/40 bg-green-500/10 text-green-700 dark:text-green-400 font-medium"
                                                    : "border-border bg-background text-muted-foreground"
                                                }`}
                                              >
                                                <span>
                                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                                </span>
                                                {isCorrect && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[9px] border-green-600 text-green-600 py-0"
                                                  >
                                                    Answer
                                                  </Badge>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </form>
    </Form>
  );
}
