/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import {
  Mail,
  Phone,
  MapPin,
  School,
  Hash,
  User,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Target,
  ExternalLink,
  Check,
  Share2,
  Building2,
  Compass,
  FileText,
  Award,
} from "lucide-react";
import { parseMemberRoles } from "@/lib/member-roles";
import { parseSpecializedDomains } from "@/lib/specialized-domains";
import { getBranchFullName } from "@/lib/branch-constants";
import { getUserProfileImageUrl } from "@/lib/image-utils";
import GitHubContributionCalendar from "@/components/member/github-contribution-calendar";
import {
  GitHubIcon,
  LinkedInIcon,
  XTwitterIcon,
  InstagramIcon,
  LeetCodeIcon,
  CodeforcesIcon,
  PortfolioIcon,
  CustomLinkIcon,
} from "@/components/icons/social-icons";
import Image from "next/image";

export interface SocialLinksData {
  github?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  leetcode?: string | null;
  codeforces?: string | null;
  portfolio?: string | null;
}

export interface CustomLinkItem {
  id: string;
  title: string;
  url: string;
}

interface MemberPublicProfileProps {
  member: {
    id: string;
    cbUserId: string | null;
    name: string;
    email: string;
    username: string | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    profileImageKey: string | null;
    image?: string | null;
    registration: string | null;
    rollNumber: string | null;
    branch: string | null;
    admissionYear: string | null;
    mobileNumber: string | null;
    whatsappNumber: string | null;
    collegeName: string | null;
    collegeAddress: string | null;
    state?: string | null;
    district?: string | null;
    address?: string | null;
    postOffice?: string | null;
    policeStation?: string | null;
    block?: string | null;
    pinCode?: string | null;
    aadhaarNumber?: string | null;
    githubUsername?: string | null;
    specializedDomain?: string | null;
    socialLinks?: any;
    customLinks?: any;
    profileComplete?: boolean;
    batch?: {
      id: string;
      name: string;
      code: string;
    } | null;
    createdAt: Date;
    role?: string | null;
    banned: boolean | null;
  };
}

