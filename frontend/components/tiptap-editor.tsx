"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Editor, Node, mergeAttributes } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import Typography from "@tiptap/extension-typography";
import { Youtube } from "@tiptap/extension-youtube";
import { Emoji, emojis } from "@tiptap/extension-emoji";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import "katex/dist/katex.min.css";

const lowlight = createLowlight(common);

// ── Callout (Warning) node ─────────────────────────────────────────────────
// Uses block+ content so Enter creates new paragraphs inside the box,
// matching the EditorJS warning block behaviour.
const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",

  addAttributes() {
    return { kind: { default: "warning" } };
  },

  parseHTML() {
    return [
      { tag: "div.blog-warning" },
      { tag: "div[data-callout]", getAttrs: el => ({ kind: (el as HTMLElement).dataset.callout || "warning" }) },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "blog-warning", "data-callout": node.attrs.kind }),
      0,
    ];
  },
});

// ── Color palettes ─────────────────────────────────────────────────────────
const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Gray",    value: "#6b7280" },
  { label: "Red",     value: "#dc2626" },
  { label: "Orange",  value: "#ea580c" },
  { label: "Purple",  value: "#7c3aed" },
  { label: "Blue",    value: "#2563eb" },
  { label: "Green",   value: "#16a34a" },
];

const HIGHLIGHT_COLORS = [
  { label: "None",   value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green",  value: "#bbf7d0" },
  { label: "Blue",   value: "#bfdbfe" },
  { label: "Pink",   value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Purple", value: "#e9d5ff" },
];

// ── Slash commands ─────────────────────────────────────────────────────────
interface SlashCmd {
  id: string; label: string; hint: string; icon: string; keywords: string[];
  exec: (editor: Editor, from: number, to: number) => void;
}

const SLASH_CMDS: SlashCmd[] = [
  { id: "text",      label: "Text",          hint: "Plain paragraph",              icon: "P",    keywords: ["p","text","paragraph"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).setParagraph().run() },
  { id: "h1",        label: "Heading 1",     hint: "Large section heading",        icon: "H1",   keywords: ["h1","heading","title"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).toggleHeading({level:1}).run() },
  { id: "h2",        label: "Heading 2",     hint: "Medium section heading",       icon: "H2",   keywords: ["h2","heading"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).toggleHeading({level:2}).run() },
  { id: "h3",        label: "Heading 3",     hint: "Small section heading",        icon: "H3",   keywords: ["h3","subheading"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).toggleHeading({level:3}).run() },
  { id: "bullet",    label: "Bullet List",   hint: "Unordered list",               icon: "•",    keywords: ["ul","list","bullet"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).toggleBulletList().run() },
  { id: "numbered",  label: "Numbered List", hint: "Ordered / numbered list",      icon: "1.",   keywords: ["ol","ordered","numbered"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).toggleOrderedList().run() },
  { id: "checklist", label: "Checklist",     hint: "To-do list with checkboxes",   icon: "☑",    keywords: ["todo","check","task","checklist"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).toggleTaskList().run() },
  { id: "quote",     label: "Quote",         hint: "Highlighted blockquote",       icon: "❝",    keywords: ["quote","blockquote","cite"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).toggleBlockquote().run() },
  { id: "warning",   label: "Warning",       hint: "Warning or note callout block",icon: "⚠",    keywords: ["warning","callout","alert","note","info"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).wrapIn("callout", { kind: "warning" }).run() },
  { id: "code",      label: "Code Block",    hint: "Syntax highlighted code",      icon: "</>",  keywords: ["code","pre","snippet"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).toggleCodeBlock().run() },
  { id: "table",     label: "Table",         hint: "Grid with rows & columns",     icon: "▦",    keywords: ["table","grid","data"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).insertTable({rows:3,cols:3,withHeaderRow:true}).run() },
  { id: "divider",   label: "Divider",       hint: "Horizontal section break",     icon: "—",    keywords: ["hr","divider","line","rule","break"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).setHorizontalRule().run() },
  { id: "image",     label: "Image",         hint: "Upload or embed an image",     icon: "🖼",   keywords: ["image","img","photo","upload"],
    exec: () => {} },
  { id: "youtube",   label: "YouTube",       hint: "Embed a YouTube video",        icon: "▶",    keywords: ["youtube","video","embed","yt"],
    exec: () => {} },
  { id: "math",      label: "Math",          hint: "LaTeX math block",             icon: "∑",    keywords: ["math","latex","equation","formula"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).insertContent({ type: "blockMath", attrs: { value: "" } }).run() },
  { id: "details",   label: "Toggle",        hint: "Collapsible details block",    icon: "▸",    keywords: ["details","toggle","collapse","accordion","spoiler"],
    exec: (e,f,t) => e.chain().focus().deleteRange({from:f,to:t}).setDetails().run() },
];

function filterCmds(query: string): SlashCmd[] {
  if (!query) return SLASH_CMDS;
  const q = query.toLowerCase();
  const score = (c: SlashCmd) => {
    if (q.length === 1) return c.id.startsWith(q) ? 0 : 3;
    if (c.id.startsWith(q) || c.label.toLowerCase().startsWith(q)) return 0;
    if (c.keywords.some(k => k.startsWith(q))) return 1;
    if (c.id.includes(q) || c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q))) return 2;
    return 3;
  };
  return SLASH_CMDS.map(c => ({ c, s: score(c) }))
    .filter(({ s }) => s < 3)
    .sort((a, b) => a.s - b.s)
    .map(({ c }) => c);
}

