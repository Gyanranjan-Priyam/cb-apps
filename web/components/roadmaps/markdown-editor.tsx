"use client";

import { useState, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Table as TableIcon,
  FileCode2,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  Minus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./markdown-renderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const TEMPLATES = [
  {
    name: "Standard Concept Overview",
    desc: "Overview, Key Concepts, and Code Example",
    content: `## Overview
Explain the core concept and its fundamental role in development.

## Key Concepts
- **Core Principle 1**: Detailed explanation of first principle.
- **Core Principle 2**: Detailed explanation of second principle.
- **Best Practice**: Recommended industry patterns.

## Code Example
\`\`\`typescript
// Practical demonstration
function executeTask(param: string): boolean {
  console.log("Processing:", param);
  return true;
}
\`\`\`

> [!TIP]
> Always verify edge cases and remember to handle asynchronous states properly.
`,
  },
  {
    name: "Deep Dive Architecture Article",
    desc: "In-depth architecture breakdown with pros/cons table",
    content: `## Architecture Breakdown
An in-depth guide on how this component operates in modern system design.

### How It Works Under The Hood
1. **Initiation**: The request enters the pipeline.
2. **Processing**: Transformations and state validation take place.
3. **Execution**: Result is persisted or dispatched to the client.

| Feature | Advantage | Tradeoff |
| --- | --- | --- |
| Server Rendering | Fast initial load | Increased server compute |
| Client Hydration | Interactive UI | Larger JS payload |

> [!NOTE]
> Ensure network latency is factored into timeout configurations.
`,
  },
  {
    name: "Hands-on Exercise & Checklist",
    desc: "Learning objectives and practical milestone checklist",
    content: `## Learning Objectives
By the end of this milestone, you will master the implementation fundamentals.

### Step-by-Step Exercise
- [ ] Understand the theoretical fundamentals and documentation.
- [ ] Set up local development environment.
- [ ] Implement the core algorithm or component.
- [ ] Write unit test coverage for edge scenarios.
- [ ] Deploy to test environment and measure performance.

\`\`\`bash
# Run tests locally
npm run test
\`\`\`
`,
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write comprehensive overview, articles, code snippets, or key concepts in Markdown...",
  minHeight,
  label = "Overview & Key Concepts (Markdown Article)",
  isExpanded = false,
  onToggleExpand,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<"write" | "preview" | "split">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const effectiveMinHeight = minHeight || (isExpanded ? "480px" : "240px");

  // Helper to insert markdown at cursor position
  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = "", defaultText: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end) || defaultText;
      const replacement = `${prefix}${selected}${suffix}`;

      const newValue = value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      // Restore focus and cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selected.length
        );
      }, 10);
    },
    [value, onChange]
  );

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      insertMarkdown("**", "**", "bold text");
    } else if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      insertMarkdown("*", "*", "italic text");
    } else if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      insertMarkdown("[", "](https://example.com)", "link title");
    } else if (e.key === "Tab") {
      e.preventDefault();
      insertMarkdown("  ");
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="space-y-2 rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* ── Editor Header & Action Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/50 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase text-foreground/90 tracking-wider">
            {label}
          </span>
          {isExpanded && (
            <span className="text-[10px] bg-primary/10 text-primary font-mono px-1.5 py-0.5 rounded-md font-bold">
              75% Display View
            </span>
          )}
        </div>

        {/* View Mode Switcher, Expand & Templates */}
        <div className="flex items-center gap-1">
          {/* Quick Template Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] font-bold text-primary gap-1 hover:bg-primary/10 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Templates</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 text-xs">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                Article & Concept Skeletons
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TEMPLATES.map((tmpl, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={() => onChange(tmpl.content)}
                  className="cursor-pointer space-y-0.5 flex flex-col items-start py-1.5"
                >
                  <span className="font-semibold text-foreground">{tmpl.name}</span>
                  <span className="text-[10px] text-muted-foreground">{tmpl.desc}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mode Buttons */}
          <div className="flex items-center bg-background/80 rounded-lg p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode("write")}
              title="Write Markdown"
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "write"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              title="Split View (Editor + Live Preview)"
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "split"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              title="Preview Article"
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "preview"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 75% Display Expand / Minimize Button */}
          {onToggleExpand && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleExpand}
              className={`h-6 px-2 text-[10px] font-bold gap-1 cursor-pointer transition-colors ${
                isExpanded
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                  : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
              }`}
              title={isExpanded ? "Collapse to regular panel" : "Pop-up 75% display view"}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span className="font-mono">Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3 text-primary" />
                  <span className="font-mono">75% Screen</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* ── Markdown Formatting Toolbar (Only in Write or Split Mode) ── */}
      {viewMode !== "preview" && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 bg-muted/20 border-b border-border/40 text-muted-foreground">
          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("## ", "", "Heading 2")}
            title="Heading 2 (##)"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("### ", "", "Subheading")}
            title="Heading 3 (###)"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("#### ", "", "Section")}
            title="Heading 4 (####)"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </Button>

          <div className="h-3.5 w-px bg-border/60 mx-1" />

          {/* Inline Styles */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("**", "**", "bold text")}
            title="Bold (Ctrl+B)"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("*", "*", "italic text")}
            title="Italic (Ctrl+I)"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("`", "`", "code")}
            title="Inline Code"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("```typescript\n", "\n```", "// Code snippet here")}
            title="Code Block"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5" />
          </Button>

          <div className="h-3.5 w-px bg-border/60 mx-1" />

          {/* Lists & Tasks */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("- ", "", "List item")}
            title="Bullet List"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("1. ", "", "First step")}
            title="Numbered List"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("- [ ] ", "", "Checklist objective")}
            title="Task Checklist"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-primary" />
          </Button>

          <div className="h-3.5 w-px bg-border/60 mx-1" />

          {/* Extra Blocks */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("> [!TIP]\n> ", "", "Pro tip description")}
            title="Tip / Callout Box"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("[", "](https://)", "link text")}
            title="Link (Ctrl+K)"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              insertMarkdown(
                "| Feature | Description |\n| --- | --- |\n| Item 1 | Value 1 |\n"
              )
            }
            title="Table"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("\n---\n")}
            title="Divider"
            className="h-6 w-6 p-0 hover:text-foreground cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* ── Editor Body ── */}
      <div className="p-2">
        {viewMode === "write" && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ minHeight: effectiveMinHeight }}
            className="w-full text-xs font-mono p-3 rounded-lg border border-border/70 bg-background text-foreground resize-y focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
          />
        )}

        {viewMode === "preview" && (
          <div
            style={{ minHeight: effectiveMinHeight }}
            className={`p-4 rounded-lg border border-border/70 bg-background/50 overflow-y-auto ${
              isExpanded ? "max-h-[640px]" : "max-h-[380px]"
            }`}
          >
            <MarkdownRenderer content={value} />
          </div>
        )}

        {viewMode === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{ minHeight: effectiveMinHeight }}
              className="w-full text-xs font-mono p-3 rounded-lg border border-border/70 bg-background text-foreground resize-y focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
            />
            <div
              style={{ minHeight: effectiveMinHeight }}
              className={`p-4 rounded-lg border border-border/70 bg-background/50 overflow-y-auto ${
                isExpanded ? "max-h-[640px]" : "max-h-[380px]"
              }`}
            >
              <MarkdownRenderer content={value} />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Info ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
        <span>Supports Markdown headers, lists, code, tips & tables</span>
        <span>
          {wordCount} words • {charCount} characters
        </span>
      </div>
    </div>
  );
}
