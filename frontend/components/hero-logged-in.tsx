"use client";

import { useEffect, useState } from "react";
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

  const { open: searchOpen, setOpen: setSearchOpen } = useSearchModal();
  const { open: bmOpen, setOpen: setBmOpen } = useBookmarkModal();

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

  async function deletePost(id: number) {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    const r = await fetch(`/api/blog/posts/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) setPostsVersion(v => v + 1);
  }

  async function deleteLink(id: number) {
    const r = await fetch(`/api/links/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) setLinksVersion(v => v + 1);
  }

  return (
    <div className="dw-page">
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      {bmOpen && <BookmarkModal onClose={() => setBmOpen(false)} onSaved={() => setLinksVersion(v => v + 1)} />}

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
            <button className="dw-btn" onClick={() => setSearchOpen(true)}>
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
            <a href={profileHref} className={`dw-avatar${avatar ? " has-photo" : ""}`} title="Profile">
              {avatar ? <img src={avatar} alt={username} /> : initials}
            </a>
            <button className="dw-signout-btn" onClick={() => onSignOut?.()} title="Sign out">
              <Icon name="arrow-right" size={14} />
            </button>
          </div>
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
                  <span className="dw-row-meta">{p.views ?? 0} reads</span>
                  <a href={`/write/${p.id}`} className="dw-row-btn" aria-label="Edit post">
                    <Icon name="pen" size={12} />
                  </a>
                  <button className="dw-row-btn dw-row-btn-danger" aria-label="Delete post" onClick={() => deletePost(p.id)}>
                    <Icon name="trash" size={12} />
                  </button>
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
                    <span className="dw-row-meta">{dom}</span>
                    <button className="dw-row-btn dw-row-btn-danger" aria-label="Delete reference" onClick={() => deleteLink(l.id)}>
                      <Icon name="trash" size={12} />
                    </button>
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