function detectSlash(editor: Editor): { slashFrom: number; queryEnd: number; query: string } | null {
  const { state } = editor;
  const { from, empty } = state.selection;
  if (!empty) return null;
  const $from = state.doc.resolve(from);
  if ($from.parent.type.name !== "paragraph") return null;
  const text = $from.parent.textContent;
  if (!text.startsWith("/") || text.includes(" ")) return null;
  return { slashFrom: $from.start(), queryEnd: from, query: text.slice(1).toLowerCase() };
}

// ── SVG icons ──────────────────────────────────────────────────────────────
function AlignLeftIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/>
  </svg>;
}
function AlignCenterIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="21" y1="6" x2="3" y2="6"/><line x1="18" y1="12" x2="6" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/>
  </svg>;
}
function AlignRightIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/>
  </svg>;
}
function LinkIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>;
}
function HighlightIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m9 11-6 6v3h3l6-6"/><path d="M14.5 2.5a2.1 2.1 0 0 1 3 3L9 14 5 15l1-4 8.5-8.5z"/>
  </svg>;
}
function BulletListIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
    <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
  </svg>;
}
function OrderedListIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
    <path d="M4 5h1v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 15h2a1 1 0 0 1 0 2H4a1 1 0 0 1 0 2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function ChecklistIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="4" height="4" rx="0.5" strokeWidth="1.8"/>
    <polyline points="3.8,7 5,8.2 7,5.8" strokeWidth="1.8"/>
    <line x1="11" y1="7" x2="21" y2="7"/>
    <rect x="3" y="15" width="4" height="4" rx="0.5" strokeWidth="1.8"/>
    <line x1="11" y1="17" x2="21" y2="17"/>
  </svg>;
}
function BlockquoteIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
  </svg>;
}
function CodeBlockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>;
}
function TableIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="9" x2="9" y2="21"/>
  </svg>;
}
function ImageIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>;
}
function DividerLineIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="2" y1="12" x2="22" y2="12"/>
  </svg>;
}
function YoutubeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.54 6.42A2.78 2.78 0 0 0 20.6 4.47C18.88 4 12 4 12 4s-6.88 0-8.6.47A2.78 2.78 0 0 0 1.46 6.42 29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.53C5.12 20 12 20 12 20s6.88 0 8.6-.47a2.78 2.78 0 0 0 1.94-1.95A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="var(--bg-elev)" stroke="none"/>
  </svg>;
}
function DetailsIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6"/>
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="4" y1="12" x2="13" y2="12"/>
    <line x1="4" y1="18" x2="13" y2="18"/>
  </svg>;
}

