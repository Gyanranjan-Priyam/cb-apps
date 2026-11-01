"use client";

import React, { useState } from "react";
import { Check, Copy, ExternalLink, Terminal, Info, AlertTriangle, Lightbulb } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return <p className="text-xs text-muted-foreground italic">No detailed description available yet.</p>;
  }

  // Parse lines and blocks
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`space-y-3 text-xs sm:text-sm text-foreground/90 leading-relaxed ${className}`}>
      {blocks.map((block, idx) => (
        <BlockItem key={idx} block={block} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Block Parsing Types & Logic
// ─────────────────────────────────────────────────────────────

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "blockquote"; text: string; alertType?: "note" | "tip" | "warning" }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "checklist"; items: { checked: boolean; text: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "paragraph"; text: string };

function parseMarkdownBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "code",
        language: language || "text",
        code: codeLines.join("\n"),
      });
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote & Alerts (> [!NOTE], > [!TIP], > [!WARNING], > text)
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const fullQuote = quoteLines.join("\n");
      let alertType: "note" | "tip" | "warning" | undefined = undefined;
      let text = fullQuote;

      if (/^\[!NOTE\]/i.test(fullQuote)) {
        alertType = "note";
        text = fullQuote.replace(/^\[!NOTE\]\s*/i, "");
      } else if (/^\[!TIP\]/i.test(fullQuote)) {
        alertType = "tip";
        text = fullQuote.replace(/^\[!TIP\]\s*/i, "");
      } else if (/^\[!(WARNING|CAUTION|IMPORTANT)\]/i.test(fullQuote)) {
        alertType = "warning";
        text = fullQuote.replace(/^\[!(WARNING|CAUTION|IMPORTANT)\]\s*/i, "");
      }

      blocks.push({ type: "blockquote", text, alertType });
      continue;
    }

    // Checklist (- [ ] or - [x])
    if (/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/.test(line)) {
      const items: { checked: boolean; text: string }[] = [];
      while (i < lines.length && /^\s*[-*]\s+\[([ xX])\]\s+(.+)$/.test(lines[i])) {
        const m = lines[i].match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (m) {
          items.push({
            checked: m[1].toLowerCase() === "x",
            text: m[2],
          });
        }
        i++;
      }
      blocks.push({ type: "checklist", items });
      continue;
    }

    // Unordered List (- or *)
    if (/^\s*[-*]\s+(.+)$/.test(line)) {
      const items: string[] = [];
      while (
        i < lines.length &&
        /^\s*[-*]\s+(.+)$/.test(lines[i]) &&
        !/^\s*[-*]\s+\[([ xX])\]/.test(lines[i])
      ) {
        const m = lines[i].match(/^\s*[-*]\s+(.+)$/);
        if (m) items.push(m[1]);
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered List (1. 2. etc)
    if (/^\s*\d+\.\s+(.+)$/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+(.+)$/.test(lines[i])) {
        const m = lines[i].match(/^\s*\d+\.\s+(.+)$/);
        if (m) items.push(m[1]);
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Markdown Table (| Col 1 | Col 2 |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());
        const headers = parseRow(tableLines[0]);
        const dataRows = tableLines.slice(2).map(parseRow); // skip header delimiter
        blocks.push({ type: "table", headers, rows: dataRows });
        continue;
      }
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular Paragraph (combines multi-line paragraph)
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(---|___|\*\*\*)$/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|"))
    ) {
      pLines.push(lines[i]);
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({ type: "paragraph", text: pLines.join(" ") });
    }
  }

  return blocks;
}

// ─────────────────────────────────────────────────────────────
// Block Renderer Components
// ─────────────────────────────────────────────────────────────

