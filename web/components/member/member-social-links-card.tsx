"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ExternalLink } from "lucide-react";

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

interface MemberSocialLinksCardProps {
  socialLinks?: SocialLinksData | null;
  customLinks?: CustomLinkItem[] | null;
  githubUsername?: string | null;
  memberName?: string | null;
  username?: string | null;
}

export default function MemberSocialLinksCard({
  socialLinks,
  customLinks,
  githubUsername,
  memberName,
  username,
}: MemberSocialLinksCardProps) {
  // Normalize links
  const github = githubUsername || socialLinks?.github;
  const linkedin = socialLinks?.linkedin?.trim();
  const twitter = socialLinks?.twitter?.trim();
  const instagram = socialLinks?.instagram?.trim();
  const leetcode = socialLinks?.leetcode?.trim();
  const codeforces = socialLinks?.codeforces?.trim();
  const portfolio = socialLinks?.portfolio?.trim();

  const validCustomLinks = (customLinks || []).filter(
    (item) => item && item.title?.trim() && item.url?.trim()
  );

  const hasAnySocial = Boolean(
    github ||
      linkedin ||
      twitter ||
      instagram ||
      leetcode ||
      codeforces ||
      portfolio ||
      validCustomLinks.length > 0
  );

  // If no links given by user, the card is completely NOT visible
  if (!hasAnySocial) {
    return null;
  }

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
        // Handle cases like linkedin.com/in/username or leetcode.com/u/username
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PortfolioIcon className="w-5 h-5 text-primary" />
          <span>Social & Portfolio Profiles</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Social Badges / Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* GitHub: Shows @githubUsername */}
          {github && (
            <a
              href={formatUrl(github, "https://github.com/")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border/80 hover:border-foreground/40 hover:bg-muted/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted/60 text-foreground shrink-0">
                  <GitHubIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    GitHub
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate font-mono">
                    @{extractHandle(github, username)}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </a>
          )}

          {/* LinkedIn: Shows Member's Name */}
          {linkedin && (
            <a
              href={formatUrl(linkedin, "https://linkedin.com/in/")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border/80 hover:border-foreground/40 hover:bg-muted/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted/60 text-foreground shrink-0">
                  <LinkedInIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    LinkedIn
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {memberName || extractHandle(linkedin, "Profile")}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </a>
          )}

          {/* Instagram: Shows @instagramHandle */}
          {instagram && (
            <a
              href={formatUrl(instagram, "https://instagram.com/")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border/80 hover:border-foreground/40 hover:bg-muted/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted/60 text-foreground shrink-0">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Instagram
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate font-mono">
                    @{extractHandle(instagram, username)}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </a>
          )}

          {/* Portfolio: Shows Member's Name / Portfolio */}
          {portfolio && (
            <a
              href={formatUrl(portfolio)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border/80 hover:border-foreground/40 hover:bg-muted/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted/60 text-foreground shrink-0">
                  <PortfolioIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Portfolio
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {memberName ? `${memberName}` : "Portfolio Website"}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </a>
          )}

          {/* Twitter / X */}
          {twitter && (
            <a
              href={formatUrl(twitter, "https://x.com/")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border/80 hover:border-foreground/40 hover:bg-muted/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted/60 text-foreground shrink-0">
                  <XTwitterIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Twitter / X
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate font-mono">
                    @{extractHandle(twitter, username)}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </a>
          )}

          {/* LeetCode */}
          {leetcode && (
            <a
              href={formatUrl(leetcode, "https://leetcode.com/u/")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border/80 hover:border-foreground/40 hover:bg-muted/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted/60 text-foreground shrink-0">
                  <LeetCodeIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    LeetCode
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate font-mono">
                    @{extractHandle(leetcode, username)}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </a>
          )}

          {/* Codeforces */}
          {codeforces && (
            <a
              href={formatUrl(codeforces, "https://codeforces.com/profile/")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border/80 hover:border-foreground/40 hover:bg-muted/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted/60 text-foreground shrink-0">
                  <CodeforcesIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Codeforces
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate font-mono">
                    @{extractHandle(codeforces, username)}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </a>
          )}
        </div>

        {/* Custom Links List */}
        {validCustomLinks.length > 0 && (
          <div className="space-y-2.5 pt-2.5 border-t">
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <CustomLinkIcon className="w-4 h-4 text-foreground" />
              <span>Custom Links & Profiles</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {validCustomLinks.map((item) => (
                <a
                  key={item.id || item.url}
                  href={formatUrl(item.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/80 bg-background hover:bg-muted/60 text-sm font-medium transition-all group"
                >
                  <span className="truncate max-w-[220px]">{item.title}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
