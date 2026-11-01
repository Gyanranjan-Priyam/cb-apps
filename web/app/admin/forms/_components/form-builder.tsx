/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useSensor,
  useSensors,
  PointerSensor,
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ThemeSelectorDropdown } from "@/components/ui/theme-selector-dropdown";
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Eye,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ImageIcon,
  FileText,
  CheckSquare,
  ChevronDown,
  Circle,
  AlignLeft,
  Calendar as CalendarIcon,
  CreditCard,
  X,
  ArrowLeft,
  Link2,
  Settings2,
  Globe,
  Lock,
  Palette,
  Layers,
  Check,
  SlidersHorizontal,
  HardDrive,
  Split,
  ArrowRight,
  Terminal,
  Users,
  Sparkles,
  HelpCircle,
  QrCode,
  Smartphone,
  MoreHorizontal,
} from "lucide-react";
import {
  createForm,
  updateForm,
  toggleFormPublish,
  updateFormResponseStatus,
  deleteFormResponse,
  type FormDetail,
  type FormResponseSummary,
} from "../actions";
import {
  createBlankFormDefinition,
  BANNER_TEMPLATES,
  FORM_STYLES,
  type FormStyleId,
  type BannerTemplateId,
  type FormDefinition,
  type FormFieldDefinition,
  type FormFieldType,
  type FormSectionDefinition,
  type SubQuestionDefinition,
  type SubQuestionType,
} from "@/lib/form-types";
import { Uploader } from "@/components/file-uploader/Uploader";
import { MiniRichEditor } from "@/components/admin_components/rich-text-editor/MiniRichEditor";
import { generateUpiQrDataUrl, UpiPaymentConfig } from "@/lib/upi";

/* ─── Helpers ─── */

