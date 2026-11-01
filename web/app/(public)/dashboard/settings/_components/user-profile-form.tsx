"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, X, Plus, Check } from "lucide-react";
import { updateUserProfileData } from "../actions";
import statesDistrictsData from "@/lib/new/states-districts.json";
import { cn } from "@/lib/utils";
import { VerifyEmailDialog } from "@/components/email-verification/verify-email-dialog";
import {
  PREDEFINED_DOMAINS,
  parseSpecializedDomains,
  serializeSpecializedDomains,
} from "@/lib/specialized-domains";
import { BRANCH_OPTIONS, getBranchCode } from "@/lib/branch-constants";

interface UserProfileFormProps {
  initialData: {
    name: string;
    email: string;
    mobileNumber?: string | null;
    whatsappNumber?: string | null;
    aadhaarNumber?: string | null;
    state?: string | null;
    district?: string | null;
    collegeName?: string | null;
    collegeAddress?: string | null;
    username?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    registration?: string | null;
    rollNumber?: string | null;
    branch?: string | null;
    admissionYear?: string | null;
    address?: string | null;
    postOffice?: string | null;
    policeStation?: string | null;
    block?: string | null;
    pinCode?: string | null;
    specializedDomain?: string | null;
  };
}

const FIELD_LIMITS: Partial<Record<string, number>> = {
  name: 60,
  username: 30,
  firstName: 30,
  middleName: 30,
  lastName: 30,
};

function FieldCounter({ value, max }: { value: string; max: number }) {
  const len = (value || "").length;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        len > max ? "text-destructive" : "text-muted-foreground"
      )}
    >
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