export default function MemberPublicProfile({ member }: MemberPublicProfileProps) {
  const [copied, setCopied] = useState(false);

  // Dismiss any existing background/socket toasts upon visiting public member profile
  useEffect(() => {
    toast.dismiss();
  }, []);

  // Generate initials from name
  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "CB"
    );
  };

  // Get profile image URL (prioritizes custom uploaded S3 image, falls back to OAuth/Google image)
  const profileImageUrl = getUserProfileImageUrl({
    profileImageKey: member.profileImageKey,
    image: member.image,
  });

  const domains = parseSpecializedDomains(member.specializedDomain);
  const roles = parseMemberRoles(member.role);

  // Handle Share / Copy Link
  const handleCopyProfileLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Profile link copied to clipboard!", {
          description: "URL ready to share with others",
        });
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Format external URLs
  const formatUrl = (url: string, defaultDomainPrefix?: string) => {
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (defaultDomainPrefix) {
      return `${defaultDomainPrefix}${trimmed.replace(/^@/, "")}`;
    }
    return `https://${trimmed}`;
  };

  const extractHandle = (urlOrHandle: string, fallback?: string | null) => {
    if (!urlOrHandle) return fallback || "";
    const trimmed = urlOrHandle.trim().replace(/^@/, "");
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const urlObj = new URL(trimmed);
        const segments = urlObj.pathname.split("/").filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && last !== "in" && last !== "u" && last !== "profile") {
          return last;
        }
      }
    } catch {
      // ignore
    }
    const clean = trimmed
      .replace(/^https?:\/\/(www\.)?[^/]+\/?/i, "")
      .replace(/\/$/, "");
    return clean || fallback || trimmed;
  };

  // Social links extraction
  const socialData = (member.socialLinks || {}) as SocialLinksData;
  const customLinksList = ((member.customLinks || []) as CustomLinkItem[]).filter(
    (item) => item && item.title?.trim() && item.url?.trim()
  );

  const github = member.githubUsername || socialData?.github;
  const linkedin = socialData?.linkedin?.trim();
  const twitter = socialData?.twitter?.trim();
  const instagram = socialData?.instagram?.trim();
  const leetcode = socialData?.leetcode?.trim();
  const codeforces = socialData?.codeforces?.trim();
  const portfolio = socialData?.portfolio?.trim();

  const hasAnySocial = Boolean(
    github ||
      linkedin ||
      twitter ||
      instagram ||
      leetcode ||
      codeforces ||
      portfolio ||
      customLinksList.length > 0
  );

  // Check if any location field exists
  const hasLocation = Boolean(
    member.address ||
      member.postOffice ||
      member.policeStation ||
      member.block ||
      member.district ||
      member.state ||
      member.pinCode
  );

  // Role badge color helper in Neo-brutalism theme
  const getNeoRoleBadge = (roleName: string, index: number) => {
    const r = roleName.toLowerCase().trim();
    if (r === "admin") {
      return "bg-[#000000] text-white border-black";
    }
    if (r.includes("secretary") || r.includes("lead")) {
      return "bg-[#FF6B6B] text-white border-black";
    }
    if (r.includes("tech") || r.includes("developer")) {
      return "bg-[#FFD93D] text-black border-black";
    }
    if (r.includes("management") || r.includes("event") || r.includes("social")) {
      return "bg-[#C4B5FD] text-black border-black";
    }
    const palette = [
      "bg-[#FFD93D] text-black border-black",
      "bg-[#C4B5FD] text-black border-black",
      "bg-[#6EE7B7] text-black border-black",
      "bg-[#FF6B6B] text-white border-black",
    ];
    return palette[index % palette.length];
  };

  // Domain sticker palette
  const domainColors = [
    "bg-[#FFD93D] text-black",
    "bg-[#C4B5FD] text-black",
    "bg-[#6EE7B7] text-black",
    "bg-[#93C5FD] text-black",
    "bg-[#FF6B6B] text-white",
    "bg-[#FED7AA] text-black",
  ];

  // Rotation angles for sticker effect
  const rotations = [
    "-rotate-1",
    "rotate-1",
    "-rotate-2",
    "rotate-2",
    "-rotate-1",
    "rotate-1",
  ];

  return (
    <div data-neo-page="true" className="min-h-screen bg-[#FFFDF5] text-black antialiased font-sans selection:bg-[#FFD93D] selection:text-black pb-16">
      {/* Global font and Neo-Brutalist CSS tokens */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=swap');
        
        .font-neo {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        .neo-halftone {
          background-image: radial-gradient(#000 1.2px, transparent 1.2px);
          background-size: 24px 24px;
        }

        .neo-grid {
          background-size: 32px 32px;
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
        }

        .neo-press-btn {
          transition: transform 100ms ease-out, box-shadow 100ms ease-out;
        }
        .neo-press-btn:hover {
          transform: translateY(-2px);
        }
        .neo-press-btn:active {
          transform: translate(2px, 2px) !important;
          box-shadow: 0px 0px 0px 0px #000 !important;
        }

        .neo-card-lift {
          transition: transform 150ms ease-out, box-shadow 150ms ease-out;
        }
        .neo-card-lift:hover {
          transform: translateY(-3px);
        }
      `}</style>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#FFD93D] border-b-4 border-black shadow-[0_4px_0px_0px_#000]">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-black"
          >
            <div className="h-9 w-9 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center group-hover:-rotate-3 transition-transform">
              <Image
                src="/assets/logo.png"
                alt="CodeBreakers Logo"
                className="h-6 w-6 object-contain"
                width={23}
                height={23}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-neo font-black text-base tracking-tight uppercase leading-none">
                CodeBreakers
              </span>
              <span className="font-neo font-bold text-[10px] tracking-wider uppercase text-black/80">
                GCE Kalahandi
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCopyProfileLink}
              className="neo-press-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-neo font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000] cursor-pointer"
              title="Share profile"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3px]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 stroke-[2.5px]" />
                  <span className="hidden sm:inline">Share Profile</span>
                  <span className="sm:hidden">Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Profile Canvas */}
      <main className="container mx-auto px-4 pt-8 max-w-5xl space-y-8 font-neo">
        {/* ========================================================= */}
        {/* 1. HERO BILLBOARD / IDENTITY DOSSIER CARD                 */}
        {/* ========================================================= */}
        <section className="relative bg-white border-4 border-black shadow-[10px_10px_0px_0px_#000]">
          {/* Top Decorative Color Band */}
          <div className="bg-[#FF6B6B] border-b-4 border-black px-4 py-2 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-[#FFD93D] border border-black inline-block"></span>
              <span className="h-3 w-3 bg-[#C4B5FD] border border-black inline-block"></span>
              <span className="h-3 w-3 bg-white border border-black inline-block"></span>
              <span className="font-neo font-black text-xs uppercase tracking-widest text-white ml-1">
                Official Member Record
              </span>
            </div>

            {member.cbUserId && (
              <span className="font-mono font-bold text-xs bg-black text-white px-2 py-0.5 border border-black tracking-wider">
                ID: {member.cbUserId}
              </span>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 relative neo-grid">
            {/* Absolute Decorative Stamp Tag */}
            <div className="absolute top-4 right-4 hidden md:block">
              <div className="rotate-6 bg-[#00ffbf] text-black border-2 border-black font-neo font-black text-xs uppercase tracking-widest px-3 py-1 shadow-[3px_3px_0px_0px_#000]">
                Verified Member
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
              {/* Profile Avatar */}
              <div className="relative shrink-0">
                <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-full border-4 border-black bg-[#FFD93D] shadow-[6px_6px_0px_0px_#000] overflow-hidden flex items-center justify-center">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-neo font-black text-4xl sm:text-5xl text-black tracking-tight select-none">
                      {getInitials(member.name)}
                    </span>
                  )}
                </div>

                {/* Mini Stamp on Avatar */}
                <div className="absolute -bottom-2 -right-1 bg-[#6EE7B7] text-black border-2 border-black rounded-full h-8 w-8 flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  <Award className="h-4 w-4 stroke-[3px]" />
                </div>
              </div>

              {/* Identity Details */}
              <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
                <div className="space-y-1">
                  <h1 className="font-neo font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-black leading-tight break-words">
                    {member.name}
                  </h1>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                    {member.username && (
                      <span className="inline-block bg-[#C4B5FD] text-black font-mono font-bold text-xs sm:text-sm px-2.5 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] -rotate-1">
                        @{member.username}
                      </span>
                    )}

                    {member.branch && (
                      <span className="inline-block bg-white text-black font-neo font-bold text-xs px-2.5 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                        {getBranchFullName(member.branch)}
                      </span>
                    )}

                    {member.admissionYear && (
                      <span className="inline-block bg-[#FFFDF5] text-black font-neo font-bold text-xs px-2.5 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                        Batch {member.admissionYear}
                      </span>
                    )}
                  </div>
                </div>

                {/* Member Roles Stickers */}
                <div className="pt-2">
                  <p className="text-[11px] font-neo font-bold uppercase tracking-wider text-black/60 mb-1.5">
                    Club Designation
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    {roles.map((role, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 font-neo font-black text-xs uppercase tracking-wider px-3 py-1 border-2 shadow-[3px_3px_0px_0px_#000] ${getNeoRoleBadge(
                          role,
                          idx
                        )} ${idx % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
                      >
                        <Sparkles className="h-3 w-3 stroke-[3px]" />
                        <span>{role}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Interactive Actions */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-4">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="neo-press-btn inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B6B] text-white font-neo font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000]"
                    >
                      <Mail className="h-4 w-4 stroke-[2.5px]" />
                      <span>Email Member</span>
                    </a>
                  )}

                  {member.whatsappNumber && (
                    <a
                      href={`https://wa.me/${member.whatsappNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neo-press-btn inline-flex items-center gap-1.5 px-4 py-2 bg-[#6EE7B7] text-black font-neo font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000]"
                    >
                      <IconBrandWhatsapp className="h-4 w-4 stroke-[2.5px]" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. SPECIALIZED DOMAINS & TECHNICAL SKILLS STICKER CLOUD   */}
        {/* ========================================================= */}
        {domains.length > 0 && (
          <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <div className="bg-[#C4B5FD] border-b-4 border-black px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <Target className="h-4 w-4 stroke-[3px] text-black" />
                </div>
                <h2 className="font-neo font-black text-sm uppercase tracking-wider text-black">
                  Specialized Domains & Interests
                </h2>
              </div>
              <span className="font-mono font-bold text-xs bg-white text-black px-2 py-0.5 border-2 border-black">
                {domains.length} {domains.length === 1 ? "Domain" : "Domains"}
              </span>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                {domains.map((dom, idx) => {
                  const colorClass = domainColors[idx % domainColors.length];
                  const rotClass = rotations[idx % rotations.length];
                  return (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-black font-neo font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] neo-card-lift cursor-default ${colorClass} ${rotClass}`}
                    >
                      <Sparkles className="h-3 w-3 stroke-[2.5px]" />
                      <span>{dom}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 3. CONTACT & COMMUNICATION DOSSIER                        */}
        {/* ========================================================= */}
        <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
          <div className="bg-[#FFD93D] border-b-4 border-black px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <User className="h-4 w-4 stroke-[3px] text-black" />
              </div>
              <h2 className="font-neo font-black text-sm uppercase tracking-wider text-black">
                Contact Information
              </h2>
            </div>
            <span className="font-mono font-bold text-xs uppercase text-black/70">
              Verified Channel
            </span>
          </div>

          <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Email */}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="neo-card-lift flex items-start gap-3 p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFD93D]/30 transition-all group"
              >
                <div className="p-2 bg-[#FF6B6B] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                  <Mail className="h-4 w-4 stroke-[2.5px]" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                    Email Address
                  </p>
                  <p className="text-xs sm:text-sm font-neo font-bold text-black truncate">
                    {member.email}
                  </p>
                </div>
              </a>
            )}

            {/* Mobile Phone */}
            {member.mobileNumber && (
              <a
                href={`tel:${member.mobileNumber}`}
                className="neo-card-lift flex items-start gap-3 p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFD93D]/30 transition-all group"
              >
                <div className="p-2 bg-[#FFD93D] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                  <Phone className="h-4 w-4 stroke-[2.5px]" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                    Mobile Number
                  </p>
                  <p className="text-xs sm:text-sm font-neo font-bold text-black font-mono">
                    {member.mobileNumber}
                  </p>
                </div>
              </a>
            )}

            {/* WhatsApp */}
            {member.whatsappNumber && (
              <a
                href={`https://wa.me/${member.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-card-lift flex items-start gap-3 p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#6EE7B7]/30 transition-all group sm:col-span-2 lg:col-span-1"
              >
                <div className="p-2 bg-[#6EE7B7] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                  <IconBrandWhatsapp className="h-4 w-4 stroke-[2.5px]" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                    WhatsApp Chat
                  </p>
                  <p className="text-xs sm:text-sm font-neo font-bold text-black font-mono">
                    {member.whatsappNumber}
                  </p>
                </div>
              </a>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. SOCIAL & PORTFOLIO PROFILES (NEO-BRUTALIST GRID)      */}
        {/* ========================================================= */}
        {hasAnySocial && (
          <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <div className="bg-[#C4B5FD] border-b-4 border-black px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <PortfolioIcon className="w-4 h-4 text-black" />
                </div>
                <h2 className="font-neo font-black text-sm uppercase tracking-wider text-black">
                  Social & Developer Profiles
                </h2>
              </div>
              <span className="font-mono font-bold text-xs uppercase text-black/70">
                External Links
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Primary Socials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* GitHub */}
                {github && (
                  <a
                    href={formatUrl(github, "https://github.com/")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-card-lift flex items-center justify-between p-3.5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFFDF5] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                        <GitHubIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                          GitHub
                        </p>
                        <p className="text-xs sm:text-sm font-neo font-bold text-black truncate font-mono">
                          @{extractHandle(github, member.username)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-black opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.5px]" />
                  </a>
                )}

                {/* LinkedIn */}
                {linkedin && (
                  <a
                    href={formatUrl(linkedin, "https://linkedin.com/in/")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-card-lift flex items-center justify-between p-3.5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFFDF5] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-[#0A66C2] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                        <LinkedInIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                          LinkedIn
                        </p>
                        <p className="text-xs sm:text-sm font-neo font-bold text-black truncate">
                          {member.name || extractHandle(linkedin, "Profile")}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-black opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.5px]" />
                  </a>
                )}

                {/* Instagram */}
                {instagram && (
                  <a
                    href={formatUrl(instagram, "https://instagram.com/")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-card-lift flex items-center justify-between p-3.5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFFDF5] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-[#E4405F] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                        <InstagramIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                          Instagram
                        </p>
                        <p className="text-xs sm:text-sm font-neo font-bold text-black truncate font-mono">
                          @{extractHandle(instagram, member.username)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-black opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.5px]" />
                  </a>
                )}

                {/* Twitter / X */}
                {twitter && (
                  <a
                    href={formatUrl(twitter, "https://x.com/")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-card-lift flex items-center justify-between p-3.5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFFDF5] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                        <XTwitterIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                          Twitter / X
                        </p>
                        <p className="text-xs sm:text-sm font-neo font-bold text-black truncate font-mono">
                          @{extractHandle(twitter, member.username)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-black opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.5px]" />
                  </a>
                )}

                {/* LeetCode */}
                {leetcode && (
                  <a
                    href={formatUrl(leetcode, "https://leetcode.com/u/")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-card-lift flex items-center justify-between p-3.5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFFDF5] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-[#FFA116] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                        <LeetCodeIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                          LeetCode
                        </p>
                        <p className="text-xs sm:text-sm font-neo font-bold text-black truncate font-mono">
                          @{extractHandle(leetcode, member.username)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-black opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.5px]" />
                  </a>
                )}

                {/* Codeforces */}
                {codeforces && (
                  <a
                    href={formatUrl(codeforces, "https://codeforces.com/profile/")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-card-lift flex items-center justify-between p-3.5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFFDF5] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-[#1F8ACB] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                        <CodeforcesIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                          Codeforces
                        </p>
                        <p className="text-xs sm:text-sm font-neo font-bold text-black truncate font-mono">
                          @{extractHandle(codeforces, member.username)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-black opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.5px]" />
                  </a>
                )}

                {/* Portfolio Website */}
                {portfolio && (
                  <a
                    href={formatUrl(portfolio)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-card-lift flex items-center justify-between p-3.5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFFDF5] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-[#FFD93D] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                        <PortfolioIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                          Portfolio Website
                        </p>
                        <p className="text-xs sm:text-sm font-neo font-bold text-black truncate">
                          {member.name ? `${member.name}'s Portfolio` : "Personal Website"}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-black opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.5px]" />
                  </a>
                )}
              </div>

              {/* Custom Links List */}
              {customLinksList.length > 0 && (
                <div className="pt-4 border-t-3 border-black space-y-3">
                  <p className="text-xs font-neo font-black uppercase tracking-wider text-black flex items-center gap-2">
                    <CustomLinkIcon className="w-4 h-4 text-black" />
                    <span>Custom Links & Resources</span>
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {customLinksList.map((item) => (
                      <a
                        key={item.id || item.url}
                        href={formatUrl(item.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neo-press-btn inline-flex items-center gap-2 px-3.5 py-2 bg-white text-black font-neo font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000]"
                      >
                        <span className="truncate max-w-[200px]">{item.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 stroke-[2.5px] shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 5. GITHUB LIVE CONTRIBUTION ACTIVITY GRAPH               */}
        {/* ========================================================= */}
        {member.githubUsername && (
          <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden">
            <div className="bg-[#FF6B6B] text-white border-b-4 border-black px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <GitHubIcon className="w-4 h-4" />
                </div>
                <h2 className="font-neo font-black text-sm uppercase tracking-wider text-white">
                  GitHub Contribution Activity
                </h2>
              </div>
              <span className="font-mono font-bold text-xs bg-white text-black px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                @{member.githubUsername.replace(/^@/, "")}
              </span>
            </div>

            <div className="p-6">
              <GitHubContributionCalendar
                username={member.githubUsername}
                showCardWrapper={false}
                variant="neo-brutalist"
              />
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 6. ACADEMIC & INSTITUTIONAL DOSSIER                      */}
        {/* ========================================================= */}
        <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
          <div className="bg-[#FFD93D] border-b-4 border-black px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <BookOpen className="h-4 w-4 stroke-[3px] text-black" />
              </div>
              <h2 className="font-neo font-black text-sm uppercase tracking-wider text-black">
                Academic & College Record
              </h2>
            </div>
            <span className="font-mono font-bold text-xs uppercase text-black/70">
              Institutional File
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Registration No */}
              {member.registration && (
                <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                  <div className="p-2 bg-[#FFD93D] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                    <Hash className="h-4 w-4 stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                      Registration No.
                    </p>
                    <p className="text-xs sm:text-sm font-neo font-black text-black font-mono">
                      {member.registration}
                    </p>
                  </div>
                </div>
              )}

              {/* Roll Number */}
              {member.rollNumber && (
                <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                  <div className="p-2 bg-[#C4B5FD] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                    <Hash className="h-4 w-4 stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                      Roll Number
                    </p>
                    <p className="text-xs sm:text-sm font-neo font-black text-black font-mono">
                      {member.rollNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Branch */}
              {member.branch && (
                <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                  <div className="p-2 bg-[#6EE7B7] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                    <School className="h-4 w-4 stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                      Branch / Discipline
                    </p>
                    <p className="text-xs sm:text-sm font-neo font-black text-black">
                      {getBranchFullName(member.branch)}
                    </p>
                  </div>
                </div>
              )}

              {/* Admission Year */}
              {member.admissionYear && (
                <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                  <div className="p-2 bg-[#FF6B6B] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                    <Calendar className="h-4 w-4 stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                      Admission Year
                    </p>
                    <p className="text-xs sm:text-sm font-neo font-black text-black font-mono">
                      {member.admissionYear}
                    </p>
                  </div>
                </div>
              )}

              {/* Assigned Batch */}
              {member.batch && (
                <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3 sm:col-span-2 lg:col-span-2">
                  <div className="p-2 bg-[#93C5FD] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                    <Layers className="h-4 w-4 stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                      Assigned Club Batch
                    </p>
                    <p className="text-xs sm:text-sm font-neo font-black text-black">
                      {member.batch.name}{" "}
                      <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5 border border-black ml-1">
                        {member.batch.code}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* College & Campus Details */}
            {(member.collegeName || member.collegeAddress) && (
              <div className="p-4 bg-[#FFFDF5] border-3 border-black shadow-[4px_4px_0px_0px_#000] space-y-2">
                {member.collegeName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-black mt-0.5 shrink-0 stroke-[2.5px]" />
                    <div>
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        College / Institution
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-black text-black">
                        {member.collegeName}
                      </p>
                    </div>
                  </div>
                )}

                {member.collegeAddress && (
                  <div className="flex items-start gap-3 pt-2 border-t-2 border-black/10">
                    <MapPin className="h-4 w-4 text-black mt-0.5 shrink-0 stroke-[2.5px]" />
                    <div>
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        Campus Location
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-bold text-black">
                        {member.collegeAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. FULL LOCATION & ADDRESS DOSSIER                       */}
        {/* ========================================================= */}
        {hasLocation && (
          <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <div className="bg-[#6EE7B7] text-black border-b-4 border-black px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <Compass className="h-4 w-4 stroke-[3px] text-black" />
                </div>
                <h2 className="font-neo font-black text-sm uppercase tracking-wider text-black">
                  Location & Address Details
                </h2>
              </div>
              <span className="font-mono font-bold text-xs uppercase text-black/70">
                Geo Dossier
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Full Street Address */}
                {member.address && (
                  <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3 sm:col-span-2 lg:col-span-3">
                    <div className="p-2 bg-[#FFD93D] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                      <MapPin className="h-4 w-4 stroke-[2.5px]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        Address / Street
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-bold text-black break-words">
                        {member.address}
                      </p>
                    </div>
                  </div>
                )}

                {/* Post Office */}
                {member.postOffice && (
                  <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                    <div className="p-2 bg-[#C4B5FD] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                      <FileText className="h-4 w-4 stroke-[2.5px]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        Post Office (P.O.)
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-black text-black">
                        {member.postOffice}
                      </p>
                    </div>
                  </div>
                )}

                {/* Police Station */}
                {member.policeStation && (
                  <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                    <div className="p-2 bg-[#FF6B6B] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                      <Building2 className="h-4 w-4 stroke-[2.5px]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        Police Station (P.S.)
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-black text-black">
                        {member.policeStation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Block */}
                {member.block && (
                  <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                    <div className="p-2 bg-[#93C5FD] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                      <Layers className="h-4 w-4 stroke-[2.5px]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        Block
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-black text-black">
                        {member.block}
                      </p>
                    </div>
                  </div>
                )}

                {/* District */}
                {member.district && (
                  <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                    <div className="p-2 bg-[#FFD93D] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                      <MapPin className="h-4 w-4 stroke-[2.5px]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        District
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-black text-black">
                        {member.district}
                      </p>
                    </div>
                  </div>
                )}

                {/* State */}
                {member.state && (
                  <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                    <div className="p-2 bg-[#6EE7B7] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                      <Compass className="h-4 w-4 stroke-[2.5px]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        State
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-black text-black">
                        {member.state}
                      </p>
                    </div>
                  </div>
                )}

                {/* PIN Code */}
                {member.pinCode && (
                  <div className="p-3.5 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_0px_#000] flex items-start gap-3">
                    <div className="p-2 bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0">
                      <Hash className="h-4 w-4 stroke-[2.5px]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[10px] font-neo font-bold uppercase tracking-wider text-black/60">
                        PIN Code
                      </p>
                      <p className="text-xs sm:text-sm font-neo font-black text-black font-mono">
                        {member.pinCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 8. FOOTER STAMP                                           */}
        {/* ========================================================= */}
        <footer className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-5 text-center space-y-1.5">
          <p className="font-neo font-black text-xs uppercase tracking-widest text-black">
            Member since {format(new Date(member.createdAt), "MMMM yyyy")}
          </p>
          <p className="font-neo font-bold text-[11px] uppercase tracking-wider text-black/70">
            CodeBreakers — Government College of Engineering Kalahandi
          </p>
        </footer>
      </main>
    </div>
  );
}