// ── Emoji suggestion renderer ──────────────────────────────────────────────
// Returns the render callbacks the Emoji extension's suggestion plugin expects.
function buildEmojiSuggestion() {
  let popup: HTMLElement | null = null;
  let items: { name: string; emoji: string; shortcodes: string[] }[] = [];
  let selected = 0;
  let onSelect: ((item: { name: string; emoji: string }) => void) | null = null;

  function render() {
    if (!popup) return;
    popup.innerHTML = items.slice(0, 10).map((it, i) => `
      <button class="emoji-item${i === selected ? " selected" : ""}" data-i="${i}">
        <span class="emoji-glyph">${it.emoji}</span>
        <span class="emoji-name">:${it.shortcodes[0]}:</span>
      </button>
    `).join("");
    popup.querySelectorAll(".emoji-item").forEach(btn => {
      (btn as HTMLElement).addEventListener("mousedown", e => {
        e.preventDefault();
        const i = parseInt((btn as HTMLElement).dataset.i ?? "0");
        onSelect?.(items[i]);
      });
    });
  }

  return {
    onStart(props: { items: typeof items; command: (p: { name: string; emoji: string }) => void; clientRect?: (() => DOMRect | null) | null }) {
      items    = props.items;
      selected = 0;
      onSelect = (it) => props.command(it);
      if (!items.length) return;
      popup = document.createElement("div");
      popup.className = "emoji-picker";
      document.body.appendChild(popup);
      const rect = props.clientRect?.();
      if (rect) { popup.style.top = `${rect.bottom + 6}px`; popup.style.left = `${rect.left}px`; }
      render();
    },
    onUpdate(props: { items: typeof items; command: (p: { name: string; emoji: string }) => void; clientRect?: (() => DOMRect | null) | null }) {
      items    = props.items;
      selected = 0;
      onSelect = (it) => props.command(it);
      const rect = props.clientRect?.();
      if (popup && rect) { popup.style.top = `${rect.bottom + 6}px`; popup.style.left = `${rect.left}px`; }
      render();
    },
    onKeyDown(props: { event: KeyboardEvent }) {
      if (!items.length) return false;
      if (props.event.key === "ArrowDown") { selected = (selected + 1) % Math.min(items.length, 10); render(); return true; }
      if (props.event.key === "ArrowUp")   { selected = (selected - 1 + Math.min(items.length, 10)) % Math.min(items.length, 10); render(); return true; }
      if (props.event.key === "Enter")     { onSelect?.(items[selected]); return true; }
      return false;
    },
    onExit() {
      popup?.remove();
      popup = null;
    },
  };
}

// ── Toolbar button ─────────────────────────────────────────────────────────
function TbBtn({ active, title, onClick, children, cls }: {
  active?: boolean; title: string; onClick: () => void;
  children: React.ReactNode; cls?: string;
}) {
  return (
    <button
      className={["tt-tb-btn", active ? "on" : "", cls ?? ""].filter(Boolean).join(" ")}
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
    >
      {children}
    </button>
  );
}