export function UserProfileForm({ initialData }: UserProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    email: initialData.email || "",
    mobileNumber: initialData.mobileNumber || "",
    whatsappNumber: initialData.whatsappNumber || "",
    aadhaarNumber: initialData.aadhaarNumber || "",
    state: initialData.state || "",
    district: initialData.district || "",
    collegeName: initialData.collegeName || "",
    collegeAddress: initialData.collegeAddress || "",
    username: initialData.username || "",
    firstName: initialData.firstName || "",
    middleName: initialData.middleName || "",
    lastName: initialData.lastName || "",
    registration: initialData.registration || "",
    rollNumber: initialData.rollNumber || "",
    branch: getBranchCode(initialData.branch),
    admissionYear: initialData.admissionYear || "",
    address: initialData.address || "",
    postOffice: initialData.postOffice || "",
    policeStation: initialData.policeStation || "",
    block: initialData.block || "",
    pinCode: initialData.pinCode || "",
    specializedDomain: initialData.specializedDomain || "",
  });

  const [customDomainInput, setCustomDomainInput] = useState("");
  const [currentSavedEmail, setCurrentSavedEmail] = useState(initialData.email || "");
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  const currentDomains = useMemo(
    () => parseSpecializedDomains(formData.specializedDomain),
    [formData.specializedDomain]
  );

  const toggleDomain = (domain: string) => {
    const updated = currentDomains.includes(domain)
      ? currentDomains.filter((d) => d !== domain)
      : [...currentDomains, domain];
    set("specializedDomain", serializeSpecializedDomains(updated) || "");
  };

  const handleAddCustomDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDomainInput.trim();
    if (!trimmed) return;
    if (!currentDomains.includes(trimmed)) {
      const updated = [...currentDomains, trimmed];
      set("specializedDomain", serializeSpecializedDomains(updated) || "");
    }
    setCustomDomainInput("");
  };

  const handleRemoveDomain = (domain: string) => {
    const updated = currentDomains.filter((d) => d !== domain);
    set("specializedDomain", serializeSpecializedDomains(updated) || "");
  };

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
    const stateData = statesDistrictsData.states.find(
      (s) => s.state === selectedState
    );
    return stateData?.districts || [];
  }, [selectedState]);

  const currentYear = new Date().getFullYear();
  const admissionYears = Array.from({ length: currentYear - 2022 + 2 }, (_, i) => 2023 + i);

  const set = (field: string, value: string) =>
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
        const result = await updateUserProfileData(formData);

        if (result.status === "requires_email_verification") {
          toast.info("Verification Required", {
            description: result.message || "Please enter the OTP sent to your new email address.",
          });
          setPendingVerifyEmail(result.pendingEmail || formData.email);
          setIsVerifyDialogOpen(true);
        } else if (result.status === "success") {
          setCurrentSavedEmail(formData.email);
          toast.success("Profile updated successfully!", {
            description: result.message || "Your personal details and preferences have been saved.",
          });
        } else {
          toast.error("Failed to update profile", {
            description: result.message || "Please check the entered values.",
          });
        }
      } catch {
        toast.error("Update failed", {
          description: "An unexpected error occurred while saving your profile.",
        });
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
          <FormField
            id="firstName"
            label="First name"
            maxLength={FIELD_LIMITS.firstName}
            value={formData.firstName}
          >
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
          <FormField
            id="middleName"
            label="Middle name"
            maxLength={FIELD_LIMITS.middleName}
            value={formData.middleName}
          >
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
          <FormField
            id="lastName"
            label="Last name"
            maxLength={FIELD_LIMITS.lastName}
            value={formData.lastName}
          >
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
              required
              disabled={pending}
              className="h-9"
            />
          </FormField>
          <FormField id="mobileNumber" label="Mobile number" required>
            <Input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => set("mobileNumber", e.target.value)}
              placeholder="+91 9876543210"
              required
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
          <FormField id="aadhaarNumber" label="Aadhaar number" required>
            <Input
              id="aadhaarNumber"
              type="text"
              value={formData.aadhaarNumber}
              onChange={(e) =>
                set("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))
              }
              placeholder="123456789012"
              required
              disabled={pending}
              maxLength={12}
              className="h-9"
            />
          </FormField>
        </div>
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
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
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
              {BRANCH_OPTIONS.map((b) => (
                <SelectItem key={b.code} value={b.code}>
                  {b.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField id="collegeName" label="College" required>
          <Select
            value={selectedCollege}
            onValueChange={handleCollegeChange}
            disabled={pending}
          >
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

        <FormField id="collegeAddress" label="College address" required>
          <Textarea
            id="collegeAddress"
            value={formData.collegeAddress}
            onChange={(e) => set("collegeAddress", e.target.value)}
            placeholder="College address"
            disabled={
              pending ||
              selectedCollege ===
                "GOVERNMENT COLLEGE OF ENGINEERING KALAHANDI, BHAWANIPATNA"
            }
            rows={2}
            className="text-sm resize-none"
          />
        </FormField>
      </div>

      {/* ── Domain Preferences ── */}
      <SubHeading>Interested Domains & Specialized Tracks</SubHeading>

      <div className="space-y-3 pt-2">
        <p className="text-xs text-muted-foreground">
          Select the technical and creative areas you are interested in or specialize in. Admins and you can update these at any time.
        </p>

        {/* Selected domain badges */}
        {currentDomains.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-muted/30 border border-border/80">
            {currentDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/25"
              >
                <span>{domain}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDomain(domain)}
                  disabled={pending}
                  className="hover:text-destructive transition-colors cursor-pointer"
                  title="Remove domain"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Predefined domain chips list */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PREDEFINED_DOMAINS.map((domain) => {
            const isSelected = currentDomains.includes(domain);
            return (
              <button
                key={domain}
                type="button"
                onClick={() => toggleDomain(domain)}
                disabled={pending}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {isSelected && <Check className="size-3 inline mr-1" />}
                {domain}
              </button>
            );
          })}
        </div>

        {/* Custom domain input */}
        <div className="flex items-center gap-2 pt-1">
          <Input
            placeholder="Add another custom domain / track..."
            value={customDomainInput}
            onChange={(e) => setCustomDomainInput(e.target.value)}
            disabled={pending}
            className="text-xs h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomDomain}
            disabled={pending || !customDomainInput.trim()}
            className="h-9 text-xs gap-1 cursor-pointer shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </Button>
        </div>
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
              onChange={(e) =>
                set("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Pin code"
              disabled={pending}
              maxLength={6}
              className="h-9"
            />
          </FormField>
          <FormField id="state" label="State" required>
            <Select
              value={formData.state}
              onValueChange={handleStateChange}
              disabled={pending}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {statesDistrictsData.states.map((s) => (
                  <SelectItem key={s.state} value={s.state}>
                    {s.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField id="district" label="District" required>
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
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Save Button */}
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