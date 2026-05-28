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
import { useSettings } from "@/lib/settings";
import { Icon } from "./icons";
import { ImageCropModal } from "./image-crop-modal";
import { TiptapEditor } from "./tiptap-editor";
import { editorJsToHtml } from "@/lib/editorjs-renderer";

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
          <button className="we-cover-btn" onClick={handleUrlSubmit}>Add</button>
          <button className="we-cover-btn" onClick={() => setUrlMode(false)}>Cancel</button>
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
              onClick={(e) => { e.stopPropagation(); setUrlMode(true); }}
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
    const t = raw.trim().toLowerCase().replace(/[^\w-]/g, "");
    if (t && !tags.includes(t) && tags.length < 10) onChange([...tags, t]);
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
    .filter((n) => !tags.includes(n) && (inputVal === "" || n.startsWith(inputVal.toLowerCase())))
    .slice(0, 8);

  return (
    <div className="we-tags-wrap">
      <div className="we-tags" onClick={() => inputRef.current?.focus()}>
        {tags.length === 0 && !focused && (
          <span className="we-tags-placeholder">Add up to 10 tags…</span>
        )}
        {tags.map((tag) => (
          <span key={tag} className="we-tag-chip">
            <span className="we-tag-hash">#</span>
            {tag}
            <button
              className="we-tag-remove"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
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
  const { settings, loaded: settingsLoaded } = useSettings();

  const [postId, setPostId] = useState<number | null>(initialPostId ?? null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved" | "unsaved" | "error">("");
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
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialContent, setInitialContent] = useState<string | undefined>(undefined);

  const postIdRef = useRef<number | null>(initialPostId ?? null);
  const contentRef = useRef<string>("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const excerptRef = useRef<HTMLTextAreaElement>(null);
  const saveDraftRef = useRef<(silent?: boolean) => Promise<void>>(async () => {});
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [user, authLoading]);

  // Apply publishing defaults for new posts once settings are loaded
  useEffect(() => {
    if (initialPostId || !settingsLoaded) return;
    setStatus(settings.publishing.defaultVisibility ?? "draft");
    const defaults = (settings.publishing.defaultTags || "")
      .split(",").map((t) => t.trim().toLowerCase().replace(/[^\w-]/g, "")).filter(Boolean);
    if (defaults.length > 0) setTagList(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded]);

  useEffect(() => {
    fetch("/api/blog/tags")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTagSuggestions(Array.isArray(d) ? d : []));
  }, []);

  // Load existing post data
  useEffect(() => {
    if (authLoading || !user || !initialPostId) {
      if (!initialPostId) setInitialContent("");
      return;
    }

    async function loadPost() {
      try {
        const r = await fetch(`/api/blog/posts/${initialPostId}`, { credentials: "include" });
        if (!r.ok) return;
        const post: PostData = await r.json();
        setTitle(post.title || "");
        setSlug(post.slug || "");
        setTagList((post.tags || "").split(",").map((t) => t.trim()).filter(Boolean));
        setExcerpt(post.excerpt || "");
        setCoverUrl(post.cover_image || "");
        setStatus(post.status === "published" ? "published" : "draft");

        if (post.content) {
          const trimmed = post.content.trim();
          // Detect old EditorJS JSON format (starts with "{") vs new Tiptap HTML
          setInitialContent(trimmed.startsWith("{") ? editorJsToHtml(post.content) : post.content);
        } else {
          setInitialContent("");
        }
      } catch {}
    }

    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  function scheduleAutoSave() {
    if (!settings.editor.autosave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const ms = (settings.editor.autosaveInterval ?? 4) * 1000;
    autoSaveTimer.current = setTimeout(() => saveDraftRef.current(true), ms);
  }

  function buildPayload() {
    return {
      title: titleRef.current?.value || title,
      content: contentRef.current,
      excerpt: excerptRef.current?.value || excerpt,
      cover_image: coverUrl,
      tags: tagList.join(","),
      slug,
    };
  }

  const saveDraft = useCallback(
    async (_silent = false) => {
      if (!editorReady) return;
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus("saving");
      try {
        const payload = buildPayload();
        const isNew = !postIdRef.current;
        const url = isNew ? "/api/blog/posts" : `/api/blog/posts/${postIdRef.current}`;
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
          setTimeout(() => setSaveStatus(""), 2800);
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      } finally {
        isSavingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorReady, excerpt, coverUrl, tagList, slug]
  );
  useEffect(() => { saveDraftRef.current = saveDraft; }, [saveDraft]);

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

  async function handlePublish() {
    try {
      await saveDraft(true);
      if (!postIdRef.current) return;
      const r = await fetch(`/api/blog/posts/${postIdRef.current}/publish`, {
        method: "POST",
        credentials: "include",
      });
      if (r.ok) {
        const data = await r.json();
        setStatus(data.status === "published" ? "published" : "draft");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleDelete() {
    if (!postIdRef.current) { window.location.href = "/dashboard"; return; }
    try {
      const r = await fetch(`/api/blog/posts/${postIdRef.current}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) window.location.href = "/dashboard";
      else setSaveStatus("error");
    } catch {
      setSaveStatus("error");
    }
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
        if (d.success && d.file?.url) {
          setCoverUrl(d.file.url);
          setSaveStatus("unsaved");
          scheduleAutoSave();
        }
      }
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleInlineImageUpload(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("image", file);
    const r = await fetch("/api/blog/upload", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.success && d.file?.url ? d.file.url : null;
  }

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
            <span
              key={saveStatus}
              className={`write-save-status${
                saveStatus === "error" ? " error"
                : saveStatus === "unsaved" ? " unsaved"
                : saveStatus === "saving" ? " saving"
                : saveStatus === "saved" ? " saved" : ""
              }`}
            >
              {saveStatus === "saving" && <span className="save-dot" />}
              {saveLabel}
            </span>
          ) : null}
          {lastSaved && saveStatus !== "saving" && saveStatus !== "saved" && (
            <span key={lastSaved.getTime()} className="write-last-saved">
              {lastSavedLabel}
            </span>
          )}
          {settings.editor.wordCount && wordCount > 0 && (
            <span className="write-word-count">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          )}
          {settings.editor.readingTime && wordCount > 0 && (
            <span className="write-word-count">
              {Math.max(1, Math.ceil(wordCount / 200))} min read
            </span>
          )}
        </div>

        <div className="write-topbar-right">
          <Link href="/settings?tab=editor" className="write-details-btn" title="Editor settings">
            <Icon name="cmd" size={14} />
          </Link>
          <button
            className="write-details-btn"
            onClick={() => setDetailsOpen((v) => !v)}
            title="Post details"
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
      <div className="write-canvas">

        {/* Cover zone */}
        <CoverZone
          coverUrl={coverUrl}
          onUploadFile={f => setPendingCoverFile(f)}
          onUrlChange={url => { setCoverUrl(url); setSaveStatus("unsaved"); scheduleAutoSave(); }}
          onRemove={() => { setCoverUrl(""); setSaveStatus("unsaved"); scheduleAutoSave(); }}
          uploading={coverUploading}
        />
        {pendingCoverFile && (
          <ImageCropModal
            file={pendingCoverFile}
            aspectRatio={3.4}
            label="Adjust cover image"
            outputWidth={1400}
            onCancel={() => setPendingCoverFile(null)}
            onConfirm={blob => {
              setPendingCoverFile(null);
              handleCoverFile(new File([blob], "cover.jpg", { type: "image/jpeg" }));
            }}
          />
        )}

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

          <TagChips
            tags={tagList}
            suggestions={tagSuggestions}
            onChange={(t) => { setTagList(t); setSaveStatus("unsaved"); scheduleAutoSave(); }}
          />

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

          <div className="write-divider"><span /></div>

          {/* Tiptap editor */}
          <div className="write-body">
            {initialContent !== undefined && (
              <TiptapEditor
                initialContent={initialContent}
                onChange={(html, wc) => {
                  contentRef.current = html;
                  setWordCount(wc);
                  setSaveStatus("unsaved");
                  scheduleAutoSave();
                }}
                onImageUpload={handleInlineImageUpload}
                onReady={() => setEditorReady(true)}
                placeholder="Tell your story…"
                autofocus={!initialPostId}
                toolbarEnabled={settings.editor.toolbar}
                slashMenuEnabled={settings.editor.slashMenu}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Details slide-over ── */}
      {detailsOpen && (
        <div className="settings-overlay open" onClick={() => setDetailsOpen(false)} />
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
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>
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

      {/* ── Mobile bottom action bar ── */}
      <div className="write-mobile-bar">
        <button className="write-mbar-btn" onClick={() => setDetailsOpen((v) => !v)}>
          <Icon name="settings" size={15} />
          Details
        </button>
        <button className="write-mbar-btn" onClick={() => saveDraft()} disabled={!editorReady}>
          <Icon name="feather" size={15} />
          Save
        </button>
        <button className="write-mbar-btn primary" onClick={handlePublish} disabled={!editorReady}>
          <Icon name="globe" size={15} />
          {status === "published" ? "Unpublish" : "Publish"}
        </button>
      </div>
    </div>
  );
}