// ── Fixed toolbar — two rows, tick prop forces re-render on editor state change ──
function FixedToolbar({ editor, onImageClick, onYoutubeClick, tick: _, onToggle }: {
  editor: Editor; onImageClick: () => void; onYoutubeClick: () => void; tick: number; onToggle: () => void;
}) {
  const [colorMode, setColorMode] = useState<null | "text" | "highlight">(null);
  const [linkMode, setLinkMode]   = useState(false);
  const [linkVal, setLinkVal]     = useState("");
  const savedSel = useRef<{ from: number; to: number } | null>(null);

  const activeH = editor.isActive("heading", { level: 1 }) ? "h1"
    : editor.isActive("heading", { level: 2 }) ? "h2"
    : editor.isActive("heading", { level: 3 }) ? "h3"
    : "p";
  const currentColor = (editor.getAttributes("textStyle") as { color?: string }).color ?? "";

  const toggleBtn = (
    <button
      className="tt-toolbar-toggle"
      title="Hide toolbar"
      onMouseDown={e => { e.preventDefault(); onToggle(); }}
    >⊟</button>
  );

  function openLink() {
    const { from, to } = editor.state.selection;
    savedSel.current = { from, to };
    setLinkVal(editor.getAttributes("link").href || "");
    setLinkMode(true);
  }

  function applyLink() {
    if (savedSel.current) {
      editor.chain().focus().setTextSelection(savedSel.current).run();
      if (linkVal) editor.chain().focus().setLink({ href: linkVal }).run();
      else editor.chain().focus().unsetLink().run();
    }
    setLinkMode(false);
    setLinkVal("");
  }

  if (colorMode) {
    const palette = colorMode === "text" ? TEXT_COLORS : HIGHLIGHT_COLORS;
    return (
      <div className="tt-toolbar-rows">
        <div className="tt-toolbar">
          <span className="tt-tb-label">{colorMode === "text" ? "Text color:" : "Highlight:"}</span>
          {palette.map(c => (
            <button
              key={c.value || "none"}
              className="tt-swatch"
              title={c.label}
              style={{ background: c.value === "" ? "conic-gradient(#e5e7eb 0 50%,#f9fafb 50%)" : c.value }}
              onMouseDown={e => {
                e.preventDefault();
                if (colorMode === "text") {
                  c.value ? editor.chain().focus().setColor(c.value).run()
                          : editor.chain().focus().unsetColor().run();
                } else {
                  c.value ? editor.chain().focus().setHighlight({ color: c.value }).run()
                          : editor.chain().focus().unsetHighlight().run();
                }
                setColorMode(null);
              }}
            />
          ))}
          <div className="tt-tb-sep" />
          <TbBtn title="Close" onClick={() => setColorMode(null)}>✕</TbBtn>
          <div className="tt-toolbar-spacer" />
          {toggleBtn}
        </div>
      </div>
    );
  }

  if (linkMode) {
    return (
      <div className="tt-toolbar-rows">
        <div className="tt-toolbar">
          <span className="tt-tb-label">Link:</span>
          <input
            autoFocus
            className="tt-link-input tt-link-input-tb"
            value={linkVal}
            placeholder="https://…"
            onChange={e => setLinkVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") applyLink();
              if (e.key === "Escape") setLinkMode(false);
            }}
          />
          <TbBtn title="Set link" onClick={applyLink}>↵ Set</TbBtn>
          {editor.isActive("link") && (
            <TbBtn title="Remove link" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkMode(false); }} cls="danger">
              Remove
            </TbBtn>
          )}
          <TbBtn title="Cancel" onClick={() => setLinkMode(false)}>✕</TbBtn>
          <div className="tt-toolbar-spacer" />
          {toggleBtn}
        </div>
      </div>
    );
  }

  return (
    <div className="tt-toolbar-rows">
      {/* Row 1 — text formatting */}
      <div className="tt-toolbar">
        <select
          className="tt-tb-select"
          value={activeH}
          onChange={e => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(v.slice(1)) as 1|2|3 }).run();
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <div className="tt-tb-sep" />
        <TbBtn active={editor.isActive("bold")}      title="Bold (Ctrl+B)"      onClick={() => editor.chain().focus().toggleBold().run()}      cls="bold">B</TbBtn>
        <TbBtn active={editor.isActive("italic")}    title="Italic (Ctrl+I)"    onClick={() => editor.chain().focus().toggleItalic().run()}    cls="italic">I</TbBtn>
        <TbBtn active={editor.isActive("underline")} title="Underline (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} cls="underline">U</TbBtn>
        <TbBtn active={editor.isActive("strike")}    title="Strikethrough"      onClick={() => editor.chain().focus().toggleStrike().run()}    cls="strike">S</TbBtn>
        <div className="tt-tb-sep" />
        <TbBtn active={editor.isActive("code")} title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()}>{"</>"}</TbBtn>
        <TbBtn active={editor.isActive("link")} title="Link"        onClick={openLink}><LinkIcon /></TbBtn>
        <div className="tt-tb-sep" />
        <button
          className="tt-tb-btn tt-color-btn"
          title="Text color"
          onMouseDown={e => { e.preventDefault(); setColorMode("text"); }}
        >
          <span className="tt-color-letter" style={{ borderBottomColor: currentColor || "var(--fg)" }}>A</span>
        </button>
        <TbBtn active={editor.isActive("highlight")} title="Highlight" onClick={() => setColorMode("highlight")}><HighlightIcon /></TbBtn>
        <div className="tt-tb-sep" />
        <TbBtn active={editor.isActive({ textAlign: "left" })}   title="Align left"   onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeftIcon /></TbBtn>
        <TbBtn active={editor.isActive({ textAlign: "center" })} title="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenterIcon /></TbBtn>
        <TbBtn active={editor.isActive({ textAlign: "right" })}  title="Align right"  onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRightIcon /></TbBtn>
        <div className="tt-tb-sep" />
        <TbBtn title="Undo (Ctrl+Z)"       onClick={() => editor.chain().focus().undo().run()}>↺</TbBtn>
        <TbBtn title="Redo (Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()}>↻</TbBtn>
        <div className="tt-toolbar-spacer" />
        {toggleBtn}
      </div>

      {/* Row 2 — block types + insert */}
      <div className="tt-toolbar tt-toolbar-r2">
        <TbBtn active={editor.isActive("bulletList")}  title="Bullet list"    onClick={() => editor.chain().focus().toggleBulletList().run()}><BulletListIcon /></TbBtn>
        <TbBtn active={editor.isActive("orderedList")} title="Numbered list"  onClick={() => editor.chain().focus().toggleOrderedList().run()}><OrderedListIcon /></TbBtn>
        <TbBtn active={editor.isActive("taskList")}    title="Checklist"      onClick={() => editor.chain().focus().toggleTaskList().run()}><ChecklistIcon /></TbBtn>
        <div className="tt-tb-sep" />
        <TbBtn active={editor.isActive("blockquote")} title="Blockquote"     onClick={() => editor.chain().focus().toggleBlockquote().run()}><BlockquoteIcon /></TbBtn>
        <TbBtn active={editor.isActive("codeBlock")}  title="Code block"     onClick={() => editor.chain().focus().toggleCodeBlock().run()}><CodeBlockIcon /></TbBtn>
        <TbBtn active={editor.isActive("callout")}    title="Warning callout" onClick={() => {
          editor.isActive("callout")
            ? editor.chain().focus().lift("callout").run()
            : editor.chain().focus().wrapIn("callout", { kind: "warning" }).run();
        }}>⚠</TbBtn>
        <TbBtn active={editor.isActive("details")}    title="Toggle / collapsible" onClick={() => editor.chain().focus().setDetails().run()}><DetailsIcon /></TbBtn>
        <div className="tt-tb-sep" />
        <TbBtn title="Insert table"    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon /></TbBtn>
        <TbBtn title="Insert image"    onClick={onImageClick}><ImageIcon /></TbBtn>
        <TbBtn title="Embed YouTube"   onClick={onYoutubeClick}><YoutubeIcon /></TbBtn>
        <TbBtn title="Math / LaTeX block (also: /math)" onClick={() => editor.chain().focus().insertContent({ type: "blockMath", attrs: { value: "" } }).run()}>∑</TbBtn>
        <TbBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><DividerLineIcon /></TbBtn>
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────
export interface TiptapEditorProps {
  initialContent?:   string;
  onChange?:         (html: string, wordCount: number) => void;
  onImageUpload?:    (file: File) => Promise<string | null>;
  onReady?:          () => void;
  placeholder?:      string;
  autofocus?:        boolean;
  toolbarEnabled?:   boolean;
  slashMenuEnabled?: boolean;
}

