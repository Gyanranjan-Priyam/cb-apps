/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
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
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  ExternalLink,
  Loader2,
  Calendar as CalendarIcon,
  CreditCard,
  Check,
  Copy,
  Ban,
  QrCode,
  Smartphone,
  Info,
  CheckCircle2,
  XCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  Users,
  Trash2,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { submitFormResponse } from "../actions";
import type { PublishedFormResponse } from "../actions";
import { FormFieldDefinition, BANNER_TEMPLATES } from "@/lib/form-types";
import {
  buildUpiUri,
  generateUpiQrDataUrl,
  parseUpiUri,
  validateUpiUri,
  getUpiAppLinks,
  UpiPaymentConfig,
} from "@/lib/upi";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import TextAlign from "@tiptap/extension-text-align";
import parse from "html-react-parser";
import { cn } from "@/lib/utils";
import { FormFileUploader, ProcessedFormFile } from "./form-file-uploader";

interface PublicFormProps {
  form: PublishedFormResponse;
}

function getImageUrl(key?: string | null) {
  if (!key) return "";
  return `https://codebreakers.t3.storage.dev/${key}`;
}

function formatDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateValue(dateStr?: string | null): Date | undefined {
  if (!dateStr || typeof dateStr !== "string") return undefined;
  const parts = dateStr.trim().split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d;
}

