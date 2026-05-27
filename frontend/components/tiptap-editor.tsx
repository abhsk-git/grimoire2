"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
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

const lowlight = createLowlight(common);

// ── Color palettes ─────────────────────────────────────────────────────────────
const TEXT_COLORS = [
  { label: "Default",  value: "" },
  { label: "Gray",    value: "#6b7280" },
  { label: "Red",     value: "#dc2626" },
  { label: "Orange",  value: "#ea580c" },
  { label: "Purple",  value: "#7c3aed" },
  { label: "Blue",    value: "#2563eb" },
  { label: "Green",   value: "#16a34a" },
];

const HIGHLIGHT_COLORS = [
  { label: "None",    value: "" },
  { label: "Yellow",  value: "#fef08a" },
  { label: "Green",   value: "#bbf7d0" },
  { label: "Blue",    value: "#bfdbfe" },
  { label: "Pink",    value: "#fbcfe8" },
  { label: "Orange",  value: "#fed7aa" },
  { label: "Purple",  value: "#e9d5ff" },
];

// ── Slash commands ─────────────────────────────────────────────────────────────
interface SlashCmd {
  id: string;
  label: string;
  hint: string;
  icon: string;
  keywords: string[];
  exec: (editor: Editor, from: number, to: number) => void;
}

const SLASH_CMDS: SlashCmd[] = [
  { id:"text",      label:"Text",          hint:"Plain paragraph",           icon:"P",   keywords:["p","text","paragraph"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).setParagraph().run() },
  { id:"h1",        label:"Heading 1",     hint:"Large section heading",     icon:"H1",  keywords:["h1","heading","title"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).toggleHeading({level:1}).run() },
  { id:"h2",        label:"Heading 2",     hint:"Medium section heading",    icon:"H2",  keywords:["h2","heading"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).toggleHeading({level:2}).run() },
  { id:"h3",        label:"Heading 3",     hint:"Small section heading",     icon:"H3",  keywords:["h3","subheading"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).toggleHeading({level:3}).run() },
  { id:"bullet",    label:"Bullet List",   hint:"Unordered list",            icon:"•",   keywords:["ul","list","bullet"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).toggleBulletList().run() },
  { id:"numbered",  label:"Numbered List", hint:"Ordered / numbered list",   icon:"1.",  keywords:["ol","ordered","numbered","number"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).toggleOrderedList().run() },
  { id:"checklist", label:"Checklist",     hint:"To-do list with checkboxes",icon:"☑",   keywords:["todo","check","task","checklist"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).toggleTaskList().run() },
  { id:"quote",     label:"Quote",         hint:"Highlighted blockquote",    icon:"❝",   keywords:["quote","blockquote","cite"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).toggleBlockquote().run() },
  { id:"code",      label:"Code Block",    hint:"Syntax highlighted code",   icon:"</>", keywords:["code","pre","snippet"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).toggleCodeBlock().run() },
  { id:"table",     label:"Table",         hint:"Grid with rows & columns",  icon:"▦",   keywords:["table","grid","data"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).insertTable({rows:3,cols:3,withHeaderRow:true}).run() },
  { id:"divider",   label:"Divider",       hint:"Horizontal section break",  icon:"—",   keywords:["hr","divider","line","rule","break"],
    exec:(e,f,t)=>e.chain().focus().deleteRange({from:f,to:t}).setHorizontalRule().run() },
  { id:"image",     label:"Image",         hint:"Upload or embed an image",  icon:"🖼",  keywords:["image","img","photo","upload"],
    exec:()=>{} },
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

// ── Props ─────────────────────────────────────────────────────────────────────
export interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (html: string, wordCount: number) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
  onReady?: () => void;
  placeholder?: string;
  autofocus?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TiptapEditor({
  initialContent = "",
  onChange,
  onImageUpload,
  onReady,
  placeholder = "Tell your story…",
  autofocus = false,
}: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onImageUploadRef = useRef(onImageUpload);
  useEffect(() => { onImageUploadRef.current = onImageUpload; }, [onImageUpload]);

  const [slashMenu, setSlashMenu] = useState<{
    query: string; slashFrom: number; queryEnd: number;
    pos: { top: number; left: number }; selected: number;
  } | null>(null);

  const [colorPicker, setColorPicker] = useState<"text" | "highlight" | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

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
    ],
    content: initialContent || "",
    autofocus: autofocus ? "end" : false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      const wc = text.trim().split(/\s+/).filter(Boolean).length;
      onChange?.(html, wc);

      const info = detectSlash(ed);
      if (info) {
        const coords = ed.view.coordsAtPos(info.queryEnd);
        setSlashMenu({
          ...info,
          pos: { top: coords.bottom + 6, left: Math.max(coords.left, 20) },
          selected: 0,
        });
      } else {
        setSlashMenu(null);
      }
    },
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
    } else {
      cmd.exec(editor, slashFrom, queryEnd);
    }
  }

  return (
    <div className="tiptap-editor-wrap">

      {/* ── Bubble menu ── */}
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
                  title="Bold (⌘B)" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
                <button className={`tt-bub-btn italic${editor.isActive("italic") ? " on" : ""}`}
                  title="Italic (⌘I)" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
                <button className={`tt-bub-btn underline${editor.isActive("underline") ? " on" : ""}`}
                  title="Underline (⌘U)" onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
                <button className={`tt-bub-btn strike${editor.isActive("strike") ? " on" : ""}`}
                  title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>
                <div className="tt-bub-sep" />
                <button className={`tt-bub-btn${editor.isActive("code") ? " on" : ""}`}
                  title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()}>
                  {"</>"}
                </button>
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </button>
                <div className="tt-bub-sep" />
                <button className="tt-bub-btn tt-color-btn" title="Text color" onClick={() => setColorPicker("text")}>
                  <span className="tt-color-letter">A</span>
                  <span className="tt-color-bar" style={{
                    background: (editor.getAttributes("textStyle") as { color?: string }).color || "currentColor"
                  }} />
                </button>
                <button className={`tt-bub-btn${editor.isActive("highlight") ? " on" : ""}`}
                  title="Highlight" onClick={() => setColorPicker("highlight")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 11-6 6v3h3l6-6"/>
                    <path d="M14.5 2.5a2.1 2.1 0 0 1 3 3L9 14 5 15l1-4 8.5-8.5z"/>
                  </svg>
                </button>
                <div className="tt-bub-sep" />
                <button className={`tt-bub-btn${editor.isActive({textAlign:"center"}) ? " on" : ""}`}
                  title="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
                    <line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </BubbleMenu>
      )}

      {/* ── Editor content ── */}
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

      {/* ── Slash menu ── */}
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

      {/* Hidden file input for image insertion */}
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
