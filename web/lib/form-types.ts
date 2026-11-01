export type FormFieldType =
  | "short_text"
  | "long_text"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "date"
  | "dob"
  | "email"
  | "number"
  | "payment"
  | "button"
  | "linear_scale"
  | "multi_input"
  | "team_members"
  | "file_upload";

export type SubQuestionType = "short_text" | "email" | "number" | "dropdown" | "dob" | "date";

export interface SubQuestionDefinition {
  id: string;
  label: string;
  type?: SubQuestionType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: string[];
  buttonLabel?: string;
  buttonUrl?: string;
  buttonOpenInNewTab?: boolean;
  qrCodeKey?: string;
  upiId?: string;
  paymentAmount?: number;
  payeeName?: string;
  transactionIdLabel?: string;
  /** Payment method toggles (UPI QR, Razorpay, Cash) */
  enableUpi?: boolean;
  enableRazorpay?: boolean;
  enableCash?: boolean;
  allowedPaymentMethods?: Array<"upi" | "razorpay" | "cash">;
  /** Optional merchant configuration for UPI */
  merchantEnabled?: boolean;
  merchantMcc?: string;
  merchantId?: string;
  merchantTerminalId?: string;
  transactionNote?: string;
  /** Optional image attached to this question */
  imageKey?: string;
  /** Linear scale settings */
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  /** Multiple input box / sub-questions */
  subQuestions?: SubQuestionDefinition[];
  /** Dynamic Repeater / Team Member settings */
  minEntries?: number;
  maxEntries?: number;
  entryLabel?: string;
  addButtonLabel?: string;
  /** File Upload settings */
  allowedFileTypes?: string[];
  maxFiles?: number;
  imageOnly?: boolean;
  multipleFiles?: boolean;
  /** Conditional branching (Google Forms style) */
  goToSectionBasedOnAnswer?: boolean;
  /** Mapping of option index/text to target: 'next' | 'submit' | `section_${sectionId}` */
  optionNavigation?: Record<string, string>;
}

export interface FormSectionDefinition {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormFieldDefinition[];
  /** Default action after completing this section: 'next' | 'submit' | `section_${sectionId}` */
  afterSectionAction?: string;
}

/** Pre-defined banner gradient templates */
export const BANNER_TEMPLATES = [
  { id: "none", label: "None", gradient: "", cssGradient: "transparent" },
  { id: "purple-blue", label: "Ocean", gradient: "from-violet-600 via-blue-500 to-cyan-400", cssGradient: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #22d3ee 100%)" },
  { id: "rose-orange", label: "Sunset", gradient: "from-rose-500 via-orange-400 to-amber-300", cssGradient: "linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #fcd34d 100%)" },
  { id: "green-teal", label: "Forest", gradient: "from-emerald-600 via-teal-500 to-cyan-400", cssGradient: "linear-gradient(135deg, #059669 0%, #14b8a6 50%, #22d3ee 100%)" },
  { id: "pink-purple", label: "Blossom", gradient: "from-pink-500 via-fuchsia-500 to-purple-600", cssGradient: "linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #9333ea 100%)" },
  { id: "blue-indigo", label: "Sky", gradient: "from-blue-600 via-indigo-500 to-violet-500", cssGradient: "linear-gradient(135deg, #2563eb 0%, #6366f1 50%, #8b5cf6 100%)" },
  { id: "orange-red", label: "Lava", gradient: "from-orange-500 via-red-500 to-rose-600", cssGradient: "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #e11d48 100%)" },
  { id: "teal-green", label: "Mint", gradient: "from-teal-400 via-emerald-400 to-green-500", cssGradient: "linear-gradient(135deg, #2dd4bf 0%, #34d399 50%, #22c55e 100%)" },
  { id: "yellow-orange", label: "Sunrise", gradient: "from-yellow-400 via-orange-400 to-rose-400", cssGradient: "linear-gradient(135deg, #facc15 0%, #fb923c 50%, #f43f5e 100%)" },
  { id: "gray-slate", label: "Storm", gradient: "from-slate-700 via-gray-600 to-zinc-500", cssGradient: "linear-gradient(135deg, #334155 0%, #4b5563 50%, #71717a 100%)" },
  { id: "navy-blue", label: "Midnight", gradient: "from-slate-900 via-blue-900 to-indigo-800", cssGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3730a3 100%)" },
  { id: "lime-cyan", label: "Neon", gradient: "from-lime-400 via-emerald-400 to-cyan-400", cssGradient: "linear-gradient(135deg, #a3e635 0%, #34d399 50%, #22d3ee 100%)" },
] as const;

export type BannerTemplateId = (typeof BANNER_TEMPLATES)[number]["id"];

export type FormStyleId = "minimal" | "terminal";

export interface FormStyleOption {
  id: FormStyleId;
  name: string;
  description: string;
  badge: string;
}

export const FORM_STYLES: FormStyleOption[] = [
  {
    id: "minimal",
    name: "Minimal & Professional",
    description: "Modern, clean corporate aesthetic with sleek typography and subtle cards.",
    badge: "Clean / Pro",
  },
  {
    id: "terminal",
    name: "Terminal CLI",
    description: "Cyber-industrial hacker shell with monospace typography, phosphor green glow, prompt markers, and CRT scanlines.",
    badge: "Hacker CLI",
  },
];

export interface FormDefinition {
  sections: FormSectionDefinition[];
  theme?: string;
  /** Visual layout & aesthetic style */
  formStyle?: FormStyleId;
  /** Uploaded custom banner image key */
  bannerKey?: string;
  /** Pre-defined gradient banner template id */
  bannerTemplate?: BannerTemplateId;
  settings: {
    submitButtonLabel: string;
    successMessage: string;
    allowMultipleSubmissions: boolean;
    collectName: boolean;
    collectEmail: boolean;
  };
}

export function createBlankFormDefinition(): FormDefinition {
  return {
    sections: [
      {
        id: `section-${Math.random().toString(36).slice(2, 10)}`,
        title: "Section 1",
        description: "",
        order: 0,
        fields: [],
      },
    ],
    theme: "default",
    formStyle: "minimal",
    bannerKey: "",
    bannerTemplate: "purple-blue",
    settings: {
      submitButtonLabel: "Submit",
      successMessage: "Your response has been submitted successfully.",
      allowMultipleSubmissions: false,
      collectName: true,
      collectEmail: true,
    },
  };
}

