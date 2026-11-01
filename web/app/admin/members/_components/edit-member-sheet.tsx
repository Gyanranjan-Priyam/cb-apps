/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  GraduationCap,
  MapPin,
  Globe,
  ShieldCheck,
  Loader2,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Check,
  CheckCircle2,
} from "lucide-react";
import statesDistrictsData from "@/lib/new/states-districts.json";
import {
  ASSIGNABLE_ROLES,
  AssignableRole,
  MAX_MEMBER_ROLES,
  parseMemberRoles,
  isSystemAdminRole,
  getRoleBadgeClasses,
} from "@/lib/member-roles";
import {
  PREDEFINED_DOMAINS,
  parseSpecializedDomains,
  getDomainBadgeClasses,
} from "@/lib/specialized-domains";
import { BRANCH_OPTIONS, getBranchCode } from "@/lib/branch-constants";
import { getActiveBatchesList } from "@/app/admin/batches/actions";
import { updateMemberDetails } from "../actions";

const admissionYearOptions = [
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
  "2026",
  "2027",
  "2028",
];

interface CustomLinkItem {
  id: string;
  title: string;
  url: string;
}

interface EditMemberSheetProps {
  isOpen: boolean;
  onClose: () => void;
  member: any | null;
  onSuccess?: () => void;
}