// ── Main component ─────────────────────────────────────────────────────────
export function TiptapEditor({
  initialContent = "",
  onChange,
  onImageUpload,
  onReady,
  placeholder = "Tell your story…",
  autofocus = false,
  toolbarEnabled = true,
  slashMenuEnabled = true,
}: TiptapEditorProps) {
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const onImageUploadRef = useRef(onImageUpload);
  useEffect(() => { onImageUploadRef.current = onImageUpload; }, [onImageUpload]);

  // Forces toolbar re-render on editor selection/state changes
  const [tick, setTick] = useState(0);

  // Toolbar visibility — driven by settings prop, togglable in-session
  const [showToolbar, setShowToolbar] = useState(toolbarEnabled);
  useEffect(() => { setShowToolbar(toolbarEnabled); }, [toolbarEnabled]);

  const [slashMenu, setSlashMenu] = useState<{
    query: string; slashFrom: number; queryEnd: number;
    pos: { top: number; left: number }; selected: number;
  } | null>(null);

  const [colorPicker, setColorPicker]     = useState<"text" | "highlight" | null>(null);
  const [linkInput, setLinkInput]         = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [ytMode, setYtMode]               = useState(false);
  const [ytUrl, setYtUrl]                 = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      CalloutNode,
      Typography,
      Youtube.configure({ width: 720, height: 405, nocookie: true }),
      Emoji.configure({
        emojis,
        enableEmoticons: true,
        suggestion: { render: buildEmojiSuggestion },
      }),
      Details.configure({ persist: true }),
      DetailsContent,
      DetailsSummary,
      BlockMath,
      InlineMath,
    ],
    content: initialContent || "",
    autofocus: autofocus ? "end" : false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      const wc   = text.trim().split(/\s+/).filter(Boolean).length;
      onChange?.(html, wc);
      setTick(n => n + 1);

      if (slashMenuEnabled) {
        const info = detectSlash(ed);
        if (info) {
          const coords = ed.view.coordsAtPos(info.queryEnd);
          setSlashMenu({ ...info, pos: { top: coords.bottom + 6, left: Math.max(coords.left, 20) }, selected: 0 });
        } else {
          setSlashMenu(null);
        }
      } else {
        setSlashMenu(null);
      }
    },
    onSelectionUpdate: () => setTick(n => n + 1),
    onCreate: () => onReady?.(),
  });

  async function handleImageFile(file: File) {
    if (!editor || !onImageUploadRef.current) return;
    const url = await onImageUploadRef.current(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  useEffect(() => {
    const close = () => setSlashMenu(null);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, []);

  const filteredCmds = slashMenu ? filterCmds(slashMenu.query) : [];

  function selectCmd(cmd: SlashCmd) {
    if (!editor || !slashMenu) return;
    const { slashFrom, queryEnd } = slashMenu;
    setSlashMenu(null);
    if (cmd.id === "image") {
      editor.chain().focus().deleteRange({ from: slashFrom, to: queryEnd }).run();
      fileInputRef.current?.click();
    } else if (cmd.id === "youtube") {
      editor.chain().focus().deleteRange({ from: slashFrom, to: queryEnd }).run();
      setYtUrl("");
      setYtMode(true);
    } else {
      cmd.exec(editor, slashFrom, queryEnd);
    }
  }

  const inTable = editor ? editor.isActive("table") : false;

  return (
    <div className="tiptap-editor-wrap">

      {/* ── Floating sticky toolbar row — hidden completely when disabled ── */}
      {editor && showToolbar && (
        <div className="tt-toolbar-row">
          <FixedToolbar
            editor={editor}
            onImageClick={() => fileInputRef.current?.click()}
            onYoutubeClick={() => { setYtUrl(""); setYtMode(true); }}
            tick={tick}
            onToggle={() => setShowToolbar(false)}
          />
        </div>
      )}

      {/* ── Table context bar — appears below toolbar when cursor is in a table ── */}
      {editor && showToolbar && inTable && (
        <div className="tt-table-bar" onMouseDown={e => e.preventDefault()}>
          <span className="tt-tb-label">Table:</span>
          <TbBtn title="Add row above"    onClick={() => editor.chain().focus().addRowBefore().run()}>↑ Add row</TbBtn>
          <TbBtn title="Add row below"    onClick={() => editor.chain().focus().addRowAfter().run()}>↓ Add row</TbBtn>
          <TbBtn title="Delete row"       onClick={() => editor.chain().focus().deleteRow().run()} cls="danger">✕ Row</TbBtn>
          <div className="tt-tb-sep" />
          <TbBtn title="Add column left"  onClick={() => editor.chain().focus().addColumnBefore().run()}>← Add col</TbBtn>
          <TbBtn title="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>→ Add col</TbBtn>
          <TbBtn title="Delete column"    onClick={() => editor.chain().focus().deleteColumn().run()} cls="danger">✕ Col</TbBtn>
          <div className="tt-tb-sep" />
          <TbBtn title="Delete entire table" onClick={() => editor.chain().focus().deleteTable().run()} cls="danger">✕ Delete table</TbBtn>
        </div>
      )}

      {/* ── YouTube URL input — inline prompt below toolbar ── */}
      {ytMode && (
        <div className="tt-yt-bar" onMouseDown={e => e.preventDefault()}>
          <YoutubeIcon />
          <input
            autoFocus
            className="tt-link-input tt-link-input-tb"
            value={ytUrl}
            placeholder="Paste YouTube URL…"
            onChange={e => setYtUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                if (ytUrl && editor) editor.chain().focus().setYoutubeVideo({ src: ytUrl }).run();
                setYtMode(false); setYtUrl("");
              }
              if (e.key === "Escape") { setYtMode(false); setYtUrl(""); }
            }}
          />
          <button className="tt-tb-btn" onMouseDown={e => {
            e.preventDefault();
            if (ytUrl && editor) editor.chain().focus().setYoutubeVideo({ src: ytUrl }).run();
            setYtMode(false); setYtUrl("");
          }}>↵ Embed</button>
          <button className="tt-tb-btn" onMouseDown={e => { e.preventDefault(); setYtMode(false); setYtUrl(""); }}>✕</button>
        </div>
      )}

      {/* ── Bubble menu — appears on text selection ── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{ placement: "top", offset: 8 }}
          shouldShow={({ state }) => {
            const { from, to } = state.selection;
            return from !== to && !editor.isActive("codeBlock") && !editor.isActive("image");
          }}
        >
          <div className="tt-bubble-menu" onMouseDown={e => e.preventDefault()}>
            {showLinkInput ? (
              <div className="tt-link-row">
                <input
                  autoFocus
                  className="tt-link-input"
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  placeholder="https://…"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      if (linkInput) editor.chain().focus().setLink({ href: linkInput }).run();
                      setShowLinkInput(false); setLinkInput("");
                    }
                    if (e.key === "Escape") { setShowLinkInput(false); setLinkInput(""); }
                  }}
                />
                <button className="tt-bub-btn" onClick={() => {
                  if (linkInput) editor.chain().focus().setLink({ href: linkInput }).run();
                  setShowLinkInput(false); setLinkInput("");
                }}>↵</button>
                {editor.isActive("link") && (
                  <button className="tt-bub-btn danger" onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setShowLinkInput(false);
                  }}>✕</button>
                )}
              </div>
            ) : colorPicker ? (
              <div className="tt-color-row">
                {(colorPicker === "text" ? TEXT_COLORS : HIGHLIGHT_COLORS).map(c => (
                  <button
                    key={c.value || "none"}
                    className="tt-swatch"
                    title={c.label}
                    style={{ background: c.value === "" ? "conic-gradient(#e5e7eb 0 50%, #f9fafb 50%)" : c.value }}
                    onClick={() => {
                      if (colorPicker === "text") {
                        c.value ? editor.chain().focus().setColor(c.value).run()
                                : editor.chain().focus().unsetColor().run();
                      } else {
                        c.value ? editor.chain().focus().setHighlight({ color: c.value }).run()
                                : editor.chain().focus().unsetHighlight().run();
                      }
                      setColorPicker(null);
                    }}
                  />
                ))}
                <div className="tt-bub-sep" />
                <button className="tt-bub-btn" onClick={() => setColorPicker(null)}>✕</button>
              </div>
            ) : (
              <>
                <button className={`tt-bub-btn bold${editor.isActive("bold") ? " on" : ""}`}
                  title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
                <button className={`tt-bub-btn italic${editor.isActive("italic") ? " on" : ""}`}
                  title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
                <button className={`tt-bub-btn underline${editor.isActive("underline") ? " on" : ""}`}
                  title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
                <button className={`tt-bub-btn strike${editor.isActive("strike") ? " on" : ""}`}
                  title="Strike" onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>
                <div className="tt-bub-sep" />
                <button className={`tt-bub-btn${editor.isActive("code") ? " on" : ""}`}
                  title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()}>{"</>"}</button>
                <button
                  className={`tt-bub-btn${editor.isActive("link") ? " on" : ""}`}
                  title="Link"
                  onClick={() => {
                    if (editor.isActive("link")) {
                      editor.chain().focus().unsetLink().run();
                    } else {
                      setLinkInput(editor.getAttributes("link").href || "");
                      setShowLinkInput(true);
                    }
                  }}
                >
                  <LinkIcon />
                </button>
                <div className="tt-bub-sep" />
                <button className="tt-bub-btn tt-color-btn" title="Text color" onClick={() => setColorPicker("text")}>
                  <span className="tt-color-letter">A</span>
                  <span className="tt-color-bar" style={{
                    background: (editor.getAttributes("textStyle") as { color?: string }).color || "currentColor"
                  }} />
                </button>
                <button className={`tt-bub-btn${editor.isActive("highlight") ? " on" : ""}`}
                  title="Highlight" onClick={() => setColorPicker("highlight")}><HighlightIcon /></button>
                <div className="tt-bub-sep" />
                <button className={`tt-bub-btn${editor.isActive({ textAlign: "center" }) ? " on" : ""}`}
                  title="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                  <AlignCenterIcon />
                </button>
              </>
            )}
          </div>
        </BubbleMenu>
      )}

      {/* ── Editor body ── */}
      <div
        className="tiptap-editor-body"
        onKeyDownCapture={e => {
          if (!slashMenu || !filteredCmds.length) return;
          if (!["ArrowDown","ArrowUp","Enter","Escape"].includes(e.key)) return;
          e.preventDefault(); e.stopPropagation();
          if (e.key === "ArrowDown")
            setSlashMenu(p => p && { ...p, selected: (p.selected + 1) % filteredCmds.length });
          else if (e.key === "ArrowUp")
            setSlashMenu(p => p && { ...p, selected: (p.selected - 1 + filteredCmds.length) % filteredCmds.length });
          else if (e.key === "Enter") { const c = filteredCmds[slashMenu.selected]; if (c) selectCmd(c); }
          else if (e.key === "Escape") setSlashMenu(null);
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* ── Slash command menu ── */}
      {slashMenu && filteredCmds.length > 0 && (
        <div className="slash-menu" style={{ top: slashMenu.pos.top, left: slashMenu.pos.left }}>
          {slashMenu.query && (
            <div className="slash-menu-heading">
              Blocks
              {filteredCmds.length === 1 && <span className="slash-menu-enter-hint">↵ to insert</span>}
            </div>
          )}
          {filteredCmds.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`slash-menu-item${i === slashMenu.selected ? " selected" : ""}`}
              onMouseDown={ev => { ev.preventDefault(); selectCmd(cmd); }}
              onMouseEnter={() => setSlashMenu(p => p && { ...p, selected: i })}
            >
              <span className="slash-menu-icon">{cmd.icon}</span>
              <div className="slash-menu-text">
                <span className="slash-menu-label">{cmd.label}</span>
                <span className="slash-menu-hint">{cmd.hint}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
