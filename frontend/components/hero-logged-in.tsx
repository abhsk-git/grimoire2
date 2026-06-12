"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { SearchModal, useSearchModal } from "./search-modal";
import { BookmarkModal, useBookmarkModal } from "./bookmark-modal";

interface Post {
  id: number;
  title: string;
  slug: string;
  status: "published" | "draft";
  reading_time?: number;
  views?: number;
  updated_at?: string;
}

interface SavedLink {
  id: number;
  title?: string;
  url: string;
  favicon?: string;
  created_at?: string;
}

interface HeroLoggedInProps {
  username?: string;
  displayName?: string;
  handle?: string;
  avatar?: string;
  onSignOut?: () => void;
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function HeroLoggedIn({ username, displayName, handle, avatar, onSignOut }: HeroLoggedInProps) {
  const name = displayName || username || "there";
  const greeting = getGreeting();
  const initials = username?.slice(0, 2).toUpperCase() ?? "ME";
  const profileHref = `/user/${handle ?? username?.toLowerCase().replace(/\s+/g, "-")}`;

  const [posts, setPosts] = useState<Post[]>([]);
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [postsVersion, setPostsVersion] = useState(0);
  const [linksVersion, setLinksVersion] = useState(0);
  const [confirmPending, setConfirmPending] = useState<{ type: "post" | "link"; id: number; label: string } | null>(null);

  const { open: searchOpen, setOpen: setSearchOpen } = useSearchModal();
  const { open: bmOpen, setOpen: setBmOpen } = useBookmarkModal();

  const [mobQuery, setMobQuery] = useState("");
  const [mobResults, setMobResults] = useState<{ type: string; title: string; slug?: string; url?: string; favicon?: string }[]>([]);
  const [mobLoading, setMobLoading] = useState(false);
  const mobAbort = useRef<AbortController | null>(null);
  const mobInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = mobQuery.trim();
    if (!q || q.length < 2) { setMobResults([]); setMobLoading(false); return; }
    setMobLoading(true);
    mobAbort.current?.abort();
    const ctrl = new AbortController();
    mobAbort.current = ctrl;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (r.ok) setMobResults(await r.json());
      } catch (e) { if ((e as Error).name !== "AbortError") setMobResults([]); }
      finally { setMobLoading(false); }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [mobQuery]);

  function mobNavigate(r: { type: string; slug?: string; url?: string }) {
    if (r.type === "post") window.location.href = `/blog/${r.slug}`;
    else if (r.url) window.open(r.url, "_blank", "noopener,noreferrer");
    setMobQuery(""); setMobResults([]);
  }

  useEffect(() => {
    fetch("/api/blog/my-posts", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts((data as Post[]).slice(0, 8)));
  }, [postsVersion]);

  useEffect(() => {
    fetch("/api/links?per_page=8", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr: SavedLink[] = Array.isArray(data) ? data : ((data as { links?: SavedLink[] }).links ?? []);
        setLinks(arr.slice(0, 8));
      });
  }, [linksVersion]);

  function deletePost(id: number) {
    const post = posts.find(p => p.id === id);
    setConfirmPending({ type: "post", id, label: post?.title || "this post" });
  }

  function deleteLink(id: number) {
    const link = links.find(l => l.id === id);
    setConfirmPending({ type: "link", id, label: link?.title || "this bookmark" });
  }

  async function confirmDelete() {
    if (!confirmPending) return;
    const { type, id } = confirmPending;
    setConfirmPending(null);
    if (type === "post") {
      const r = await fetch(`/api/blog/posts/${id}`, { method: "DELETE", credentials: "include" });
      if (r.ok) setPostsVersion(v => v + 1);
    } else {
      const r = await fetch(`/api/links/${id}`, { method: "DELETE", credentials: "include" });
      if (r.ok) setLinksVersion(v => v + 1);
    }
  }

  return (
    <div className="dw-page">
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      {bmOpen && <BookmarkModal onClose={() => setBmOpen(false)} onSaved={() => setLinksVersion(v => v + 1)} />}

      {confirmPending && (
        <div className="dw-confirm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setConfirmPending(null); }}>
          <div className="dw-confirm">
            <div className="dw-confirm-icon">
              <Icon name="trash" size={18} />
            </div>
            <div className="dw-confirm-body">
              <p className="dw-confirm-title">Delete {confirmPending.type === "post" ? "post" : "bookmark"}?</p>
              <p className="dw-confirm-sub">
                &ldquo;{confirmPending.label.length > 48 ? confirmPending.label.slice(0, 48) + "…" : confirmPending.label}&rdquo; will be permanently removed.
              </p>
            </div>
            <div className="dw-confirm-actions">
              <button className="dw-confirm-cancel" onClick={() => setConfirmPending(null)}>Cancel</button>
              <button className="dw-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="dw-wrap">

        {/* ── Top bar ── */}
        <div className="dw-topbar">
          <div className="dw-greeting">
            <span className="dw-eyebrow"><Icon name="feather" size={11} /> {greeting}</span>
            <h1 className="dw-title">
              Welcome back,{" "}
              <span className="dw-name">{name}<span className="dw-serif">.</span></span>
            </h1>
          </div>

          <div className="dw-actions">
            <button className="dw-btn dw-search-btn" onClick={() => setSearchOpen(true)}>
              <Icon name="search" size={13} /> Search
            </button>
            <a href="/write" className="dw-btn dw-btn-primary">
              <Icon name="pen" size={13} /> New post
            </a>
            <button className="dw-btn" onClick={() => setBmOpen(true)}>
              <Icon name="bookmark" size={13} /> Save link
            </button>
            <a href="/explore" className="dw-btn">
              <Icon name="globe" size={13} /> Explore
            </a>
            <a href="/settings" className="dw-icon-btn" title="Settings">
              <Icon name="settings" size={15} />
            </a>
            <button className="dw-signout-btn" onClick={() => onSignOut?.()} title="Sign out">
              <Icon name="power" size={14} />
            </button>
            <a href={profileHref} className={`dw-avatar${avatar ? " has-photo" : ""}`} title="Profile">
              {avatar ? <img src={avatar} alt={username} /> : initials}
            </a>
          </div>
        </div>

        {/* Mobile inline search — hidden on desktop via CSS */}
        <div className="dw-mob-search-wrap">
          <div className="dw-mob-search-bar">
            <Icon name="search" size={14} />
            <input
              ref={mobInputRef}
              value={mobQuery}
              onChange={e => setMobQuery(e.target.value)}
              placeholder="Search posts and bookmarks…"
              autoComplete="off"
              spellCheck={false}
            />
            {mobLoading && <div className="search-spinner" />}
            {mobQuery && !mobLoading && (
              <button className="dw-mob-search-clear" onClick={() => { setMobQuery(""); setMobResults([]); mobInputRef.current?.focus(); }}>
                <Icon name="x" size={13} />
              </button>
            )}
          </div>
          {mobResults.length > 0 && (
            <div className="dw-mob-search-results">
              {mobResults.map((r, i) => (
                <button key={i} className="dw-mob-search-item" onClick={() => mobNavigate(r)}>
                  {r.type === "post"
                    ? <Icon name="feather" size={13} style={{ flexShrink: 0, color: "var(--fg-muted)" }} />
                    : r.favicon
                      ? <img src={r.favicon} alt="" width={14} height={14} style={{ borderRadius: 3, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <Icon name="link" size={13} style={{ flexShrink: 0, color: "var(--fg-muted)" }} />
                  }
                  <span className="dw-mob-search-title">{r.title || (r.url ? getDomain(r.url) : "")}</span>
                  <Icon name={r.type === "post" ? "arrow-right" : "arrow-up-right"} size={12} style={{ flexShrink: 0, color: "var(--fg-muted)" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 2-column grid ── */}
        <div className="dw-grid">

          {/* Posts card */}
          <div className="dw-card">
            <div className="dw-card-head">
              <span className="feed-count-label">
                <b>{String(posts.length).padStart(2, "0")}</b>
                <span>posts</span>
              </span>
              <span className="feed-head-grow" />
              <a href="/write" className="dw-head-action">
                <Icon name="plus" size={12} /> New
              </a>
            </div>
            <div className="dw-card-body">
              {posts.length === 0 ? (
                <div className="dw-empty">
                  <Icon name="feather" size={22} />
                  <p>No posts yet — start writing</p>
                </div>
              ) : posts.map(p => (
                <div key={p.id} className="dw-post-row">
                  <span className={`dw-pill ${p.status === "published" ? "live" : "draft"}`}>
                    {p.status === "published" ? "Live" : "Draft"}
                  </span>
                  <a
                    href={p.status === "published" ? `/blog/${p.slug}` : `/write/${p.id}`}
                    className="dw-row-title"
                  >
                    {p.title || "Untitled"}
                  </a>
                  <div className="dw-row-end">
                    <span className="dw-row-meta">{p.views ?? 0} reads</span>
                    <div className="dw-row-actions">
                      <a href={`/write/${p.id}`} className="dw-row-btn" aria-label="Edit post">
                        <Icon name="pen" size={12} />
                      </a>
                      <button className="dw-row-btn dw-row-btn-danger" aria-label="Delete post" onClick={() => deletePost(p.id)}>
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* References card */}
          <div className="dw-card">
            <div className="dw-card-head">
              <span className="feed-count-label">
                <b>{String(links.length).padStart(2, "0")}</b>
                <span>references</span>
              </span>
              <span className="feed-head-grow" />
              <button className="dw-head-action" onClick={() => setBmOpen(true)}>
                <Icon name="plus" size={12} /> Save
              </button>
            </div>
            <div className="dw-card-body">
              {links.length === 0 ? (
                <div className="dw-empty">
                  <Icon name="bookmark" size={22} />
                  <p>No saved references yet</p>
                </div>
              ) : links.map(l => {
                const dom = getDomain(l.url);
                return (
                  <div key={l.id} className="dw-ref-row">
                    <span className="dw-ref-fav">
                      {l.favicon
                        ? <img src={l.favicon} width={14} height={14} alt=""
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <Icon name="globe" size={13} />
                      }
                    </span>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="dw-row-title">
                      {l.title || dom}
                    </a>
                    <div className="dw-row-end">
                      <span className="dw-row-meta">{dom}</span>
                      <div className="dw-row-actions">
                        <button className="dw-row-btn dw-row-btn-danger" aria-label="Delete bookmark" onClick={() => deleteLink(l.id)}>
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
