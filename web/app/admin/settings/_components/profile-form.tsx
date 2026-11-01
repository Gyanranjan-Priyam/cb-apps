"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateUserProfile, type ProfileUpdateData } from "../actions";
import statesDistrictsData from "@/lib/new/states-districts.json";
import { cn } from "@/lib/utils";
import { VerifyEmailDialog } from "@/components/email-verification/verify-email-dialog";

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    mobileNumber?: string | null;
    whatsappNumber?: string | null;
    upiId?: string | null;
    username?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    aadhaarNumber?: string | null;
    registration?: string | null;
    rollNumber?: string | null;
    branch?: string | null;
    admissionYear?: string | null;
    collegeName?: string | null;
    collegeAddress?: string | null;
    address?: string | null;
    postOffice?: string | null;
    policeStation?: string | null;
    block?: string | null;
    pinCode?: string | null;
    state?: string | null;
    district?: string | null;
  };
}

const FIELD_LIMITS: Partial<Record<keyof ProfileUpdateData, number>> = {
  name: 60,
  username: 30,
  firstName: 30,
  middleName: 30,
  lastName: 30,
};

function FieldCounter({ value, max }: { value: string; max: number }) {
  const len = (value || "").length;
  return (
    <span className={cn("text-xs tabular-nums", len > max ? "text-destructive" : "text-muted-foreground")}>
      {len}/{max}
    </span>
  );
}