function BlockItem({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const text = renderInline(block.text);
      if (block.level === 1) {
        return (
          <h2 className="text-base sm:text-lg font-bold text-foreground mt-4 pb-1.5 border-b border-border/60 first:mt-0">
            {text}
          </h2>
        );
      }
      if (block.level === 2) {
        return (
          <h3 className="text-sm sm:text-base font-bold text-foreground mt-3.5 flex items-center gap-2 first:mt-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            {text}
          </h3>
        );
      }
      if (block.level === 3) {
        return (
          <h4 className="text-xs sm:text-sm font-semibold text-foreground/90 mt-2.5 uppercase tracking-wide first:mt-0">
            {text}
          </h4>
        );
      }
      return <h5 className="text-xs font-semibold text-foreground/80 mt-2">{text}</h5>;
    }

    case "code":
      return <CodeBlock language={block.language} code={block.code} />;

    case "blockquote": {
      if (block.alertType === "note") {
        return (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Info className="w-3.5 h-3.5" /> Note
            </div>
            <div className="text-xs leading-relaxed">{renderInline(block.text)}</div>
          </div>
        );
      }
      if (block.alertType === "tip") {
        return (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Lightbulb className="w-3.5 h-3.5" /> Pro Tip
            </div>
            <div className="text-xs leading-relaxed">{renderInline(block.text)}</div>
          </div>
        );
      }
      if (block.alertType === "warning") {
        return (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Important
            </div>
            <div className="text-xs leading-relaxed">{renderInline(block.text)}</div>
          </div>
        );
      }

      return (
        <blockquote className="pl-3.5 py-1 border-l-3 border-primary/50 text-xs sm:text-sm text-muted-foreground italic my-2 bg-muted/20 rounded-r-lg">
          {renderInline(block.text)}
        </blockquote>
      );
    }

    case "list":
      if (block.ordered) {
        return (
          <ol className="list-decimal list-inside space-y-1 my-2 pl-1 text-xs sm:text-sm">
            {block.items.map((item, idx) => (
              <li key={idx} className="text-foreground/90 pl-1">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="space-y-1 my-2 pl-1 text-xs sm:text-sm">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-foreground/90">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );

    case "checklist":
      return (
        <div className="space-y-1.5 my-2 p-2 rounded-xl bg-muted/30 border border-border/60">
          {block.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] shrink-0 ${
                  item.checked
                    ? "bg-primary border-primary text-primary-foreground font-bold"
                    : "border-muted-foreground/40 bg-background"
                }`}
              >
                {item.checked && <Check className="w-2.5 h-2.5" />}
              </span>
              <span className={item.checked ? "line-through text-muted-foreground" : "text-foreground"}>
                {renderInline(item.text)}
              </span>
            </div>
          ))}
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto my-3 rounded-lg border border-border/70">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-foreground font-bold border-b border-border/70">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="p-2 border-r last:border-r-0 border-border/60">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {block.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-muted/20">
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-2 border-r last:border-r-0 border-border/40">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "hr":
      return <hr className="border-border/60 my-3" />;

    case "paragraph":
      return <p className="leading-relaxed whitespace-pre-line">{renderInline(block.text)}</p>;
  }
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2.5 rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-primary" />
          <span>{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-[10px] hover:text-zinc-100 transition-colors cursor-pointer py-0.5 px-1 rounded hover:bg-zinc-800"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] sm:text-xs font-mono leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline Formatter (Bold, Italic, Code, Links)
// ─────────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by code, links, bold, italic
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Inline Code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 rounded-md bg-muted border border-border/60 text-primary font-mono text-[11px]"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Link: [title](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const isInternal = linkMatch[2].startsWith("/") || linkMatch[2].includes("codebreakers");
      parts.push(
        <a
          key={keyIdx++}
          href={linkMatch[2]}
          target={isInternal ? "_self" : "_blank"}
          rel="noopener noreferrer"
          className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-0.5"
        >
          <span>{linkMatch[1]}</span>
          {!isInternal && <ExternalLink className="w-2.5 h-2.5 inline" />}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 3. Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      parts.push(
        <strong key={keyIdx++} className="font-bold text-foreground">
          {renderInline(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 4. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      parts.push(
        <em key={keyIdx++} className="italic text-foreground/90">
          {renderInline(italicMatch[2])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 5. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      parts.push(
        <span key={keyIdx++} className="line-through text-muted-foreground">
          {renderInline(strikeMatch[1])}
        </span>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Plain text chunk up to next special character
    const nextSpecial = remaining.search(/[`\[\*_~]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Single orphan special char
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return <>{parts}</>;
}