export function EditMemberSheet({
  isOpen,
  onClose,
  member,
  onSuccess,
}: EditMemberSheetProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchesList, setBatchesList] = useState<{ id: string; name: string; code: string }[]>([]);

  // Personal Fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [cbUserId, setCbUserId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");

  // Academic & Club Fields
  const [collegeName, setCollegeName] = useState("");
  const [collegeAddress, setCollegeAddress] = useState("");
  const [branch, setBranch] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [registration, setRegistration] = useState("");
  const [batchId, setBatchId] = useState<string>("none");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Member"]);

  // Address Fields
  const [stateVal, setStateVal] = useState("");
  const [districtVal, setDistrictVal] = useState("");
  const [address, setAddress] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [block, setBlock] = useState("");
  const [pinCode, setPinCode] = useState("");

  // Links & Socials
  const [githubUsername, setGithubUsername] = useState("");
  const [socialLinkedIn, setSocialLinkedIn] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialPortfolio, setSocialPortfolio] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialLeetCode, setSocialLeetCode] = useState("");
  const [socialCodeforces, setSocialCodeforces] = useState("");
  const [customLinks, setCustomLinks] = useState<CustomLinkItem[]>([]);

  // Account Status
  const [emailVerified, setEmailVerified] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  const isSystemAdmin = member ? isSystemAdminRole(member.role) : false;

  // Load batches on open
  useEffect(() => {
    if (isOpen) {
      getActiveBatchesList().then((list) => setBatchesList(list));
    }
  }, [isOpen]);

  // Pre-fill form when member changes
  useEffect(() => {
    if (member && isOpen) {
      setFirstName(member.firstName || "");
      setMiddleName(member.middleName || "");
      setLastName(member.lastName || "");
      setEmail(member.email || "");
      setUsername(member.username || "");
      setCbUserId(member.cbUserId || "");
      setMobileNumber(member.mobileNumber || "");
      setWhatsappNumber(member.whatsappNumber || "");
      setAadhaarNumber(member.aadhaarNumber || "");

      setCollegeName(member.collegeName || "");
      setCollegeAddress(member.collegeAddress || "");
      setBranch(getBranchCode(member.branch));
      setAdmissionYear(member.admissionYear || "");
      setRollNumber(member.rollNumber || "");
      setRegistration(member.registration || "");
      setBatchId(member.batchId || member.batch?.id || "none");

      const parsedDomains = parseSpecializedDomains(member.specializedDomain);
      setSelectedDomains(parsedDomains);
      setCustomDomainInput("");

      const parsedRoles = parseMemberRoles(member.role);
      const clubRoles = parsedRoles.filter((r) => r !== "Admin");
      setSelectedRoles(
        clubRoles.length > 0
          ? clubRoles
          : isSystemAdminRole(member.role)
          ? []
          : ["Member"]
      );

      setStateVal(member.state || "");
      setDistrictVal(member.district || "");
      setAddress(member.address || "");
      setPostOffice(member.postOffice || "");
      setPoliceStation(member.policeStation || "");
      setBlock(member.block || "");
      setPinCode(member.pinCode || "");

      setGithubUsername(member.githubUsername || "");
      const sLinks = member.socialLinks || {};
      setSocialLinkedIn(sLinks.linkedin || "");
      setSocialTwitter(sLinks.twitter || "");
      setSocialPortfolio(sLinks.portfolio || "");
      setSocialInstagram(sLinks.instagram || "");
      setSocialLeetCode(sLinks.leetcode || "");
      setSocialCodeforces(sLinks.codeforces || "");

      const cLinks = Array.isArray(member.customLinks)
        ? member.customLinks
        : [];
      setCustomLinks(cLinks);

      setEmailVerified(Boolean(member.emailVerified));
      setProfileComplete(Boolean(member.profileComplete));
      setActiveTab("personal");
    }
  }, [member, isOpen]);

  // District options based on chosen state
  const districtOptions = useMemo(() => {
    if (!stateVal) return [];
    const foundState = statesDistrictsData.states.find(
      (s) => s.state.toLowerCase() === stateVal.toLowerCase()
    );
    return foundState ? foundState.districts : [];
  }, [stateVal]);

  if (!member) return null;

  const handleToggleRole = (role: AssignableRole) => {
    if (role === "Member") {
      setSelectedRoles(isSystemAdmin ? [] : ["Member"]);
      return;
    }

    const withoutMember = selectedRoles.filter(
      (r) => r !== "Member" && r !== "Admin"
    );

    if (withoutMember.includes(role)) {
      const next = withoutMember.filter((r) => r !== role);
      setSelectedRoles(
        next.length === 0 ? (isSystemAdmin ? [] : ["Member"]) : next
      );
    } else {
      if (withoutMember.length >= MAX_MEMBER_ROLES) {
        toast.error(`Maximum ${MAX_MEMBER_ROLES} club roles can be assigned.`);
        return;
      }
      setSelectedRoles([...withoutMember, role]);
    }
  };

  const handleToggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleAddCustomDomain = () => {
    const trimmed = customDomainInput.trim();
    if (!trimmed) return;
    if (selectedDomains.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This domain is already selected.");
      return;
    }
    setSelectedDomains([...selectedDomains, trimmed]);
    setCustomDomainInput("");
  };

  const handleAddCustomLink = () => {
    setCustomLinks([
      ...customLinks,
      {
        id: crypto.randomUUID?.() || Date.now().toString(),
        title: "",
        url: "",
      },
    ]);
  };

  const handleUpdateCustomLink = (
    index: number,
    field: "title" | "url",
    value: string
  ) => {
    const next = [...customLinks];
    next[index] = { ...next[index], [field]: value };
    setCustomLinks(next);
  };

  const handleRemoveCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const socialLinksData: Record<string, string> = {};
      if (socialLinkedIn.trim()) socialLinksData.linkedin = socialLinkedIn.trim();
      if (socialTwitter.trim()) socialLinksData.twitter = socialTwitter.trim();
      if (socialPortfolio.trim()) socialLinksData.portfolio = socialPortfolio.trim();
      if (socialInstagram.trim()) socialLinksData.instagram = socialInstagram.trim();
      if (socialLeetCode.trim()) socialLinksData.leetcode = socialLeetCode.trim();
      if (socialCodeforces.trim()) socialLinksData.codeforces = socialCodeforces.trim();
      if (githubUsername.trim()) socialLinksData.github = githubUsername.trim();

      const validCustomLinks = customLinks.filter(
        (l) => l.title.trim() && l.url.trim()
      );

      const result = await updateMemberDetails({
        id: member.id,
        firstName: firstName.trim() || null,
        middleName: middleName.trim() || null,
        lastName: lastName.trim() || null,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase() || null,
        cbUserId: member.cbUserId || null,
        mobileNumber: mobileNumber.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        aadhaarNumber: aadhaarNumber.trim() || null,
        collegeName: collegeName.trim() || null,
        collegeAddress: collegeAddress.trim() || null,
        branch: branch.trim() || null,
        admissionYear: admissionYear.trim() || null,
        rollNumber: rollNumber.trim() || null,
        registration: registration.trim() || null,
        batchId: batchId === "none" ? null : batchId,
        specializedDomain:
          selectedDomains.length > 0 ? selectedDomains.join(", ") : null,
        roles: selectedRoles,
        state: stateVal.trim() || null,
        district: districtVal.trim() || null,
        address: address.trim() || null,
        postOffice: postOffice.trim() || null,
        policeStation: policeStation.trim() || null,
        block: block.trim() || null,
        pinCode: pinCode.trim() || null,
        githubUsername: githubUsername.trim() || null,
        socialLinks: Object.keys(socialLinksData).length > 0 ? socialLinksData : null,
        customLinks: validCustomLinks.length > 0 ? validCustomLinks : null,
        emailVerified,
        profileComplete,
      });

      if (result.status === "success") {
        toast.success(result.message);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update member details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col h-full bg-background border-l border-border z-50 overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-6 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Edit Member Details
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-1">
                Updating <span className="font-semibold text-foreground">{member.name}</span> ({member.email})
              </SheetDescription>
            </div>
            {member.cbUserId && (
              <Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex">
                {member.cbUserId}
              </Badge>
            )}
          </div>
        </div>

        {/* Scrollable Form Body with Tabs */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Tab Navigation */}
            <div className="px-6 pt-3 pb-3 border-b border-border bg-background shrink-0">
              <TabsList className="grid grid-cols-5 w-full h-10 p-1 bg-muted/60">
                <TabsTrigger value="personal" className="text-xs flex items-center gap-1.5 px-2 cursor-pointer">
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="text-xs flex items-center gap-1.5 px-2 cursor-pointer">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Academic</span>
                </TabsTrigger>
                <TabsTrigger value="address" className="text-xs flex items-center gap-1.5 px-2 cursor-pointer">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Address</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="text-xs flex items-center gap-1.5 px-2 cursor-pointer">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Links</span>
                </TabsTrigger>
                <TabsTrigger value="status" className="text-xs flex items-center gap-1.5 px-2 cursor-pointer">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Status</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable Tab Contents */}
            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onWheel={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              {/* 1. PERSONAL TAB */}
              <TabsContent value="personal" className="mt-0 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Basic Identity & Contact
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Names, email credentials, identification, and contact phone numbers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-medium">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="middleName" className="text-xs font-medium">
                      Middle Name
                    </Label>
                    <Input
                      id="middleName"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="e.g. Robert"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-medium">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@example.com"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Used for authentication and notifications.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-medium">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      placeholder="johndoe"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Public handle (alphanumeric).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cbUserId" className="text-xs font-medium flex items-center justify-between">
                      <span>CB User ID</span>
                      <span className="text-[10px] text-muted-foreground font-normal">System Generated</span>
                    </Label>
                    <Input
                      id="cbUserId"
                      value={cbUserId || "Not Assigned"}
                      disabled
                      readOnly
                      className="font-mono text-xs bg-muted/50 cursor-not-allowed select-all text-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Unique Club Identification Code (Non-editable).
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aadhaarNumber" className="text-xs font-medium">
                      Aadhaar Number
                    </Label>
                    <Input
                      id="aadhaarNumber"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      placeholder="12 digits"
                      maxLength={12}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      12-digit government identification.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="mobileNumber" className="text-xs font-medium">
                      Mobile Number
                    </Label>
                    <Input
                      id="mobileNumber"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsappNumber" className="text-xs font-medium">
                      WhatsApp Number
                    </Label>
                    <Input
                      id="whatsappNumber"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 2. ACADEMIC TAB */}
              <TabsContent value="academic" className="mt-0 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Academic & Club Assignments
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    College department, batch enrolment, club roles, and technical domains.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="collegeName" className="text-xs font-medium">
                      College / Institute Name
                    </Label>
                    <Input
                      id="collegeName"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="Government College of Engineering, Kalahandi"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="collegeAddress" className="text-xs font-medium">
                      College Address
                    </Label>
                    <Input
                      id="collegeAddress"
                      value={collegeAddress}
                      onChange={(e) => setCollegeAddress(e.target.value)}
                      placeholder="Bhawanipatna, Kalahandi, Odisha"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="branch" className="text-xs font-medium">
                      Branch / Department
                    </Label>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger id="branch" className="w-full">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCH_OPTIONS.map((b) => (
                          <SelectItem key={b.code} value={b.code}>
                            {b.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admissionYear" className="text-xs font-medium">
                      Admission / Joining Year
                    </Label>
                    <Select value={admissionYear} onValueChange={setAdmissionYear}>
                      <SelectTrigger id="admissionYear" className="w-full">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {admissionYearOptions.map((yr) => (
                          <SelectItem key={yr} value={yr}>
                            {yr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="registration" className="text-xs font-medium">
                      Registration Number
                    </Label>
                    <Input
                      id="registration"
                      value={registration}
                      onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                      placeholder="2101109XXX"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rollNumber" className="text-xs font-medium">
                      Roll Number
                    </Label>
                    <Input
                      id="rollNumber"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                      placeholder="CSE-21-XX"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="batchId" className="text-xs font-medium flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      Assigned Batch
                    </Label>
                    <Select value={batchId} onValueChange={setBatchId}>
                      <SelectTrigger id="batchId" className="w-full">
                        <SelectValue placeholder="Select Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Batch Assigned</SelectItem>
                        {batchesList.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Specialized Domains */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Specialized Domains
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedDomains.length} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border rounded-md bg-muted/20">
                    {PREDEFINED_DOMAINS.map((domain) => {
                      const isSelected = selectedDomains.includes(domain);
                      const { badgeClass } = getDomainBadgeClasses(domain);
                      return (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => handleToggleDomain(domain)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? `${badgeClass} ring-2 ring-primary/40 font-medium`
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          {domain}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add custom domain..."
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomDomain();
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomDomain}
                      className="h-8 text-xs shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Club Roles */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Assigned Club Roles (Max {MAX_MEMBER_ROLES})
                    </Label>
                    {isSystemAdmin && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px]">
                        System Admin
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ASSIGNABLE_ROLES.map((role) => {
                      const isSelected = selectedRoles.includes(role);
                      const { badgeClass } = getRoleBadgeClasses(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleToggleRole(role)}
                          className={`text-xs p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? `${badgeClass} ring-1 ring-primary/40 font-medium`
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          <span className="truncate">{role}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* 3. ADDRESS TAB */}
              <TabsContent value="address" className="mt-0 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Residential Address & Location
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    State, district, postal jurisdiction, and full street address.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="stateVal" className="text-xs font-medium">
                      State / UT
                    </Label>
                    <Select
                      value={stateVal}
                      onValueChange={(val) => {
                        setStateVal(val);
                        setDistrictVal("");
                      }}
                    >
                      <SelectTrigger id="stateVal" className="w-full">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {statesDistrictsData.states.map((s) => (
                          <SelectItem key={s.state} value={s.state}>
                            {s.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="districtVal" className="text-xs font-medium">
                      District
                    </Label>
                    <Select
                      value={districtVal}
                      onValueChange={setDistrictVal}
                      disabled={!stateVal || districtOptions.length === 0}
                    >
                      <SelectTrigger id="districtVal" className="w-full">
                        <SelectValue placeholder={stateVal ? "Select District" : "Select State First"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {districtOptions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-medium">
                    Full Street Address
                  </Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Apartment, Street, Landmark..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="postOffice" className="text-xs font-medium">
                      Post Office
                    </Label>
                    <Input
                      id="postOffice"
                      value={postOffice}
                      onChange={(e) => setPostOffice(e.target.value)}
                      placeholder="P.O. Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="policeStation" className="text-xs font-medium">
                      Police Station
                    </Label>
                    <Input
                      id="policeStation"
                      value={policeStation}
                      onChange={(e) => setPoliceStation(e.target.value)}
                      placeholder="P.S. Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="block" className="text-xs font-medium">
                      Block
                    </Label>
                    <Input
                      id="block"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      placeholder="Block Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pinCode" className="text-xs font-medium">
                      PIN Code
                    </Label>
                    <Input
                      id="pinCode"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6 digits"
                      maxLength={6}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 4. LINKS & SOCIALS TAB */}
              <TabsContent value="links" className="mt-0 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Social Profiles & Portfolio Links
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Connect GitHub, LinkedIn, coding platforms, and custom showcase links.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="githubUsername" className="text-xs font-medium">
                      GitHub Username
                    </Label>
                    <Input
                      id="githubUsername"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value.replace(/^@/, ""))}
                      placeholder="octocat"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Without @ symbol. Feeds GitHub live contribution graph.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="socialLinkedIn" className="text-xs font-medium">
                      LinkedIn URL or Username
                    </Label>
                    <Input
                      id="socialLinkedIn"
                      value={socialLinkedIn}
                      onChange={(e) => setSocialLinkedIn(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="socialTwitter" className="text-xs font-medium">
                      Twitter / X URL or Handle
                    </Label>
                    <Input
                      id="socialTwitter"
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      placeholder="https://x.com/username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="socialPortfolio" className="text-xs font-medium">
                      Portfolio / Website URL
                    </Label>
                    <Input
                      id="socialPortfolio"
                      value={socialPortfolio}
                      onChange={(e) => setSocialPortfolio(e.target.value)}
                      placeholder="https://mywebsite.dev"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="socialInstagram" className="text-xs font-medium">
                      Instagram Handle / URL
                    </Label>
                    <Input
                      id="socialInstagram"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="socialLeetCode" className="text-xs font-medium">
                      LeetCode Username
                    </Label>
                    <Input
                      id="socialLeetCode"
                      value={socialLeetCode}
                      onChange={(e) => setSocialLeetCode(e.target.value)}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="socialCodeforces" className="text-xs font-medium">
                      Codeforces Handle
                    </Label>
                    <Input
                      id="socialCodeforces"
                      value={socialCodeforces}
                      onChange={(e) => setSocialCodeforces(e.target.value)}
                      placeholder="handle"
                    />
                  </div>
                </div>

                <Separator />

                {/* Custom Links */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium">Custom Links</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Add links to personal blogs, projects, or other platforms.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomLink}
                      className="h-8 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Link
                    </Button>
                  </div>

                  {customLinks.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                      No custom links added yet. Click &quot;Add Link&quot; to add one.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {customLinks.map((link, idx) => (
                        <div key={link.id || idx} className="flex items-center gap-2">
                          <Input
                            placeholder="Link Title (e.g. Blog)"
                            value={link.title}
                            onChange={(e) =>
                              handleUpdateCustomLink(idx, "title", e.target.value)
                            }
                            className="w-1/3 h-8 text-xs"
                          />
                          <Input
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) =>
                              handleUpdateCustomLink(idx, "url", e.target.value)
                            }
                            className="flex-1 h-8 text-xs font-mono"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCustomLink(idx)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 5. STATUS TAB */}
              <TabsContent value="status" className="mt-0 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Account Status & Verification
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Control verification badges and profile onboarding status.
                  </p>
                </div>

                <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailVerifiedSwitch" className="text-xs font-medium">
                        Email Verified
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Marks the member&apos;s email address as verified in the system.
                      </p>
                    </div>
                    <Switch
                      id="emailVerifiedSwitch"
                      checked={emailVerified}
                      onCheckedChange={setEmailVerified}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="profileCompleteSwitch" className="text-xs font-medium">
                        Profile Completed
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Sets the member profile completeness state.
                      </p>
                    </div>
                    <Switch
                      id="profileCompleteSwitch"
                      checked={profileComplete}
                      onCheckedChange={setProfileComplete}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 border-t border-border/80 bg-background/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
