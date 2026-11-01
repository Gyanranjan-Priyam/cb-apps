"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateAttendanceSession, AttendanceSessionData } from "../actions";
import { getActiveBatchesList } from "@/app/admin/batches/actions";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  sessionNumber: z.number().min(1, "Session number must be at least 1"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  date: z.date({
    message: "Please select a date",
  }),
  targetBatchIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditSessionDialogProps {
  session: AttendanceSessionData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditSessionDialog({ session, open, onOpenChange }: EditSessionDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchesList, setBatchesList] = useState<{ id: string; name: string; code: string }[]>([]);

  useEffect(() => {
    getActiveBatchesList().then((list) => setBatchesList(list));
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionNumber: session.sessionNumber,
      title: session.title,
      date: new Date(session.date),
      targetBatchIds: session.targetBatchIds || [],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        sessionNumber: session.sessionNumber,
        title: session.title,
        date: new Date(session.date),
        targetBatchIds: session.targetBatchIds || [],
      });
    }
  }, [open, session, form]);

  const selectedDate = form.watch("date");

  const getDayName = (date: Date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()];
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const day = getDayName(data.date);
      
      const result = await updateAttendanceSession(session.id, {
        sessionNumber: data.sessionNumber,
        title: data.title,
        date: data.date,
        day,
        targetBatchIds: data.targetBatchIds || [],
      });

      if (result.status === "success") {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Attendance Session</DialogTitle>
          <DialogDescription>
            Update the attendance session details
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sessionNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter session number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      value={field.value}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter session title"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Session Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("2023-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Day: <span className="font-medium">{getDayName(selectedDate)}</span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetBatchIds"
              render={({ field }) => {
                const currentValue =
                  field.value && field.value.length > 0 ? field.value[0] : "all";
                return (
                  <FormItem>
                    <FormLabel>Target Batch</FormLabel>
                    <div className="relative">
                      <Select
                        value={currentValue}
                        onValueChange={(val) => {
                          if (val === "all") {
                            field.onChange([]);
                          } else {
                            field.onChange([val]);
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select Target Batch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">
                            All Batches (Global - All students)
                          </SelectItem>
                          {batchesList.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name} ({batch.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Select which batch this attendance session is for.
                    </p>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Session
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
