/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

interface MiniRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function hasListNodes(json: any): boolean {
  if (!json || typeof json !== "object") return false;
  if (json.type === "bulletList" || json.type === "orderedList") return true;
  if (Array.isArray(json.content)) {
    return json.content.some(hasListNodes);
  }
  return false;
}

function extractPlainTextFromJson(json: any): string {
  if (!json) return "";
  if (typeof json === "string") return json;
  if (json.text && typeof json.text === "string") return json.text;
  if (Array.isArray(json.content)) {
    return json.content.map(extractPlainTextFromJson).join(" ");
  }
  return "";
}

function autoFormatDescriptionText(text: string): string {
  if (!text) return "";

  if (text.includes("📌") || /important:/i.test(text)) {
    const parts = text.split(/(📌\s*Important:?|Important:)/i);
    if (parts.length >= 3) {
      const intro = parts[0].trim();
      const header = parts[1].trim();
      const rest = parts.slice(2).join("").trim();

      const rawSentences = rest.split(/(?<=\.)\s+|\r?\n/).map((s) => s.trim()).filter(Boolean);
      const bulletItems: string[] = [];
      let outro = "";

      for (const sentence of rawSentences) {
        if (/please complete the form/i.test(sentence)) {
          outro = sentence;
        } else {
          const cleanSentence = sentence.replace(/^[•*\-\s]+/, "").trim();
          if (cleanSentence) bulletItems.push(cleanSentence);
        }
      }

      let html = "";
      if (intro) html += `<p>${intro}</p>`;
      if (header) html += `<p style="margin-top: 12px; margin-bottom: 6px;"><strong>${header}</strong></p>`;
      if (bulletItems.length > 0) {
        html += `<ul class="my-bullet-list">`;
        for (const item of bulletItems) {
          html += `<li class="my-list-item"><p>${item}</p></li>`;
        }
        html += `</ul>`;
      }
      if (outro) html += `<p style="margin-top: 12px;"><strong>${outro}</strong></p>`;

      return html;
    }
  }

  return plainTextToHtml(text);
}

function plainTextToHtml(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  let html = "";
  let inBulletList = false;
  let inOrderedList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inBulletList) { html += "</ul>"; inBulletList = false; }
      if (inOrderedList) { html += "</ol>"; inOrderedList = false; }
      continue;
    }

    const bulletMatch = line.match(/^(?:[•*\-]|&bull;)\s+(.*)/);
    const orderedMatch = line.match(/^\d+[\.\)]\s+(.*)/);

    if (bulletMatch) {
      if (inOrderedList) { html += "</ol>"; inOrderedList = false; }
      if (!inBulletList) { html += "<ul class=\"my-bullet-list\">"; inBulletList = true; }
      html += `<li class="my-list-item"><p>${bulletMatch[1]}</p></li>`;
    } else if (orderedMatch) {
      if (inBulletList) { html += "</ul>"; inBulletList = false; }
      if (!inOrderedList) { html += "<ol class=\"my-ordered-list\">"; inOrderedList = true; }
      html += `<li class="my-list-item"><p>${orderedMatch[1]}</p></li>`;
    } else {
      if (inBulletList) { html += "</ul>"; inBulletList = false; }
      if (!inOrderedList) { html += "</ol>"; inOrderedList = false; }
      html += `<p>${line}</p>`;
    }
  }

  if (inBulletList) html += "</ul>";
  if (inOrderedList) html += "</ol>";

  return html || `<p>${text}</p>`;
}

/**
 * Compact Tiptap editor for inline description fields.
 * Stores content as JSON string (same as the full RichTextEditor).
 */
export function MiniRichEditor({ value, onChange, placeholder = "Add a description...", className }: MiniRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "my-list-item",
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "my-bullet-list",
        },
        itemTypeName: "listItem",
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "my-ordered-list",
        },
        itemTypeName: "listItem",
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[40px] h-auto px-3 py-2 text-sm focus:outline-none",
          "prose prose-sm dark:prose-invert !max-w-none",
          "[&_p]:m-0 [&_p]:leading-relaxed",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
          "[&_li]:my-0.5",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    content: (() => {
      if (!value) return "";
      try {
        const json = JSON.parse(value);
        if (json && typeof json === "object" && (json.type || json.content)) {
          return json;
        }
      } catch {
        // Not JSON, handle as plain text
      }
      return autoFormatDescriptionText(value);
    })(),
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className={cn("border border-dashed border-border/50 rounded-lg overflow-hidden focus-within:border-primary focus-within:border-solid transition-all", className)}>
      {/* Minimal toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border/30 bg-muted/20">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1 rounded hover:bg-muted/60 transition-colors",
            editor.isActive("bold") && "bg-muted text-primary"
          )}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1 rounded hover:bg-muted/60 transition-colors",
            editor.isActive("italic") && "bg-muted text-primary"
          )}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-border/40 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1 rounded hover:bg-muted/60 transition-colors",
            editor.isActive("bulletList") && "bg-muted text-primary"
          )}
          title="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1 rounded hover:bg-muted/60 transition-colors",
            editor.isActive("orderedList") && "bg-muted text-primary"
          )}
          title="Ordered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
