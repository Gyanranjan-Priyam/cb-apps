"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Globe,
  BrainCircuit,
  Cloud,
  ShieldCheck,
  Smartphone,
  Code2,
  Palette,
  Cpu,
  Gamepad2,
  Bot,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UserCheck,
  Settings,
  Plus,
  Loader2,
  X,
  Layers,
} from "lucide-react";
import { PREDEFINED_DOMAINS, parseSpecializedDomains } from "@/lib/specialized-domains";
import { isSystemAdminRole } from "@/lib/member-roles";
import { saveUserSpecializedDomain, completeUserOnboarding } from "../actions";
import { toast } from "sonner";

interface OnboardingDialogProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    specializedDomain?: string | null;
    profileComplete?: boolean;
    hasCompletedOnboarding?: boolean;
    hasLoggedIn?: boolean;
    role?: string | null;
    registration?: string | null;
    branch?: string | null;
  };
}

interface DomainOption {
  name: string;
  category: string;
  icon: React.ElementType;
  description: string;
}

const DOMAIN_OPTIONS: DomainOption[] = [
  {
    name: "Web Development",
    category: "Development",
    icon: Globe,
    description: "Frontend, Backend & Full-Stack Modern Web",
  },
  {
    name: "AI & Machine Learning",
    category: "Intelligence",
    icon: BrainCircuit,
    description: "Deep Learning, LLMs, NLP & Data Science",
  },
  {
    name: "Cloud Computing & DevOps",
    category: "Infrastructure",
    icon: Cloud,
    description: "Docker, Kubernetes, AWS & CI/CD Pipelines",
  },
  {
    name: "Cybersecurity",
    category: "Security",
    icon: ShieldCheck,
    description: "Ethical Hacking, Auditing & Network Security",
  },
  {
    name: "Mobile App Development",
    category: "Development",
    icon: Smartphone,
    description: "Flutter, React Native, Android & iOS",
  },
  {
    name: "Competitive Programming",
    category: "Algorithms",
    icon: Code2,
    description: "DSA, Codeforces, LeetCode & Contests",
  },
  {
    name: "UI/UX Design",
    category: "Design",
    icon: Palette,
    description: "Figma, Wireframing, Prototypes & User Research",
  },
  {
    name: "Blockchain & Web3",
    category: "Decentralized",
    icon: Layers,
    description: "Smart Contracts, Solidity & DApps",
  },
  {
    name: "Embedded Systems & IoT",
    category: "Hardware",
    icon: Cpu,
    description: "Arduino, ESP32, Sensors & Automation",
  },
  {
    name: "Game Development",
    category: "Interactive",
    icon: Gamepad2,
    description: "Unity, Unreal Engine, 2D/3D Game Design",
  },
  {
    name: "Robotics & Automation",
    category: "Robotics",
    icon: Bot,
    description: "ROS, Autonomous Systems & Hardware Control",
  },
];