function FormDatePicker({
  value,
  onChange,
  placeholder = "Pick a date...",
  isDob = false,
  hasError = false,
  isTerminal = false,
  className,
}: {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isDob?: boolean;
  hasError?: boolean;
  isTerminal?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const parsedDate = useMemo(() => parseDateValue(value), [value]);
  const defaultYear = isDob ? 2004 : new Date().getFullYear();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return parsedDate || new Date(defaultYear, isDob ? 0 : new Date().getMonth(), 1);
  });

  useEffect(() => {
    if (parsedDate) {
      setCurrentMonth(parsedDate);
    }
  }, [parsedDate]);

  const currentYear = new Date().getFullYear();
  const startYear = 1920;
  const endYear = isDob ? currentYear : currentYear + 20;

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, [endYear, startYear]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-11 border-[1.5px] rounded-md text-sm px-3.5 flex items-center justify-between cursor-pointer outline-none text-left transition-colors",
            isTerminal
              ? "!bg-[#0a0a0a] !text-[#33ff00] font-mono " + (hasError ? "!border-[#D13438]" : "!border-[#1f521f] hover:!border-[#33ff00]")
              : "!bg-white !text-[#1C1B1F] " + (hasError ? "!border-[#D13438]" : "!border-[#D2D0CA] focus:!border-[#0078D4]"),
            className
          )}
        >
          <span style={{ color: parsedDate ? (isTerminal ? "#33ff00" : "#1C1B1F") : (isTerminal ? "#669966" : "#B4B2AC") }}>
            {parsedDate ? format(parsedDate, "PPP") : placeholder}
          </span>
          <CalendarIcon className={cn("h-4 w-4 shrink-0", isTerminal ? "text-[#33ff00]" : "text-[#666]")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className={cn(
          "w-auto p-3 rounded-xl shadow-xl z-50 space-y-2.5",
          isTerminal
            ? "!bg-[#0d120d] !text-[#33ff00] !border-[#1f521f] font-mono"
            : "!bg-white !text-[#1C1B1F] !border-[#D2D0CA]"
        )}
      >
        {/* Month & Year Quick Selector */}
        <div className={cn("flex items-center justify-between gap-2 pb-2 border-b", isTerminal ? "border-[#1f521f]" : "border-[#F3F2F1]")}>
          <select
            value={currentMonth.getMonth()}
            onChange={(e) => {
              const newM = Number(e.target.value);
              setCurrentMonth(new Date(currentMonth.getFullYear(), newM, 1));
            }}
            className={cn(
              "h-8 px-2 text-xs font-semibold rounded-md border cursor-pointer outline-none",
              isTerminal
                ? "!bg-[#0a0a0a] !text-[#33ff00] !border-[#1f521f]"
                : "!bg-white !text-[#1C1B1F] !border-[#D2D0CA] hover:!border-[#0078D4]"
            )}
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={currentMonth.getFullYear()}
            onChange={(e) => {
              const newY = Number(e.target.value);
              setCurrentMonth(new Date(newY, currentMonth.getMonth(), 1));
            }}
            className={cn(
              "h-8 px-2 text-xs font-semibold rounded-md border cursor-pointer outline-none",
              isTerminal
                ? "!bg-[#0a0a0a] !text-[#33ff00] !border-[#1f521f]"
                : "!bg-white !text-[#1C1B1F] !border-[#D2D0CA] hover:!border-[#0078D4]"
            )}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Clean Calendar without auto-opening dropdown glitches */}
        <Calendar
          mode="single"
          captionLayout="label"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          selected={parsedDate}
          onSelect={(day) => {
            if (day) {
              onChange(formatDateValue(day));
              setOpen(false);
            }
          }}
          className={cn("p-0", isTerminal ? "!bg-[#0d120d] !text-[#33ff00]" : "!bg-white !text-[#1C1B1F]")}
          classNames={{
            months: "flex flex-col gap-2",
            month_caption: "hidden",
            nav: "hidden",
            table: "w-full border-collapse",
            weekdays: cn("flex border-b pb-1", isTerminal ? "border-[#1f521f]" : "border-[#F3F2F1]"),
            weekday: cn("text-xs font-medium w-9 text-center", isTerminal ? "!text-[#669966]" : "!text-[#605E5C]"),
            day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            today: isTerminal ? "!bg-[#1f521f] !text-[#33ff00] font-bold" : "!bg-[#F3F2F1] !text-[#0078D4] font-bold rounded-lg",
            outside: "!text-[#A19F9D] opacity-30",
            disabled: "!text-[#C8C6C4] opacity-20",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ─── CSS ─── */
const FORM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .mf-page {
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    color: #1C1B1F;
    position: relative;
  }

  /* ─── Gradient Banner ─── */
  .mf-banner {
    width: 100%;
    height: 180px;
    position: relative;
    z-index: 0;
  }
  @media (max-width: 640px) {
    .mf-banner { height: 120px; }
  }

  /* ─── Main Card Container ─── */
  .mf-container {
    position: relative;
    z-index: 1;
    max-width: 920px;
    width: 100%;
    margin: -80px auto 0;
    padding: 0 24px 60px;
  }
  @media (max-width: 640px) {
    .mf-container { margin-top: -50px; padding: 0 12px 40px; }
  }

  .mf-card {
    background: #FFFFFF;
    border-radius: 12px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    padding: 44px 52px;
    margin-bottom: 0;
  }
  @media (max-width: 640px) {
    .mf-card { padding: 24px 18px; border-radius: 8px; }
  }

  /* ─── Form Header ─── */
  .mf-brand-header {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding: 4px 12px 4px 6px;
    background: #F8F9FA;
    border: 1px solid #E9ECEF;
    border-radius: 9999px;
  }
  .mf-brand-logo-wrap {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }
  .mf-brand-name {
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #1E293B;
    letter-spacing: -0.01em;
  }

  .mf-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(22px, 4vw, 32px);
    font-weight: 700;
    color: #1C1B1F;
    line-height: 1.3;
    letter-spacing: -0.01em;
    margin: 0 0 16px;
    text-transform: uppercase;
  }
  .mf-description {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #333;
    line-height: 1.6;
    margin: 0 0 16px;
  }
  .mf-description p {
    margin: 0 0 12px;
    line-height: 1.6;
  }
  .mf-description p:last-child {
    margin-bottom: 0;
  }
  .mf-description strong, .mf-description b {
    font-weight: 700;
    color: #111;
  }
  .mf-description em, .mf-description i {
    font-style: italic;
  }
  .mf-description ul {
    list-style-type: disc;
    padding-left: 22px;
    margin: 8px 0 12px;
  }
  .mf-description ol {
    list-style-type: decimal;
    padding-left: 22px;
    margin: 8px 0 12px;
  }
  .mf-description li {
    margin: 4px 0;
    line-height: 1.5;
  }
  .mf-disclaimer {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #666;
    line-height: 1.6;
    margin: 0 0 20px;
  }
  .mf-required-notice {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #333;
    margin: 0;
    padding-top: 16px;
    border-top: 1px solid #e8e8e8;
  }
  .mf-required-notice .mf-asterisk {
    color: #D13438;
    margin-right: 2px;
  }

  /* ─── Question Block ─── */
  .mf-question {
    padding: 32px 0;
  }
  .mf-question + .mf-question {
    border-top: none;
  }
  .mf-question-label {
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #1C1B1F;
    margin: 0 0 12px;
    line-height: 1.4;
  }
  .mf-question-label .mf-asterisk {
    color: #D13438;
    font-weight: 600;
    margin-left: 2px;
  }
  .mf-question-desc {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: #666;
    margin: -6px 0 12px;
    line-height: 1.5;
  }
  .mf-question-desc p {
    margin: 0 0 6px;
    line-height: 1.5;
  }
  .mf-question-desc p:last-child {
    margin-bottom: 0;
  }
  .mf-question-desc strong, .mf-question-desc b {
    font-weight: 700;
    color: #333;
  }
  .mf-question-desc em, .mf-question-desc i {
    font-style: italic;
  }
  .mf-question-desc ul {
    list-style-type: disc;
    padding-left: 20px;
    margin: 4px 0 8px;
  }
  .mf-question-desc ol {
    list-style-type: decimal;
    padding-left: 20px;
    margin: 4px 0 8px;
  }
  .mf-question-desc li {
    margin: 2px 0;
  }

  /* ─── Inputs ─── */
  .mf-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1.5px solid #D2D0CA;
    outline: none;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: #1C1B1F;
    padding: 10px 0;
    transition: border-color .2s ease;
  }
  .mf-input::placeholder { color: #B4B2AC; }
  .mf-input:focus { border-bottom-color: #0078D4; }
  .mf-input.mf-input-error { border-bottom-color: #D13438; }

  .mf-textarea {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1.5px solid #D2D0CA;
    outline: none;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: #1C1B1F;
    padding: 10px 0;
    transition: border-color .2s ease;
    resize: vertical;
    min-height: 60px;
  }
  .mf-textarea::placeholder { color: #B4B2AC; }
  .mf-textarea:focus { border-bottom-color: #0078D4; }

  /* ─── Option Cards (Radio/Checkbox) ─── */
  .mf-option-card {
    width: 100%;
    background: #FFFFFF;
    border: 1.5px solid #D2D0CA;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all .15s ease;
    user-select: none;
    outline: none;
  }
  .mf-option-card:hover {
    border-color: #0078D4;
    background: #F8FAFD;
  }
  .mf-option-card:focus-visible {
    border-color: #0078D4;
    box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.2);
  }
  .mf-option-card.selected {
    border-color: #0078D4;
    background: #EFF6FC;
    box-shadow: 0 1px 3px rgba(0, 120, 212, 0.08);
  }
  .mf-option-label {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #1C1B1F;
    flex: 1;
    line-height: 1.4;
    transition: color .15s ease;
  }
  .mf-option-card.selected .mf-option-label {
    font-weight: 500;
    color: #0F172A;
  }

  /* ─── Shadcn-Style Radio Indicator ─── */
  .mf-radio-indicator {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #D2D0CA;
    background-color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .15s ease;
  }
  .mf-option-card:hover .mf-radio-indicator {
    border-color: #0078D4;
  }
  .mf-option-card.selected .mf-radio-indicator {
    border-color: #0078D4;
    background-color: #FFFFFF;
  }
  .mf-radio-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background-color: #0078D4;
    transform: scale(0);
    transition: transform .15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .mf-option-card.selected .mf-radio-dot {
    transform: scale(1);
  }

  /* ─── Shadcn-Style Checkbox Indicator ─── */
  .mf-checkbox-indicator {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 2px solid #D2D0CA;
    background-color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .15s ease;
    color: #FFFFFF;
  }
  .mf-option-card:hover .mf-checkbox-indicator {
    border-color: #0078D4;
  }
  .mf-option-card.selected .mf-checkbox-indicator {
    border-color: #0078D4;
    background-color: #0078D4;
  }

  /* ─── Scale ─── */
  .mf-scale-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .mf-scale-btn {
    width: 48px; height: 48px;
    border-radius: 4px;
    border: 1.5px solid #D2D0CA;
    background: #FFFFFF;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #1C1B1F;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .15s ease;
  }
  .mf-scale-btn:hover { border-color: #0078D4; }
  .mf-scale-btn.active {
    background: #0078D4;
    border-color: #0078D4;
    color: #FFFFFF;
  }

  /* ─── Payment Card & Methods ─── */
  .mf-payment-card {
    background: #FAFAFA;
    border: 1.5px solid #D2D0CA;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 16px;
  }
  .mf-payment-amount {
    font-family: 'Sora', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #1C1B1F;
  }
  .mf-pay-tab-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    padding: 4px;
    background: #F1F5F9;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
  }
  .mf-pay-tab {
    flex: 1;
    min-width: 140px;
    padding: 8px 12px;
    border-radius: 6px;
    border: none;
    background: transparent;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #64748B;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all .15s ease;
  }
  .mf-pay-tab:hover {
    color: #0F172A;
    background: rgba(255,255,255,0.6);
  }
  .mf-pay-tab.active {
    background: #FFFFFF;
    color: #0078D4;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  /* ─── Submit Button ─── */
  .mf-submit-btn {
    background: #0078D4;
    color: #FFFFFF;
    border: none;
    border-radius: 4px;
    padding: 12px 32px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: background .15s ease;
    margin-top: 8px;
  }
  .mf-submit-btn:hover:not(:disabled) { background: #106EBE; }
  .mf-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .mf-back-btn {
    background: #FFFFFF;
    color: #0078D4;
    border: 1.5px solid #0078D4;
    border-radius: 4px;
    padding: 11px 28px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all .15s ease;
    margin-top: 8px;
  }
  .mf-back-btn:hover:not(:disabled) { background: #F0F7FD; }
  .mf-back-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ─── Footer ─── */
  .mf-footer {
    text-align: center;
    padding: 24px 0;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #888;
  }
  .mf-footer a { color: #888; text-decoration: none; }
  .mf-footer a:hover { color: #1C1B1F; text-decoration: underline; }

  /* ─── Success Screen ─── */
  .mf-success-card {
    background: #FFFFFF;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    padding: 60px 48px;
    text-align: center;
  }
  @media (max-width: 640px) {
    .mf-success-card { padding: 40px 20px; }
  }

  /* ─── Animations ─── */
  @keyframes mfFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .mf-fade-in {
    animation: mfFadeIn .4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  @media (prefers-reduced-motion: reduce) {
    .mf-fade-in { animation: none !important; opacity: 1 !important; transform: none !important; }
  }

  /* ─── Validation Error ─── */
  .mf-error-msg {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #D13438;
    margin-top: 4px;
  }

  /* ─── Team Members / Repeatable Box ─── */
  .mf-team-card {
    background: #FFFFFF;
    border: 1.5px solid #E2E8F0;
    border-radius: 8px;
    padding: 20px 22px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
    position: relative;
    transition: all 0.2s ease;
  }
  .mf-team-card:hover {
    border-color: #CBD5E1;
  }
  .mf-team-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #F1F5F9;
  }
  .mf-team-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #EFF6FF;
    color: #0078D4;
    border: 1px solid #BFDBFE;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .mf-team-badge.secondary {
    background: #F8FAFC;
    color: #475569;
    border-color: #E2E8F0;
  }
  .mf-team-delete-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid #FCA5A5;
    color: #DC2626;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .mf-team-delete-btn:hover {
    background: #FEF2F2;
    border-color: #EF4444;
  }
  .mf-team-add-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #F0F7FD;
    border: 1.5px dashed #0078D4;
    color: #0078D4;
    border-radius: 6px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .mf-team-add-btn:hover {
    background: #E0EFFD;
  }
  .mf-team-limit-reached {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #F1F5F9;
    border: 1px solid #CBD5E1;
    color: #64748B;
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 600;
  }

  /* ─── Light Mode Calendar & Dropdown Overrides ─── */
  .mf-light-popover,
  [data-slot="popover-content"].mf-light-popover,
  .mf-light-select,
  [data-slot="select-content"].mf-light-select {
    background-color: #FFFFFF !important;
    background: #FFFFFF !important;
    color: #1C1B1F !important;
    border: 1px solid #D2D0CA !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
  }

  .mf-light-select [data-slot="select-item"] {
    color: #1C1B1F !important;
  }
  .mf-light-select [data-slot="select-item"]:hover,
  .mf-light-select [data-slot="select-item"]:focus,
  .mf-light-select [data-slot="select-item"][data-highlighted] {
    background-color: #F3F2F1 !important;
    color: #1C1B1F !important;
  }

  .mf-light-calendar,
  .mf-light-calendar * {
    color: #1C1B1F !important;
  }
  .mf-light-calendar [data-slot="calendar"] {
    background-color: #FFFFFF !important;
    background: #FFFFFF !important;
  }
  .mf-light-calendar .rdp-month_caption {
    color: #1C1B1F !important;
    font-weight: 600 !important;
  }
  .mf-light-calendar .rdp-weekday {
    color: #605E5C !important;
  }
  .mf-light-calendar [data-slot="button"] {
    color: #1C1B1F !important;
  }
  .mf-light-calendar [data-slot="button"]:hover {
    background-color: #F3F2F1 !important;
  }
  .mf-light-calendar [data-selected-single="true"] {
    background-color: #0078D4 !important;
    color: #FFFFFF !important;
    font-weight: 600 !important;
  }
  .mf-light-calendar [data-slot="button"][data-selected-single="true"] {
    background-color: #0078D4 !important;
    color: #FFFFFF !important;
  }
  .mf-light-calendar .rdp-dropdowns,
  .mf-light-calendar [class*="dropdowns"] {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
  }
  .mf-light-calendar .rdp-dropdown_root,
  .mf-light-calendar [class*="dropdown_root"] {
    position: relative !important;
    display: inline-flex !important;
    align-items: center !important;
    border: 1px solid #D2D0CA !important;
    border-radius: 6px !important;
    background-color: #FFFFFF !important;
    padding: 2px 6px !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
  }
  .mf-light-calendar .rdp-dropdown_root:hover,
  .mf-light-calendar [class*="dropdown_root"]:hover {
    background-color: #F3F2F1 !important;
    border-color: #0078D4 !important;
  }
  .mf-light-calendar select,
  .mf-light-calendar .rdp-dropdown,
  .mf-light-calendar [class*="dropdown"] {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    opacity: 0 !important;
    cursor: pointer !important;
    background-color: #FFFFFF !important;
    color: #1C1B1F !important;
    font-size: 13px !important;
    z-index: 10 !important;
  }
  .mf-light-calendar select option {
    background-color: #FFFFFF !important;
    color: #1C1B1F !important;
    padding: 4px 8px !important;
  }
  .mf-light-calendar .rdp-caption_label,
  .mf-light-calendar [class*="caption_label"] {
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #1C1B1F !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 2px !important;
  }
  .mf-light-calendar .rdp-nav,
  .mf-light-calendar [class*="nav"] {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    position: absolute !important;
    top: 0px !important;
    left: 0px !important;
    right: 0px !important;
    padding: 0 4px !important;
    height: 32px !important;
    pointer-events: none !important;
    z-index: 10 !important;
  }
  .mf-light-calendar .rdp-button_previous,
  .mf-light-calendar .rdp-button_next,
  .mf-light-calendar [class*="button_previous"],
  .mf-light-calendar [class*="button_next"] {
    pointer-events: auto !important;
    background-color: #FFFFFF !important;
    border: 1px solid #D2D0CA !important;
    border-radius: 6px !important;
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #1C1B1F !important;
    cursor: pointer !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.15s ease !important;
    z-index: 20 !important;
  }
  .mf-light-calendar .rdp-button_previous:hover,
  .mf-light-calendar .rdp-button_next:hover,
  .mf-light-calendar [class*="button_previous"]:hover,
  .mf-light-calendar [class*="button_next"]:hover {
    background-color: #F3F2F1 !important;
    border-color: #0078D4 !important;
  }

  /* ─── Closed State ─── */
  .mf-closed-card {
    background: #FFFFFF;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    padding: 60px 48px;
    text-align: center;
  }
  @media (max-width: 640px) {
    .mf-closed-card { padding: 40px 20px; }
  }

  /* ─── Rich Text Content ─── */
  .mf-rich-text {
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
    color: #444;
  }
  .mf-rich-text p { margin: 0 0 8px; }
  .mf-rich-text p:last-child { margin-bottom: 0; }
  .mf-rich-text strong { font-weight: 700; color: #1C1B1F; }
  .mf-rich-text em { font-style: italic; }
  .mf-rich-text ul, .mf-rich-text .my-bullet-list, .mf-rich-text .prose-bullet-list, .tiptap-content ul {
    list-style-type: disc !important;
    margin: 8px 0 !important;
    padding-left: 24px !important;
  }
  .mf-rich-text ol, .mf-rich-text .my-ordered-list, .mf-rich-text .prose-ordered-list, .tiptap-content ol {
    list-style-type: decimal !important;
    margin: 8px 0 !important;
    padding-left: 24px !important;
  }
  .mf-rich-text li, .mf-rich-text .my-list-item, .tiptap-content li {
    display: list-item !important;
    margin: 4px 0 !important;
  }
  .mf-rich-text li p, .tiptap-content li p {
    margin: 0 !important;
    display: inline !important;
  }
`;

/* ─── TERMINAL CLI CSS THEME ─── */
const TERMINAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=VT323&display=swap');

  /* Scanlines Overlay */
  .terminal-scanlines::before {
    content: " ";
    display: block;
    position: fixed;
    top: 0; left: 0; bottom: 0; right: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.32) 50%), linear-gradient(90deg, rgba(51, 255, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
    z-index: 9999;
    background-size: 100% 3px, 6px 100%;
    pointer-events: none;
    opacity: 0.85;
  }

  /* Blinking Block Cursor */
  @keyframes terminalBlink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .terminal-cursor {
    display: inline-block;
    width: 9px;
    height: 15px;
    background-color: #33ff00;
    vertical-align: middle;
    margin-left: 4px;
    animation: terminalBlink 1s infinite;
  }

  /* Page Wrapper */
  .mf-page.terminal-theme {
    background: #0a0a0a !important;
    background-color: #0a0a0a !important;
    color: #33ff00 !important;
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace !important;
    min-height: 100vh;
    position: relative;
    letter-spacing: -0.01em;
  }

  .mf-page.terminal-theme * {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace !important;
    border-radius: 0px !important;
  }

  /* Main Container & Card */
  .mf-page.terminal-theme .mf-container {
    max-width: 940px;
    width: 100%;
    margin: 24px auto 60px;
    padding: 0 20px;
  }
  @media (max-width: 640px) {
    .mf-page.terminal-theme .mf-container {
      padding: 0 12px;
    }
  }

  .mf-page.terminal-theme .mf-card,
  .mf-page.terminal-theme .mf-success-card,
  .mf-page.terminal-theme .mf-closed-card {
    background: #0d120d !important;
    border: 1.5px solid #1f521f !important;
    box-shadow: 0 0 24px rgba(31, 82, 31, 0.35), inset 0 0 24px rgba(10, 20, 10, 0.6) !important;
    padding: 32px 36px !important;
    color: #33ff00 !important;
  }
  @media (max-width: 640px) {
    .mf-page.terminal-theme .mf-card,
    .mf-page.terminal-theme .mf-success-card,
    .mf-page.terminal-theme .mf-closed-card {
      padding: 20px 16px !important;
    }
  }

  /* Terminal Window Header */
  .mf-page.terminal-theme .terminal-window-header {
    background: #122412;
    border-bottom: 1.5px solid #1f521f;
    padding: 8px 16px;
    margin: -32px -36px 24px -36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 700;
    color: #33ff00;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  @media (max-width: 640px) {
    .mf-page.terminal-theme .terminal-window-header {
      margin: -20px -16px 16px -16px;
      padding: 6px 12px;
      font-size: 10px;
    }
  }

  /* Brand Header in Terminal */
  .mf-page.terminal-theme .mf-brand-header {
    background: #081008 !important;
    border: 1px solid #1f521f !important;
    padding: 4px 12px !important;
  }
  .mf-page.terminal-theme .mf-brand-name {
    color: #33ff00 !important;
    font-size: 12px !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase;
  }

  /* Title & Glow */
  .mf-page.terminal-theme .mf-title {
    color: #33ff00 !important;
    font-size: clamp(20px, 3.5vw, 28px) !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.04em !important;
    text-shadow: 0 0 8px rgba(51, 255, 0, 0.45);
    border-bottom: 1px dashed #1f521f;
    padding-bottom: 16px;
    margin-bottom: 20px !important;
  }

  .mf-page.terminal-theme .mf-description,
  .mf-page.terminal-theme .mf-rich-text {
    color: #9fe899 !important;
    font-size: 13px !important;
    line-height: 1.7 !important;
  }
  .mf-page.terminal-theme .mf-description strong,
  .mf-page.terminal-theme .mf-description b,
  .mf-page.terminal-theme .mf-rich-text strong {
    color: #ffb000 !important;
    text-shadow: 0 0 5px rgba(255, 176, 0, 0.35);
  }

  .mf-page.terminal-theme .mf-disclaimer {
    background: #081008 !important;
    border: 1px solid #1f521f !important;
    border-left: 3px solid #ffb000 !important;
    padding: 10px 14px !important;
    color: #7ab377 !important;
    font-size: 12px !important;
  }

  .mf-page.terminal-theme .mf-required-notice {
    color: #ffb000 !important;
    font-size: 11px !important;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-top: 1px dashed #1f521f !important;
    padding-top: 12px !important;
  }
  .mf-page.terminal-theme .mf-asterisk {
    color: #ff3333 !important;
  }

  /* Questions */
  .mf-page.terminal-theme .mf-question {
    padding: 24px 0 !important;
    border-bottom: 1px solid #142914 !important;
  }
  .mf-page.terminal-theme .mf-question:last-child {
    border-bottom: none !important;
  }

  .mf-page.terminal-theme .mf-question-label {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #33ff00 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.02em !important;
    text-shadow: 0 0 4px rgba(51, 255, 0, 0.35);
  }

  .mf-page.terminal-theme .mf-question-desc {
    color: #6bb367 !important;
    font-size: 12px !important;
  }

  /* Inputs & Textareas */
  .mf-page.terminal-theme .mf-input,
  .mf-page.terminal-theme .mf-textarea {
    background: #060a06 !important;
    border: 1px solid #1f521f !important;
    color: #33ff00 !important;
    font-size: 13px !important;
    padding: 10px 14px !important;
    outline: none !important;
    transition: all .15s ease !important;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8) !important;
  }
  .mf-page.terminal-theme .mf-input::placeholder,
  .mf-page.terminal-theme .mf-textarea::placeholder {
    color: #173d17 !important;
  }
  .mf-page.terminal-theme .mf-input:focus,
  .mf-page.terminal-theme .mf-textarea:focus {
    border-color: #33ff00 !important;
    box-shadow: 0 0 10px rgba(51, 255, 0, 0.3), inset 0 0 8px rgba(0,0,0,0.8) !important;
    background: #091309 !important;
  }
  .mf-page.terminal-theme .mf-input.mf-input-error {
    border-color: #ff3333 !important;
    box-shadow: 0 0 8px rgba(255, 51, 51, 0.3) !important;
  }

  /* Option Cards (Radio & Checkbox) */
  .mf-page.terminal-theme .mf-option-card {
    background: #060a06 !important;
    border: 1px solid #1f521f !important;
    color: #33ff00 !important;
    padding: 11px 14px !important;
    margin-bottom: 8px !important;
    transition: all .15s ease !important;
  }
  .mf-page.terminal-theme .mf-option-card:hover {
    border-color: #33ff00 !important;
    background: #0e1c0e !important;
  }
  .mf-page.terminal-theme .mf-option-card.selected {
    border-color: #33ff00 !important;
    background: #142814 !important;
    box-shadow: 0 0 10px rgba(51, 255, 0, 0.25) !important;
  }
  .mf-page.terminal-theme .mf-option-label {
    font-size: 13px !important;
    color: #8ce686 !important;
  }
  .mf-page.terminal-theme .mf-option-card.selected .mf-option-label {
    color: #33ff00 !important;
    font-weight: 700 !important;
    text-shadow: 0 0 4px rgba(51, 255, 0, 0.4);
  }

  .mf-page.terminal-theme .mf-radio-indicator,
  .mf-page.terminal-theme .mf-checkbox-indicator {
    background: #040804 !important;
    border: 1.5px solid #1f521f !important;
    color: #33ff00 !important;
  }
  .mf-page.terminal-theme .mf-option-card.selected .mf-radio-indicator,
  .mf-page.terminal-theme .mf-option-card.selected .mf-checkbox-indicator {
    border-color: #33ff00 !important;
    background: #33ff00 !important;
    color: #000000 !important;
  }
  .mf-page.terminal-theme .mf-radio-dot {
    background: #000000 !important;
  }

  /* Linear Scale */
  .mf-page.terminal-theme .mf-scale-btn {
    background: #060a06 !important;
    border: 1px solid #1f521f !important;
    color: #33ff00 !important;
  }
  .mf-page.terminal-theme .mf-scale-btn:hover {
    border-color: #33ff00 !important;
    background: #0e1c0e !important;
  }
  .mf-page.terminal-theme .mf-scale-btn.active {
    background: #33ff00 !important;
    color: #000000 !important;
    border-color: #33ff00 !important;
    font-weight: 800 !important;
    box-shadow: 0 0 10px rgba(51, 255, 0, 0.4);
  }

  /* Navigation Buttons */
  .mf-page.terminal-theme .mf-submit-btn {
    background: #0a0a0a !important;
    border: 1.5px solid #33ff00 !important;
    color: #33ff00 !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
    padding: 12px 28px !important;
    cursor: pointer !important;
    transition: all .15s ease !important;
  }
  .mf-page.terminal-theme .mf-submit-btn:hover:not(:disabled) {
    background: #33ff00 !important;
    color: #000000 !important;
    box-shadow: 0 0 16px rgba(51, 255, 0, 0.5) !important;
    text-shadow: none !important;
  }
  .mf-page.terminal-theme .mf-submit-btn:disabled {
    opacity: 0.45 !important;
    border-color: #1f521f !important;
    color: #1f521f !important;
  }

  .mf-page.terminal-theme .mf-back-btn {
    background: #0a0a0a !important;
    border: 1.5px solid #1f521f !important;
    color: #7ab377 !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    padding: 11px 24px !important;
  }
  .mf-page.terminal-theme .mf-back-btn:hover:not(:disabled) {
    border-color: #33ff00 !important;
    color: #33ff00 !important;
    background: #0e1a0e !important;
  }

  /* Payment Card in Terminal */
  .mf-page.terminal-theme .mf-payment-card {
    background: #060a06 !important;
    border: 1.5px dashed #1f521f !important;
    color: #33ff00 !important;
  }
  .mf-page.terminal-theme .mf-payment-amount {
    color: #33ff00 !important;
    text-shadow: 0 0 6px rgba(51, 255, 0, 0.4);
  }
  .mf-page.terminal-theme .mf-pay-tab-group {
    background: #040804 !important;
    border: 1px solid #1f521f !important;
  }
  .mf-page.terminal-theme .mf-pay-tab {
    color: #7ab377 !important;
  }
  .mf-page.terminal-theme .mf-pay-tab:hover {
    color: #33ff00 !important;
    background: #0e1c0e !important;
  }
  .mf-page.terminal-theme .mf-pay-tab.active {
    background: #142814 !important;
    color: #33ff00 !important;
    border: 1px solid #33ff00 !important;
    box-shadow: 0 0 8px rgba(51, 255, 0, 0.3) !important;
  }

  /* Validation Error */
  .mf-page.terminal-theme .mf-error-msg {
    color: #ff3333 !important;
    font-size: 11px !important;
    letter-spacing: 0.03em;
  }

  /* Footer */
  .mf-page.terminal-theme .mf-footer {
    color: #1a401a !important;
    font-size: 11px !important;
  }
  .mf-page.terminal-theme .mf-footer a {
    color: #33ff00 !important;
  }

  /* Terminal Popover / Dropdown / Calendar */
  .mf-page.terminal-theme .mf-light-popover,
  .mf-page.terminal-theme [data-slot="popover-content"].mf-light-popover,
  .mf-page.terminal-theme .mf-light-select,
  .mf-page.terminal-theme [data-slot="select-content"].mf-light-select {
    background: #0a0e0a !important;
    background-color: #0a0e0a !important;
    color: #33ff00 !important;
    border: 1.5px solid #1f521f !important;
    box-shadow: 0 0 16px rgba(31, 82, 31, 0.4) !important;
  }

  .mf-page.terminal-theme .mf-light-select [data-slot="select-item"] {
    color: #8ce686 !important;
  }
  .mf-page.terminal-theme .mf-light-select [data-slot="select-item"]:hover,
  .mf-page.terminal-theme .mf-light-select [data-slot="select-item"]:focus,
  .mf-page.terminal-theme .mf-light-select [data-slot="select-item"][data-highlighted] {
    background-color: #142814 !important;
    color: #33ff00 !important;
  }

  /* Team Members in Terminal Theme */
  .mf-page.terminal-theme .mf-team-card {
    background: #0d160d !important;
    border: 1.5px solid #1f521f !important;
    box-shadow: 0 0 14px rgba(31, 82, 31, 0.25) !important;
    padding: 18px !important;
    margin-bottom: 16px !important;
  }
  .mf-page.terminal-theme .mf-team-header {
    border-bottom: 1px dashed #1f521f !important;
    padding-bottom: 10px !important;
  }
  .mf-page.terminal-theme .mf-team-badge {
    background: #142814 !important;
    color: #33ff00 !important;
    border: 1px solid #1f521f !important;
  }
  .mf-page.terminal-theme .mf-team-badge.secondary {
    background: #0a140a !important;
    color: #8ce686 !important;
    border-color: #1a3a1a !important;
  }
  .mf-page.terminal-theme .mf-team-delete-btn {
    background: #1a0808 !important;
    border: 1px solid #770000 !important;
    color: #ff3333 !important;
  }
  .mf-page.terminal-theme .mf-team-delete-btn:hover {
    background: #2a0c0c !important;
    border-color: #ff3333 !important;
  }
  .mf-page.terminal-theme .mf-team-add-btn {
    background: #0d1b0d !important;
    border: 1.5px dashed #33ff00 !important;
    color: #33ff00 !important;
  }
  .mf-page.terminal-theme .mf-team-add-btn:hover {
    background: #152d15 !important;
  }
  .mf-page.terminal-theme .mf-team-limit-reached {
    background: #121812 !important;
    border: 1px solid #224422 !important;
    color: #669966 !important;
  }
`;

/* ─── Helpers ─── */
function getBannerGradient(form: PublishedFormResponse): string {
  const templateId = form.definition.bannerTemplate;
  if (!templateId || templateId === "none") {
    return "linear-gradient(135deg, #2dd4bf 0%, #a7f3d0 50%, #bfdbfe 100%)";
  }
  const tpl = BANNER_TEMPLATES.find((t) => t.id === templateId);
  return tpl
    ? tpl.cssGradient
    : "linear-gradient(135deg, #2dd4bf 0%, #a7f3d0 50%, #bfdbfe 100%)";
}

const tiptapExtensions = [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    listItem: false,
  }),
  ListItem.configure({
    HTMLAttributes: {
      class: "my-list-item",
    },
  }),
  BulletList.configure({
    HTMLAttributes: {
      class: "my-bullet-list",
    },
    itemTypeName: "listItem",
  }),
  OrderedList.configure({
    HTMLAttributes: {
      class: "my-ordered-list",
    },
    itemTypeName: "listItem",
  }),
  TextAlign.configure({
    types: ["heading", "paragraph", "listItem"],
  }),
];




function autoFormatDescriptionText(text: string): string {
  if (!text) return "";

  if (text.includes("📌") || /important:/i.test(text)) {
    const parts = text.split(/(📌\s*Important:?|Important:)/i);
    if (parts.length >= 3) {
      const intro = parts[0].trim();
      const header = parts[1].trim();
      const rest = parts.slice(2).join("").trim();

      const rawSentences = rest
        .split(/(?<=\.)\s+|\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const bulletItems: string[] = [];
      let outro = "";

      for (const sentence of rawSentences) {
        if (/please complete the form/i.test(sentence)) {
          outro = sentence;
        } else {
          const cleanSentence = sentence.replace(/^[•*\-\s]+/, "").trim();
          if (cleanSentence) bulletItems.push(cleanSentence);
        }
      }

      let html = "";
      if (intro) html += `<p>${intro}</p>`;
      if (header)
        html += `<p style="margin-top: 12px; margin-bottom: 6px;"><strong>${header}</strong></p>`;
      if (bulletItems.length > 0) {
        html += `<ul class="my-bullet-list">`;
        for (const item of bulletItems) {
          html += `<li class="my-list-item"><p>${item}</p></li>`;
        }
        html += `</ul>`;
      }
      if (outro)
        html += `<p style="margin-top: 12px;"><strong>${outro}</strong></p>`;

      return html;
    }
  }

  return plainTextToHtml(text);
}

function plainTextToHtml(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  let html = "";
  let inBulletList = false;
  let inOrderedList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inBulletList) {
        html += "</ul>";
        inBulletList = false;
      }
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      continue;
    }

    const bulletMatch = line.match(/^(?:[•*\-]|&bull;)\s+(.*)/);
    const orderedMatch = line.match(/^\d+[\.\)]\s+(.*)/);

    if (bulletMatch) {
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (!inBulletList) {
        html += '<ul class="my-bullet-list">';
        inBulletList = true;
      }
      html += `<li class="my-list-item"><p>${bulletMatch[1]}</p></li>`;
    } else if (orderedMatch) {
      if (inBulletList) {
        html += "</ul>";
        inBulletList = false;
      }
      if (!inOrderedList) {
        html += '<ol class="my-ordered-list">';
        inOrderedList = true;
      }
      html += `<li class="my-list-item"><p>${orderedMatch[1]}</p></li>`;
    } else {
      if (inBulletList) {
        html += "</ul>";
        inBulletList = false;
      }
      if (!inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      html += `<p>${line}</p>`;
    }
  }

  if (inBulletList) html += "</ul>";
  if (inOrderedList) html += "</ol>";

  return html || `<p>${text}</p>`;
}

/** Render Tiptap JSON or plain text as React elements */
function renderRichText(value: string | null | undefined, className?: string) {
  if (!value) return null;
  try {
    const json = JSON.parse(value);
    if (json && typeof json === "object" && (json.type || json.content)) {
      const html = generateHTML(json, tiptapExtensions);
      return (
        <div className={`mf-rich-text ${className || ""}`}>
          {parse(html)}
        </div>
      );
    }
  } catch {
    // Not JSON — convert plain text to HTML with paragraph and list tags
  }
  const fallbackHtml = autoFormatDescriptionText(value);
  return (
    <div className={`mf-rich-text ${className || ""}`}>
      {parse(fallbackHtml)}
    </div>
  );
}

export default function PublicForm({ form }: PublicFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    previousResponseId: string;
    referenceNumber: string;
    message: string;
    submittedAt?: string;
  } | null>(null);
  const [submittedDetails, setSubmittedDetails] = useState<{
    name?: string;
    email?: string;
    responseId?: string;
    referenceNumber?: string;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [answers, setAnswers] = useState<
    Record<string, string | string[] | Record<string, string> | Array<Record<string, string>> | ProcessedFormFile[]>
  >({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [sectionHistory, setSectionHistory] = useState<number[]>([]);

  // ─── Submission Status Check ───
  useEffect(() => {
    // Reset transient states to prevent cross-form state leaks
    setDuplicateInfo(null);
    setSuccess(false);
    setSubmittedDetails(null);
    setSubmitAttempted(false);
    setName("");
    setEmail("");
    setTransactionId("");
    setAnswers({});
    setTouched({});
    setCurrentSectionIdx(0);
    setSectionHistory([]);

    try {
      const formKey = form.formId || form.id;
      // Clean up any legacy drafts
      localStorage.removeItem(`public_form_draft_${formKey}`);

      const submittedKey = `public_form_submitted_${formKey}`;
      const isAlreadySubmitted = localStorage.getItem(submittedKey);

      // If already submitted and multiple submissions not allowed, stay on success screen
      if (isAlreadySubmitted && !form.definition.settings.allowMultipleSubmissions) {
        const savedName =
          localStorage.getItem(`public_form_submitted_name_${formKey}`) || "";
        const savedEmail =
          localStorage.getItem(`public_form_submitted_email_${formKey}`) || "";
        const savedRespId =
          localStorage.getItem(`public_form_submitted_response_id_${formKey}`) || "";
        setSubmittedDetails({
          name: savedName,
          email: savedEmail,
          responseId: savedRespId,
          referenceNumber: savedRespId
            ? `#${savedRespId.replace(/-/g, "").slice(0, 8).toUpperCase()}`
            : "",
        });
        setSuccess(true);
        setIsMounted(true);
        return;
      }
    } catch {
      // ignore storage error
    } finally {
      setIsMounted(true);
    }
  }, [form.formId, form.id, form.definition.settings.allowMultipleSubmissions]);

  const allFields = useMemo(
    () => form.definition.sections.flatMap((s) => s.fields),
    [form],
  );
  const paymentField = useMemo(
    () => allFields.find((f) => f.type === "payment") || null,
    [allFields],
  );

  const availablePaymentMethods = useMemo<Array<"upi" | "razorpay" | "cash">>(() => {
    if (!paymentField) return [];
    const methods: Array<"upi" | "razorpay" | "cash"> = [];
    if (paymentField.enableUpi !== false) methods.push("upi");
    if (paymentField.enableRazorpay) methods.push("razorpay");
    if (paymentField.enableCash) methods.push("cash");
    if (methods.length === 0) methods.push("upi");
    return methods;
  }, [paymentField]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"upi" | "razorpay" | "cash">("upi");
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isRazorpayVerified, setIsRazorpayVerified] = useState(false);
  const [razorpayDetails, setRazorpayDetails] = useState<{ paymentId: string; orderId: string } | null>(null);

  // Sync default payment method
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.includes(selectedPaymentMethod)) {
      const defaultM = availablePaymentMethods[0];
      setSelectedPaymentMethod(defaultM);
      if (defaultM === "cash") {
        setTransactionId("CASH");
      }
    }
  }, [availablePaymentMethods, selectedPaymentMethod]);

  const handleSelectPaymentMethod = (method: "upi" | "razorpay" | "cash") => {
    setSelectedPaymentMethod(method);
    if (method === "cash") {
      setTransactionId("CASH");
    } else if (method === "upi") {
      if (transactionId === "CASH" || transactionId.startsWith("pay_")) {
        setTransactionId("");
      }
    } else if (method === "razorpay") {
      if (isRazorpayVerified && razorpayDetails?.paymentId) {
        setTransactionId(razorpayDetails.paymentId);
      } else if (transactionId === "CASH") {
        setTransactionId("");
      }
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const razorpayTaxBreakdown = useMemo(() => {
    const base = paymentField?.paymentAmount || 0;
    if (!base || base <= 0) return { baseAmount: 0, feeAndGst: 0, totalAmount: 0, totalAmountInPaise: 0 };
    // 2% gateway fee + 18% GST on that 2% fee (0.36%) = 2.36% total deduction rate
    // Reverse calculation so Admin receives exact baseAmount after Razorpay deduction:
    // Total = Base / (1 - 0.0236) = Base / 0.9764
    const deductionRate = 0.0236;
    const totalAmount = Number((base / (1 - deductionRate)).toFixed(2));
    const feeAndGst = Number((totalAmount - base).toFixed(2));
    const totalAmountInPaise = Math.round(totalAmount * 100);
    return { baseAmount: base, feeAndGst, totalAmount, totalAmountInPaise };
  }, [paymentField?.paymentAmount]);

  const handlePayWithRazorpay = async () => {
    const { totalAmount, totalAmountInPaise, baseAmount } = razorpayTaxBreakdown;
    if (!baseAmount || baseAmount <= 0) {
      toast.error("Invalid payment amount configured.");
      return;
    }

    try {
      setIsRazorpayProcessing(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay checkout SDK. Please check your internet connection.");
        setIsRazorpayProcessing(false);
        return;
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmountInPaise,
          currency: "INR",
          notes: {
            formId: form.formId,
            formTitle: form.title,
            baseAmount: String(baseAmount),
            totalCharged: String(totalAmount),
            userName: name || undefined,
            userEmail: email || undefined,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        toast.error(orderData.error || "Failed to create Razorpay payment order.");
        setIsRazorpayProcessing(false);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Codebreakers",
        description: `${form.title || "Form"} Payment`,
        image: "/assets/logo.png",
        order_id: orderData.order_id,
        prefill: {
          name: name.trim() || undefined,
          email: email.trim() || undefined,
        },
        theme: {
          color: "#0078D4",
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setIsRazorpayProcessing(true);
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setTransactionId(response.razorpay_payment_id);
              setIsRazorpayVerified(true);
              setRazorpayDetails({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
              toast.success("Payment verified successfully!");
            } else {
              toast.error(verifyData.error || "Payment signature verification failed.");
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            toast.error("Error verifying payment signature: " + (err.message || "Unknown error"));
          } finally {
            setIsRazorpayProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment window closed.");
            setIsRazorpayProcessing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        console.error("Razorpay payment failed:", resp);
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
        setIsRazorpayProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Error initiating Razorpay checkout:", err);
      toast.error(err.message || "Failed to start Razorpay payment.");
      setIsRazorpayProcessing(false);
    }
  };

  const firstName = name.split(" ")[0] || "there";

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isQrLoading, setIsQrLoading] = useState<boolean>(false);
  const [showDevDiagnostics, setShowDevDiagnostics] = useState<boolean>(false);

  const upiConfig: UpiPaymentConfig | null = useMemo(() => {
    if (!paymentField?.upiId) return null;
    return {
      vpa: paymentField.upiId,
      payeeName: paymentField.payeeName || form.title || "Payment",
      amount: paymentField.paymentAmount,
      currency: "INR",
      transactionNote: paymentField.transactionNote || `${form.title} Payment`,
      merchant: paymentField.merchantEnabled
        ? {
            enabled: true,
            mcc: paymentField.merchantMcc,
            merchantId: paymentField.merchantId,
            terminalId: paymentField.merchantTerminalId,
          }
        : undefined,
    };
  }, [paymentField, form.title]);

  const upiLinks = useMemo(() => {
    if (!upiConfig) return null;
    return getUpiAppLinks(upiConfig);
  }, [upiConfig]);

  const upiDiagnostics = useMemo(() => {
    if (!upiConfig || !upiLinks) return null;
    const parsed = parseUpiUri(upiLinks.universalUri);
    const validation = validateUpiUri(upiLinks.universalUri, upiConfig);
    return {
      uri: upiLinks.universalUri,
      parsed,
      validation,
    };
  }, [upiConfig, upiLinks]);

  // Generate QR Code data URL client-side
  useEffect(() => {
    let isMounted = true;
    if (upiConfig) {
      setIsQrLoading(true);
      generateUpiQrDataUrl(upiConfig, { width: 300, margin: 1 })
        .then((dataUrl) => {
          if (isMounted) {
            setQrDataUrl(dataUrl);
            setIsQrLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to generate UPI QR code:", err);
          if (isMounted) {
            setIsQrLoading(false);
          }
        });
    } else {
      setQrDataUrl("");
    }
    return () => {
      isMounted = false;
    };
  }, [upiConfig]);

  /* ─── Answer Helpers ─── */
  const updateAnswer = (
    id: string,
    val:
      | string
      | string[]
      | Record<string, string>
      | Array<Record<string, string>>
      | ProcessedFormFile[],
  ) => {
    setAnswers((c) => ({ ...c, [id]: val }));
    setTouched((c) => ({ ...c, [id]: true }));
  };

  const toggleCheckbox = (id: string, opt: string) => {
    const cur = (answers[id] as string[] | undefined) || [];
    updateAnswer(
      id,
      cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt],
    );
  };

  const copyToClipboard = (text: string, label: string = "UPI ID") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } else {
      toast.info(`${label}: ${text}`);
    }
  };

  const openUpiApp = (schemeUrl: string, appName: string = "UPI") => {
    if (!paymentField?.upiId) return;
    copyToClipboard(paymentField.upiId, "UPI ID");
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      toast.success(`Opening ${appName}...`);
      window.location.href = schemeUrl;
    } else {
      toast.info(
        `UPI ID (${paymentField.upiId}) copied! Scan the QR code or use your UPI app to pay ₹${paymentField.paymentAmount ?? 0}.`,
        { duration: 5000 },
      );
      try {
        window.location.href = schemeUrl;
      } catch {
        // Suppress desktop scheme errors
      }
    }
  };

  const openUpi = () => {
    if (upiLinks) {
      openUpiApp(upiLinks.universalUri, "UPI app");
    }
  };

  /* ─── Validation ─── */
  const isFieldValid = (field: FormFieldDefinition): boolean => {
    if (field.type === "multi_input") {
      if (!field.required) return true;
      const valObj =
        (answers[field.id] as Record<string, string> | undefined) || {};
      const subQuestions = field.subQuestions || [];
      for (const sub of subQuestions) {
        if (sub.required && !valObj[sub.id]?.trim()) return false;
      }
      return true;
    }

    if (field.type === "team_members") {
      const minRequired = field.minEntries || 1;
      const rawVal = answers[field.id];
      const members = Array.isArray(rawVal)
        ? (rawVal as Array<Record<string, string>>)
        : (field.required ? [{}] : []);

      if (field.required && members.length < minRequired) return false;

      const subQuestions = field.subQuestions || [];
      for (const member of members) {
        for (const sub of subQuestions) {
          const val = (member[sub.id] || "").trim();
          if (sub.required && !val) return false;
          if (sub.type === "email" && val && !val.includes("@")) return false;
        }
      }
      return true;
    }

    if (!field.required) return true;
    if (field.type === "payment") return Boolean(transactionId.trim());
    if (field.type === "button") return true;
    if (field.type === "file_upload") {
      const files = answers[field.id];
      return Array.isArray(files) && files.length > 0;
    }
    const val = answers[field.id];
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(typeof val === "string" && val.trim());
  };

  const validateAll = (): boolean => {
    let valid = true;
    if (form.definition.settings.collectName && !name.trim()) valid = false;
    if (
      form.definition.settings.collectEmail &&
      (!email.trim() || !email.includes("@"))
    )
      valid = false;
    for (const field of allFields) {
      if (!isFieldValid(field)) valid = false;
    }
    return valid;
  };

  const validateSection = (secIdx: number): boolean => {
    let valid = true;
    if (secIdx === 0) {
      if (form.definition.settings.collectName && !name.trim()) valid = false;
      if (
        form.definition.settings.collectEmail &&
        (!email.trim() || !email.includes("@"))
      ) {
        valid = false;
      }
    }
    const currentFields = form.definition.sections[secIdx]?.fields || [];
    for (const field of currentFields) {
      if (!isFieldValid(field)) {
        valid = false;
        setTouched((prev) => ({ ...prev, [field.id]: true }));
      }
    }
    if (secIdx === 0) {
      if (form.definition.settings.collectName && !name.trim()) {
        setTouched((prev) => ({ ...prev, __name: true }));
      }
      if (form.definition.settings.collectEmail && (!email.trim() || !email.includes("@"))) {
        setTouched((prev) => ({ ...prev, __email: true }));
      }
    }
    return valid;
  };

  const isFieldError = (fieldId: string, required: boolean): boolean => {
    if (!required) return false;
    if (!submitAttempted && !touched[fieldId]) return false;
    const val = answers[fieldId];
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === "object" && val !== null) return false; // multi_input & team_members handled within render
    return !val || (typeof val === "string" && !val.trim());
  };

  /* ─── Conditional Branching & Section Navigation ─── */
  const handleNextSection = () => {
    setSubmitAttempted(true);
    if (!validateSection(currentSectionIdx)) {
      toast.error("Please fill in all required fields before proceeding.");
      return;
    }

    const currentSec = form.definition.sections[currentSectionIdx];
    if (!currentSec) return;

    let targetAction: string | undefined = undefined;

    // Check if any question in current section has branching logic active
    for (const field of currentSec.fields) {
      if (
        field.goToSectionBasedOnAnswer &&
        (field.type === "radio" || field.type === "dropdown")
      ) {
        const selectedVal = answers[field.id];
        if (typeof selectedVal === "string" && selectedVal) {
          const optIdx = (field.options || []).indexOf(selectedVal);
          if (optIdx !== -1) {
            const nav =
              field.optionNavigation?.[String(optIdx)] ||
              field.optionNavigation?.[selectedVal];
            if (nav && nav !== "next") {
              targetAction = nav;
              break;
            }
          }
        }
      }
    }

    // If no option-level override, check section's default afterSectionAction
    if (!targetAction) {
      targetAction = currentSec.afterSectionAction || "next";
    }

    // Process targetAction
    if (targetAction === "submit") {
      handleSubmit();
      return;
    }

    let targetIdx = -1;
    if (targetAction.startsWith("section_")) {
      const targetSecId = targetAction.replace("section_", "");
      targetIdx = form.definition.sections.findIndex((s) => s.id === targetSecId);
      // Safeguard: If target section is the current section, avoid loop by advancing to next section
      if (targetIdx === currentSectionIdx) {
        targetIdx = currentSectionIdx + 1;
      }
    } else {
      targetIdx = currentSectionIdx + 1;
    }

    if (targetIdx === -1 || targetIdx >= form.definition.sections.length) {
      handleSubmit();
    } else {
      setSectionHistory((prev) => [...prev, currentSectionIdx]);
      setCurrentSectionIdx(targetIdx);
      setSubmitAttempted(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevSection = () => {
    if (sectionHistory.length === 0) return;
    const prevIdx = sectionHistory[sectionHistory.length - 1];
    setSectionHistory((prev) => prev.slice(0, -1));
    setCurrentSectionIdx(prevIdx);
    setSubmitAttempted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ─── Active/Visited Sections Validation for Submission ─── */
  const validateForSubmission = (): boolean => {
    let valid = true;
    if (form.definition.settings.collectName && !name.trim()) valid = false;
    if (
      form.definition.settings.collectEmail &&
      (!email.trim() || !email.includes("@"))
    ) {
      valid = false;
    }

    // Validate fields in visited sections + current section
    const activeSectionIndices = new Set([...sectionHistory, currentSectionIdx]);
    for (const sIdx of activeSectionIndices) {
      const secFields = form.definition.sections[sIdx]?.fields || [];
      for (const field of secFields) {
        if (!isFieldValid(field)) {
          valid = false;
          setTouched((prev) => ({ ...prev, [field.id]: true }));
        }
      }
    }
    if (form.definition.settings.collectName && !name.trim()) {
      setTouched((prev) => ({ ...prev, __name: true }));
    }
    if (form.definition.settings.collectEmail && (!email.trim() || !email.includes("@"))) {
      setTouched((prev) => ({ ...prev, __email: true }));
    }
    return valid;
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!validateForSubmission()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (paymentField && !transactionId.trim()) {
      toast.error("Please enter your Transaction ID");
      return;
    }
    setIsSubmitting(true);
    const result = await submitFormResponse({
      formId: form.formId,
      answers: {
        ...answers,
        name: form.definition.settings.collectName ? name : undefined,
        email: form.definition.settings.collectEmail ? email : undefined,
      },
      transactionId,
    });

    if (result.status === "duplicate" || (result as any).isDuplicate) {
      setDuplicateInfo({
        previousResponseId: (result as any).previousResponseId || (result as any).data?.id || "",
        referenceNumber: (result as any).referenceNumber || (result as any).data?.referenceNumber || "",
        message: result.message || "A submission with this email has already been recorded.",
        submittedAt: (result as any).data?.submittedAt,
      });
      toast.warning(result.message);
    } else if (result.status === "success") {
      const submittedName = name.trim();
      const submittedEmail = email.trim();
      const respId = (result as any).data?.id || "";
      const refNum = respId ? `#${respId.replace(/-/g, "").slice(0, 8).toUpperCase()}` : "";

      setDuplicateInfo(null);
      setSubmittedDetails({
        name: submittedName,
        email: submittedEmail,
        responseId: respId,
        referenceNumber: refNum,
      });
      setSuccess(true);
      try {
        const formKey = form.formId || form.id;
        localStorage.removeItem(`public_form_draft_${formKey}`);
        localStorage.setItem(`public_form_submitted_${formKey}`, "true");
        if (respId)
          localStorage.setItem(`public_form_submitted_response_id_${formKey}`, respId);
        if (submittedName)
          localStorage.setItem(
            `public_form_submitted_name_${formKey}`,
            submittedName,
          );
        if (submittedEmail)
          localStorage.setItem(
            `public_form_submitted_email_${formKey}`,
            submittedEmail,
          );
      } catch {
        // ignore storage error
      }
      setName("");
      setEmail("");
      setTransactionId("");
      setAnswers({});
      setTouched({});
      setCurrentSectionIdx(0);
      setSectionHistory([]);
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const bannerGradient = getBannerGradient(form);
  const bannerImage = form.definition.bannerKey
    ? getImageUrl(form.definition.bannerKey)
    : null;
  const hasAnyRequired =
    allFields.some((f) => f.required) ||
    form.definition.settings.collectName ||
    form.definition.settings.collectEmail;

  /* ─── Dynamically determine if current button should be Submit or Next ─── */
  const isCurrentStepSubmit = useMemo(() => {
    // If it's the last section in the form, it's always submit
    if (currentSectionIdx >= form.definition.sections.length - 1) return true;

    const currentSec = form.definition.sections[currentSectionIdx];
    if (!currentSec) return true;

    // Check if any question in the current section with branching active is pointing to 'submit'
    for (const field of currentSec.fields) {
      if (
        field.goToSectionBasedOnAnswer &&
        (field.type === "radio" || field.type === "dropdown")
      ) {
        const selectedVal = answers[field.id];
        if (typeof selectedVal === "string" && selectedVal) {
          const optIdx = (field.options || []).indexOf(selectedVal);
          if (optIdx !== -1) {
            const nav =
              field.optionNavigation?.[String(optIdx)] ||
              field.optionNavigation?.[selectedVal];
            if (nav === "submit") return true;
            if (nav && nav !== "next" && nav.startsWith("section_")) return false;
          }
        }
      }
    }

    // Otherwise check section's default afterSectionAction
    if (currentSec.afterSectionAction === "submit") {
      return true;
    }

    return false;
  }, [currentSectionIdx, form.definition.sections, answers]);

  const isTerminal = (form.definition?.formStyle || "minimal") === "terminal";

  /* ─── Build numbered questions ─── */
  let questionNum = 0;

  /* ═══ RENDER: LOADING / MOUNTING (Eliminates Flash on Refresh) ═══ */
  if (!isMounted) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: isTerminal ? `${FORM_CSS}\n${TERMINAL_CSS}` : FORM_CSS }} />
        <div className={`mf-page${isTerminal ? " terminal-theme terminal-scanlines" : ""}`} style={{ background: isTerminal ? "#0a0a0a" : "#F3F2F1" }}>
          {!isTerminal && (
            <div
              className="mf-banner"
              style={{
                background: bannerImage ? undefined : bannerGradient,
              }}
            >
              {bannerImage && (
                <Image
                  src={bannerImage}
                  alt=""
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              )}
            </div>
          )}
          <div className="mf-container">
            <div className="mf-card" style={{ textAlign: "center", padding: "60px 24px" }}>
              <Loader2 className={`animate-spin h-7 w-7 mx-auto mb-3 ${isTerminal ? "text-[#33ff00]" : "text-[#0078D4]"}`} />
              <p style={{ fontFamily: isTerminal ? "'JetBrains Mono', monospace" : "'Inter', sans-serif", fontSize: 13, color: isTerminal ? "#33ff00" : "#605E5C", fontWeight: 500 }}>
                {isTerminal ? "[SYS_INIT] BOOTING_FORM_SESSION..." : "Loading form…"}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ═══ RENDER: DUPLICATE / ALREADY SUBMITTED ═══ */
  if (duplicateInfo) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: isTerminal ? `${FORM_CSS}\n${TERMINAL_CSS}` : FORM_CSS }} />
        <div className={`mf-page${isTerminal ? " terminal-theme terminal-scanlines" : ""}`} style={{ background: isTerminal ? "#0a0a0a" : "#F3F2F1" }}>
          {!isTerminal && (
            <div
              className="mf-banner"
              style={{
                background: bannerImage ? undefined : bannerGradient,
              }}
            >
              {bannerImage && (
                <Image
                  src={bannerImage}
                  alt=""
                  fill
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
          )}
          <div className="mf-container">
            <div className="mf-success-card mf-fade-in" style={{ borderColor: isTerminal ? "#ffb000" : "#E0A800" }}>
              {isTerminal && (
                <div className="terminal-window-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, background: "#ff3333", border: "1px solid #770000" }} />
                    <span style={{ width: 10, height: 10, background: "#ffb000", border: "1px solid #775500" }} />
                    <span style={{ width: 10, height: 10, background: "#33ff00", border: "1px solid #007700" }} />
                    <span style={{ marginLeft: 6 }}>SYS://CBGCEK/DUPLICATE_ENTRY</span>
                  </div>
                  <span style={{ color: "#ffb000" }}>[STATUS: 409_ALREADY_EXISTS]</span>
                </div>
              )}

              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: isTerminal ? 0 : "50%",
                  background: isTerminal ? "#1a1300" : "#FFF8E1",
                  border: isTerminal ? "2px solid #ffb000" : "2px solid #F59E0B",
                  color: isTerminal ? "#ffb000" : "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Ban style={{ width: 28, height: 28, strokeWidth: 2.5 }} />
              </div>

              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isTerminal ? "#ffb000" : "#D97706",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                {isTerminal ? "[STATUS: 409 CONFLICT]" : "Already Submitted"}
              </p>

              <h1
                style={{
                  fontSize: "clamp(22px, 3.5vw, 30px)",
                  fontWeight: 700,
                  color: isTerminal ? "#33ff00" : "#1C1B1F",
                  marginBottom: 12,
                }}
              >
                {isTerminal ? "> RECORD_ALREADY_EXISTS" : "Response Already Recorded"}
              </h1>

              <p
                style={{
                  fontSize: 14,
                  color: isTerminal ? "#8ce686" : "#555",
                  lineHeight: 1.6,
                  maxWidth: 480,
                  margin: "0 auto 24px",
                }}
              >
                {duplicateInfo.message}
              </p>

              {/* Previous Response Details Box */}
              <div
                style={{
                  padding: "16px 0",
                  maxWidth: 440,
                  margin: "0 auto 28px",
                  textAlign: "left",
                  borderTop: isTerminal ? "1px dashed #1f521f" : "1px solid #E5E5E5",
                  borderBottom: isTerminal ? "1px dashed #1f521f" : "1px solid #E5E5E5",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: isTerminal ? "#6bb367" : "#666", fontWeight: 500 }}>Form</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isTerminal ? "#33ff00" : "#1C1B1F" }}>{form.title}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: duplicateInfo.submittedAt ? 8 : 0 }}>
                  <span style={{ fontSize: 13, color: isTerminal ? "#6bb367" : "#666", fontWeight: 500 }}>Previous Response ID</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: isTerminal ? "#ffb000" : "#1C1B1F" }}>
                    {duplicateInfo.referenceNumber || `#${duplicateInfo.previousResponseId.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>
                {duplicateInfo.submittedAt && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: isTerminal ? "#6bb367" : "#666", fontWeight: 500 }}>Submitted On</span>
                    <span style={{ fontSize: 13, color: isTerminal ? "#8ce686" : "#444" }}>
                      {new Date(duplicateInfo.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 32 }}>
                <button
                  type="button"
                  onClick={() => setDuplicateInfo(null)}
                  className={isTerminal ? "mf-submit-btn" : undefined}
                  style={isTerminal ? undefined : {
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 24px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    color: "#1C1B1F",
                    background: "#F3F2F1",
                    border: "1px solid #D2D0CA",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isTerminal ? "[ RE-TRY / EDIT SUBMISSION ]" : "Edit & Try Again"}
                </button>
              </div>

              <div
                style={{
                  marginTop: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src="/assets/logo.png"
                    alt="Codebreakers"
                    width={36}
                    height={36}
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: isTerminal ? "'JetBrains Mono', monospace" : "'Sora', sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: isTerminal ? "#33ff00" : "#1C1B1F",
                  }}
                >
                  CodeBreakers
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ═══ RENDER: SUCCESS ═══ */
  if (success) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: isTerminal ? `${FORM_CSS}\n${TERMINAL_CSS}` : FORM_CSS }} />
        <div className={`mf-page${isTerminal ? " terminal-theme terminal-scanlines" : ""}`} style={{ background: isTerminal ? "#0a0a0a" : "#F3F2F1" }}>
          {!isTerminal && (
            <div
              className="mf-banner"
              style={{
                background: bannerImage ? undefined : bannerGradient,
              }}
            >
              {bannerImage && (
                <Image
                  src={bannerImage}
                  alt=""
                  fill
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
          )}
          <div className="mf-container">
            <div className="mf-success-card mf-fade-in">
              {isTerminal && (
                <div className="terminal-window-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, background: "#ff3333", border: "1px solid #770000" }} />
                    <span style={{ width: 10, height: 10, background: "#ffb000", border: "1px solid #775500" }} />
                    <span style={{ width: 10, height: 10, background: "#33ff00", border: "1px solid #007700" }} />
                    <span style={{ marginLeft: 6 }}>SYS://CBGCEK/EXECUTION_SUCCESS</span>
                  </div>
                  <span style={{ color: "#33ff00" }}>[STATUS: 200_OK]</span>
                </div>
              )}

              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: isTerminal ? 0 : "50%",
                  background: isTerminal ? "#081a08" : "#107C10",
                  border: isTerminal ? "2px solid #33ff00" : undefined,
                  color: isTerminal ? "#33ff00" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Check style={{ width: 28, height: 28, strokeWidth: 3 }} />
              </div>

              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isTerminal ? "#33ff00" : "#107C10",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                {isTerminal ? "[SYS_EVENT: SUBMISSION_COMPLETE]" : "Submission Complete"}
              </p>

              <h1
                style={{
                  fontSize: "clamp(24px, 4vw, 34px)",
                  fontWeight: 700,
                  color: isTerminal ? "#33ff00" : "#1C1B1F",
                  marginBottom: 12,
                }}
              >
                {isTerminal
                  ? `> ACCESS_GRANTED: ${(submittedDetails?.name || firstName || "USER").toUpperCase()}`
                  : `You're in, ${submittedDetails?.name ? submittedDetails.name.split(" ")[0] : firstName}!`}
              </h1>

              <p
                style={{
                  fontSize: 15,
                  color: isTerminal ? "#9fe899" : "#666",
                  lineHeight: 1.6,
                  maxWidth: 440,
                  margin: "0 auto 32px",
                }}
              >
                {form.definition.settings.successMessage ||
                  `Confirmation sent to ${submittedDetails?.email || email || "your email"}. See you at CodeBreakers.`}
              </p>

              {/* Response Details Box */}
              {submittedDetails?.referenceNumber && (
                <div
                  style={{
                    padding: "12px 16px",
                    maxWidth: 380,
                    margin: "0 auto 28px",
                    background: isTerminal ? "#060e06" : "#F8F9FA",
                    border: isTerminal ? "1.5px dashed #1f521f" : "1px solid #E9ECEF",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 11, color: isTerminal ? "#7ab377" : "#666", fontWeight: 500, display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                    {isTerminal ? "Transaction Payload Hash" : "Response Reference ID"}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: isTerminal ? "#33ff00" : "#107C10", letterSpacing: "0.05em" }}>
                    {submittedDetails.referenceNumber}
                  </span>
                </div>
              )}

              {form.definition.settings.allowMultipleSubmissions && (
                <div style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="mf-back-btn"
                    onClick={() => {
                      try {
                        localStorage.removeItem(`public_form_submitted_${form.formId}`);
                        localStorage.removeItem(`public_form_submitted_response_id_${form.formId}`);
                        localStorage.removeItem(`public_form_submitted_name_${form.formId}`);
                        localStorage.removeItem(`public_form_submitted_email_${form.formId}`);
                        localStorage.removeItem(`public_form_draft_${form.formId}`);
                      } catch {}
                      setSuccess(false);
                      setDuplicateInfo(null);
                      setSubmittedDetails(null);
                    }}
                  >
                    {isTerminal ? "[ SUBMIT_ANOTHER_PAYLOAD ]" : "Submit another response"}
                  </button>
                </div>
              )}

              <div
                style={{
                  marginTop: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src="/assets/logo.png"
                    alt="Codebreakers"
                    width={36}
                    height={36}
                  />
                </div>
                <span
                  style={{
                    fontFamily: isTerminal ? "'JetBrains Mono', monospace" : "'Sora', sans-serif",
                    fontSize: 25,
                    fontWeight: 600,
                    color: isTerminal ? "#33ff00" : "#1C1B1F",
                  }}
                >
                  CodeBreakers
                </span>
              </div>
            </div>
          </div>

          <div className="mf-footer">
            <a href="https://codebreakersgcek.tech/privacy">Privacy Policy</a>
            <span style={{ margin: "0 8px", color: "#ccc" }}>·</span>
            Powered by <strong>CodeBreakers</strong>
          </div>
        </div>
      </>
    );
  }

  /* ═══ RENDER: FORM ═══ */
  const renderField = (field: FormFieldDefinition, qNumber: number) => {
    const fieldError = isFieldError(field.id, field.required);

    if (field.type === "button") {
      return (
        <div className="mf-question mf-fade-in" key={field.id}>
          <p className="mf-question-label">
            {qNumber}. {field.label}
          </p>
          {field.description &&
            renderRichText(field.description, "mf-question-desc")}
          <button
            type="button"
            className="mf-submit-btn"
            style={{ background: "#1F4D3D" }}
            onClick={() => {
              if (!field.buttonUrl) return;
              field.buttonOpenInNewTab
                ? window.open(field.buttonUrl, "_blank", "noopener,noreferrer")
                : (window.location.href = field.buttonUrl);
            }}
          >
            {field.buttonLabel || "Open link"}{" "}
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      );
    }

    if (field.type === "payment") {
      const payErr = submitAttempted && !transactionId.trim();
      const showTabs = availablePaymentMethods.length > 1;

      return (
        <div className="mf-question mf-fade-in" key={field.id}>
          <p className="mf-question-label">
            {qNumber}. {field.label}
            <span className="mf-asterisk">*</span>
          </p>
          {field.description &&
            renderRichText(field.description, "mf-question-desc")}

          <div className="mf-payment-card" style={{ background: "#FAFAFA", borderRadius: 12, border: "1.5px solid #E2E8F0", padding: 24, marginBottom: 20 }}>
            {/* Amount and Payee Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                borderBottom: "1px solid #E2E8F0",
                paddingBottom: 16,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  Amount Due
                </span>
                <span style={{ fontSize: 13, color: "#475569" }}>
                  Payee: <strong style={{ color: "#0F172A" }}>{field.payeeName || form.title}</strong>
                </span>
              </div>
              <span className="mf-payment-amount" style={{ fontSize: 30, fontWeight: 800, color: "#0F172A" }}>
                ₹{field.paymentAmount ?? 0}
              </span>
            </div>

            {/* Payment Method Selector Tabs */}
            {showTabs && (
              <div className="mf-pay-tab-group">
                {availablePaymentMethods.includes("razorpay") && (
                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod("razorpay")}
                    className={`mf-pay-tab ${selectedPaymentMethod === "razorpay" ? "active" : ""}`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Razorpay (Online)</span>
                  </button>
                )}
                {availablePaymentMethods.includes("upi") && (
                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod("upi")}
                    className={`mf-pay-tab ${selectedPaymentMethod === "upi" ? "active" : ""}`}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>UPI QR Code</span>
                  </button>
                )}
                {availablePaymentMethods.includes("cash") && (
                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod("cash")}
                    className={`mf-pay-tab ${selectedPaymentMethod === "cash" ? "active" : ""}`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Cash Payment</span>
                  </button>
                )}
              </div>
            )}

            {/* 1. RAZORPAY PAYMENT VIEW */}
            {selectedPaymentMethod === "razorpay" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {isRazorpayVerified ? (
                  <div
                    style={{
                      background: "#F0FDF4",
                      border: "1.5px solid #86EFAC",
                      borderRadius: 12,
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      <div>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#15803D" }}>
                          Payment Successful!
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>
                          Verified online payment via Razorpay.
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #BBF7D0",
                        borderRadius: 8,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        <span style={{ fontWeight: 600, color: "#166534" }}>Transaction ID: </span>
                        <code style={{ fontWeight: 700, color: "#0F172A", background: "#F1F5F9", padding: "2px 6px", borderRadius: 4 }}>
                          {transactionId}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transactionId, "Transaction ID")}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#16a34a",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: 12, color: "#15803D", lineHeight: 1.4 }}>
                      ✓ Your transaction ID is locked and saved in this form. You can proceed with the remaining questions and submit.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      borderRadius: 12,
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: 14,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        background: "#EFF6FF",
                        color: "#0078D4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CreditCard className="h-6 w-6" />
                    </div>

                    <div style={{ maxWidth: 380, width: "100%" }}>
                      <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                        Pay via Razorpay Gateway
                      </h4>
                      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                        Instant checkout supporting all UPI Apps (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking & Wallets.
                      </p>

                      {/* Fee and Tax Breakdown Box */}
                      <div
                        style={{
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          borderRadius: 8,
                          padding: "10px 14px",
                          fontSize: 12,
                          textAlign: "left",
                          marginBottom: 16,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                          <span>Base Registration Amount:</span>
                          <span style={{ fontWeight: 600 }}>₹{razorpayTaxBreakdown.baseAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: 11 }}>
                          <span>Gateway Fee & GST (2% + 18% GST):</span>
                          <span>+ ₹{razorpayTaxBreakdown.feeAndGst.toFixed(2)}</span>
                        </div>
                        <div
                          style={{
                            borderTop: "1px dashed #CBD5E1",
                            paddingTop: 6,
                            marginTop: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            color: "#0F172A",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          <span>Total Amount to Pay:</span>
                          <span style={{ color: "#0078D4" }}>₹{razorpayTaxBreakdown.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isRazorpayProcessing}
                      onClick={handlePayWithRazorpay}
                      className="mf-submit-btn"
                      style={{
                        background: isRazorpayProcessing ? "#94A3B8" : "#0078D4",
                        width: "100%",
                        maxWidth: 300,
                        justifyContent: "center",
                        padding: "12px 24px",
                        fontSize: 14,
                        borderRadius: 8,
                        boxShadow: "0 2px 6px rgba(0, 120, 212, 0.25)",
                      }}
                    >
                      {isRazorpayProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" /> Pay ₹{razorpayTaxBreakdown.totalAmount.toFixed(2)} with Razorpay
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. UPI QR PAYMENT VIEW */}
            {selectedPaymentMethod === "upi" && field.upiId && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                {/* QR Code Container */}
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    border: "1px solid #CBD5E1",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    maxWidth: 260,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 200,
                      height: 200,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#FFFFFF",
                    }}
                  >
                    {isQrLoading || !qrDataUrl ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0078D4" }} />
                        <span style={{ fontSize: 12, color: "#64748B" }}>Generating QR...</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt="Standard UPI Payment QR Code"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          imageRendering: "pixelated",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748B",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Scan with any UPI app</span>
                  </div>
                </div>

                {/* UPI ID Pill & Copy Button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    borderRadius: 8,
                    padding: "6px 12px",
                    maxWidth: "100%",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>UPI ID:</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "monospace",
                      color: "#0F172A",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {field.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(field.upiId!, "UPI ID")}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "#0078D4",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                    title="Copy UPI ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile App Intent Pay Buttons */}
                <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    type="button"
                    onClick={openUpi}
                    style={{
                      background: "#0078D4",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 16px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 2px 4px rgba(0,120,212,0.2)",
                      transition: "background .15s ease",
                    }}
                  >
                    <Smartphone className="h-4 w-4" /> Pay with UPI App
                  </button>

                  {upiLinks && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 2 }}>
                      {upiLinks.apps
                        .filter((app) => app.id !== "generic")
                        .map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => openUpiApp(app.schemeUrl, app.name)}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                              borderRadius: 6,
                              padding: "6px 4px",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#334155",
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all .15s ease",
                            }}
                            title={`Open ${app.name}`}
                          >
                            {app.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Payment Verification Advisory Notice */}
                <div
                  style={{
                    width: "100%",
                    background: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: 12,
                    color: "#1E40AF",
                    lineHeight: "1.4",
                  }}
                >
                  <Info className="h-4 w-4 shrink-0" style={{ marginTop: 2, color: "#2563EB" }} />
                  <div>
                    <strong>Verification Notice:</strong> Scanning or opening the app transfers funds directly through your bank.
                    After completing payment, please enter the <strong>UTR / Bank Transaction Reference ID</strong> below to confirm your submission.
                  </div>
                </div>
              </div>
            )}

            {/* 3. CASH PAYMENT VIEW */}
            {selectedPaymentMethod === "cash" && (
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1.5px solid #FDE68A",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      background: "#FEF3C7",
                      color: "#D97706",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#92400E" }}>
                      Cash Payment Selected
                    </h4>
                    <p style={{ margin: 0, fontSize: 12, color: "#B45309" }}>
                      Offline hand-to-hand cash payment.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #FDE68A",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "#78350F",
                    lineHeight: 1.5,
                  }}
                >
                  Please submit <strong>₹{field.paymentAmount ?? 0}</strong> in cash directly to the organizing coordinators or event desk.
                  Your transaction ID is automatically set as <code>CASH</code>.
                </div>
              </div>
            )}
          </div>

          {/* Transaction ID Input Area */}
          {selectedPaymentMethod === "upi" ? (
            <>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                {field.transactionIdLabel || "Transaction ID / UTR"}{" "}
                <span style={{ color: "#D13438" }}>*</span>
              </label>
              <input
                className={`mf-input${payErr ? " mf-input-error" : ""}`}
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Paste 12-digit UTR or Reference ID..."
              />
              {payErr && <p className="mf-error-msg">Please enter your payment UTR / Transaction Reference ID</p>}
            </>
          ) : selectedPaymentMethod === "razorpay" ? (
            <>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Razorpay Payment ID <span style={{ color: "#D13438" }}>*</span>
              </label>
              <input
                className={`mf-input${payErr ? " mf-input-error" : ""}`}
                type="text"
                value={transactionId}
                readOnly
                placeholder="Click 'Pay with Razorpay' above to pay and populate ID..."
                style={{
                  background: isRazorpayVerified ? "#F0FDF4" : "#F8FAFC",
                  color: isRazorpayVerified ? "#15803D" : "#64748B",
                  fontWeight: isRazorpayVerified ? 600 : 400,
                }}
              />
              {payErr && <p className="mf-error-msg">Please complete payment via Razorpay to continue</p>}
            </>
          ) : (
            <>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Transaction Mode <span style={{ color: "#D13438" }}>*</span>
              </label>
              <input
                className="mf-input"
                type="text"
                value={transactionId || "CASH"}
                readOnly
                style={{ background: "#FFFBEB", color: "#92400E", fontWeight: 600 }}
              />
            </>
          )}
        </div>
      );
    }

    return (
      <div className="mf-question mf-fade-in" key={field.id}>
        <p className="mf-question-label">
          {qNumber}. {field.label}
          {field.required && <span className="mf-asterisk">*</span>}
        </p>
        {field.description &&
          renderRichText(field.description, "mf-question-desc")}

        {field.imageKey && (
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 16,
              border: "1px solid #e8e8e8",
            }}
          >
            <Image
              src={getImageUrl(field.imageKey)}
              alt=""
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
        )}

        {/* Short Text / Email / Number */}
        {(field.type === "short_text" ||
          field.type === "email" ||
          field.type === "number") && (
          <div>
            <input
              className={`mf-input${fieldError ? " mf-input-error" : ""}`}
              type={
                field.type === "email"
                  ? "email"
                  : field.type === "number"
                    ? "number"
                    : "text"
              }
              value={(answers[field.id] as string) || ""}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              placeholder={field.placeholder || "Enter your answer"}
            />
            {fieldError && (
              <p className="mf-error-msg">This field is required</p>
            )}
          </div>
        )}

        {/* Long Text */}
        {field.type === "long_text" && (
          <div>
            <textarea
              className={`mf-textarea${fieldError ? " mf-input-error" : ""}`}
              rows={3}
              value={(answers[field.id] as string) || ""}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              placeholder={field.placeholder || "Enter your answer"}
            />
            {fieldError && (
              <p className="mf-error-msg">This field is required</p>
            )}
          </div>
        )}

        {/* Multi Input */}
        {field.type === "multi_input" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {(field.subQuestions || []).map((sub, idx) => {
              const currentValObj =
                (answers[field.id] as Record<string, string> | undefined) || {};
              const subVal = currentValObj[sub.id] || "";
              const isSubRequired = Boolean(field.required && sub.required);
              const subErr =
                (submitAttempted || touched[field.id]) &&
                isSubRequired &&
                !subVal.trim();
              return (
                <div key={sub.id || idx}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1C1B1F",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {sub.label || `Sub-question ${idx + 1}`}
                    {isSubRequired && (
                      <span style={{ color: "#D13438", marginLeft: 2 }}>*</span>
                    )}
                  </label>
                  <input
                    className={`mf-input${subErr ? " mf-input-error" : ""}`}
                    type="text"
                    value={subVal}
                    onChange={(e) => {
                      const updated = {
                        ...currentValObj,
                        [sub.id]: e.target.value,
                      };
                      updateAnswer(field.id, updated);
                    }}
                    placeholder={sub.placeholder || "Enter your answer"}
                  />
                  {subErr && (
                    <p className="mf-error-msg">This field is required</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Team Members / Repeatable Box */}
        {field.type === "team_members" && (() => {
          const minRequired = field.minEntries || 1;
          const maxAllowed = field.maxEntries || 4;
          const entryLabel = field.entryLabel || "Member";
          const addButtonLabel = field.addButtonLabel || "Add Member";

          const currentList: Array<Record<string, string>> = Array.isArray(answers[field.id])
            ? (answers[field.id] as Array<Record<string, string>>)
            : Array.from({ length: minRequired }, (): Record<string, string> => ({}));

          const subQuestions = field.subQuestions || [
            { id: "sub_1", label: "Full Name", type: "short_text", required: true, placeholder: "e.g. Alex Smith" },
            { id: "sub_2", label: "Email Address", type: "email", required: true, placeholder: "e.g. alex@example.com" },
            { id: "sub_3", label: "Phone Number", type: "number", required: true, placeholder: "e.g. 9876543210" },
            { id: "sub_4", label: "Gender", type: "dropdown", required: false, options: ["Male", "Female", "Other"] },
            { id: "sub_5", label: "College / Branch", type: "short_text", required: false, placeholder: "e.g. GCEK / CSE" },
          ];

          const isAtLimit = currentList.length >= maxAllowed;

          const handleAddEntry = () => {
            if (currentList.length >= maxAllowed) return;
            const updated = [...currentList, {}];
            updateAnswer(field.id, updated);
          };

          const handleRemoveEntry = (idxToRemove: number) => {
            if (currentList.length <= minRequired) return;
            const updated = currentList.filter((_, i) => i !== idxToRemove);
            updateAnswer(field.id, updated);
          };

          const handleUpdateMemberField = (memberIdx: number, subId: string, val: string) => {
            const updated = currentList.map((m, i) =>
              i === memberIdx ? { ...m, [subId]: val } : m
            );
            updateAnswer(field.id, updated);
          };

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {currentList.map((memberData, memberIdx) => {
                const isLeader = memberIdx === 0;
                return (
                  <div key={memberIdx} className="mf-team-card">
                    {/* Header */}
                    <div className="mf-team-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`mf-team-badge ${isLeader ? "" : "secondary"}`}>
                          <Users className="h-3.5 w-3.5" />
                          {entryLabel} #{memberIdx + 1} {isLeader ? "(Leader)" : ""}
                        </span>
                        {isTerminal && (
                          <span style={{ fontSize: 11, color: "#669966" }}>
                            [ID: 0x0{memberIdx + 1}]
                          </span>
                        )}
                      </div>

                      {currentList.length > minRequired && (
                        <button
                          type="button"
                          className="mf-team-delete-btn"
                          onClick={() => handleRemoveEntry(memberIdx)}
                          title={`Remove ${entryLabel} #${memberIdx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{isTerminal ? "REMOVE" : "Remove"}</span>
                        </button>
                      )}
                    </div>

                    {/* Sub-Questions Vertical Stack (Down to Down) */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {subQuestions.map((sub, sIdx) => {
                        const subId = sub.id || `sub_${sIdx + 1}`;
                        const subVal = memberData[subId] || "";
                        const isSubRequired = Boolean(sub.required);
                        const isTouchedOrSubmitted = submitAttempted || Boolean(touched[field.id]);
                        const isInvalidEmpty = isSubRequired && isTouchedOrSubmitted && !subVal.trim();
                        const isInvalidEmail = sub.type === "email" && subVal.trim() && !subVal.includes("@") && isTouchedOrSubmitted;
                        const hasSubErr = isInvalidEmpty || isInvalidEmail;

                        return (
                          <div key={subId} style={{ display: "flex", flexDirection: "column" }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: 13,
                                fontWeight: 500,
                                color: isTerminal ? "#33ff00" : "#333",
                                marginBottom: 6,
                              }}
                            >
                              {sub.label || `Field ${sIdx + 1}`}
                              {isSubRequired && (
                                <span style={{ color: "#D13438", marginLeft: 2 }}>*</span>
                              )}
                            </label>

                            {/* DROPDOWN / SELECT */}
                            {sub.type === "dropdown" ? (
                              <Select
                                value={subVal}
                                onValueChange={(val) =>
                                  handleUpdateMemberField(memberIdx, subId, val)
                                }
                              >
                                <SelectTrigger
                                  className={`w-full h-auto min-h-[44px] py-2.5 !bg-white border-[1.5px] ${hasSubErr ? "!border-[#D13438]" : "!border-[#D2D0CA]"} rounded-md text-sm !text-[#1C1B1F] focus:!border-[#0078D4] focus:!ring-0 shadow-none px-3.5 text-left whitespace-normal break-words leading-relaxed`}
                                >
                                  <SelectValue placeholder={sub.placeholder || "Select option..."} className="whitespace-normal break-words text-left leading-relaxed" />
                                </SelectTrigger>
                                <SelectContent
                                  position="popper"
                                  align="start"
                                  sideOffset={4}
                                  className="mf-light-select rounded-lg border border-[#D2D0CA] !bg-white !text-[#1C1B1F] shadow-xl z-50 p-1 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-32px)]"
                                >
                                  {(sub.options && sub.options.length > 0 ? sub.options : ["Male", "Female", "Other"]).map((opt) => (
                                    <SelectItem
                                      key={opt}
                                      value={opt}
                                      className="text-sm py-2.5 px-3 cursor-pointer !text-[#1C1B1F] hover:!bg-[#F3F2F1] focus:!bg-[#F3F2F1] focus:!text-[#1C1B1F] rounded-md transition-colors whitespace-normal break-words leading-relaxed text-left"
                                    >
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : sub.type === "dob" || sub.type === "date" ? (
                              /* DATE OF BIRTH / DATE PICKER */
                              <FormDatePicker
                                value={subVal}
                                onChange={(dateStr) =>
                                  handleUpdateMemberField(memberIdx, subId, dateStr)
                                }
                                placeholder={sub.placeholder || (sub.type === "dob" ? "Select date of birth..." : "Select date...")}
                                isDob={sub.type === "dob"}
                                hasError={Boolean(hasSubErr)}
                                isTerminal={isTerminal}
                              />
                            ) : (
                              /* TEXT / EMAIL / NUMBER INPUT */
                              <input
                                className={`mf-input${hasSubErr ? " mf-input-error" : ""}`}
                                type={sub.type === "number" ? "number" : sub.type === "email" ? "email" : "text"}
                                value={subVal}
                                onChange={(e) =>
                                  handleUpdateMemberField(memberIdx, subId, e.target.value)
                                }
                                placeholder={sub.placeholder || `Enter ${sub.label?.toLowerCase() || "answer"}`}
                              />
                            )}

                            {isInvalidEmpty && (
                              <p className="mf-error-msg">This field is required</p>
                            )}
                            {isInvalidEmail && (
                              <p className="mf-error-msg">Please enter a valid email address</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Actions & Limits Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  paddingTop: 4,
                }}
              >
                {!isAtLimit ? (
                  <button
                    type="button"
                    className="mf-team-add-btn"
                    onClick={handleAddEntry}
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {addButtonLabel} ({currentList.length}/{maxAllowed})
                    </span>
                  </button>
                ) : (
                  <div className="mf-team-limit-reached">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      Maximum limit reached ({maxAllowed}/{maxAllowed} {entryLabel.toLowerCase()}s)
                    </span>
                  </div>
                )}

                <span
                  style={{
                    fontSize: 12,
                    color: isTerminal ? "#669966" : "#64748B",
                  }}
                >
                  Min: {minRequired} · Max: {maxAllowed} {entryLabel.toLowerCase()}s
                </span>
              </div>

              {fieldError && (
                <p className="mf-error-msg">
                  Please provide all required member information.
                </p>
              )}
            </div>
          );
        })()}

        {/* Linear Scale */}
        {field.type === "linear_scale" && (
          <div>
            <div className="mf-scale-grid">
              {Array.from(
                { length: (field.scaleMax ?? 5) - (field.scaleMin ?? 1) + 1 },
                (_, idx) => (field.scaleMin ?? 1) + idx,
              ).map((num) => {
                const selected = answers[field.id] === String(num);
                return (
                  <button
                    key={num}
                    type="button"
                    className={`mf-scale-btn ${selected ? "active" : ""}`}
                    onClick={() => updateAnswer(field.id, String(num))}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            {(field.scaleMinLabel || field.scaleMaxLabel) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#888",
                  marginTop: 6,
                }}
              >
                <span>{field.scaleMinLabel || ""}</span>
                <span>{field.scaleMaxLabel || ""}</span>
              </div>
            )}
            {fieldError && (
              <p className="mf-error-msg">This field is required</p>
            )}
          </div>
        )}

        {/* Radio */}
        {field.type === "radio" && (
          <div role="radiogroup" aria-label={field.label}>
            {(field.options || ["Option 1"]).map((opt) => {
              const selected = answers[field.id] === opt;
              return (
                <div
                  key={opt}
                  className={`mf-option-card ${selected ? "selected" : ""}`}
                  onClick={() => updateAnswer(field.id, opt)}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      updateAnswer(field.id, opt);
                    }
                  }}
                >
                  <div className="mf-radio-indicator">
                    <div className="mf-radio-dot" />
                  </div>
                  <span className="mf-option-label">{opt}</span>
                </div>
              );
            })}
            {fieldError && (
              <p className="mf-error-msg">This field is required</p>
            )}
          </div>
        )}

        {/* Checkbox */}
        {field.type === "checkbox" && (
          <div role="group" aria-label={field.label}>
            {(field.options || ["Option 1"]).map((opt) => {
              const cur = (answers[field.id] as string[]) || [];
              const selected = cur.includes(opt);
              return (
                <div
                  key={opt}
                  className={`mf-option-card ${selected ? "selected" : ""}`}
                  onClick={() => toggleCheckbox(field.id, opt)}
                  role="checkbox"
                  aria-checked={selected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCheckbox(field.id, opt);
                    }
                  }}
                >
                  <div className="mf-checkbox-indicator">
                    {selected && (
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="mf-option-label">{opt}</span>
                </div>
              );
            })}
            {fieldError && (
              <p className="mf-error-msg">This field is required</p>
            )}
          </div>
        )}

        {/* Dropdown */}
        {field.type === "dropdown" && (
          <div className="w-full">
            <Select
              value={(answers[field.id] as string) || ""}
              onValueChange={(val) => updateAnswer(field.id, val)}
            >
              <SelectTrigger
                className={`w-full max-w-full h-auto min-h-[44px] py-2.5 !bg-white border-[1.5px] ${fieldError ? "!border-[#D13438]" : "!border-[#D2D0CA]"} rounded-md text-sm !text-[#1C1B1F] focus:!border-[#0078D4] focus:!ring-0 shadow-none px-3.5 text-left whitespace-normal break-words leading-relaxed`}
              >
                <SelectValue placeholder="Choose an option..." className="whitespace-normal break-words text-left leading-relaxed" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
                sideOffset={4}
                className="mf-light-select rounded-lg border border-[#D2D0CA] !bg-white !text-[#1C1B1F] shadow-xl z-50 p-1 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-32px)]"
              >
                {(field.options || []).map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt}
                    className="text-sm py-2.5 px-3 cursor-pointer !text-[#1C1B1F] hover:!bg-[#F3F2F1] focus:!bg-[#F3F2F1] focus:!text-[#1C1B1F] rounded-md transition-colors whitespace-normal break-words leading-relaxed text-left"
                  >
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="mf-error-msg">This field is required</p>
            )}
          </div>
        )}

        {/* Date & Date of Birth */}
        {(field.type === "date" || field.type === "dob") && (
          <div className="max-w-xs">
            <FormDatePicker
              value={answers[field.id] as string}
              onChange={(val) => updateAnswer(field.id, val)}
              placeholder={field.type === "dob" ? "Select date of birth..." : "Select date..."}
              isDob={field.type === "dob"}
              hasError={Boolean(fieldError)}
              isTerminal={isTerminal}
            />
            {fieldError && (
              <p className="mf-error-msg">This field is required</p>
            )}
          </div>
        )}

        {/* File Upload */}
        {field.type === "file_upload" && (
          <div>
            <FormFileUploader
              fieldId={field.id}
              label={field.label}
              description={field.description}
              required={field.required}
              allowedFileTypes={field.allowedFileTypes}
              maxFiles={field.maxFiles}
              imageOnly={field.imageOnly}
              multipleFiles={field.multipleFiles}
              value={(answers[field.id] as unknown as ProcessedFormFile[]) || []}
              onChange={(files) => updateAnswer(field.id, files as any)}
              disabled={isSubmitting}
            />
            {fieldError && (
              <p className="mf-error-msg" style={{ marginTop: 6 }}>
                This field is required
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: isTerminal ? `${FORM_CSS}\n${TERMINAL_CSS}` : FORM_CSS }} />

      <div className={`mf-page${isTerminal ? " terminal-theme terminal-scanlines" : ""}`} style={{ background: isTerminal ? "#0a0a0a" : "#F3F2F1" }}>
        {/* ─── Gradient Banner (Only for minimal style or when custom image is set) ─── */}
        {(!isTerminal || bannerImage) && (
          <div
            className="mf-banner"
            style={{
              background: bannerImage ? undefined : bannerGradient,
            }}
          >
            {bannerImage && (
              <Image
                src={bannerImage}
                alt=""
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            )}
          </div>
        )}

        {/* ─── Form Card ─── */}
        <div className="mf-container">
          <div className="mf-card mf-fade-in">
            {/* Terminal Window Header Bar */}
            {isTerminal && (
              <div className="terminal-window-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, background: "#ff3333", border: "1px solid #770000" }} />
                  <span style={{ width: 10, height: 10, background: "#ffb000", border: "1px solid #775500" }} />
                  <span style={{ width: 10, height: 10, background: "#33ff00", border: "1px solid #007700" }} />
                  <span style={{ marginLeft: 6 }}>SYS://CBGCEK/FORM_INTERPRETER.sh</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ffb000" }}>
                  <span>[TTY_01]</span>
                  <span>FORM_ID:{form.formId.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            )}

            {/* Interactive Shell Prompt */}
            {isTerminal && (
              <div style={{ marginBottom: 18, fontSize: 12, borderBottom: "1px dashed #1f521f", paddingBottom: 10, display: "flex", alignItems: "center", gap: 6, color: "#1f521f" }}>
                <span style={{ color: "#33ff00", fontWeight: 700 }}>root@cbgcek:~$</span>
                <span style={{ color: "#8ce686" }}>./run_interactive_entry --target=&quot;{form.title}&quot;</span>
                <span className="terminal-cursor" />
              </div>
            )}

            {/* Form Brand Header */}
            <div className="mf-brand-header">
              <div className="mf-brand-logo-wrap">
                <Image
                  src="/assets/logo.png"
                  alt="Codebreakers"
                  width={20}
                  height={20}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <span className="mf-brand-name">CodeBreakers</span>
            </div>

            {/* Form Title */}
            {form.title && <h1 className="mf-title">{form.title}</h1>}

            {/* Form Description */}
            {form.description &&
              renderRichText(form.description, "mf-description")}

            {!form.acceptingResponses ? (
              /* ─── Closed State ─── */
              <div style={{ paddingTop: 24, textAlign: "center" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: isTerminal ? 0 : "50%",
                    background: isTerminal ? "#2b0a0a" : "#FDE8E8",
                    border: isTerminal ? "2px solid #ff3333" : undefined,
                    color: "#D13438",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Ban style={{ width: 28, height: 28 }} />
                </div>
                <h2
                  style={{
                    fontFamily: isTerminal ? "'JetBrains Mono', monospace" : "'Sora', sans-serif",
                    fontSize: "clamp(18px, 3vw, 24px)",
                    fontWeight: 700,
                    color: isTerminal ? "#ff3333" : "#1C1B1F",
                    marginBottom: 8,
                  }}
                >
                  {isTerminal ? "[ERR: 503_SERVICE_OFFLINE] FORM_CLOSED" : "This form is no longer accepting responses"}
                </h2>
                <p
                  style={{
                    fontFamily: isTerminal ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
                    fontSize: 14,
                    color: isTerminal ? "#8ce686" : "#666",
                    lineHeight: 1.6,
                    maxWidth: 400,
                    margin: "0 auto",
                  }}
                >
                  {isTerminal
                    ? "The form operator has halted the listening daemon. No new responses may be committed."
                    : "The form owner has closed this form for new submissions. If you believe this is a mistake, please contact the form creator."}
                </p>
              </div>
            ) : (
              /* ─── Active Form ─── */
              <>
                {/* Disclaimer text */}
                <p className="mf-disclaimer">
                  {isTerminal
                    ? "[PRIVACY_POLICY] Client telemetry and identity metadata are omitted unless explicitly declared below."
                    : "When you submit this form, it will not automatically collect your details like name and email address unless you provide it yourself."}
                </p>

                {/* Required notice */}
                {hasAnyRequired && (
                  <p className="mf-required-notice">
                    <span className="mf-asterisk">*</span> {isTerminal ? "MANDATORY_PARAMETERS" : "Required"}
                  </p>
                )}

                {/* ─── Name & Email (Section 1) ─── */}
                {currentSectionIdx === 0 && (
                  <>
                    {/* Name Field */}
                    {form.definition.settings.collectName &&
                      (() => {
                        questionNum++;
                        const nameErr =
                          (submitAttempted || touched["__name"]) && !name.trim();
                        return (
                          <div className="mf-question mf-fade-in">
                            <p className="mf-question-label">
                              {questionNum}. {isTerminal ? "USER_FULL_NAME" : "Name"}{" "}
                              <span className="mf-asterisk">*</span>
                            </p>
                            <input
                              className={`mf-input${nameErr ? " mf-input-error" : ""}`}
                              type="text"
                              value={name}
                              onChange={(e) => {
                                setName(e.target.value);
                                setTouched((c) => ({ ...c, __name: true }));
                              }}
                              placeholder={isTerminal ? "user@host:~$ enter full name..." : "Enter your answer"}
                            />
                            {nameErr && (
                              <p className="mf-error-msg">{isTerminal ? "[ERR] 0x01: PARAMETER_NAME_REQUIRED" : "This field is required"}</p>
                            )}
                          </div>
                        );
                      })()}

                    {/* Email Field */}
                    {form.definition.settings.collectEmail &&
                      (() => {
                        questionNum++;
                        const emailErr =
                          (submitAttempted || touched["__email"]) &&
                          (!email.trim() || !email.includes("@"));
                        return (
                          <div className="mf-question mf-fade-in">
                            <p className="mf-question-label">
                              {questionNum}. {isTerminal ? "USER_EMAIL_ADDRESS" : "Email"}{" "}
                              <span className="mf-asterisk">*</span>
                            </p>
                            <input
                              className={`mf-input${emailErr ? " mf-input-error" : ""}`}
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setTouched((c) => ({ ...c, __email: true }));
                              }}
                              placeholder={isTerminal ? "user@domain.com" : "Enter your answer"}
                            />
                            {emailErr && (
                              <p className="mf-error-msg">
                                {isTerminal ? "[ERR] 0x02: INVALID_EMAIL_FORMAT" : "Please enter a valid email address"}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                  </>
                )}

                {/* ─── Current Section Questions ─── */}
                {(() => {
                  const currentSection =
                    form.definition.sections[currentSectionIdx] ||
                    form.definition.sections[0];
                  if (!currentSection) return null;

                  return (
                    <div key={currentSection.id} className="mf-fade-in">
                      {form.definition.sections.length > 1 && (
                        <div
                          style={{
                            marginTop: 20,
                            marginBottom: 16,
                            paddingBottom: 10,
                            borderBottom: isTerminal ? "1.5px dashed #1f521f" : "1.5px solid #EDEBE9",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: isTerminal ? "#33ff00" : "#0078D4",
                                background: isTerminal ? "#0a1f0a" : "#EFF6FC",
                                border: isTerminal ? "1px solid #1f521f" : undefined,
                                padding: "3px 8px",
                                borderRadius: isTerminal ? 0 : 4,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {isTerminal
                                ? `[ SECTION ${currentSectionIdx + 1}/${form.definition.sections.length} ]`
                                : `Section ${currentSectionIdx + 1} of ${form.definition.sections.length}`}
                            </span>
                          </div>
                          {currentSection.title &&
                            currentSection.title !== "Section 1" && (
                              <h2
                                style={{
                                  fontSize: 18,
                                  fontWeight: 700,
                                  margin: "6px 0 4px",
                                  color: isTerminal ? "#33ff00" : "#1C1B1F",
                                }}
                              >
                                {isTerminal ? `> ${currentSection.title.toUpperCase()}` : currentSection.title}
                              </h2>
                            )}
                          {currentSection.description &&
                            renderRichText(
                              currentSection.description,
                              "mf-description",
                            )}
                        </div>
                      )}
                      {currentSection.fields.map((field) => {
                        questionNum++;
                        return renderField(field, questionNum);
                      })}
                    </div>
                  );
                })()}

                {/* ─── Navigation Buttons (Back / Next / Submit) ─── */}
                <div
                  style={{
                    paddingTop: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  {sectionHistory.length > 0 ? (
                    <button
                      type="button"
                      className="mf-back-btn"
                      disabled={isSubmitting}
                      onClick={handlePrevSection}
                    >
                      {isTerminal ? "[ << PREV_STEP ]" : "Back"}
                    </button>
                  ) : (
                    <div />
                  )}

                  {isCurrentStepSubmit ? (
                    <button
                      type="button"
                      className="mf-submit-btn"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4" /> {isTerminal ? "[ TRANSMITTING_PAYLOAD... ]" : "Submitting…"}
                        </>
                      ) : (
                        <>
                          {isTerminal
                            ? `[ ${form.definition.settings.submitButtonLabel?.toUpperCase() || "SUBMIT_DATA"} ]`
                            : form.definition.settings.submitButtonLabel || "Submit"}
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mf-submit-btn"
                      disabled={isSubmitting}
                      onClick={handleNextSection}
                    >
                      {isTerminal ? "[ NEXT_STEP >> ]" : "Next"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ─── Footer ─── */}
          <div className="mf-footer">
            <a href="/privacy">{isTerminal ? "[PRIVACY_POLICY]" : "Privacy Policy"}</a>
            <span style={{ margin: "0 8px", color: isTerminal ? "#1f521f" : "#ccc" }}>·</span>
            {isTerminal ? (
              <span>SYSTEM HOST: <strong style={{ color: "#33ff00" }}>CODEBREAKERS</strong></span>
            ) : (
              <span>Powered by <strong>CodeBreakers</strong></span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