interface FormBuilderProps {
  initialDefinition?: FormDefinition;
  initialForm?: FormDetail | null;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getImageUrl(key?: string | null) {
  if (!key) return "";
  return `https://codebreakers.t3.storage.dev/${key}`;
}

function getFieldDescriptionText(desc: string | null | undefined): string {
  if (!desc) return "";
  try {
    const parsed = JSON.parse(desc);
    if (parsed && typeof parsed === "object" && (parsed.type || parsed.content)) {
      const extractText = (node: any): string => {
        if (!node) return "";
        if (typeof node === "string") return node;
        if (node.text) return node.text;
        if (Array.isArray(node.content)) {
          return node.content.map(extractText).filter(Boolean).join(" ");
        }
        return "";
      };
      return extractText(parsed);
    }
  } catch {
    // Plain text
  }
  return desc;
}

function normalizeDefinition(definition: FormDefinition): FormDefinition {
  return {
    ...definition,
    formStyle: definition.formStyle || "minimal",
    bannerKey: definition.bannerKey ?? "",
    bannerTemplate: definition.bannerTemplate ?? "purple-blue",
    sections: (definition.sections || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section, si) => ({
        ...section,
        order: si,
        fields: (section.fields || [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((field, fi) => ({
            ...field,
            order: fi,
            options: field.options ?? ["Option 1"],
            required: Boolean(field.required),
            transactionIdLabel:
              field.type === "payment"
                ? field.transactionIdLabel || "Transaction ID"
                : field.transactionIdLabel,
            enableUpi:
              field.type === "payment"
                ? field.enableUpi !== undefined
                  ? field.enableUpi
                  : true
                : undefined,
            enableRazorpay:
              field.type === "payment" ? Boolean(field.enableRazorpay) : undefined,
            enableCash:
              field.type === "payment" ? Boolean(field.enableCash) : undefined,
            allowedPaymentMethods:
              field.type === "payment"
                ? field.allowedPaymentMethods || ["upi"]
                : undefined,
            buttonOpenInNewTab: Boolean(field.buttonOpenInNewTab),
            subQuestions:
              field.subQuestions ??
              (field.type === "team_members"
                ? [
                    {
                      id: createId("sub"),
                      label: "Full Name",
                      placeholder: "e.g. John Doe",
                      required: true,
                      type: "short_text",
                    },
                    {
                      id: createId("sub"),
                      label: "Email Address",
                      placeholder: "e.g. member@email.com",
                      required: true,
                      type: "email",
                    },
                    {
                      id: createId("sub"),
                      label: "Phone Number",
                      placeholder: "e.g. 9876543210",
                      required: false,
                      type: "number",
                    },
                    {
                      id: createId("sub"),
                      label: "Gender",
                      placeholder: "Select gender",
                      required: false,
                      type: "dropdown",
                      options: ["Male", "Female", "Other"],
                    },
                    {
                      id: createId("sub"),
                      label: "College / Branch",
                      placeholder: "e.g. CSE 3rd Year",
                      required: false,
                      type: "short_text",
                    },
                  ]
                : field.type === "multi_input"
                ? [
                    {
                      id: createId("sub"),
                      label: "Sub-question 1",
                      placeholder: "Enter answer...",
                      required: false,
                      type: "short_text",
                    },
                    {
                      id: createId("sub"),
                      label: "Sub-question 2",
                      placeholder: "Enter answer...",
                      required: false,
                      type: "short_text",
                    },
                  ]
                : undefined),
            minEntries:
              field.type === "team_members" ? field.minEntries ?? 1 : undefined,
            maxEntries:
              field.type === "team_members" ? field.maxEntries ?? 4 : undefined,
            entryLabel:
              field.type === "team_members"
                ? field.entryLabel || "Member"
                : undefined,
            addButtonLabel:
              field.type === "team_members"
                ? field.addButtonLabel || "Add Member"
                : undefined,
          })),
      })),
    settings: {
      submitButtonLabel: definition.settings?.submitButtonLabel || "Submit",
      successMessage:
        definition.settings?.successMessage ||
        "Your response has been submitted successfully.",
      allowMultipleSubmissions: Boolean(
        definition.settings?.allowMultipleSubmissions,
      ),
      collectName: definition.settings?.collectName !== false,
      collectEmail: definition.settings?.collectEmail !== false,
    },
  };
}

function emptySection(order: number): FormSectionDefinition {
  return {
    id: createId("section"),
    title: `Section ${order + 1}`,
    description: "",
    order,
    fields: [],
  };
}

function emptyField(type: FormFieldType, order: number): FormFieldDefinition {
  return {
    id: createId("field"),
    type,
    label:
      type === "button"
        ? "Button Link"
        : type === "payment"
        ? "Payment Block"
        : type === "linear_scale"
        ? "Rating Scale"
        : type === "multi_input"
        ? "Multiple Input Questions"
        : type === "team_members"
        ? "Team Members Information"
        : type === "file_upload"
        ? "Upload File"
        : type === "dob"
        ? "Date of Birth"
        : "Untitled Question",
    description: "",
    placeholder: "",
    required: false,
    order,
    options: ["Option 1"],
    buttonLabel: "Open link",
    buttonUrl: "https://",
    buttonOpenInNewTab: true,
    qrCodeKey: "",
    upiId: "",
    enableUpi: true,
    enableRazorpay: false,
    enableCash: false,
    allowedPaymentMethods: ["upi"],
    transactionIdLabel: "Transaction ID",
    imageKey: "",
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "",
    scaleMaxLabel: "",
    minEntries: type === "team_members" ? 1 : undefined,
    maxEntries: type === "team_members" ? 4 : undefined,
    entryLabel: type === "team_members" ? "Member" : undefined,
    addButtonLabel: type === "team_members" ? "Add Member" : undefined,
    subQuestions:
      type === "team_members"
        ? [
            {
              id: createId("sub"),
              label: "Full Name",
              placeholder: "e.g. John Doe",
              required: true,
              type: "short_text",
            },
            {
              id: createId("sub"),
              label: "Email Address",
              placeholder: "e.g. member@email.com",
              required: true,
              type: "email",
            },
            {
              id: createId("sub"),
              label: "Phone Number",
              placeholder: "e.g. 9876543210",
              required: false,
              type: "number",
            },
            {
              id: createId("sub"),
              label: "Gender",
              placeholder: "Select gender",
              required: false,
              type: "dropdown",
              options: ["Male", "Female", "Other"],
            },
            {
              id: createId("sub"),
              label: "College / Branch",
              placeholder: "e.g. CSE 3rd Year",
              required: false,
              type: "short_text",
            },
          ]
        : type === "multi_input"
        ? [
            {
              id: createId("sub"),
              label: "Sub-question 1",
              placeholder: "Enter answer...",
              required: false,
              type: "short_text",
            },
            {
              id: createId("sub"),
              label: "Sub-question 2",
              placeholder: "Enter answer...",
              required: false,
              type: "short_text",
            },
          ]
        : undefined,
    allowedFileTypes: ["jpg", "jpeg", "png", "webp", "pdf"],
    maxFiles: 1,
    imageOnly: false,
    multipleFiles: false,
  };
}

function reorder<T>(items: T[], from: number, to: number) {
  return arrayMove(items, from, to);
}

const FIELD_GROUPS: Array<{
  group: string;
  items: Array<{
    type: FormFieldType;
    label: string;
    description: string;
    icon: any;
  }>;
}> = [
  {
    group: "Text & Inputs",
    items: [
      {
        type: "short_text",
        label: "Short Answer",
        description: "Single-line plain text response",
        icon: AlignLeft,
      },
      {
        type: "long_text",
        label: "Paragraph",
        description: "Multi-line text or detailed explanation",
        icon: FileText,
      },
      {
        type: "email",
        label: "Email Address",
        description: "Validated email input",
        icon: AlignLeft,
      },
      {
        type: "number",
        label: "Number",
        description: "Numerical digits and figures",
        icon: AlignLeft,
      },
      {
        type: "date",
        label: "Date",
        description: "Interactive date picker",
        icon: CalendarIcon,
      },
      {
        type: "dob",
        label: "Date of Birth (DOB)",
        description: "Birth date picker with year/month selection",
        icon: CalendarIcon,
      },
    ],
  },
  {
    group: "Choices & Options",
    items: [
      {
        type: "radio",
        label: "Multiple Choice",
        description: "Pick a single option from a list",
        icon: Circle,
      },
      {
        type: "checkbox",
        label: "Checkboxes",
        description: "Select one or multiple options",
        icon: CheckSquare,
      },
      {
        type: "dropdown",
        label: "Dropdown Select",
        description: "Clean collapsible options menu",
        icon: ChevronDown,
      },
      {
        type: "linear_scale",
        label: "Rating Scale",
        description: "Numerical score scale (e.g. 1-5 or 1-10)",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    group: "Hackathon & Multi-Field",
    items: [
      {
        type: "team_members",
        label: "Team Members Repeater",
        description: "Dynamic repeatable member box with limits & dropdowns",
        icon: Users,
      },
      {
        type: "multi_input",
        label: "Multi-Input Box",
        description: "Bundle multiple text questions together",
        icon: Layers,
      },
    ],
  },
  {
    group: "Payments & Media",
    items: [
      {
        type: "payment",
        label: "Payment Block",
        description: "Collect payments via UPI QR, Razorpay & Cash",
        icon: CreditCard,
      },
      {
        type: "file_upload",
        label: "File Upload",
        description: "Secure uploads stored directly in Google Drive",
        icon: HardDrive,
      },
      {
        type: "button",
        label: "Action Button Link",
        description: "External link button or redirect",
        icon: ExternalLink,
      },
    ],
  },
];

const ALL_FIELD_TYPES = FIELD_GROUPS.flatMap((g) => g.items);

/* ─── Add Question Palette Popover ─── */
function AddQuestionPopover({
  onAddField,
  trigger,
}: {
  onAddField: (type: FormFieldType) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-lg text-xs font-semibold gap-2 border-border text-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[340px] sm:w-[400px] p-0 rounded-xl shadow-2xl border border-border bg-popover overflow-hidden flex flex-col max-h-[min(var(--radix-popover-content-available-height,85vh),480px)]"
      >
        <div className="px-3.5 py-2.5 border-b border-border/60 shrink-0 bg-popover/80 backdrop-blur-xs">
          <p className="text-xs font-semibold text-foreground">
            Select Question Type
          </p>
          <p className="text-[11px] text-muted-foreground">
            Choose a field to add to your form section
          </p>
        </div>

        <ScrollArea className="h-[360px] p-2.5 [&_[data-slot=scroll-area-scrollbar]]:hidden [&_[data-slot=scroll-area-viewport]]:no-scrollbar">
          <div className="space-y-3 pr-1">
            {FIELD_GROUPS.map((group) => (
              <div key={group.group} className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                  {group.group}
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          onAddField(item.type);
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-muted transition-colors text-foreground cursor-pointer"
                      >
                        <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center shrink-0 text-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* ─── Payment Field Preview Component ─── */
function PaymentFieldPreview({ field }: { field: FormFieldDefinition }) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const isUpiEnabled = field.enableUpi !== false;
  const isRazorpayEnabled = Boolean(field.enableRazorpay);
  const isCashEnabled = Boolean(field.enableCash);

  useEffect(() => {
    let isMounted = true;
    if (!isUpiEnabled || !field.upiId?.trim()) {
      setQrUrl("");
      return;
    }
    setLoading(true);
    const config: UpiPaymentConfig = {
      vpa: field.upiId.trim(),
      payeeName: field.payeeName?.trim() || field.label?.trim() || "Payment",
      amount: field.paymentAmount,
      currency: "INR",
      transactionNote: field.transactionNote?.trim(),
      merchant: field.merchantEnabled
        ? {
            enabled: true,
            mcc: field.merchantMcc?.trim(),
            merchantId: field.merchantId?.trim(),
            terminalId: field.merchantTerminalId?.trim(),
          }
        : undefined,
    };

    generateUpiQrDataUrl(config, { width: 180, margin: 1 })
      .then((url) => {
        if (isMounted) {
          setQrUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    isUpiEnabled,
    field.upiId,
    field.payeeName,
    field.label,
    field.paymentAmount,
    field.transactionNote,
    field.merchantEnabled,
    field.merchantMcc,
    field.merchantId,
    field.merchantTerminalId,
  ]);

  return (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">
          Active Methods:
        </span>
        {isUpiEnabled && (
          <Badge variant="outline" className="text-[11px] gap-1 font-normal">
            <Check className="h-3 w-3" /> UPI QR Code
          </Badge>
        )}
        {isRazorpayEnabled && (
          <Badge variant="outline" className="text-[11px] gap-1 font-normal">
            <Check className="h-3 w-3" /> Razorpay
          </Badge>
        )}
        {isCashEnabled && (
          <Badge variant="outline" className="text-[11px] gap-1 font-normal">
            <Check className="h-3 w-3" /> Cash (Offline)
          </Badge>
        )}
      </div>

      {isUpiEnabled && field.upiId?.trim() ? (
        <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center gap-3">
          <div className="relative w-16 h-16 bg-white rounded border border-border p-1 shrink-0 flex items-center justify-center">
            {loading || !qrUrl ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="UPI QR Preview"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-foreground">
              ₹{field.paymentAmount !== undefined ? field.paymentAmount : 0}
            </p>
            <p className="text-muted-foreground text-[11px] truncate max-w-[220px]">
              VPA: {field.upiId}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Question Side Toolbar (Direct 1-Click Actions on the right side) ─── */
function QuestionSideToolbar({
  onAddField,
  onAddSection,
  onOpenTheme,
  cardHeight,
  isMobileHorizontal,
}: {
  onAddField: (type: FormFieldType) => void;
  onAddSection: () => void;
  onOpenTheme: () => void;
  cardHeight?: number;
  isMobileHorizontal?: boolean;
}) {
  const TOOLBAR_ITEMS: Array<{
    type: FormFieldType;
    title: string;
    label: string;
    icon: any;
  }> = [
    { type: "short_text", title: "Add Short Text", label: "Short Answer", icon: AlignLeft },
    { type: "long_text", title: "Add Paragraph", label: "Paragraph", icon: FileText },
    { type: "radio", title: "Add Multiple Choice", label: "Multiple Choice", icon: Circle },
    { type: "checkbox", title: "Add Checkboxes", label: "Checkboxes", icon: CheckSquare },
    { type: "dropdown", title: "Add Dropdown Select", label: "Dropdown", icon: ChevronDown },
    { type: "team_members", title: "Add Team Members (Hackathon Repeater)", label: "Team Members", icon: Users },
    { type: "payment", title: "Add Payment Block (UPI + Razorpay + Cash)", label: "Payment Block", icon: CreditCard },
    { type: "file_upload", title: "Add File Upload (Google Drive)", label: "File Upload", icon: HardDrive },
    { type: "linear_scale", title: "Add Rating Scale", label: "Rating Scale", icon: SlidersHorizontal },
    { type: "date", title: "Add Date Picker", label: "Date Picker", icon: CalendarIcon },
  ];

  if (isMobileHorizontal) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto max-w-[90vw] p-1">
        {TOOLBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onAddField(item.type)}
              title={item.title}
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        <div className="h-4 w-px bg-border shrink-0 my-auto" />
        <button
          type="button"
          onClick={onAddSection}
          title="Add Section"
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Dynamic layout calculation based on card height
  // Each button: h-8 (32px) + gap-0.5 (2px) = 34px
  // Bottom fixed items (divider + Section + Theme + padding): ~86px
  // Three-dot button: 34px
  const itemHeight = 34;
  const bottomReservedHeight = 86;
  const threeDotButtonHeight = 34;

  let visibleItems = TOOLBAR_ITEMS;
  let overflowItems: typeof TOOLBAR_ITEMS = [];

  if (cardHeight !== undefined && cardHeight > 0) {
    const fullHeightNeeded = TOOLBAR_ITEMS.length * itemHeight + bottomReservedHeight;
    if (cardHeight < fullHeightNeeded) {
      // Calculate how many items fit comfortably alongside the three-dot button
      const availableHeight = cardHeight - bottomReservedHeight - threeDotButtonHeight;
      const fitCount = Math.max(2, Math.min(TOOLBAR_ITEMS.length - 1, Math.floor(availableHeight / itemHeight)));
      visibleItems = TOOLBAR_ITEMS.slice(0, fitCount);
      overflowItems = TOOLBAR_ITEMS.slice(fitCount);
    }
  }

  return (
    <div className="bg-card border border-border shadow-sm rounded-xl p-1 flex flex-col items-center gap-0.5">
      {/* 1-Click Direct Visible Question Creation Icons */}
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.type}
            type="button"
            onClick={() => onAddField(item.type)}
            title={item.title}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}

      {/* Overflow Three-Dot Popover when height is low */}
      {overflowItems.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="More Question Types"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-56 p-1.5 bg-popover border border-border shadow-md rounded-xl space-y-0.5 z-50"
          >
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              More Types
            </div>
            {overflowItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onAddField(item.type)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      )}

      <div className="h-px w-5 bg-border my-0.5" />

      {/* Add Section */}
      <button
        type="button"
        onClick={onAddSection}
        title="Add Section"
        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        <Layers className="h-4 w-4" />
      </button>

      {/* Theme & Styling */}
      <button
        type="button"
        onClick={onOpenTheme}
        title="Theme & Banner Settings"
        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        <Palette className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Question Card ─── */
function QuestionCard({
  sectionId,
  field,
  isActive,
  sections,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddField,
  onAddSection,
  onOpenTheme,
}: {
  sectionId: string;
  field: FormFieldDefinition;
  isActive: boolean;
  sections: FormSectionDefinition[];
  onSelect: () => void;
  onUpdate: (patch: Partial<FormFieldDefinition>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddField: (type: FormFieldType) => void;
  onAddSection: () => void;
  onOpenTheme: () => void;
}) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(400);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const update = () => {
      if (el) setCardHeight(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isActive, field]);

  const sortableId = `field:${sectionId}:${field.id}`;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: sortableId,
  });

  const addOption = () => {
    const o = field.options || [];
    onUpdate({ options: [...o, `Option ${o.length + 1}`] });
  };
  const addOtherOption = () => {
    if (!(field.options || []).includes("Other...")) {
      onUpdate({ options: [...(field.options || []), "Other..."] });
    }
  };
  const updateOptionText = (i: number, text: string) => {
    const o = [...(field.options || [])];
    o[i] = text;
    onUpdate({ options: o });
  };
  const removeOption = (i: number) => {
    const o = (field.options || []).filter((_, idx) => idx !== i);
    onUpdate({ options: o.length > 0 ? o : ["Option 1"] });
  };

  return (
    <div
      id={`field-card-${field.id}`}
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={`relative rounded-xl transition-all border ${
        isActive
          ? "bg-card border-foreground/40 shadow-sm ring-1 ring-foreground/20"
          : "bg-card border-border hover:border-foreground/20"
      }`}
    >
      {/* Side Toolbar anchored on the right of the active question card */}
      {isActive && (
        <div className="hidden md:flex absolute -right-12 top-2 z-30">
          <QuestionSideToolbar
            onAddField={onAddField}
            onAddSection={onAddSection}
            onOpenTheme={onOpenTheme}
            cardHeight={cardHeight}
          />
        </div>
      )}

      {/* Drag handle header */}
      <div className="flex justify-center pt-2 pb-0.5">
        <button
          type="button"
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 rotate-90" />
        </button>
      </div>

      <div className="px-5 pb-5 pt-1 space-y-4">
        {isActive ? (
          /* ─── ACTIVE EDITING STATE ─── */
          <div className="space-y-4">
            {/* Row 1: Label and Type Selector */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={field.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="Enter question title"
                  className="w-full text-sm font-medium h-10 pr-10 rounded-lg bg-background border-border focus-visible:ring-1 focus-visible:ring-foreground"
                  autoFocus
                />
                <button
                  type="button"
                  title="Add / Remove image"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImageUpload((v) => !v);
                  }}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground ${
                    field.imageKey ? "text-foreground font-bold" : ""
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>

              <Select
                value={field.type}
                onValueChange={(val) => onUpdate({ type: val as FormFieldType })}
              >
                <SelectTrigger className="w-full sm:w-52 h-10 rounded-lg text-xs font-medium bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {ALL_FIELD_TYPES.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem
                        key={opt.type}
                        value={opt.type}
                        className="text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Optional Image Uploader */}
            {showImageUpload && (
              <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Question Image
                  </span>
                  {field.imageKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        onUpdate({ imageKey: "" });
                        setShowImageUpload(false);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {field.imageKey && (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                    <Image
                      src={getImageUrl(field.imageKey)}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <Uploader
                  fileTypeAccepted="image"
                  value={field.imageKey || ""}
                  onChange={(key) => {
                    onUpdate({ imageKey: key });
                    setShowImageUpload(false);
                  }}
                  maxSize={10 * 1024 * 1024}
                />
              </div>
            )}

            {/* Description / Helper text */}
            <div className="space-y-1">
              <MiniRichEditor
                value={field.description || ""}
                onChange={(val) => onUpdate({ description: val })}
                placeholder="Add description or instructions (optional)..."
              />
            </div>

            {/* ─── Field-Specific Configuration ─── */}
            <div className="pt-1">
              {/* Short text / Email / Number */}
              {(field.type === "short_text" ||
                field.type === "email" ||
                field.type === "number") && (
                <Input
                  disabled
                  placeholder="Respondent will type a short answer here"
                  className="max-w-sm bg-muted/20 border-dashed text-xs text-muted-foreground h-9 rounded-lg"
                />
              )}

              {/* Long text */}
              {field.type === "long_text" && (
                <Textarea
                  disabled
                  placeholder="Respondent will type a multi-line paragraph answer here"
                  rows={2}
                  className="bg-muted/20 border-dashed text-xs text-muted-foreground resize-none rounded-lg"
                />
              )}

              {/* Date & Date of Birth */}
              {(field.type === "date" || field.type === "dob") && (
                <div className="inline-flex items-center gap-2 bg-muted/20 border border-dashed border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>DD / MM / YYYY</span>
                </div>
              )}

              {/* Radio / Checkbox / Dropdown */}
              {(field.type === "radio" ||
                field.type === "checkbox" ||
                field.type === "dropdown") && (
                <div className="space-y-2">
                  {(field.options || ["Option 1"]).map((option, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        {field.type === "radio" ? (
                          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/60 shrink-0" />
                        ) : field.type === "checkbox" ? (
                          <div className="h-3.5 w-3.5 rounded border border-muted-foreground/60 shrink-0" />
                        ) : (
                          <span className="text-xs text-muted-foreground w-4 text-center shrink-0">
                            {idx + 1}.
                          </span>
                        )}
                        <Input
                          value={option}
                          onChange={(e) => updateOptionText(idx, e.target.value)}
                          className="flex-1 bg-background text-xs h-8 rounded-md"
                          placeholder={`Option ${idx + 1}`}
                        />
                        {(field.options?.length || 0) > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(idx)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Option navigation branching */}
                      {field.goToSectionBasedOnAnswer &&
                        (field.type === "radio" || field.type === "dropdown") &&
                        sections.length > 1 && (
                          <div className="pl-6 sm:pl-0 shrink-0">
                            <Select
                              value={field.optionNavigation?.[String(idx)] || "next"}
                              onValueChange={(val) => {
                                const nav = { ...(field.optionNavigation || {}) };
                                nav[String(idx)] = val;
                                onUpdate({ optionNavigation: nav });
                              }}
                            >
                              <SelectTrigger className="w-full sm:w-48 h-7 bg-muted/40 text-[11px] rounded-md">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg">
                                <SelectItem value="next" className="text-xs">
                                  Continue to next section
                                </SelectItem>
                                {sections
                                  .filter((sec) => sec.id !== sectionId)
                                  .map((sec) => {
                                    const sIdx = sections.findIndex(
                                      (s) => s.id === sec.id,
                                    );
                                    return (
                                      <SelectItem
                                        key={sec.id}
                                        value={`section_${sec.id}`}
                                        className="text-xs"
                                      >
                                        Go to Section {sIdx + 1} ({sec.title || "Untitled"})
                                      </SelectItem>
                                    );
                                  })}
                                <SelectItem
                                  value="submit"
                                  className="text-xs font-medium"
                                >
                                  Submit form
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addOption}
                      className="text-xs h-7 px-2 text-foreground font-medium"
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Option
                    </Button>
                    <span className="text-muted-foreground text-xs">or</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addOtherOption}
                      className="text-xs h-7 px-2 text-muted-foreground"
                    >
                      Add &quot;Other&quot;
                    </Button>
                  </div>
                </div>
              )}

              {/* Team Members Repeater */}
              {field.type === "team_members" && (
                <div className="space-y-4 rounded-lg bg-muted/20 p-4 border border-border">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Team Limits & Settings
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Define the maximum team size and custom labels for the repeater.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Min Members
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={field.minEntries ?? 1}
                        onChange={(e) =>
                          onUpdate({
                            minEntries: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Max Members
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={field.maxEntries ?? 4}
                        onChange={(e) =>
                          onUpdate({
                            maxEntries: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Entry Label
                      </Label>
                      <Input
                        value={field.entryLabel || "Member"}
                        onChange={(e) => onUpdate({ entryLabel: e.target.value })}
                        placeholder="e.g. Member"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Add Button Text
                      </Label>
                      <Input
                        value={field.addButtonLabel || "Add Member"}
                        onChange={(e) => onUpdate({ addButtonLabel: e.target.value })}
                        placeholder="e.g. Add Member"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                  </div>

                  {/* Sub Questions / Fields Template */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-xs font-semibold text-foreground">
                      Member Information Fields
                    </span>
                    <div className="space-y-2">
                      {(field.subQuestions || []).map((sub, sIdx) => (
                        <div
                          key={sub.id || sIdx}
                          className="p-3 bg-background rounded-lg border border-border space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Input
                              value={sub.label}
                              onChange={(e) => {
                                const list = [...(field.subQuestions || [])];
                                list[sIdx] = { ...sub, label: e.target.value };
                                onUpdate({ subQuestions: list });
                              }}
                              placeholder={`Field ${sIdx + 1} Label`}
                              className="flex-1 h-8 text-xs rounded-md"
                            />

                            <Select
                              value={sub.type || "short_text"}
                              onValueChange={(val) => {
                                const list = [...(field.subQuestions || [])];
                                list[sIdx] = {
                                  ...sub,
                                  type: val as SubQuestionType,
                                  options:
                                    val === "dropdown"
                                      ? sub.options || ["Male", "Female", "Other"]
                                      : undefined,
                                };
                                onUpdate({ subQuestions: list });
                              }}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs rounded-md">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg">
                                <SelectItem value="short_text" className="text-xs">
                                  Short Text
                                </SelectItem>
                                <SelectItem value="email" className="text-xs">
                                  Email
                                </SelectItem>
                                <SelectItem value="number" className="text-xs">
                                  Number
                                </SelectItem>
                                <SelectItem value="dob" className="text-xs">
                                  Date of Birth (DOB)
                                </SelectItem>
                                <SelectItem value="dropdown" className="text-xs">
                                  Dropdown
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                <Switch
                                  checked={Boolean(sub.required)}
                                  onCheckedChange={(c) => {
                                    const list = [...(field.subQuestions || [])];
                                    list[sIdx] = { ...sub, required: c };
                                    onUpdate({ subQuestions: list });
                                  }}
                                />
                                <span>Req</span>
                              </label>

                              {(field.subQuestions?.length || 0) > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const list = (field.subQuestions || []).filter(
                                      (_, i) => i !== sIdx,
                                    );
                                    onUpdate({ subQuestions: list });
                                  }}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Dropdown Options Manager for Sub-Field */}
                          {sub.type === "dropdown" && (
                            <div className="pl-2 border-l-2 border-border space-y-1.5 pt-1">
                              <span className="text-[11px] font-medium text-muted-foreground">
                                Dropdown Options:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(sub.options || ["Male", "Female", "Other"]).map(
                                  (opt, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs border border-border"
                                    >
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const opts = [
                                            ...(sub.options || ["Male", "Female", "Other"]),
                                          ];
                                          opts[optIdx] = e.target.value;
                                          const list = [...(field.subQuestions || [])];
                                          list[sIdx] = { ...sub, options: opts };
                                          onUpdate({ subQuestions: list });
                                        }}
                                        className="bg-transparent border-none outline-none text-xs w-20 text-foreground"
                                      />
                                      {(sub.options?.length || 0) > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const opts = (
                                              sub.options || ["Male", "Female", "Other"]
                                            ).filter((_, i) => i !== optIdx);
                                            const list = [
                                              ...(field.subQuestions || []),
                                            ];
                                            list[sIdx] = { ...sub, options: opts };
                                            onUpdate({ subQuestions: list });
                                          }}
                                          className="text-muted-foreground hover:text-destructive"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  ),
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const opts = [
                                      ...(sub.options || ["Male", "Female", "Other"]),
                                      `Option ${(sub.options?.length || 0) + 1}`,
                                    ];
                                    const list = [...(field.subQuestions || [])];
                                    list[sIdx] = { ...sub, options: opts };
                                    onUpdate({ subQuestions: list });
                                  }}
                                  className="h-6 text-[11px] px-2"
                                >
                                  <Plus className="h-2.5 w-2.5 mr-1" /> Option
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const list = [
                            ...(field.subQuestions || []),
                            {
                              id: createId("sub"),
                              label: `Field ${(field.subQuestions?.length || 0) + 1}`,
                              placeholder: "Enter details",
                              required: false,
                              type: "short_text" as SubQuestionType,
                            },
                          ];
                          onUpdate({ subQuestions: list });
                        }}
                        className="text-xs h-7 gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Sub-Field
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi Input */}
              {field.type === "multi_input" && (
                <div className="space-y-3 rounded-lg bg-muted/20 p-4 border border-border">
                  <span className="text-xs font-semibold text-foreground">
                    Multiple Input Questions
                  </span>
                  <div className="space-y-2">
                    {(field.subQuestions || []).map((sub, sIdx) => (
                      <div
                        key={sub.id || sIdx}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={sub.label}
                          onChange={(e) => {
                            const list = [...(field.subQuestions || [])];
                            list[sIdx] = { ...sub, label: e.target.value };
                            onUpdate({ subQuestions: list });
                          }}
                          placeholder={`Sub-question ${sIdx + 1}`}
                          className="flex-1 h-8 text-xs bg-background rounded-md"
                        />
                        <Input
                          value={sub.placeholder || ""}
                          onChange={(e) => {
                            const list = [...(field.subQuestions || [])];
                            list[sIdx] = { ...sub, placeholder: e.target.value };
                            onUpdate({ subQuestions: list });
                          }}
                          placeholder="Placeholder"
                          className="flex-1 h-8 text-xs bg-background rounded-md"
                        />
                        {(field.subQuestions?.length || 0) > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const list = (field.subQuestions || []).filter(
                                (_, i) => i !== sIdx,
                              );
                              onUpdate({ subQuestions: list });
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const list = [
                          ...(field.subQuestions || []),
                          {
                            id: createId("sub"),
                            label: `Sub-question ${(field.subQuestions?.length || 0) + 1}`,
                            placeholder: "Enter answer...",
                            required: false,
                            type: "short_text" as SubQuestionType,
                          },
                        ];
                        onUpdate({ subQuestions: list });
                      }}
                      className="text-xs h-7 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Input Box
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment Block */}
              {field.type === "payment" && (
                <div className="space-y-3 rounded-lg bg-muted/20 p-4 border border-border">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Payment Gateway Settings
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Configure payment amount and allowed checkout methods.
                    </p>
                  </div>

                  {/* Payment Method Checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background cursor-pointer text-xs">
                      <Checkbox
                        checked={field.enableUpi !== false}
                        onCheckedChange={(c) => {
                          const isChecked = Boolean(c);
                          const cur = field.allowedPaymentMethods || ["upi"];
                          const updated = isChecked
                            ? Array.from(new Set([...cur, "upi" as const]))
                            : cur.filter((m) => m !== "upi");
                          onUpdate({
                            enableUpi: isChecked,
                            allowedPaymentMethods: updated,
                          });
                        }}
                      />
                      <span className="font-medium">UPI QR Code</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background cursor-pointer text-xs">
                      <Checkbox
                        checked={Boolean(field.enableRazorpay)}
                        onCheckedChange={(c) => {
                          const isChecked = Boolean(c);
                          const cur = field.allowedPaymentMethods || ["upi"];
                          const updated = isChecked
                            ? Array.from(new Set([...cur, "razorpay" as const]))
                            : cur.filter((m) => m !== "razorpay");
                          onUpdate({
                            enableRazorpay: isChecked,
                            allowedPaymentMethods: updated,
                          });
                        }}
                      />
                      <span className="font-medium">Razorpay Online</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background cursor-pointer text-xs">
                      <Checkbox
                        checked={Boolean(field.enableCash)}
                        onCheckedChange={(c) => {
                          const isChecked = Boolean(c);
                          const cur = field.allowedPaymentMethods || ["upi"];
                          const updated = isChecked
                            ? Array.from(new Set([...cur, "cash" as const]))
                            : cur.filter((m) => m !== "cash");
                          onUpdate({
                            enableCash: isChecked,
                            allowedPaymentMethods: updated,
                          });
                        }}
                      />
                      <span className="font-medium">Cash Payment</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Amount (₹) *
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.paymentAmount ?? ""}
                        onChange={(e) =>
                          onUpdate({
                            paymentAmount: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="e.g. 200.00"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        UPI ID / VPA
                      </Label>
                      <Input
                        value={field.upiId || ""}
                        onChange={(e) => onUpdate({ upiId: e.target.value })}
                        placeholder="e.g. codebreakers@okaxis"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Payee Name
                      </Label>
                      <Input
                        value={field.payeeName || ""}
                        onChange={(e) => onUpdate({ payeeName: e.target.value })}
                        placeholder="e.g. Codebreakers GCEK"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Transaction ID Label
                      </Label>
                      <Input
                        value={field.transactionIdLabel || ""}
                        onChange={(e) =>
                          onUpdate({ transactionIdLabel: e.target.value })
                        }
                        placeholder="e.g. UTR / Reference ID"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                  </div>

                  <PaymentFieldPreview field={field} />
                </div>
              )}

              {/* File Upload */}
              {field.type === "file_upload" && (
                <div className="space-y-3 rounded-lg bg-muted/20 p-4 border border-border">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5" /> File Upload Settings
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Uploaded files will be compressed and saved to Google Drive.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={Boolean(field.multipleFiles)}
                        onCheckedChange={(c) => onUpdate({ multipleFiles: c })}
                      />
                      <span>Allow multiple files</span>
                    </label>

                    {field.multipleFiles && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px]">
                          Max Files:
                        </span>
                        <Select
                          value={String(field.maxFiles || 3)}
                          onValueChange={(val) =>
                            onUpdate({ maxFiles: Number(val) })
                          }
                        >
                          <SelectTrigger className="w-20 h-7 text-xs rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="2" className="text-xs">
                              2
                            </SelectItem>
                            <SelectItem value="3" className="text-xs">
                              3
                            </SelectItem>
                            <SelectItem value="5" className="text-xs">
                              5
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Linear Scale */}
              {field.type === "linear_scale" && (
                <div className="space-y-3 rounded-lg bg-muted/20 p-4 border border-border">
                  <span className="text-xs font-semibold text-foreground">
                    Rating Scale
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Min Scale
                      </Label>
                      <Input
                        type="number"
                        value={field.scaleMin ?? 1}
                        onChange={(e) =>
                          onUpdate({ scaleMin: Number(e.target.value) || 1 })
                        }
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Max Scale
                      </Label>
                      <Input
                        type="number"
                        value={field.scaleMax ?? 5}
                        onChange={(e) =>
                          onUpdate({ scaleMax: Number(e.target.value) || 5 })
                        }
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Min Label
                      </Label>
                      <Input
                        value={field.scaleMinLabel || ""}
                        onChange={(e) =>
                          onUpdate({ scaleMinLabel: e.target.value })
                        }
                        placeholder="e.g. Poor"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Max Label
                      </Label>
                      <Input
                        value={field.scaleMaxLabel || ""}
                        onChange={(e) =>
                          onUpdate({ scaleMaxLabel: e.target.value })
                        }
                        placeholder="e.g. Excellent"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Button Link */}
              {field.type === "button" && (
                <div className="space-y-3 rounded-lg bg-muted/20 p-4 border border-border">
                  <span className="text-xs font-semibold text-foreground">
                    Button Link Settings
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Button Label
                      </Label>
                      <Input
                        value={field.buttonLabel || ""}
                        onChange={(e) => onUpdate({ buttonLabel: e.target.value })}
                        placeholder="e.g. Join WhatsApp Group"
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Target URL
                      </Label>
                      <Input
                        value={field.buttonUrl || ""}
                        onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
                        placeholder="https://..."
                        className="h-8 text-xs bg-background rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Card Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDuplicate}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  title="Duplicate Question"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1.5"
                  title="Delete Question"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>

                {/* Branching Toggle */}
                {(field.type === "radio" || field.type === "dropdown") &&
                  sections.length > 1 && (
                    <Button
                      type="button"
                      variant={
                        field.goToSectionBasedOnAnswer ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        onUpdate({
                          goToSectionBasedOnAnswer: !field.goToSectionBasedOnAnswer,
                        })
                      }
                      className="h-8 px-2.5 text-xs gap-1.5 ml-1"
                    >
                      <Split className="h-3.5 w-3.5" />
                      <span>Branching</span>
                    </Button>
                  )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Required</span>
                <Switch
                  checked={field.required}
                  onCheckedChange={(c) => onUpdate({ required: c })}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ─── INACTIVE COLLAPSED PREVIEW ─── */
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {field.label || "Untitled Question"}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </p>
              <Badge variant="outline" className="text-[10px] font-normal capitalize">
                {field.type.replace(/_/g, " ")}
              </Badge>
            </div>

            {field.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {getFieldDescriptionText(field.description)}
              </p>
            )}

            {/* Inactive Field Previews */}
            <div className="pt-0.5">
              {(field.type === "short_text" ||
                field.type === "email" ||
                field.type === "number") && (
                <div className="h-8 max-w-xs rounded border border-dashed border-border/80 bg-muted/10 flex items-center px-3 text-xs text-muted-foreground">
                  Short answer
                </div>
              )}
              {field.type === "long_text" && (
                <div className="h-14 rounded border border-dashed border-border/80 bg-muted/10 p-2 text-xs text-muted-foreground">
                  Paragraph text
                </div>
              )}
              {field.type === "team_members" && (
                <div className="p-2.5 rounded border border-dashed border-border/80 bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Users className="h-3.5 w-3.5" /> Team Members (Max:{" "}
                    {field.maxEntries || 4})
                  </span>
                  <span className="text-[11px]">
                    {field.subQuestions?.length || 0} fields per member
                  </span>
                </div>
              )}
              {field.type === "payment" && (
                <div className="p-2.5 rounded border border-dashed border-border/80 bg-muted/10 text-xs text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Amount: ₹{field.paymentAmount ?? 0}</span>
                </div>
              )}
              {field.type === "file_upload" && (
                <div className="p-2 rounded border border-dashed border-border/80 bg-muted/10 text-xs text-muted-foreground flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>File upload</span>
                </div>
              )}
              {(field.type === "date" || field.type === "dob") && (
                <div className="h-8 max-w-xs rounded border border-dashed border-border/80 bg-muted/10 flex items-center gap-2 px-3 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>DD / MM / YYYY</span>
                </div>
              )}
              {(field.type === "radio" ||
                field.type === "checkbox" ||
                field.type === "dropdown") && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {(field.options || ["Option 1"]).slice(0, 3).map((opt, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-muted border border-border text-[11px]"
                    >
                      {opt}
                    </span>
                  ))}
                  {(field.options?.length || 0) > 3 && (
                    <span className="text-[11px] self-center">
                      +{(field.options?.length || 0) - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main FormBuilder Component ─── */
export default function FormBuilder({
  initialDefinition,
  initialForm,
}: FormBuilderProps) {
  const router = useRouter();
  const isEditing = Boolean(initialForm);
  const initialData =
    initialForm?.definition ?? initialDefinition ?? createBlankFormDefinition();

  const [title, setTitle] = useState(initialForm?.title || "Untitled form");
  const [description, setDescription] = useState(initialForm?.description || "");
  const [definition, setDefinition] = useState<FormDefinition>(
    normalizeDefinition(initialData),
  );
  const [activeTab, setActiveTab] = useState<"questions" | "theme" | "settings">(
    "questions",
  );
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState<
    boolean | null
  >(null);
  const [showPublishGuardDialog, setShowPublishGuardDialog] = useState(false);

  const safeIdx = Math.min(activeSectionIdx, definition.sections.length - 1);
  const currentSection = definition.sections[safeIdx] || emptySection(0);

  // Height measurement for Title Card & Section Card side toolbars
  const titleCardRef = useRef<HTMLDivElement | null>(null);
  const [titleCardHeight, setTitleCardHeight] = useState<number>(300);

  useEffect(() => {
    const el = titleCardRef.current;
    if (!el) return;
    const update = () => {
      if (el) setTitleCardHeight(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [title, description, definition.bannerKey, definition.bannerTemplate, activeFieldId]);

  const sectionCardRef = useRef<HTMLDivElement | null>(null);
  const [sectionCardHeight, setSectionCardHeight] = useState<number>(300);

  useEffect(() => {
    const el = sectionCardRef.current;
    if (!el) return;
    const update = () => {
      if (el) setSectionCardHeight(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [safeIdx, currentSection.title, currentSection.description, activeFieldId]);

  // Check Google Drive connection
  useEffect(() => {
    async function checkDrive() {
      try {
        const res = await fetch("/api/settings/google-drive/status");
        const json = await res.json();
        if (json.success && json.data) {
          setIsGoogleDriveConnected(Boolean(json.data.isConnected));
        } else {
          setIsGoogleDriveConnected(false);
        }
      } catch {
        setIsGoogleDriveConnected(false);
      }
    }
    checkDrive();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  /* ─── Section operations ─── */
  const addSection = () => {
    const newSection = emptySection(definition.sections.length);
    setDefinition((c) => ({ ...c, sections: [...c.sections, newSection] }));
    setActiveSectionIdx(definition.sections.length);
    setActiveFieldId(null);
  };

  const deleteSection = (idx: number) => {
    if (definition.sections.length <= 1) {
      toast.error("A form must have at least one section");
      return;
    }
    setDefinition((c) => ({
      ...c,
      sections: c.sections
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, order: i })),
    }));
    setActiveSectionIdx(Math.max(0, idx - 1));
    setActiveFieldId(null);
  };

  const updateSection = (
    idx: number,
    patch: Partial<FormSectionDefinition>,
  ) => {
    setDefinition((c) => ({
      ...c,
      sections: c.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  };

  /* ─── Field operations ─── */
  const addField = (type: FormFieldType = "radio") => {
    const f = emptyField(type, currentSection.fields.length);
    if (
      activeFieldId &&
      activeFieldId !== "title" &&
      activeFieldId !== "section"
    ) {
      const activeIdx = currentSection.fields.findIndex(
        (field) => field.id === activeFieldId,
      );
      if (activeIdx !== -1) {
        const newFields = [...currentSection.fields];
        newFields.splice(activeIdx + 1, 0, f);
        const reordered = newFields.map((field, idx) => ({
          ...field,
          order: idx,
        }));
        setDefinition((c) => ({
          ...c,
          sections: c.sections.map((s, i) =>
            i === safeIdx ? { ...s, fields: reordered } : s,
          ),
        }));
        setActiveFieldId(f.id);

        setTimeout(() => {
          const el = document.getElementById(`field-card-${f.id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
        return;
      }
    }
    setDefinition((c) => ({
      ...c,
      sections: c.sections.map((s, i) =>
        i === safeIdx ? { ...s, fields: [...s.fields, f] } : s,
      ),
    }));
    setActiveFieldId(f.id);

    setTimeout(() => {
      const el = document.getElementById(`field-card-${f.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  const updateField = (id: string, patch: Partial<FormFieldDefinition>) => {
    setDefinition((c) => ({
      ...c,
      sections: c.sections.map((s, i) =>
        i === safeIdx
          ? {
              ...s,
              fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
            }
          : s,
      ),
    }));
  };

  const deleteField = (id: string) => {
    setDefinition((c) => ({
      ...c,
      sections: c.sections.map((s, i) =>
        i === safeIdx
          ? { ...s, fields: s.fields.filter((f) => f.id !== id) }
          : s,
      ),
    }));
    if (activeFieldId === id) setActiveFieldId(null);
  };

  const duplicateField = (id: string) => {
    const src = currentSection.fields.find((f) => f.id === id);
    if (!src) return;
    const clone: FormFieldDefinition = {
      ...src,
      id: createId("field"),
      label: `${src.label} (Copy)`,
      order: currentSection.fields.length,
      options: src.options ? [...src.options] : ["Option 1"],
    };
    setDefinition((c) => ({
      ...c,
      sections: c.sections.map((s, i) =>
        i === safeIdx ? { ...s, fields: [...s.fields, clone] } : s,
      ),
    }));
    setActiveFieldId(clone.id);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oi = currentSection.fields.findIndex(
      (f) => `field:${currentSection.id}:${f.id}` === active.id,
    );
    const ni = currentSection.fields.findIndex(
      (f) => `field:${currentSection.id}:${f.id}` === over.id,
    );
    if (oi >= 0 && ni >= 0) {
      setDefinition((c) => ({
        ...c,
        sections: c.sections.map((s, i) =>
          i === safeIdx
            ? {
                ...s,
                fields: reorder(s.fields, oi, ni).map((f, idx) => ({
                  ...f,
                  order: idx,
                })),
              }
            : s,
        ),
      }));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Form title is required");
      return;
    }
    const normalized = normalizeDefinition(definition);
    setIsSaving(true);
    const result =
      isEditing && initialForm
        ? await updateForm(initialForm.formId, {
            title,
            description,
            definition: normalized,
          })
        : await createForm({ title, description, definition: normalized });
    if (result.status === "success") {
      toast.success(result.message);
      if (!isEditing && result.data?.formId) {
        router.push(`/admin/forms/${result.data.formId}`);
      } else {
        router.refresh();
      }
    } else {
      toast.error(result.message);
    }
    setIsSaving(false);
  };

  const handlePublishToggle = async () => {
    if (!initialForm) {
      toast.error("Save form first before publishing");
      return;
    }

    const willPublish = !initialForm.isPublished;
    if (willPublish) {
      const hasFileUpload = definition.sections.some((s) =>
        s.fields.some((f) => f.type === "file_upload"),
      );
      if (hasFileUpload && !isGoogleDriveConnected) {
        setShowPublishGuardDialog(true);
        return;
      }
    }

    setIsPublishing(true);
    const result = await toggleFormPublish(initialForm.formId, willPublish);
    if (result.status === "success") {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setIsPublishing(false);
  };

  const isPublished = initialForm?.isPublished;
  const currentBanner = BANNER_TEMPLATES.find(
    (t) => t.id === (definition.bannerTemplate || "none"),
  );

  return (
    <div className="min-h-full flex-1 bg-muted/20 text-foreground flex flex-col">
      {/* ═══ TOP APP BAR ═══ */}
      <header className="sticky top-0 z-40 bg-background border-b border-border shadow-xs">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 gap-3">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/admin/forms")}
              title="Back to Forms"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground min-w-0 w-36 sm:w-60 truncate focus:bg-muted/40 focus:px-2 focus:rounded-md transition-all"
                placeholder="Untitled form"
              />
              <Badge
                variant="outline"
                className={`text-[10px] font-medium uppercase px-1.5 py-0 h-5 shrink-0 ${
                  isPublished
                    ? "border-emerald-600/30 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "border-border text-muted-foreground"
                }`}
              >
                {isPublished ? "Live" : "Draft"}
              </Badge>
            </div>
          </div>

          {/* Center Tabs */}
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "questions"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Builder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("theme")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "theme"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Theme & Style</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "settings"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Settings</span>
            </button>

            {initialForm && (
              <button
                type="button"
                onClick={() =>
                  router.push(`/admin/forms/${initialForm.formId}/responses`)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Responses ({initialForm.responses?.length || 0})</span>
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeSelectorDropdown />

            {initialForm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://forms.cbgcek.dev/${initialForm.formId}`,
                    "_blank",
                  )
                }
                className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
                title="Preview Form"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            )}

            <Button
              onClick={handlePublishToggle}
              disabled={isPublishing || !initialForm}
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium gap-1.5"
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isPublished ? (
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              <span>{isPublished ? "Published" : "Publish"}</span>
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="h-8 px-4 text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Save</span>
            </Button>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex md:hidden border-t border-border px-4 py-1.5 gap-1 overflow-x-auto bg-background">
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`px-3 py-1 rounded text-xs font-medium ${
              activeTab === "questions"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("theme")}
            className={`px-3 py-1 rounded text-xs font-medium ${
              activeTab === "theme"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1 rounded text-xs font-medium ${
              activeTab === "settings"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Settings
          </button>
          {initialForm && (
            <button
              type="button"
              onClick={() =>
                router.push(`/admin/forms/${initialForm.formId}/responses`)
              }
              className="px-3 py-1 rounded text-xs font-medium text-muted-foreground"
            >
              Responses
            </button>
          )}
        </div>
      </header>

      {/* ═══ MAIN CANVAS ═══ */}
      <main className="flex-1 py-6">
        {/* ─── 1. BUILDER (QUESTIONS) TAB ─── */}
        {activeTab === "questions" && (
          <div className="max-w-3xl mx-auto px-4 md:pr-14 space-y-4 relative">
            {/* Form Title & Description Card */}
            <div
              ref={titleCardRef}
              className={`rounded-xl border bg-card p-5 space-y-3 relative transition-all ${
                activeFieldId === "title"
                  ? "border-foreground/40 shadow-sm ring-1 ring-foreground/20"
                  : "border-border"
              }`}
              onClick={() => setActiveFieldId("title")}
            >
              {/* Right Side Toolbar anchored to Title Card */}
              {activeFieldId === "title" && (
                <div className="hidden md:flex absolute -right-12 top-4 z-30">
                  <QuestionSideToolbar
                    onAddField={addField}
                    onAddSection={addSection}
                    onOpenTheme={() => setActiveTab("theme")}
                    cardHeight={titleCardHeight}
                  />
                </div>
              )}

              {/* Header Banner Preview if selected */}
              {(definition.bannerKey ||
                (definition.bannerTemplate &&
                  definition.bannerTemplate !== "none")) && (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border">
                  {definition.bannerKey ? (
                    <Image
                      src={getImageUrl(definition.bannerKey)}
                      alt="Banner"
                      fill
                      className="object-cover"
                    />
                  ) : currentBanner ? (
                    <div
                      className={`w-full h-full bg-gradient-to-r ${currentBanner.gradient}`}
                      style={{ background: currentBanner.cssGradient }}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("theme");
                    }}
                    className="absolute right-2 top-2 text-[10px] bg-black/70 text-white px-2 py-1 rounded hover:bg-black"
                  >
                    Change in Theme tab
                  </button>
                </div>
              )}

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Form Title"
                className="w-full text-xl sm:text-2xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60"
              />

              <MiniRichEditor
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Add form description or guidelines..."
              />

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
                  <span>
                    {definition.settings.collectEmail
                      ? "Collecting respondent emails"
                      : "Email collection optional"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="text-foreground hover:underline font-medium text-xs"
                >
                  Configure in Settings →
                </button>
              </div>
            </div>

            {/* Section Stepper Tabs */}
            {definition.sections.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {definition.sections.map((sec, i) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setActiveSectionIdx(i);
                      setActiveFieldId(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                      i === safeIdx
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="h-3 w-3" />
                    <span>{sec.title || `Section ${i + 1}`}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Active Section Card */}
            <div
              ref={sectionCardRef}
              className={`rounded-xl border bg-card p-4 space-y-3 relative transition-all ${
                activeFieldId === "section"
                  ? "border-foreground/40 shadow-sm ring-1 ring-foreground/20"
                  : "border-border"
              }`}
              onClick={() => setActiveFieldId("section")}
            >
              {/* Right Side Toolbar anchored to Section Card */}
              {activeFieldId === "section" && (
                <div className="hidden md:flex absolute -right-12 top-3 z-30">
                  <QuestionSideToolbar
                    onAddField={addField}
                    onAddSection={addSection}
                    onOpenTheme={() => setActiveTab("theme")}
                    cardHeight={sectionCardHeight}
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Section {safeIdx + 1} of {definition.sections.length}:
                  </span>
                  <input
                    type="text"
                    value={currentSection.title}
                    onChange={(e) =>
                      updateSection(safeIdx, { title: e.target.value })
                    }
                    placeholder={`Section ${safeIdx + 1} Title`}
                    className="text-sm font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 flex-1"
                  />
                </div>

                {definition.sections.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSection(safeIdx)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Delete Section"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <MiniRichEditor
                value={currentSection.description || ""}
                onChange={(val) =>
                  updateSection(safeIdx, { description: val })
                }
                placeholder="Section description (optional)..."
              />

              {/* Branching Action after section */}
              {definition.sections.length > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <ArrowRight className="h-3.5 w-3.5" /> After Section {safeIdx + 1}:
                  </span>
                  <Select
                    value={currentSection.afterSectionAction || "next"}
                    onValueChange={(val) =>
                      updateSection(safeIdx, { afterSectionAction: val })
                    }
                  >
                    <SelectTrigger className="w-56 h-8 text-xs bg-background rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="next" className="text-xs">
                        Continue to next section
                      </SelectItem>
                      {definition.sections
                        .filter((sec) => sec.id !== currentSection.id)
                        .map((sec) => {
                          const sIdx = definition.sections.findIndex(
                            (s) => s.id === sec.id,
                          );
                          return (
                            <SelectItem
                              key={sec.id}
                              value={`section_${sec.id}`}
                              className="text-xs"
                            >
                              Go to Section {sIdx + 1} ({sec.title || "Untitled"})
                            </SelectItem>
                          );
                        })}
                      <SelectItem value="submit" className="text-xs font-medium">
                        Submit form
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Questions List with Sortable DND */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentSection.fields.map(
                  (f) => `field:${currentSection.id}:${f.id}`,
                )}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {currentSection.fields.map((field) => (
                    <QuestionCard
                      key={field.id}
                      sectionId={currentSection.id}
                      field={field}
                      isActive={activeFieldId === field.id}
                      sections={definition.sections}
                      onSelect={() => setActiveFieldId(field.id)}
                      onUpdate={(patch) => updateField(field.id, patch)}
                      onDelete={() => deleteField(field.id)}
                      onDuplicate={() => duplicateField(field.id)}
                      onAddField={addField}
                      onAddSection={addSection}
                      onOpenTheme={() => setActiveTab("theme")}
                    />
                  ))}

                  {currentSection.fields.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2 bg-card">
                      <p className="text-xs font-semibold text-foreground">
                        No questions in this section yet
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Click the button below to add your first question.
                      </p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Question & Add Section Action Bar */}
            <div className="pt-2 flex items-center gap-2">
              <AddQuestionPopover onAddField={addField} />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSection}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold gap-1.5 border-border text-foreground hover:bg-muted"
              >
                <Layers className="h-3.5 w-3.5" /> Add Section
              </Button>
            </div>

            {/* Mobile floating action dock */}
            <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border border-border shadow-lg rounded-xl p-1 max-w-[95vw]">
              <QuestionSideToolbar
                onAddField={addField}
                onAddSection={addSection}
                onOpenTheme={() => setActiveTab("theme")}
                isMobileHorizontal
              />
            </div>
          </div>
        )}

        {/* ─── 2. THEME & STYLE TAB ─── */}
        {activeTab === "theme" && (
          <div className="max-w-2xl mx-auto px-4 space-y-4">
            {/* Visual Theme Selector */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Form Visual Style
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select the aesthetic layout for public respondents.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {FORM_STYLES.map((style) => {
                  const isSelected =
                    (definition.formStyle || "minimal") === style.id;
                  const isTerminal = style.id === "terminal";
                  return (
                    <div
                      key={style.id}
                      onClick={() =>
                        setDefinition((c) => ({ ...c, formStyle: style.id }))
                      }
                      className={`cursor-pointer rounded-lg p-4 border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-foreground bg-muted/40 ring-1 ring-foreground"
                          : "border-border hover:border-foreground/40 bg-card"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            {isTerminal ? (
                              <Terminal className="h-3.5 w-3.5" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {style.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {style.badge}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {style.description}
                        </p>
                      </div>

                      {/* Clean Miniature Preview */}
                      <div
                        className={`mt-3 rounded p-2 text-[10px] font-mono border ${
                          isTerminal
                            ? "bg-black text-[#33ff00] border-[#1f521f]"
                            : "bg-white text-zinc-900 border-zinc-200"
                        }`}
                      >
                        {isTerminal ? "[PROMPT_READY] > _" : "Short answer text..."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Header Banner Customization */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground">
                  Header Banner
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select a solid header or upload a custom image.
                </p>
              </div>

              {/* Banner Templates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BANNER_TEMPLATES.map((tmpl) => {
                  const isSelected =
                    (definition.bannerTemplate || "none") === tmpl.id &&
                    !definition.bannerKey;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() =>
                        setDefinition((c) => ({
                          ...c,
                          bannerTemplate: tmpl.id,
                          bannerKey: "",
                        }))
                      }
                      className={`h-16 rounded-lg border p-1 text-left relative overflow-hidden transition-all ${
                        isSelected
                          ? "ring-2 ring-foreground border-transparent"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      {tmpl.id === "none" ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                          None
                        </div>
                      ) : (
                        <div
                          className="w-full h-full rounded"
                          style={{ background: tmpl.cssGradient }}
                        />
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-foreground text-background rounded-full p-0.5">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Banner Upload */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-xs font-semibold text-foreground">
                  Or Upload Custom Banner Image
                </span>
                <Uploader
                  fileTypeAccepted="image"
                  value={definition.bannerKey || ""}
                  onChange={(key) =>
                    setDefinition((c) => ({ ...c, bannerKey: key }))
                  }
                  maxSize={10 * 1024 * 1024}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. SETTINGS TAB ─── */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto px-4 space-y-4">
            {/* Respondent Requirements */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Respondent Information
              </h3>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Collect Full Name
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Require respondent to enter their name on submission
                    </p>
                  </div>
                  <Switch
                    checked={definition.settings.collectName}
                    onCheckedChange={(c) =>
                      setDefinition((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, collectName: c },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Collect Email Address
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Require email for confirmation receipt and verification
                    </p>
                  </div>
                  <Switch
                    checked={definition.settings.collectEmail}
                    onCheckedChange={(c) =>
                      setDefinition((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, collectEmail: c },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Allow Multiple Submissions
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Allow the same respondent/browser to submit more than once
                    </p>
                  </div>
                  <Switch
                    checked={definition.settings.allowMultipleSubmissions}
                    onCheckedChange={(c) =>
                      setDefinition((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, allowMultipleSubmissions: c },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Submission Messages */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Submission Experience
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Submit Button Label
                  </Label>
                  <Input
                    value={definition.settings.submitButtonLabel}
                    onChange={(e) =>
                      setDefinition((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          submitButtonLabel: e.target.value,
                        },
                      }))
                    }
                    placeholder="Submit"
                    className="h-8 text-xs bg-background rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Thank You / Success Message
                  </Label>
                  <Textarea
                    value={definition.settings.successMessage}
                    onChange={(e) =>
                      setDefinition((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          successMessage: e.target.value,
                        },
                      }))
                    }
                    rows={2}
                    className="text-xs bg-background rounded-md resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Form Info Card if editing */}
            {initialForm && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-2 text-xs">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Form Details
                </h3>
                <div className="space-y-1.5 text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span>Form ID</span>
                    <span className="font-mono text-foreground">
                      {initialForm.formId}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span>Public URL</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          `https://forms.cbgcek.dev/${initialForm.formId}`,
                        );
                        toast.success("Public link copied!");
                      }}
                      className="text-foreground hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Link2 className="h-3 w-3" /> Copy Link
                    </button>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Total Sections</span>
                    <span className="text-foreground font-medium">
                      {definition.sections.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══ GOOGLE DRIVE PUBLISH GUARD DIALOG ═══ */}
      <AlertDialog
        open={showPublishGuardDialog}
        onOpenChange={setShowPublishGuardDialog}
      >
        <AlertDialogContent className="rounded-xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5" />
              <AlertDialogTitle className="text-base font-semibold">
                Google Drive Required
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              This form contains file upload fields, but Google Drive is not
              connected yet. Please connect Google Drive in Settings before
              publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowPublishGuardDialog(false);
                window.open("/admin/settings?tab=security", "_blank");
              }}
              className="rounded-lg text-xs"
            >
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
