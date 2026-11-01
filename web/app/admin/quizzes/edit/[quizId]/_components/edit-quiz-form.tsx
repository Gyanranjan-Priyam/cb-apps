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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { updateQuiz } from "../../../actions";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  Globe,
  Key,
  RefreshCw,
  Award,
  Layers,
  Edit3,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { parseQuestionsByShiftAndSet } from "@/app/admin/quizzes/utils";

const formSchema = z.object({
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
  isActive: z.boolean(),
  questionsJson: z.string().optional(),
}).refine((data) => {
  return data.endDateTime > data.startDateTime;
}, {
  message: "End date must be after start date",
  path: ["endDateTime"],
});

type FormData = z.infer<typeof formSchema>;

interface ShiftItem {
  shiftNumber: number;
  name: string;
  set?: string;
  sets: string[];
  status?: string;
}

interface Quiz {
  id: string;
  quizId: string;
  title: string;
  description: string;
  sets: number;
  shifts?: number | null;
  shiftsJson?: string | null;
  activeShift?: number | null;
  duration: number;
  pointsPerQuestion: number;
  startDateTime: Date | null;
  endDateTime: Date | null;
  questionsJson: string;
  isActive: boolean;
  targetAudience?: string;
  accessCode?: string | null;
  formId?: string | null;
  feedbackFormId?: string | null;
  cutoffMarks?: number | null;
  cutoffType?: string | null;
  topSelectCount?: number | null;
}

interface EditQuizFormProps {
  quiz: Quiz;
  forms?: Array<{ id: string; formId: string; title: string }>;
}

