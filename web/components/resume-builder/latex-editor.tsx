/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useMemo } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Copy,
  RotateCcw,
  ListPlus,
  Briefcase,
  FolderGit2,
  Bold,
  Italic,
  Underline,
  Link,
  Percent,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  onResetToTemplate?: () => void;
}

export function LatexEditor({ value, onChange, onResetToTemplate }: LatexEditorProps) {
  const editorRef = useRef<any>(null);

  // Overleaf Word Count Telemetry
  const stats = useMemo(() => {
    const lines = value.split("\n").length;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const characters = value.length;
    return { lines, words, characters };
  }, [value]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register LaTeX language if not already registered in Monaco
    const registeredLangs = monaco.languages.getLanguages();
    if (!registeredLangs.some((lang: { id: string }) => lang.id === "latex")) {
      monaco.languages.register({ id: "latex", extensions: [".tex", ".latex"] });
    }

    // Set Monarch syntax tokens for LaTeX
    monaco.languages.setMonarchTokensProvider("latex", {
      defaultToken: "",
      tokenPostfix: ".latex",
      keywords: [
        "begin",
        "end",
        "documentclass",
        "usepackage",
        "newcommand",
        "renewcommand",
        "section",
        "subsection",
        "subsubsection",
        "paragraph",
        "item",
        "textbf",
        "textit",
        "emph",
        "underline",
        "href",
        "vspace",
        "hspace",
        "scshape",
        "Huge",
        "large",
        "small",
        "resumeSubheading",
        "resumeProjectHeading",
        "resumeItem",
        "resumeSubHeadingListStart",
        "resumeSubHeadingListEnd",
        "resumeItemListStart",
        "resumeItemListEnd",
      ],
      tokenizer: {
        root: [
          // Comments
          [/%(.*)$/, "comment"],
          // Macro commands (\command)
          [
            /\\[a-zA-Z@]+/,
            {
              cases: {
                "@keywords": "keyword",
                "@default": "type.identifier",
              },
            },
          ],
          // Escaped characters (\$, \%, \&, etc.)
          [/\\[\\$%&#_{}]/, "string.escape"],
          // Math mode inline $ ... $
          [/\$[^$]+\$/, "string"],
          // Brackets and delimiters
          [/[{}()[\]]/, "@brackets"],
          [/[=><|]/, "operator"],
        ],
      },
    });

    // Set language configuration (brackets, comments, auto-closing pairs)
    monaco.languages.setLanguageConfiguration("latex", {
      comments: {
        lineComment: "%",
      },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "$", close: "$" },
      ],
      surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "$", close: "$" },
      ],
    });
  };

  const insertSnippet = (snippet: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    const op = {
      range: selection,
      text: snippet,
      forceMoveMarkers: true,
    };
    editor.executeEdits("snippet-insert", [op]);
    editor.focus();
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    const selectedText = editor.getModel().getValueInRange(selection) || "text";
    const op = {
      range: selection,
      text: `${prefix}${selectedText}${suffix}`,
      forceMoveMarkers: true,
    };
    editor.executeEdits("wrap-selection", [op]);
    editor.focus();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    toast.success("LaTeX source code copied to clipboard");
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 max-w-full border border-border/60 rounded-xl overflow-hidden shadow-xs">
      {/* ── Overleaf-Style Code Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 px-3 bg-muted/40 border-b border-border/60 text-xs shrink-0 w-full min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono text-[11px] font-semibold text-foreground truncate">
            main.tex
          </span>
        </div>

        {/* Rich Formatting Actions */}
        <div className="flex items-center gap-1 flex-wrap">
          <TooltipProvider delayDuration={200}>
            {/* Bold */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => wrapSelection("\\textbf{", "}")}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Bold className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold (\textbf)</TooltipContent>
            </Tooltip>

            {/* Italic */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => wrapSelection("\\emph{", "}")}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Italic className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic (\emph)</TooltipContent>
            </Tooltip>

            {/* Underline */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => wrapSelection("\\underline{", "}")}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Underline className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline (\underline)</TooltipContent>
            </Tooltip>

            {/* Hyperlink */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => wrapSelection("\\href{https://example.com}{", "}")}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Link className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hyperlink (\href)</TooltipContent>
            </Tooltip>

            {/* Comment Line */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => wrapSelection("% ", "")}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Percent className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Comment Line (%)</TooltipContent>
            </Tooltip>

            <div className="w-[1px] h-4 bg-border/80 mx-1" />

            {/* Experience Block */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    insertSnippet(`\n\\resumeSubheading\n  {Job Title}{Dates}\n  {Company / Organization}{Location}\n  \\resumeItemListStart\n    \\resumeItem{Impact-driven achievement with metrics.}\n  \\resumeItemListEnd\n`)
                  }
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Job</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Experience / Job Heading block</TooltipContent>
            </Tooltip>

            {/* Project Block */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    insertSnippet(`\n\\resumeProjectHeading\n  {\\textbf{Project Name} $|$ \\emph{Tech Stack} $|$ \\href{https://demo.app}{\\faExternalLinkAlt\\ Demo} $|$ \\href{https://github.com/user/repo}{\\faGithub\\ Code}}{Year}\n  \\resumeItemListStart\n    \\resumeItem{Engineered scalable system with measurable performance.}\n  \\resumeItemListEnd\n`)
                  }
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Project</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Project Heading with links block</TooltipContent>
            </Tooltip>

            {/* Bullet Point */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    insertSnippet(`    \\resumeItem{Action verb describing contribution and measurable impact (e.g. reduced latency by 30\\%).}\n`)
                  }
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Bullet</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Bullet Point (\resumeItem)</TooltipContent>
            </Tooltip>

            {/* Copy */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Raw LaTeX Code</TooltipContent>
            </Tooltip>

            {onResetToTemplate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onResetToTemplate}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Code to Default Template</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* ── Monaco Editor Body ── */}
      <div className="flex-1 w-full min-w-0 max-w-full min-h-0 overflow-hidden bg-slate-950">
        <Editor
          height="100%"
          defaultLanguage="latex"
          language="latex"
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange(val || "")}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            lineNumbers: "on",
            wordWrap: "on",
            wrappingStrategy: "advanced",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            folding: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            padding: { top: 12, bottom: 12 },
            cursorBlinking: "smooth",
            smoothScrolling: true,
          }}
        />
      </div>

      {/* ── Overleaf Status & Telemetry Footer ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 text-[11px] text-muted-foreground border-t border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-muted-foreground" />
            {stats.lines} lines
          </span>
          <span>•</span>
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.characters} chars</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live Synced
        </div>
      </div>
    </div>
  );
}
