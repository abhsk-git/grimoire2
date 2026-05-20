"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  DragEvent,
  KeyboardEvent,
} from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Icon } from "./icons";

declare global {
  interface Window {
    EditorJS: any;
    Header: any;
    List: any;
    Quote: any;
    CodeTool: any;
    InlineCode: any;
    Delimiter: any;
    ImageTool: any;
    Embed: any;
    Table: any;
    Warning: any;
    Marker: any;
    Checklist: any;
    LinkTool: any;
  }
}

const CDN_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest/dist/editorjs.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/header@latest/dist/header.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/list@latest/dist/list.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/quote@latest/dist/quote.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/code@latest/dist/code.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest/dist/inline-code.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest/dist/delimiter.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/image@latest/dist/image.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/embed@latest/dist/embed.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/table@latest/dist/table.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/warning@latest/dist/warning.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/marker@latest/dist/marker.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest/dist/checklist.umd.js",
  "https://cdn.jsdelivr.net/npm/@editorjs/link@latest/dist/link.umd.js",
];

function loadScripts(): Promise<void> {
  return CDN_SCRIPTS.reduce(
    (chain, src) =>
      chain.then(
        () =>
          new Promise<void>((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
            const s = document.createElement("script");
            s.src = src;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(s);
          })
      ),
    Promise.resolve()
  );
}

interface PostData {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string;
  tags: string;
  slug: string;
  status: string;
}

interface TagSuggestion {
  name: string;
  count: number;
}

interface WriteEditorProps {
  postId?: number;
}

// ── Slash command definitions ─────────────────────────────────────────────────

interface SlashCmd {
  id: string;
  label: string;
  hint: string;
  type: string;
  data: Record<string, unknown>;
  icon: string;
  keywords: string[];
}

const SLASH_CMDS: SlashCmd[] = [
  { id:"paragraph", label:"Paragraph",     hint:"Plain text",                  type:"paragraph", data:{},                    icon:"P",  keywords:["p","text","body"] },
  { id:"h2",        label:"Heading 2",     hint:"Large section heading",       type:"header",    data:{ level:2 },           icon:"H2", keywords:["h2","heading","title"] },
  { id:"h3",        label:"Heading 3",     hint:"Medium section heading",      type:"header",    data:{ level:3 },           icon:"H3", keywords:["h3","subheading","sub"] },
  { id:"bullet",    label:"Bullet List",   hint:"Unordered list",              type:"list",      data:{ style:"unordered" }, icon:"•",  keywords:["ul","list","bullet"] },
  { id:"numbered",  label:"Numbered List", hint:"Ordered / numbered list",     type:"list",      data:{ style:"ordered" },   icon:"1.", keywords:["ol","ordered","number"] },
  { id:"checklist", label:"Checklist",     hint:"To-do list with checkboxes",  type:"checklist", data:{},                    icon:"☑",  keywords:["todo","check","task"] },
  { id:"quote",     label:"Quote",         hint:"Highlighted blockquote",      type:"quote",     data:{},                    icon:"❝",  keywords:["quote","blockquote","cite"] },
  { id:"code",      label:"Code Block",    hint:"Syntax-highlighted code",     type:"code",      data:{},                    icon:"<>", keywords:["code","pre","snippet"] },
  { id:"table",     label:"Table",         hint:"Grid of rows and columns",    type:"table",     data:{},                    icon:"▦",  keywords:["table","grid","data"] },
  { id:"warning",   label:"Warning",       hint:"Callout or alert box",        type:"warning",   data:{},                    icon:"⚠",  keywords:["warning","alert","note"] },
  { id:"delimiter", label:"Divider",       hint:"Visual section break",        type:"delimiter", data:{},                    icon:"—",  keywords:["hr","divider","line","break"] },
  { id:"image",     label:"Image",         hint:"Upload or embed an image",    type:"image",     data:{},                    icon:"🖼", keywords:["image","img","photo"] },
];

function getFilteredCmds(query: string): SlashCmd[] {
  if (!query) return SLASH_CMDS;
  const q = query.toLowerCase();
  return SLASH_CMDS.filter(c =>
    c.id.includes(q) ||
    c.label.toLowerCase().includes(q) ||
    c.keywords.some(k => k.includes(q))
  );
}

// ── Slash Menu Panel ──────────────────────────────────────────────────────────