function FormField({
  id,
  label,
  required,
  hint,
  maxLength,
  children,
  value,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  maxLength?: number;
  children: React.ReactNode;
  value?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {maxLength !== undefined && value !== undefined && (
          <FieldCounter value={value} max={maxLength} />
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        {children}
      </p>
      <Separator />
    </div>
  );
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: initialData.name || "",
    email: initialData.email || "",
    mobileNumber: initialData.mobileNumber || "",
    whatsappNumber: initialData.whatsappNumber || "",
    upiId: initialData.upiId || "",
    username: initialData.username || "",
    firstName: initialData.firstName || "",
    middleName: initialData.middleName || "",
    lastName: initialData.lastName || "",
    aadhaarNumber: initialData.aadhaarNumber || "",
    registration: initialData.registration || "",
    rollNumber: initialData.rollNumber || "",
    branch: initialData.branch || "",
    admissionYear: initialData.admissionYear || "",
    collegeName: initialData.collegeName || "",
    collegeAddress: initialData.collegeAddress || "",
    address: initialData.address || "",
    postOffice: initialData.postOffice || "",
    policeStation: initialData.policeStation || "",
    block: initialData.block || "",
    pinCode: initialData.pinCode || "",
    state: initialData.state || "",
    district: initialData.district || "",
  });

  const [currentSavedEmail, setCurrentSavedEmail] = useState(initialData.email || "");
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  const [selectedState, setSelectedState] = useState(initialData.state || "");
  const [selectedCollege, setSelectedCollege] = useState(
    initialData.collegeName === "GOVERNMENT COLLEGE OF ENGINEERING KALAHANDI, BHAWANIPATNA"
      ? initialData.collegeName
      : initialData.collegeName
      ? "Other"
      : ""
  );
  const [pending, startTransition] = useTransition();

  const availableDistricts = useMemo(() => {
    if (!selectedState) return [];
    return (
      statesDistrictsData.states.find((s) => s.state === selectedState)?.districts || []
    );
  }, [selectedState]);

  const currentYear = new Date().getFullYear();
  const admissionYears = Array.from({ length: currentYear - 2022 + 2 }, (_, i) => 2023 + i);

  const set = (field: keyof ProfileUpdateData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setFormData((prev) => ({ ...prev, state: value, district: "" }));
  };

  const handleCollegeChange = (value: string) => {
    setSelectedCollege(value);
    if (value === "GOVERNMENT COLLEGE OF ENGINEERING KALAHANDI, BHAWANIPATNA") {
      setFormData((prev) => ({
        ...prev,
        collegeName: value,
        collegeAddress: "AT-KANDHABANDO PALA, PO- RISIGAON, BHWANIPATNA, KALAHANDI, ODISHA, 766003",
      }));
    } else if (value === "Other") {
      setFormData((prev) => ({ ...prev, collegeName: "", collegeAddress: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateUserProfile(formData);

        if (result.status === "requires_email_verification") {
          toast.info(result.message);
          setPendingVerifyEmail(result.pendingEmail || formData.email);
          setIsVerifyDialogOpen(true);
        } else if (result.status === "success") {
          setCurrentSavedEmail(formData.email);
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("An unexpected error occurred");
      }
    });
  };

  const handleEmailVerificationSuccess = (newEmail: string) => {
    setCurrentSavedEmail(newEmail);
    setFormData((prev) => ({ ...prev, email: newEmail }));
    setPendingVerifyEmail(null);
    setIsVerifyDialogOpen(false);
  };

  const handleEmailVerificationCancel = () => {
    // Revert form email to current active email
    setFormData((prev) => ({ ...prev, email: currentSavedEmail }));
    setPendingVerifyEmail(null);
    setIsVerifyDialogOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Personal ── */}
      <SubHeading>Personal Information</SubHeading>

      <div className="space-y-4 pt-2">
        {/* Display name */}
        <FormField
          id="name"
          label="Display name"
          required
          maxLength={FIELD_LIMITS.name}
          value={formData.name}
        >
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your full name"
            maxLength={FIELD_LIMITS.name}
            disabled={pending}
            className="h-9"
          />
        </FormField>

        {/* Username */}
        <FormField
          id="username"
          label="Username"
          maxLength={FIELD_LIMITS.username}
          value={formData.username}
          hint="*Username can only be changed once per 14 days"
        >
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="username"
            maxLength={FIELD_LIMITS.username}
            disabled={pending}
            className="h-9"
          />
        </FormField>

        {/* Name split */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField id="firstName" label="First name" maxLength={FIELD_LIMITS.firstName} value={formData.firstName}>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="First"
              maxLength={FIELD_LIMITS.firstName}
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="middleName" label="Middle name" maxLength={FIELD_LIMITS.middleName} value={formData.middleName}>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => set("middleName", e.target.value)}
              placeholder="Middle"
              maxLength={FIELD_LIMITS.middleName}
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="lastName" label="Last name" maxLength={FIELD_LIMITS.lastName} value={formData.lastName}>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Last"
              maxLength={FIELD_LIMITS.lastName}
              disabled={pending}
              className="h-9"
            />
          </FormField>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField id="email" label="Email address" required>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="mobileNumber" label="Mobile number">
            <Input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => set("mobileNumber", e.target.value)}
              placeholder="+91 9876543210"
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="whatsappNumber" label="WhatsApp number">
            <Input
              id="whatsappNumber"
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="+91 9876543210"
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="aadhaarNumber" label="Aadhaar number">
            <Input
              id="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={(e) => set("aadhaarNumber", e.target.value)}
              placeholder="XXXX XXXX XXXX"
              disabled={pending}
              className="h-9"
            />
          </FormField>
        </div>

        <FormField id="upiId" label="UPI ID">
          <Input
            id="upiId"
            value={formData.upiId}
            onChange={(e) => set("upiId", e.target.value)}
            placeholder="yourname@paytm"
            disabled={pending}
            className="h-9"
          />
        </FormField>
      </div>

      {/* ── Academic ── */}
      <SubHeading>Academic Information</SubHeading>

      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField id="admissionYear" label="Admission year">
            <Select
              value={formData.admissionYear}
              onValueChange={(v) => set("admissionYear", v)}
              disabled={pending}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {admissionYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="registration" label="Registration no.">
            <Input
              id="registration"
              value={formData.registration}
              onChange={(e) => set("registration", e.target.value)}
              placeholder="Reg number"
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="rollNumber" label="Roll number">
            <Input
              id="rollNumber"
              value={formData.rollNumber}
              onChange={(e) => set("rollNumber", e.target.value)}
              placeholder="Roll no."
              disabled={pending}
              className="h-9"
            />
          </FormField>
        </div>

        <FormField id="branch" label="Branch">
          <Select
            value={formData.branch}
            onValueChange={(v) => set("branch", v)}
            disabled={pending}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CSE">CSE</SelectItem>
              <SelectItem value="EE">EE</SelectItem>
              <SelectItem value="ME">ME</SelectItem>
              <SelectItem value="CE">CE</SelectItem>
              <SelectItem value="ECE">ECE</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField id="collegeName" label="College">
          <Select value={selectedCollege} onValueChange={handleCollegeChange} disabled={pending}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Select college" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GOVERNMENT COLLEGE OF ENGINEERING KALAHANDI, BHAWANIPATNA">
                GCEK, Bhawanipatna
              </SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {selectedCollege === "Other" && (
            <Input
              placeholder="Enter college name"
              value={formData.collegeName}
              onChange={(e) => set("collegeName", e.target.value)}
              disabled={pending}
              className="mt-2 h-9"
            />
          )}
        </FormField>

        <FormField id="collegeAddress" label="College address">
          <Input
            id="collegeAddress"
            value={formData.collegeAddress}
            onChange={(e) => set("collegeAddress", e.target.value)}
            placeholder="College address"
            disabled={
              pending ||
              selectedCollege === "GOVERNMENT COLLEGE OF ENGINEERING KALAHANDI, BHAWANIPATNA"
            }
            className="h-9"
          />
        </FormField>
      </div>

      {/* ── Address ── */}
      <SubHeading>Address Information</SubHeading>

      <div className="space-y-4 pt-2">
        <FormField id="address" label="Address">
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Street / locality"
            disabled={pending}
            className="h-9"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField id="postOffice" label="Post office">
            <Input
              id="postOffice"
              value={formData.postOffice}
              onChange={(e) => set("postOffice", e.target.value)}
              placeholder="Post office"
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="policeStation" label="Police station">
            <Input
              id="policeStation"
              value={formData.policeStation}
              onChange={(e) => set("policeStation", e.target.value)}
              placeholder="Police station"
              disabled={pending}
              className="h-9"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField id="block" label="Block">
            <Input
              id="block"
              value={formData.block}
              onChange={(e) => set("block", e.target.value)}
              placeholder="Block"
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="pinCode" label="Pin code">
            <Input
              id="pinCode"
              value={formData.pinCode}
              onChange={(e) => set("pinCode", e.target.value)}
              placeholder="Pin code"
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="state" label="State">
            <Select value={formData.state} onValueChange={handleStateChange} disabled={pending}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {statesDistrictsData.states.map((s) => (
                  <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField id="district" label="District">
          <Select
            value={formData.district}
            onValueChange={(v) => set("district", v)}
            disabled={!selectedState || pending}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {availableDistricts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Save */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="mb-10 bg-foreground text-background hover:bg-foreground/90 h-9 px-5 text-sm font-medium rounded-full cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>

    {/* Email OTP Verification Dialog */}
    <VerifyEmailDialog
      isOpen={isVerifyDialogOpen}
      onClose={handleEmailVerificationCancel}
      pendingEmail={pendingVerifyEmail || ""}
      onSuccess={handleEmailVerificationSuccess}
    />
  </>
);
}