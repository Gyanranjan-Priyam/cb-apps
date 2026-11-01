"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Compass,
  Edit,
  Trash2,
  ExternalLink,
  Users,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createAdminRoadmap, deleteAdminRoadmap } from "../actions";
import { DEFAULT_ROADMAPS } from "@/lib/roadmaps/data/default-tracks";

interface AdminRoadmapItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  badgeText?: string | null;
  iconName?: string | null;
  nodesCount: number;
  edgesCount: number;
  isPublished: boolean;
  version: number;
  membersEnrolled: number;
  createdAt: string;
  updatedAt: string;
}

export function AdminRoadmapsClient({
  initialRoadmaps,
  baseUrl = "/admin/roadmaps",
}: {
  initialRoadmaps: AdminRoadmapItem[];
  baseUrl?: string;
}) {
  const [roadmaps, setRoadmaps] = useState<AdminRoadmapItem[]>(initialRoadmaps);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("web-dev");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [badgeText, setBadgeText] = useState("Core Track");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [showMermaidInput, setShowMermaidInput] = useState(false);
  const [mermaidCode, setMermaidCode] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, "-"));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      toast.error("Please provide a title and slug");
      return;
    }

    const finalCategory = isCustomCategory
      ? customCategory.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || "custom"
      : category;

    setIsSubmitting(true);
    try {
      const res = await createAdminRoadmap({
        title,
        slug,
        description,
        category: finalCategory,
        badgeText,
        templateId: selectedTemplate !== "none" ? selectedTemplate : undefined,
        mermaidCode: showMermaidInput && mermaidCode.trim() ? mermaidCode : undefined,
      });

      if (res.status === "success" && res.data) {
        toast.success("Roadmap created successfully!");
        setIsCreateOpen(false);
        // Refresh page
        window.location.reload();
      } else {
        toast.error(res.message || "Failed to create roadmap");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete roadmap "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await deleteAdminRoadmap(id);
      if (res.status === "success") {
        toast.success("Roadmap deleted");
        setRoadmaps((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete roadmap");
    }
  };

  const filtered = roadmaps.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Actions Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracks by title or category..."
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <SilentRefreshButton toastMessage="Roadmaps refreshed silently" />
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Roadmap
          </Button>
        </div>
      </div>

      {/* ── Roadmaps Table ── */}
      <Card className="border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roadmap Title & Slug</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Nodes</TableHead>
              <TableHead className="text-center">Enrolled</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                  No roadmaps found. Create your first roadmap to get started!
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-foreground">{r.title}</span>
                        {r.badgeText && (
                          <Badge variant="outline" className="text-[10px] px-1.5 bg-muted">
                            {r.badgeText}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        /dashboard/roadmaps/{r.slug}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {r.category}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs">
                    {r.nodesCount} nodes
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs">
                    {r.membersEnrolled}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      className={`text-[10px] ${
                        r.isPublished
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8 text-xs gap-1"
                      >
                        <Link href={`${baseUrl}/${r.id}`}>
                          <Edit className="w-3.5 h-3.5" />
                          <span>Visual Studio</span>
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="View member preview"
                      >
                        <Link href={`/dashboard/roadmaps/${r.slug}`} target="_blank">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(r.id, r.title)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500"
                        title="Delete roadmap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ── Create Roadmap Modal ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Visual Roadmap</DialogTitle>
            <DialogDescription>
              Set up a new curriculum. You can start blank or clone one of the pre-built templates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Roadmap Title</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Full Stack Next.js & TypeScript"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">URL Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. full-stack-nextjs"
                required
                className="text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Category</Label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    {isCustomCategory ? "Pick preset" : "+ Write own"}
                  </button>
                </div>
                {isCustomCategory ? (
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Blockchain, Mobile App"
                    className="text-xs h-9"
                    required
                  />
                ) : (
                  <Select value={category} onValueChange={(val) => {
                    if (val === "custom") {
                      setIsCustomCategory(true);
                    } else {
                      setCategory(val);
                    }
                  }}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web-dev">Web Development</SelectItem>
                      <SelectItem value="systems">Systems & Backend</SelectItem>
                      <SelectItem value="cloud-devops">Cloud & DevOps</SelectItem>
                      <SelectItem value="dsa">DSA & Algorithms</SelectItem>
                      <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
                      <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                      <SelectItem value="mobile">Mobile Development</SelectItem>
                      <SelectItem value="blockchain">Web3 & Blockchain</SelectItem>
                      <SelectItem value="custom">+ Write Custom Category...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Badge Text</Label>
                <Input
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. Popular, Advanced"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Curriculum Source</Label>
                <button
                  type="button"
                  onClick={() => setShowMermaidInput(!showMermaidInput)}
                  className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {showMermaidInput ? "Use Standard Template" : "Convert Mermaid Flowchart"}
                </button>
              </div>

              {showMermaidInput ? (
                <div className="space-y-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground">
                      Paste Mermaid Code (Auto-generates layout & nodes):
                    </span>
                  </div>
                  <Textarea
                    value={mermaidCode}
                    onChange={(e) => setMermaidCode(e.target.value)}
                    placeholder={"flowchart TB\n    Start((Start)) --> A[Frontend Basics]:::emerald\n    A --> B[React & Next.js]:::blue\n    B --> C[(PostgreSQL DB)]:::indigo"}
                    rows={4}
                    className="text-xs font-mono bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Nodes, shapes, subgraphs, and styles will be automatically positioned and connected into interactive roadmap components!
                  </p>
                </div>
              ) : (
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Blank Roadmap (Start from scratch)</SelectItem>
                    {DEFAULT_ROADMAPS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title} ({t.nodes.length} nodes)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what members will learn in this track..."
                rows={2}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Roadmap"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
