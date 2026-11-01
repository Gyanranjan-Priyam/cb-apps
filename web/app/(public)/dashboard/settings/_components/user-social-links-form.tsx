"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { updateUserSocialAndCustomLinks } from "../actions";

interface CustomLink {
  id: string;
  title: string;
  url: string;
}

interface UserSocialLinksFormProps {
  initialSocialLinks?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    leetcode?: string;
    codeforces?: string;
    portfolio?: string;
  } | null;
  initialCustomLinks?: CustomLink[] | null;
  githubUsername?: string | null;
  profileComplete?: boolean;
}

export function UserSocialLinksForm({
  initialSocialLinks,
  initialCustomLinks,
  githubUsername,
  profileComplete = false,
}: UserSocialLinksFormProps) {
  const router = useRouter();
  const [linkedin, setLinkedin] = useState(initialSocialLinks?.linkedin || "");
  const [twitter, setTwitter] = useState(initialSocialLinks?.twitter || "");
  const [instagram, setInstagram] = useState(initialSocialLinks?.instagram || "");
  const [leetcode, setLeetcode] = useState(initialSocialLinks?.leetcode || "");
  const [codeforces, setCodeforces] = useState(initialSocialLinks?.codeforces || "");
  const [portfolio, setPortfolio] = useState(initialSocialLinks?.portfolio || "");

  const [customLinks, setCustomLinks] = useState<CustomLink[]>(
    initialCustomLinks && Array.isArray(initialCustomLinks)
      ? initialCustomLinks
      : []
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleAddCustomLink = () => {
    if (customLinks.length >= 6) {
      toast.error("You can add up to 6 custom links.");
      return;
    }
    setCustomLinks([
      ...customLinks,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
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
    const updated = [...customLinks];
    updated[index] = { ...updated[index], [field]: value };
    setCustomLinks(updated);
  };

  const handleRemoveCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      const filteredCustomLinks = customLinks.filter(
        (link) => link.title.trim() && link.url.trim()
      );

      const res = await updateUserSocialAndCustomLinks({
        socialLinks: {
          linkedin: linkedin.trim() || undefined,
          twitter: twitter.trim() || undefined,
          instagram: instagram.trim() || undefined,
          leetcode: leetcode.trim() || undefined,
          codeforces: codeforces.trim() || undefined,
          portfolio: portfolio.trim() || undefined,
        },
        customLinks: filteredCustomLinks,
      });

      if (res.status === "success") {
        toast.success("Social links updated!", {
          description: res.message || "Your profile and portfolio links have been saved.",
        });
        router.refresh();
      } else {
        toast.error("Failed to save links", {
          description: res.message || "Please check the entered URLs and try again.",
        });
      }
    } catch {
      toast.error("Network error", {
        description: "Failed to save links. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-7">
      {!profileComplete && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">Profile Incomplete</p>
            <p className="text-xs leading-relaxed">
              Please complete your core profile details (Branch, Roll Number, Phone, Address) in the <strong>Profile</strong> tab. Once completed, your social and custom links will be published on your public profile.
            </p>
          </div>
        </div>
      )}

      {/* GitHub account status banner */}
      <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-background border shrink-0">
            <GitHubIcon className="w-5 h-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground">GitHub Contribution Graph</p>
            <p className="text-xs text-muted-foreground truncate">
              {githubUsername
                ? `Connected as @${githubUsername}`
                : "Link your GitHub account under Account Security to show your live commit graph"}
            </p>
          </div>
        </div>
      </div>

      {/* Standard Social Links Grid */}
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Social & Coding Profiles</h3>
          <p className="text-sm text-muted-foreground">
            Add your social handles and competitive programming profile links.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <LinkedInIcon className="w-4.5 h-4.5 shrink-0" />
              <span>LinkedIn Profile</span>
            </Label>
            <Input
              id="linkedin"
              placeholder="e.g. https://linkedin.com/in/username or username"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              disabled={isSaving}
              className="h-10 text-sm"
            />
          </div>

          {/* Twitter / X */}
          <div className="space-y-2">
            <Label htmlFor="twitter" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <XTwitterIcon className="w-4.5 h-4.5 shrink-0" />
              <span>Twitter / X Profile</span>
            </Label>
            <Input
              id="twitter"
              placeholder="e.g. https://x.com/username or @username"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              disabled={isSaving}
              className="h-10 text-sm"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <InstagramIcon className="w-4.5 h-4.5 shrink-0" />
              <span>Instagram Profile</span>
            </Label>
            <Input
              id="instagram"
              placeholder="e.g. https://instagram.com/username or @username"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              disabled={isSaving}
              className="h-10 text-sm"
            />
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <Label htmlFor="portfolio" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <PortfolioIcon className="w-4.5 h-4.5 shrink-0" />
              <span>Portfolio / Personal Website</span>
            </Label>
            <Input
              id="portfolio"
              placeholder="e.g. https://yourportfolio.dev or https://yourname.com"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              disabled={isSaving}
              className="h-10 text-sm"
            />
          </div>

          {/* LeetCode */}
          <div className="space-y-2">
            <Label htmlFor="leetcode" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <LeetCodeIcon className="w-4.5 h-4.5 shrink-0" />
              <span>LeetCode Profile</span>
            </Label>
            <Input
              id="leetcode"
              placeholder="e.g. https://leetcode.com/u/username or username"
              value={leetcode}
              onChange={(e) => setLeetcode(e.target.value)}
              disabled={isSaving}
              className="h-10 text-sm"
            />
          </div>

          {/* Codeforces */}
          <div className="space-y-2">
            <Label htmlFor="codeforces" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <CodeforcesIcon className="w-4.5 h-4.5 shrink-0" />
              <span>Codeforces Handle</span>
            </Label>
            <Input
              id="codeforces"
              placeholder="e.g. https://codeforces.com/profile/handle or handle"
              value={codeforces}
              onChange={(e) => setCodeforces(e.target.value)}
              disabled={isSaving}
              className="h-10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Custom Links Section */}
      <div className="space-y-4 pt-3 border-t">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CustomLinkIcon className="w-4.5 h-4.5 shrink-0" />
              <span>Custom Links (Blogs, Projects, Resume)</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Add custom external links to showcase on your public member profile.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomLink}
            disabled={isSaving || customLinks.length >= 6}
            className="text-xs h-9 gap-1.5 px-3 self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Link</span>
          </Button>
        </div>

        {customLinks.length === 0 ? (
          <div className="p-6 border border-dashed rounded-xl text-center text-sm text-muted-foreground bg-muted/10">
            No custom links added yet. Click &quot;Add Link&quot; above to link your Hashnode/Medium blog, YouTube channel, or featured projects.
          </div>
        ) : (
          <div className="space-y-3">
            {customLinks.map((link, idx) => (
              <div
                key={link.id || idx}
                className="flex items-center gap-2.5 p-3.5 rounded-xl border border-border bg-card shadow-2xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                  <Input
                    placeholder="e.g. Tech Blog, Resume PDF, YouTube..."
                    value={link.title}
                    onChange={(e) =>
                      handleUpdateCustomLink(idx, "title", e.target.value)
                    }
                    disabled={isSaving}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="e.g. https://medium.com/@username or https://..."
                    value={link.url}
                    onChange={(e) =>
                      handleUpdateCustomLink(idx, "url", e.target.value)
                    }
                    disabled={isSaving}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCustomLink(idx)}
                  disabled={isSaving}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isSaving} className="min-w-36 h-10 text-sm">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Links...
            </>
          ) : (
            "Save Social Links"
          )}
        </Button>
      </div>
    </form>
  );
}
