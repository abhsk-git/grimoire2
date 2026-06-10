"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "./icons";

interface Meta {
  title: string;
  description: string;
  image: string;
  favicon: string;
  url: string;
}

interface BookmarkModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export function BookmarkModal({ onClose, onSaved }: BookmarkModalProps) {
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [fetching, setFetching] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { urlRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function fetchMeta(rawUrl: string) {
    const u = rawUrl.trim();
    if (!u) return;
    setFetching(true);
    setError("");
    setMeta(null);
    try {
      const r = await fetch("/api/fetch-meta", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      if (!r.ok) throw new Error();
      const data: Meta = await r.json();
      setMeta(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
    } catch {
      setError("Couldn't fetch metadata — you can still save the URL.");
    } finally {
      setFetching(false);
    }
  }

  function handleUrlKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); fetchMeta(url); }
  }

  function handleUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text");
    if (pasted.startsWith("http") || pasted.startsWith("www.")) {
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
      fetchTimer.current = setTimeout(() => fetchMeta(pasted), 80);
    }
  }

  async function save() {
    const u = (meta?.url || url).trim();
    if (!u) return;
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/links", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: u,
          title: title.trim(),
          description: description.trim(),
          image: meta?.image || "",
          favicon: meta?.favicon || "",
          tags: tags.trim(),
          notes: notes.trim(),
        }),
      });
      if (!r.ok) throw new Error();
      onSaved();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  const domain = (() => {
    const u = meta?.url || url;
    try { return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, ""); }
    catch { return ""; }
  })();

  return (
    <div
      className="bm-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bm-modal" role="dialog" aria-modal="true">

        <div className="bm-header">
          <Icon name="bookmark" size={14} />
          <span>Save bookmark</span>
          <button className="bm-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={13} />
          </button>
        </div>

        <div className="bm-url-row">
          <input
            ref={urlRef}
            className="bm-url-input"
            placeholder="Paste or type a URL…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            onPaste={handleUrlPaste}
            type="url"
            spellCheck={false}
          />
          <button
            className="bm-fetch-btn"
            onClick={() => fetchMeta(url)}
            disabled={!url.trim() || fetching}
          >
            {fetching ? <span className="bm-spinner" /> : "Fetch"}
          </button>
        </div>

        {meta && (
          <div className="bm-preview">
            <div className="bm-fav">
              {meta.favicon
                ? <img src={meta.favicon} alt="" width={18} height={18} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <Icon name="link" size={14} />
              }
            </div>
            <div className="bm-preview-body">
              <input
                className="bm-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title"
              />
              <textarea
                className="bm-desc-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description"
                rows={2}
              />
              {domain && <span className="bm-domain">{domain}</span>}
            </div>
          </div>
        )}

        <div className="bm-fields">
          <input
            className="bm-field-input"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
          <textarea
            className="bm-field-input bm-notes"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {error && <div className="bm-error">{error}</div>}

        <div className="bm-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={save}
            disabled={!url.trim() || saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useBookmarkModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        setOpen(o => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}