function SlashMenuPanel({
  query,
  selected,
  pos,
  onSelect,
  onHover,
}: {
  query: string;
  selected: number;
  pos: { top: number; left: number };
  onSelect: (cmd: SlashCmd) => void;
  onHover: (idx: number) => void;
}) {
  const filtered = getFilteredCmds(query);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // children[0] is the heading div when query is set, so items are offset by 1
    const childIdx = query ? selected + 1 : selected;
    const item = listRef.current?.children[childIdx] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [selected, query]); // filtered is derived from query; no need to list it

  if (!filtered.length) return null;

  const menuHeight = Math.min(filtered.length, 7) * 52 + (query ? 36 : 8) + 8;
  const adjustedTop =
    pos.top + menuHeight > window.innerHeight - 8
      ? pos.top - menuHeight - 28
      : pos.top;
  const adjustedLeft = Math.min(pos.left, window.innerWidth - 292);

  return (
    <div
      className="slash-menu"
      ref={listRef}
      style={{ top: adjustedTop, left: adjustedLeft }}
    >
      {query && <div className="slash-menu-heading">Blocks</div>}
      {filtered.map((cmd, i) => (
        <button
          key={cmd.id}
          className={`slash-menu-item${i === selected ? " selected" : ""}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(cmd); }}
          onMouseEnter={() => onHover(i)}
        >
          <span className="slash-menu-icon">{cmd.icon}</span>
          <div className="slash-menu-text">
            <span className="slash-menu-label">{cmd.label}</span>
            <span className="slash-menu-hint">{cmd.hint}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Cover Image Zone ──────────────────────────────────────────────────────────

function CoverZone({
  coverUrl,
  onUploadFile,
  onUrlChange,
  onRemove,
  uploading,
}: {
  coverUrl: string;
  onUploadFile: (file: File) => void;
  onUrlChange: (url: string) => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onUploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleUrlSubmit() {
    const url = urlInput.trim();
    if (url) {
      onUrlChange(url);
      setUrlInput("");
      setUrlMode(false);
    }
  }

  if (coverUrl) {
    return (
      <div className="we-cover-has">
        <img src={coverUrl} alt="Cover" className="we-cover-img" />
        <div className="we-cover-actions">
          <button
            className="we-cover-btn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Icon name="upload" size={13} />
            {uploading ? "Uploading…" : "Change"}
          </button>
          <button className="we-cover-btn danger" onClick={onRemove}>
            <Icon name="x" size={13} /> Remove
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div
      className={`we-cover-empty${dragging ? " drag" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !urlMode && fileRef.current?.click()}
    >
      {uploading ? (
        <div className="we-cover-placeholder">
          <div className="we-cover-spinner" />
          <span>Uploading…</span>
        </div>
      ) : urlMode ? (
        <div
          className="we-cover-url-form"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            className="we-cover-url-input"
            placeholder="Paste image URL…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUrlSubmit();
              if (e.key === "Escape") setUrlMode(false);
            }}
          />
          <button className="we-cover-btn" onClick={handleUrlSubmit}>
            Add
          </button>
          <button
            className="we-cover-btn"
            onClick={() => setUrlMode(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="we-cover-placeholder">
          <div className="we-cover-icon">
            <Icon name="image" size={22} />
          </div>
          <span className="we-cover-label">Add a cover image</span>
          <span className="we-cover-hint">
            Drop an image, click to upload,{" "}
            <button
              className="we-cover-link"
              onClick={(e) => {
                e.stopPropagation();
                setUrlMode(true);
              }}
            >
              or paste a URL
            </button>
          </span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Tag chips ────────────────────────────────────────────────────────────────

function TagChips({
  tags,
  suggestions,
  onChange,
}: {
  tags: string[];
  suggestions: TagSuggestion[];
  onChange: (tags: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const t = raw
      .trim()
      .toLowerCase()
      .replace(/[^\w-]/g, "");
    if (t && !tags.includes(t) && tags.length < 10) {
      onChange([...tags, t]);
    }
    setInputVal("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  const filteredSuggestions = suggestions
    .map((s) => s.name)
    .filter(
      (n) =>
        !tags.includes(n) &&
        (inputVal === "" || n.startsWith(inputVal.toLowerCase()))
    )
    .slice(0, 8);

  return (
    <div className="we-tags-wrap">
      <div
        className="we-tags"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.length === 0 && !focused && (
          <span className="we-tags-placeholder">Add up to 10 tags…</span>
        )}
        {tags.map((tag) => (
          <span key={tag} className="we-tag-chip">
            <span className="we-tag-hash">#</span>
            {tag}
            <button
              className="we-tag-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="we-tag-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 150);
            if (inputVal) addTag(inputVal);
          }}
          placeholder={tags.length === 0 ? "" : ""}
          style={{ width: Math.max(80, inputVal.length * 9 + 16) }}
        />
      </div>

      {focused && filteredSuggestions.length > 0 && (
        <div className="we-tag-suggestions">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              className="we-tag-suggest-item"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
                inputRef.current?.focus();
              }}
            >
              <span className="we-tag-hash">#</span>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────

export function WriteEditor({ postId: initialPostId }: WriteEditorProps) {
  const { user, loading: authLoading } = useAuth();

  const [postId, setPostId] = useState<number | null>(initialPostId ?? null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saveStatus, setSaveStatus] = useState<
    "" | "saving" | "saved" | "unsaved" | "error"
  >("");
  const [editorReady, setEditorReady] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [slashMenu, setSlashMenu] = useState<{
    open: boolean;
    query: string;
    selected: number;
    pos: { top: number; left: number };
  } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editorRef = useRef<any>(null);
  const postIdRef = useRef<number | null>(initialPostId ?? null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const excerptRef = useRef<HTMLTextAreaElement>(null);
  // stable ref so event handlers always see latest slash-menu state
  const slashMenuRef = useRef(slashMenu);
  useEffect(() => { slashMenuRef.current = slashMenu; }, [slashMenu]);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [user, authLoading]);

  useEffect(() => {
    fetch("/api/blog/tags")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTagSuggestions(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    async function init() {
      let initialData: any = undefined;

      if (initialPostId) {
        try {
          const r = await fetch(`/api/blog/posts/${initialPostId}`, {
            credentials: "include",
          });
          if (r.ok) {
            const post: PostData = await r.json();
            setTitle(post.title || "");
            setSlug(post.slug || "");
            setTagList(
              (post.tags || "")
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            );
            setExcerpt(post.excerpt || "");
            setCoverUrl(post.cover_image || "");
            setStatus(post.status === "published" ? "published" : "draft");
            if (post.content) {
              try { initialData = JSON.parse(post.content); } catch {}
            }
          }
        } catch {}
      }

      await loadScripts();
      editorRef.current?.destroy?.();

      editorRef.current = new window.EditorJS({
        holder: "editorjs",
        autofocus: !initialPostId,
        placeholder: "Tell your story…",
        data: initialData,
        tools: {
          header: { class: window.Header, inlineToolbar: true },
          list: { class: window.List, inlineToolbar: true },
          quote: { class: window.Quote, inlineToolbar: true },
          code: { class: window.CodeTool },
          inlineCode: { class: window.InlineCode },
          delimiter: window.Delimiter,
          image: {
            class: window.ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const fd = new FormData();
                  fd.append("image", file);
                  const r = await fetch("/api/blog/upload", {
                    method: "POST",
                    credentials: "include",
                    body: fd,
                  });
                  return r.ok ? r.json() : { success: 0 };
                },
                async uploadByUrl(url: string) {
                  const r = await fetch("/api/blog/upload", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                  });
                  return r.ok ? r.json() : { success: 0 };
                },
              },
            },
          },
          embed: window.Embed,
          table: { class: window.Table, inlineToolbar: true },
          warning: window.Warning,
          marker: { class: window.Marker },
          checklist: { class: window.Checklist, inlineToolbar: true },
          linkTool: {
            class: window.LinkTool,
            config: { endpoint: "/api/link-meta" },
          },
        },
        onChange: () => {
          setSaveStatus("unsaved");
          scheduleAutoSave();
          updateWordCount();

          // Slash command detection — check if focused block starts with "/"
          const active = document.activeElement as HTMLElement | null;
          const editorEl = document.getElementById("editorjs");
          if (active && editorEl?.contains(active)) {
            const text = (active.textContent ?? "").trim();
            if (text.startsWith("/")) {
              const query = text.slice(1).toLowerCase();
              const sel = window.getSelection();
              const rect = sel?.rangeCount
                ? sel.getRangeAt(0).getBoundingClientRect()
                : active.getBoundingClientRect();
              if (rect.height > 0) {
                setSlashMenu({
                  open: true,
                  query,
                  selected: 0,
                  pos: { top: rect.bottom + 6, left: Math.max(rect.left, 20) },
                });
                return;
              }
            }
          }
          setSlashMenu((prev) => (prev?.open ? null : prev));
        },
      });

      setEditorReady(true);
    }

    init();
    return () => {
      autoSaveTimer.current && clearTimeout(autoSaveTimer.current);
      editorRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  function scheduleAutoSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDraft(true), 4000);
  }

  async function updateWordCount() {
    if (!editorRef.current) return;
    try {
      const data = await editorRef.current.save();
      const text = data.blocks
        .map((b: any) => {
          if (["paragraph", "header", "quote"].includes(b.type))
            return b.data?.text || "";
          if (b.type === "list") return (b.data?.items || []).join(" ");
          if (b.type === "code") return b.data?.code || "";
          if (b.type === "checklist")
            return (b.data?.items || [])
              .map((i: any) => i?.text || "")
              .join(" ");
          return "";
        })
        .join(" ")
        .replace(/<[^>]+>/g, "");
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    } catch {}
  }

  async function buildPayload() {
    const editorData = await editorRef.current.save();
    return {
      title: titleRef.current?.value || title,
      content: JSON.stringify(editorData),
      excerpt: excerptRef.current?.value || excerpt,
      cover_image: coverUrl,
      tags: tagList.join(","),
      slug,
    };
  }

  const saveDraft = useCallback(
    async (_silent = false) => {
      if (!editorRef.current || !editorReady) return;
      setSaveStatus("saving");
      try {
        const payload = await buildPayload();
        const isNew = !postIdRef.current;
        const url = isNew
          ? "/api/blog/posts"
          : `/api/blog/posts/${postIdRef.current}`;
        const r = await fetch(url, {
          method: isNew ? "POST" : "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          const data = await r.json();
          if (isNew && data.id) {
            postIdRef.current = data.id;
            setPostId(data.id);
            window.history.replaceState(null, "", `/write/${data.id}`);
          }
          if (data.slug) setSlug(data.slug);
          setSaveStatus("saved");
          setLastSaved(new Date());
          setTimeout(() => setSaveStatus(""), 3000);
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorReady, excerpt, coverUrl, tagList, slug]
  );

  async function selectSlashCmd(cmd: SlashCmd) {
    setSlashMenu(null);
    if (!editorRef.current) return;
    try {
      const idx = editorRef.current.blocks?.getCurrentBlockIndex?.() ?? -1;
      if (idx >= 0) {
        editorRef.current.blocks.delete(idx);
        editorRef.current.blocks.insert(cmd.type, cmd.data, {}, idx, true);
      }
    } catch {}
  }

  async function handlePublish() {
    await saveDraft(true);
    if (!postIdRef.current) return;
    const r = await fetch(`/api/blog/posts/${postIdRef.current}/publish`, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      const data = await r.json();
      setStatus(data.status === "published" ? "published" : "draft");
    }
  }

  async function handleDelete() {
    if (!postIdRef.current) { window.location.href = "/dashboard"; return; }
    const r = await fetch(`/api/blog/posts/${postIdRef.current}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) window.location.href = "/dashboard";
  }

  async function handleCoverFile(file: File) {
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch("/api/blog/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (r.ok) {
        const d = await r.json();
        if (d.success && d.file?.url) setCoverUrl(d.file.url);
      }
    } finally {
      setCoverUploading(false);
    }
  }

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveDraft]);

  if (authLoading || !user) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  const saveLabel =
    saveStatus === "saving"  ? "Saving…"
    : saveStatus === "saved"   ? "Saved ✓"
    : saveStatus === "error"   ? "Save failed"
    : saveStatus === "unsaved" ? "Unsaved"
    : "";

  const lastSavedLabel = lastSaved
    ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "";

  const filteredCmds = slashMenu?.open ? getFilteredCmds(slashMenu.query) : [];

  return (
    <div className="write-page">

      {/* ── Topbar ── */}
      <div className="write-topbar">
        <Link href="/dashboard" className="write-back">
          <Icon name="arrow-left" size={14} />
          Dashboard
        </Link>

        <div className="write-topbar-pills">
          <span className={`write-status-pill${status === "published" ? " published" : ""}`}>
            {status === "published" ? "Live" : "Draft"}
          </span>
          {saveLabel ? (
            <span className={`write-save-status${saveStatus === "error" ? " error" : saveStatus === "unsaved" ? " unsaved" : saveStatus === "saving" ? " saving" : ""}`}>
              {saveStatus === "saving" && <span className="save-dot" />}
              {saveLabel}
            </span>
          ) : lastSavedLabel ? (
            <span className="write-last-saved">{lastSavedLabel}</span>
          ) : null}
          {wordCount > 0 && (
            <span className="write-word-count">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          )}
        </div>

        <div className="write-topbar-right">
          <button
            className="write-details-btn"
            onClick={() => setDetailsOpen((v) => !v)}
            title="Post details (slug, excerpt, SEO)"
          >
            <Icon name="settings" size={14} />
            Details
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => saveDraft()}
            disabled={!editorReady}
          >
            Save
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handlePublish}
            disabled={!editorReady}
          >
            {status === "published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div
        className="write-canvas"
        onKeyDownCapture={(e) => {
          if (!slashMenu?.open || !filteredCmds.length) return;
          if (!["ArrowDown","ArrowUp","Enter","Tab","Escape"].includes(e.key)) return;
          e.preventDefault();
          e.stopPropagation();
          if (e.key === "ArrowDown")
            setSlashMenu((p) => p && { ...p, selected: (p.selected + 1) % filteredCmds.length });
          else if (e.key === "ArrowUp")
            setSlashMenu((p) => p && { ...p, selected: (p.selected - 1 + filteredCmds.length) % filteredCmds.length });
          else if (e.key === "Enter" || e.key === "Tab") {
            const cmd = filteredCmds[slashMenu.selected];
            if (cmd) selectSlashCmd(cmd);
          } else if (e.key === "Escape")
            setSlashMenu(null);
        }}
      >

        {/* Cover zone */}
        <CoverZone
          coverUrl={coverUrl}
          onUploadFile={handleCoverFile}
          onUrlChange={setCoverUrl}
          onRemove={() => setCoverUrl("")}
          uploading={coverUploading}
        />

        {/* Title */}
        <div className="write-canvas-inner">
          <textarea
            ref={titleRef}
            className="write-title"
            placeholder="Post title…"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus("unsaved");
              scheduleAutoSave();
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            rows={1}
          />

          {/* Tags */}
          <TagChips
            tags={tagList}
            suggestions={tagSuggestions}
            onChange={(t) => { setTagList(t); setSaveStatus("unsaved"); scheduleAutoSave(); }}
          />

          {/* Excerpt */}
          <textarea
            ref={excerptRef}
            className="write-excerpt"
            placeholder="Write a short excerpt (optional — shown in previews)…"
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              setSaveStatus("unsaved");
              scheduleAutoSave();
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            rows={1}
          />

          <div className="write-divider">
            <span />
          </div>

          {/* Editor body */}
          <div className="write-body">
            <div id="editorjs" />
          </div>
        </div>
      </div>

      {/* ── Details slide-over (slug + SEO only) ── */}
      {detailsOpen && (
        <div
          className="settings-overlay open"
          onClick={() => setDetailsOpen(false)}
        />
      )}
      <div className={`write-settings${detailsOpen ? " open" : ""}`}>
        <div className="write-settings-head">
          <span>Post details</span>
          <button
            className="icon-btn"
            style={{ width: 28, height: 28 }}
            onClick={() => setDetailsOpen(false)}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="write-settings-body">
          <div className="field">
            <label>URL slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated-from-title"
            />
            <p className="field-hint">
              grimoire.sysnode.in/blog/<strong>{slug || "your-slug"}</strong>
            </p>
          </div>

          {postId && (
            <>
              <div className="field" style={{ marginTop: 24 }}>
                <label style={{ color: "var(--fg-soft)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Danger zone
                </label>
              </div>
              {deleteConfirm ? (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    className="btn btn-danger-subtle btn-sm"
                    style={{ flex: 1 }}
                    onClick={handleDelete}
                  >
                    Yes, delete
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-danger-subtle btn-sm"
                  style={{ width: "100%", marginTop: 8 }}
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Icon name="trash" size={13} /> Delete post
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Slash command palette ── */}
      {slashMenu?.open && filteredCmds.length > 0 && (
        <SlashMenuPanel
          query={slashMenu.query}
          selected={slashMenu.selected}
          pos={slashMenu.pos}
          onSelect={selectSlashCmd}
          onHover={(i) => setSlashMenu((p) => p && { ...p, selected: i })}
        />
      )}
    </div>
  );
}