export default function EditQuizForm({ quiz, forms = [] }: EditQuizFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // Shift-isolated questions: { [shiftNumber]: { [setLetter]: Question[] } }
  const [shiftQuestions, setShiftQuestions] = useState<Record<number, Record<string, any[]>>>({});
  const [textareaValues, setTextareaValues] = useState<Record<string, string>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedShiftForSidebar, setSelectedShiftForSidebar] = useState<number | null>(null);
  const [isShiftSidebarOpen, setIsShiftSidebarOpen] = useState(false);
  const [activeSidebarSet, setActiveSidebarSet] = useState<string>("A");
  const [activePreviewShiftTab, setActivePreviewShiftTab] = useState<string>("shift-1");
  const [shiftsConfig, setShiftsConfig] = useState<ShiftItem[]>([]);

  const generate6DigitCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: quiz.title,
      description: quiz.description,
      targetAudience: (quiz.targetAudience as "INTERNAL" | "EXTERNAL") || "INTERNAL",
      accessCode: quiz.accessCode || generate6DigitCode(),
      formId: quiz.formId || "",
      feedbackFormId: quiz.feedbackFormId || "",
      sets: quiz.sets,
      shifts: quiz.shifts || 1,
      duration: quiz.duration,
      pointsPerQuestion: quiz.pointsPerQuestion,
      cutoffMarks: quiz.cutoffMarks ?? 50,
      cutoffType: (quiz.cutoffType as "PERCENTAGE" | "MARKS" | "TOP_N") || "PERCENTAGE",
      topSelectCount: quiz.topSelectCount ?? 10,
      startDateTime: quiz.startDateTime ? new Date(quiz.startDateTime) : new Date(),
      endDateTime: quiz.endDateTime ? new Date(quiz.endDateTime) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: quiz.isActive,
      questionsJson: quiz.questionsJson,
    },
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      try {
        const numShifts = quiz.shifts || 1;
        const numSets = quiz.sets || 1;

        const parsedMap = parseQuestionsByShiftAndSet(quiz.questionsJson, numShifts, numSets);
        setShiftQuestions(parsedMap);

        const initialTextareas: Record<string, string> = {};
        Object.entries(parsedMap).forEach(([sNumStr, setsMap]: [string, Record<string, any[]>]) => {
          Object.entries(setsMap).forEach(([sLetter, qList]: [string, any[]]) => {
            const key = `shift_${sNumStr}_${sLetter}`;
            initialTextareas[key] = qList && qList.length > 0 ? JSON.stringify(qList, null, 2) : "";
          });
        });
        setTextareaValues(initialTextareas);

        let parsedShifts: ShiftItem[] = [];
        try {
          if (quiz.shiftsJson) {
            parsedShifts = JSON.parse(quiz.shiftsJson);
          }
        } catch (e) {
          console.error("Error parsing shiftsJson:", e);
        }

        const availableSetLetters = Array.from({ length: numSets }, (_, i) => String.fromCharCode(65 + i));

        if (parsedShifts.length > 0) {
          const normalized = parsedShifts.map((s: any) => ({
            ...s,
            sets: s.sets && Array.isArray(s.sets) && s.sets.length > 0 ? s.sets : [s.set || "A"],
            set: s.set || (s.sets && s.sets[0]) || "A",
          }));
          setShiftsConfig(normalized);
        } else {
          const initialShifts: ShiftItem[] = [];
          for (let i = 1; i <= numShifts; i++) {
            const defaultSet = availableSetLetters[(i - 1) % availableSetLetters.length] || "A";
            initialShifts.push({
              shiftNumber: i,
              name: `Shift ${i}`,
              set: defaultSet,
              sets: [defaultSet],
            });
          }
          setShiftsConfig(initialShifts);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error parsing questions:", error);
        setIsInitialized(true);
      }
    }
  }, [quiz.questionsJson, quiz.sets, quiz.shifts, quiz.shiftsJson, isInitialized]);

  const watchAudience = form.watch("targetAudience");
  const watchSets = form.watch("sets");
  const watchShifts = form.watch("shifts") || 1;
  const watchTitle = form.watch("title");
  const watchDescription = form.watch("description");
  const watchDuration = form.watch("duration");
  const watchPoints = form.watch("pointsPerQuestion");
  const watchAccessCode = form.watch("accessCode");

  const totalQuestions = Object.values(shiftQuestions).reduce(
    (acc, setsMap) => acc + Object.values(setsMap).reduce((sum, qList) => sum + (qList?.length || 0), 0),
    0
  );

  const prevSetsRef = useRef(watchSets);

  useEffect(() => {
    if (isInitialized) {
      const numSets = watchSets || 1;
      const numShifts = watchShifts || 1;
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
            status: existing?.status,
          });
        }
        return next;
      });
    }
  }, [watchShifts, watchSets, isInitialized]);

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

      const isValid = parsed.every((q: any) => 
        q.id !== undefined && 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length > 0 &&
        q.answer !== undefined
      );

      if (!isValid) {
        setJsonError("Each question must contain: id, question, options array, and answer");
        return;
      }

      setShiftQuestions(prev => ({
        ...prev,
        [shiftNum]: {
          ...(prev[shiftNum] || {}),
          [setLetter]: parsed
        }
      }));
      setTextareaValues(prev => ({
        ...prev,
        [storageKey]: jsonString
      }));
      setJsonError(null);
      toast.success(`Shift ${shiftNum} · Set ${setLetter}: ${parsed.length} questions validated and saved!`);
    } catch {
      setJsonError("Invalid JSON format. Please verify JSON syntax.");
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
    if (shiftQuestions[1]) {
      Object.entries(shiftQuestions[1]).forEach(([sLetter, qList]) => {
        output[sLetter] = qList;
      });
    }
    return JSON.stringify(output);
  };

  const onSubmit = async (data: FormData) => {
    const totalQ = Object.values(shiftQuestions).reduce(
      (acc, setsMap) => acc + Object.values(setsMap).reduce((sum, qList) => sum + (qList?.length || 0), 0),
      0
    );
    
    if (totalQ === 0) {
      toast.error("Please add questions for at least one shift in the Shift sidebar");
      return;
    }

    setIsLoading(true);

    const questionsJson = combineAllSets();
    const numShifts = data.shifts || shiftsConfig.length || 1;
    const shiftsJson = JSON.stringify(shiftsConfig);

    try {
      const result = await updateQuiz(quiz.id, {
        title: data.title,
        description: data.description,
        targetAudience: data.targetAudience,
        accessCode: data.targetAudience === "EXTERNAL" ? data.accessCode : null,
        formId: data.targetAudience === "EXTERNAL" ? (data.formId === "none" ? null : data.formId) : null,
        feedbackFormId: data.targetAudience === "EXTERNAL" ? (data.feedbackFormId === "none" ? null : data.feedbackFormId) : null,
        sets: data.sets,
        shifts: numShifts,
        shiftsJson,
        duration: data.duration,
        pointsPerQuestion: data.pointsPerQuestion,
        cutoffMarks: data.cutoffMarks,
        cutoffType: data.cutoffType,
        topSelectCount: data.topSelectCount,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        isActive: data.isActive,
        questionsJson: questionsJson,
      });

      if (result.status === "success") {
        toast.success("Quiz updated successfully");
        router.push(`/admin/quizzes/${quiz.quizId}`);
      } else {
        toast.error(result.message || "Failed to update quiz");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating the quiz");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 border rounded-xl bg-muted/20">
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Target Audience *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Quiz Title *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Annual Tech Hackathon Quiz 2026" className="bg-background/80" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sets"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Question Sets</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString() || "1"}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background/80">
                      <SelectValue placeholder="Select sets" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Set{num > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="border-border/60 bg-card/40">
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
                    className="p-4 border border-border/60 rounded-xl bg-background/50 hover:bg-background/80 hover:border-primary/50 transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold flex items-center gap-1.5 group-hover:text-primary transition-colors">
                          <Layers className="h-4 w-4 text-primary" />
                          Shift {shift.shiftNumber}
                        </span>
                        {shift.status === "COMPLETED" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Completed
                          </Badge>
                        )}
                      </div>
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

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground font-medium">Shift Total:</span>
                      <span className="font-bold text-primary">{shiftQuestionsCount} questions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Quiz Description & Instructions *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Instructions for participants..."
                  className="bg-background/80"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="shifts"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Total Shifts</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  defaultValue={field.value?.toString() || "1"}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background/80">
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
                <FormDescription className="text-xs">Number of quiz shifts</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Duration (Minutes) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className="bg-background/80"
                  />
                </FormControl>
                <FormDescription className="text-xs">Time allowed per attempt</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pointsPerQuestion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Points Per Question *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min={0.01}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="bg-background/80"
                  />
                </FormControl>
                <FormDescription className="text-xs">Points for each correct answer</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cutoffType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Cutoff Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "PERCENTAGE"}>
                  <FormControl>
                    <SelectTrigger className="bg-background/80">
                      <SelectValue placeholder="Cutoff type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="MARKS">Absolute Marks</SelectItem>
                    <SelectItem value="TOP_N">Top N Candidates</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">Qualification criteria</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cutoffMarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">
                  {form.watch("cutoffType") === "TOP_N"
                    ? "Minimum Marks (to be eligible for Top N)"
                    : form.watch("cutoffType") === "MARKS"
                    ? "Cutoff Marks"
                    : "Cutoff Percentage (%)"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min={0}
                    value={field.value ?? 50}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="bg-background/80"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("cutoffType") === "TOP_N" && (
            <FormField
              control={form.control}
              name="topSelectCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary" /> Top N Count
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      value={field.value ?? 10}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      className="bg-background/80"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Number of top students to qualify</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDateTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Start Date & Time *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={
                      field.value instanceof Date && !isNaN(field.value.getTime())
                        ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    className="bg-background/80"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDateTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">End Date & Time *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={
                      field.value instanceof Date && !isNaN(field.value.getTime())
                        ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    className="bg-background/80"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
              <div className="space-y-0.5">
                <FormLabel className="font-semibold">Quiz Status</FormLabel>
                <FormDescription className="text-xs">
                  {field.value
                    ? "Active - users/systems can access the quiz within scheduled dates"
                    : "Inactive - quiz is hidden and cannot be attempted"}
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Questions Display Section */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Configured Shift Questions Preview</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Review questions per shift. To edit questions, click "Configure Shift in Sidebar".
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {totalQuestions} Total Questions
                </Badge>
                {shiftsConfig.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openShiftSidebar(shiftsConfig[0].shiftNumber)}
                    className="h-8 text-xs font-semibold gap-1.5 cursor-pointer text-primary border-primary/30 hover:bg-primary/10"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Open Shift Sidebar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {shiftsConfig.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <p className="text-sm font-semibold">No shifts configured yet</p>
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

        <FormField
          control={form.control}
          name="questionsJson"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input {...field} type="hidden" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between gap-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            className="cursor-pointer"
          >
            <Eye className="h-4 w-4 mr-1.5" /> Full Quiz Live Preview
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/quizzes/${quiz.quizId}`)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer font-bold"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
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
          <SheetContent side="right" className="sm:max-w-xl w-full p-0 flex h-dvh max-h-screen flex-col overflow-hidden bg-background border-l shadow-2xl">
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
                    {watchAudience === "EXTERNAL" ? <><Globe className="h-3 w-3 mr-1" />External Kiosk</> : <><Users className="h-3 w-3 mr-1" />Internal Members</>}
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
                    <p className="text-xs text-muted-foreground mt-1">Add and validate question JSON in the shift sidebar to see preview.</p>
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
