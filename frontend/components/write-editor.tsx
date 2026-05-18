"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

interface WriteEditorProps {
  postId?: number;
}

export function WriteEditor({ postId: initialPostId }: WriteEditorProps) {
  const { user, loading: authLoading } = useAuth();

  const [postId, setPostId] = useState<number | null>(initialPostId ?? null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved" | "unsaved" | "error">("");
  const [editorReady, setEditorReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const editorRef = useRef<any>(null);
  const postIdRef = useRef<number | null>(initialPostId ?? null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;

    async function init() {
      let initialData: any = undefined;

      if (initialPostId) {
        try {
          const r = await fetch(`/api/blog/posts/${initialPostId}`, { credentials: "include" });
          if (r.ok) {
            const post: PostData = await r.json();
            setTitle(post.title || "");
            setSlug(post.slug || "");
            setTags(post.tags || "");
            setExcerpt(post.excerpt || "");
            setCoverUrl(post.cover_image || "");
            setStatus(post.status === "published" ? "published" : "draft");
            if (post.content) {
              try {
                initialData = JSON.parse(post.content);
              } catch {
                initialData = undefined;
              }
            }
          }
        } catch {
          // proceed with blank editor
        }
      }

      await loadScripts();

      if (editorRef.current) {
        editorRef.current.destroy?.();
      }

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
          if (b.type === "paragraph" || b.type === "header") return b.data?.text || "";
          if (b.type === "list") return (b.data?.items || []).join(" ");
          return "";
        })
        .join(" ")
        .replace(/<[^>]+>/g, "");
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    } catch {
      // ignore
    }
  }

  async function buildPayload() {
    const editorData = await editorRef.current.save();
    return {
      title: titleRef.current?.value || title,
      content: JSON.stringify(editorData),
      excerpt,
      cover_image: coverUrl,
      tags,
      slug,
    };
  }

  const saveDraft = useCallback(
    async (silent = false) => {
      if (!editorRef.current || !editorReady) return;
      if (!silent) setSaveStatus("saving");

      try {
        const payload = await buildPayload();
        const isNew = !postIdRef.current;
        const url = isNew ? "/api/blog/posts" : `/api/blog/posts/${postIdRef.current}`;
        const method = isNew ? "POST" : "PUT";

        const r = await fetch(url, {
          method,
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
          setTimeout(() => setSaveStatus(""), 3000);
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorReady, excerpt, coverUrl, tags, slug]
  );

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
    if (!postIdRef.current) {
      window.location.href = "/dashboard";
      return;
    }
    const r = await fetch(`/api/blog/posts/${postIdRef.current}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) {
      window.location.href = "/dashboard";
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveDraft]);

  if (authLoading || !user) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  const saveStatusLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
      ? "Save failed"
      : saveStatus === "unsaved"
      ? "Unsaved"
      : "";

  return (
    <div className="write-page">
      {/* Topbar */}
      <div className="write-topbar">
        <Link href="/dashboard" className="write-back">
          <Icon name="arrow-left" size={15} />
          <span>Dashboard</span>
        </Link>
        <div className="write-sep" />
        <span className="write-label">
          {status === "published" ? "Published" : "Draft"}
        </span>

        {saveStatusLabel && (
          <span
            className={`write-save-status${
              saveStatus === "saving"
                ? " saving"
                : saveStatus === "error"
                ? " error"
                : saveStatus === "unsaved"
                ? " unsaved"
                : ""
            }`}
          >
            {saveStatusLabel}
          </span>
        )}

        <div className="write-topbar-right">
          <button
            className="icon-btn"
            title="Post settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Icon name="settings" size={15} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => saveDraft()}
            disabled={!editorReady}
          >
            Save draft
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

      {/* Main editor area */}
      <div className="write-main">
        <div className="write-meta-row">
          <span style={{ color: "var(--fg-soft)", fontSize: 13 }}>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          {postId && (
            <span style={{ color: "var(--fg-muted)", fontSize: 12 }}>
              #{postId}
            </span>
          )}
        </div>

        <textarea
          ref={titleRef}
          className="write-title"
          placeholder="Post title…"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaveStatus("unsaved");
            scheduleAutoSave();
            // Auto-resize
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          rows={1}
        />

        <div className="write-body">
          <div id="editorjs" />
        </div>
      </div>

      {/* Settings overlay + panel */}
      {settingsOpen && (
        <div
          className="settings-overlay"
          onClick={() => setSettingsOpen(false)}
        />
      )}
      <div className={`write-settings${settingsOpen ? " open" : ""}`}>
        <div className="write-settings-head">
          <span>Post settings</span>
          <button
            className="icon-btn"
            style={{ width: 28, height: 28 }}
            onClick={() => setSettingsOpen(false)}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="write-settings-body">
          <div className="field">
            <label>Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated-from-title"
            />
          </div>
          <div className="field">
            <label>Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma, separated, tags"
            />
          </div>
          <div className="field">
            <label>Excerpt</label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short description for previews…"
            />
          </div>
          <div className="field">
            <label>Cover image URL</label>
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          {coverUrl && (
            <img
              src={coverUrl}
              alt="Cover preview"
              style={{
                width: "100%",
                borderRadius: 8,
                objectFit: "cover",
                maxHeight: 160,
                marginTop: 4,
              }}
            />
          )}

          {postId && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              {deleteConfirm ? (
                <div style={{ display: "flex", gap: 8 }}>
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
                  style={{ width: "100%" }}
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Icon name="trash" size={13} /> Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