export function OnboardingDialog({ user }: OnboardingDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedDomains, setSelectedDomains] = useState<string[]>(() =>
    parseSpecializedDomains(user.specializedDomain)
  );
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [isPending, startTransition] = useTransition();

  // Exclude users who already completed onboarding or are system administrators
  const isExcluded = Boolean(user?.hasCompletedOnboarding || isSystemAdminRole(user?.role));

  // Check whether onboarding should be displayed
  useEffect(() => {
    if (!user?.id || isExcluded) return;

    // Show onboarding only for first-time users who have not completed onboarding
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [user?.id, isExcluded]);

  // If user already completed onboarding or is admin, never render anything
  if (isExcluded) {
    return null;
  }

  const handleClose = () => {
    if (user?.id) {
      // Mark onboarding as completed in database asynchronously
      startTransition(async () => {
        try {
          await completeUserOnboarding();
        } catch (err) {
          console.error("Failed to mark onboarding completed:", err);
        }
      });
    }
    setIsOpen(false);
  };

  const toggleDomain = (domainName: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domainName)
        ? prev.filter((d) => d !== domainName)
        : [...prev, domainName]
    );
  };

  const handleAddCustomDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDomainInput.trim();
    if (!trimmed) return;

    if (!selectedDomains.includes(trimmed)) {
      setSelectedDomains((prev) => [...prev, trimmed]);
    }
    setCustomDomainInput("");
  };

  const handleRemoveDomain = (domainName: string) => {
    setSelectedDomains((prev) => prev.filter((d) => d !== domainName));
  };

  const handleSaveDomains = () => {
    if (selectedDomains.length === 0) {
      toast.error("Please select at least one domain to continue.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveUserSpecializedDomain(selectedDomains);
        if (result.status === "success") {
          toast.success("Domain preferences saved successfully!");
          setCurrentStep(3);
        } else {
          toast.error(result.message || "Failed to save domain preferences");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred while saving.");
      }
    });
  };

  const handleRedirectToSettings = () => {
    handleClose();
    router.push("/dashboard/settings");
  };

  const firstName = user.name?.split(" ")[0] || "CodeBreaker";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-2xl w-full p-0 max-h-[86dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden border-border bg-card shadow-2xl rounded-2xl"
        data-lenis-prevent
      >
        {/* Progress Bar Top Indicator */}
        <div className="w-full bg-muted h-1.5 flex shrink-0">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{
              width:
                currentStep === 1 ? "33.33%" : currentStep === 2 ? "66.66%" : "100%",
            }}
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STEP 1: WELCOME & GREETING
           ───────────────────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7 space-y-4 sm:space-y-5">
            <DialogHeader className="space-y-3 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <div className="size-10 sm:size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Image
                    src="/assets/logo.png"
                    alt="CodeBreakers Logo"
                    width={28}
                    height={28}
                    className="size-7 sm:size-8 object-contain"
                  />
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary bg-primary/5 px-2.5 py-0.5 text-xs font-mono"
                >
                  Step 1 of 2
                </Badge>
              </div>

              <div className="space-y-1">
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Welcome to CodeBreakers, {firstName}! 👋
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We are extremely happy to have you on board! CodeBreakers is your collaborative learning and development platform at GCEK.
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Quick onboarding perks card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                <div className="size-6 sm:size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="size-3.5 sm:size-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Choose Domains</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Select your tracks (Web, AI/ML, Cloud, Security) to tailor activities.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                <div className="size-6 sm:size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="size-3.5 sm:size-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Complete Profile</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Fill in your Branch, Roll No, and GitHub in Settings for verified club perks.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                <div className="size-6 sm:size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Settings className="size-3.5 sm:size-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Sync Anytime</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  You and admins can update your details and domain anytime.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedirectToSettings}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground cursor-pointer h-8"
              >
                Skip to Profile Settings
              </Button>

              <Button
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto gap-2 text-xs font-medium cursor-pointer shadow-sm h-9"
              >
                <span>Choose Interested Domains</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 2: DOMAIN SELECTION
           ───────────────────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7 space-y-4">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary bg-primary/5 px-2.5 py-0.5 text-xs font-mono"
                >
                  Step 2 of 2
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedDomains.length} domain{selectedDomains.length === 1 ? "" : "s"} selected
                </span>
              </div>

              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Which domain(s) are you interested in? 🎯
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Select all areas you&apos;d like to explore in CodeBreakers. You and admins can modify this later in Settings.
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Selected tags chip bar if any */}
            {selectedDomains.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-muted/30 border border-border/70 max-h-24 overflow-y-auto no-scrollbar">
                {selectedDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/25 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <span>{domain}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      className="hover:text-destructive transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Domain Grid with Scrollable Box */}
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 no-scrollbar border border-border/60 rounded-xl p-2.5 bg-muted/15">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DOMAIN_OPTIONS.map((item) => {
                  const isSelected = selectedDomains.includes(item.name);
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleDomain(item.name)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                          : "border-border/80 bg-card hover:bg-muted/60 hover:border-border"
                      }`}
                    >
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isSelected ? "text-foreground font-bold" : "text-foreground"
                            }`}
                          >
                            {item.name}
                          </span>
                          {isSelected && (
                            <Check className="size-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Other predefined domains if not in the primary grid */}
              <div className="pt-2 border-t border-border/60">
                <span className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                  More Tracks:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_DOMAINS.filter(
                    (p) => !DOMAIN_OPTIONS.some((opt) => opt.name === p)
                  ).map((extraDomain) => {
                    const isSelected = selectedDomains.includes(extraDomain);
                    return (
                      <button
                        key={extraDomain}
                        type="button"
                        onClick={() => toggleDomain(extraDomain)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {isSelected && <Check className="size-3 inline mr-1" />}
                        {extraDomain}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Custom Domain Input */}
            <form
              onSubmit={handleAddCustomDomain}
              className="flex items-center gap-2 pt-1"
            >
              <Input
                placeholder="Don't see your domain? Type custom domain..."
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1 cursor-pointer shrink-0"
              >
                <Plus className="size-3.5" />
                <span>Add</span>
              </Button>
            </form>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-between gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                disabled={isPending}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleSaveDomains}
                  disabled={isPending || selectedDomains.length === 0}
                  className="text-xs gap-2 font-medium cursor-pointer shadow-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Saving Preferences...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Continue</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 3: SUCCESS & COMPLETE PROFILE PROMPT
           ───────────────────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="mx-auto size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-in zoom-in-75 duration-200">
              <Check className="size-7 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                You&apos;re All Set! 🎉
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your domain preferences have been saved. Kindly complete your remaining profile details (Branch, Roll No, Admission Year, GitHub) in Settings to unlock verified member features and track assignments.
              </DialogDescription>
            </div>

            {/* Info summary card */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Selected Domains:</span>
                <span className="font-semibold text-foreground">
                  {selectedDomains.length} track{selectedDomains.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedDomains.map((d) => (
                  <Badge
                    key={d}
                    variant="secondary"
                    className="text-[11px] font-normal"
                  >
                    {d}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                💡 You and club admins can edit these domains anytime from your Profile Settings.
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto text-xs cursor-pointer"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={handleRedirectToSettings}
                className="w-full sm:w-auto text-xs gap-2 cursor-pointer shadow-sm"
              >
                <Settings className="size-3.5" />
                <span>Complete Profile in Settings</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
