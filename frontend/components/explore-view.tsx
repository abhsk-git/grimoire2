"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { useAuth } from "@/lib/auth";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  tags: string;
  reading_time: number;
  views: number;
  likes: number;
  pub_date: string;
  featured: number;
  author_id: number;
  author_name: string;
  author_avatar: string;
  author_handle?: string;
}

interface Writer {
  id: number;
  name: string;
  avatar: string;
  handle?: string;
  post_count: number;
  total_views: number;
  total_likes: number;
}

interface Link_ {
  id: number;
  url: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  tags: string;
  visit_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string;
  author_id: number;
  author_handle?: string;
}

interface Tag { name: string; count: number; }

const COVER_GRADIENTS = [
  "linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)",
  "linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)",
  "linear-gradient(135deg,#14613a,#2f7d4d 60%,#6abf85)",
  "linear-gradient(135deg,#5b54d6,#8e8df0 60%,#b486f0)",
  "linear-gradient(135deg,#d04f63,#f08197 60%,#f4b860)",
  "linear-gradient(135deg,#2f4f6b,#1b6a8b 60%,#5ab4d0)",
];

function coverStyle(post: Post, idx: number): React.CSSProperties {
  if (post.cover_image)
    return { backgroundImage: `url(${post.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" };
  return { background: COVER_GRADIENTS[idx % COVER_GRADIENTS.length] };
}

function avatarFallback(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=44&background=6366f1&color=fff`;
}

const toHandle = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

function fmtViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

const SIDEBAR_WRITERS  = 4;
const SIDEBAR_TAGS     = 8;
const SIDEBAR_LINKS    = 3;

export function ExploreView() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  const [bookmarked, setBookmarked] = useState<Map<number, number>>(new Map());
  const [bookmarking, setBookmarking] = useState<Set<number>>(new Set());

  async function toggleBookmark(e: React.MouseEvent, post: Post) {
    e.preventDefault(); e.stopPropagation();
    if (!user) { window.location.href = "/login"; return; }
    const linkId = bookmarked.get(post.id);
    setBookmarking(prev => new Set(prev).add(post.id));
    try {
      if (linkId !== undefined) {
        const r = await fetch(`/api/links/${linkId}`, { method: "DELETE", credentials: "include" });
        if (r.ok) setBookmarked(prev => { const m = new Map(prev); m.delete(post.id); return m; });
      } else {
        const r = await fetch("/api/links", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: window.location.origin + "/blog/" + post.slug, title: post.title, description: post.excerpt || "", image: post.cover_image || "", favicon: "", tags: post.tags || "", is_public: false }),
        });
        if (r.ok) { const d = await r.json(); setBookmarked(prev => new Map(prev).set(post.id, d.id)); }
      }
    } catch {}
    finally { setBookmarking(prev => { const s = new Set(prev); s.delete(post.id); return s; }); }
  }

  // Data
  const [posts, setPosts]           = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [blogTags, setBlogTags]     = useState<Tag[]>([]);
  const [writers, setWriters]       = useState<Writer[]>([]);
  const [sidebarLinks, setSidebarLinks] = useState<Link_[]>([]);
  const [mobileLinks, setMobileLinks] = useState<Link_[]>([]);

  useEffect(() => {
    fetch("/api/blog/writers").then(r => r.ok ? r.json() : []).then(setWriters).catch(() => {});
    fetch("/api/blog/tags").then(r => r.ok ? r.json() : []).then(setBlogTags).catch(() => {});
    fetch("/api/explore?per_page=5").then(r => r.ok ? r.json() : { links: [] }).then(d => setSidebarLinks(d.links || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!search && !activeTag) { setMobileLinks([]); return; }
    const p = new URLSearchParams({ per_page: "5" });
    if (search) p.set("q", search);
    if (activeTag) p.set("tag", activeTag);
    fetch(`/api/explore?${p}`).then(r => r.ok ? r.json() : { links: [] }).then(d => setMobileLinks(d.links || [])).catch(() => {});
  }, [search, activeTag]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const p = new URLSearchParams({ per_page: "18" });
      if (search) p.set("q", search);
      if (activeTag) p.set("tag", activeTag);
      const r = await fetch(`/api/blog/posts?${p}`);
      if (r.ok) setPosts((await r.json()).posts || []);
    } catch {}
    finally { setPostsLoading(false); }
  }, [search, activeTag]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function handleTagClick(tag: string) {
    setActiveTag(prev => prev === tag ? "" : tag);
    setSearch("");
  }

  const isFiltering = !!(search || activeTag);

  return (
    <div className="explore-layout">

      {/* ── LEFT SIDEBAR — desktop only, never scrolls ── */}
      <aside className="explore-sidebar">

        {writers.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-head">
              <Icon name="users" size={11} /> Writers
            </div>
            {writers.slice(0, SIDEBAR_WRITERS).map(w => (
              <Link key={w.id} href={`/user/${w.handle || toHandle(w.name)}`} className="sidebar-writer">
                <img
                  src={w.avatar || avatarFallback(w.name)}
                  onError={e => { (e.target as HTMLImageElement).src = avatarFallback(w.name); }}
                  style={{ width: 30, height: 30, borderRadius: "7px", objectFit: "cover", flexShrink: 0 }}
                  alt={w.name} loading="lazy"
                />
                <div style={{ minWidth: 0 }}>
                  <div className="sw-name">{w.name}</div>
                  <div className="sw-meta">{w.post_count} posts</div>
                </div>
                <Icon name="arrow-right" size={11} style={{ flexShrink: 0, color: "var(--fg-soft)", marginLeft: "auto" }} />
              </Link>
            ))}
          </div>
        )}

        {blogTags.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-head">
              <Icon name="tag" size={11} /> Topics
            </div>
            <div className="sidebar-tags">
              {blogTags.slice(0, SIDEBAR_TAGS).map(t => (
                <span
                  key={t.name}
                  className={`sidebar-tag${activeTag === t.name ? " active" : ""}`}
                  onClick={() => handleTagClick(t.name)}
                >
                  {t.name}
                  <span className="n">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {sidebarLinks.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-head">
              <Icon name="bookmark" size={11} /> Public links
            </div>
            {sidebarLinks.slice(0, SIDEBAR_LINKS).map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="sidebar-ref">
                {l.favicon ? (
                  <img src={l.favicon} style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0, marginTop: 2 }} alt=""
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span style={{ width: 13, flexShrink: 0, marginTop: 2, color: "var(--fg-soft)" }}>
                    <Icon name="globe" size={11} />
                  </span>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="sr-title">{l.title || getDomain(l.url)}</div>
                  <div className="sr-domain">{getDomain(l.url)}</div>
                </div>
              </a>
            ))}
          </div>
        )}

      </aside>

      {/* ── RIGHT MAIN ── */}
      <main className="explore-main">

        {/* Hero: title + mobile search */}
        <div className="explore-main-hero">
          <h1 className="explore-main-title">
            Open the <span className="serif">Grimoire</span>.
          </h1>
          <p className="explore-main-sub">Read what the curious are writing.</p>

          {/* Mobile search — replaces the hidden header search on small screens */}
          <div className="explore-mobile-search">
            <Icon name="search" size={13} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Escape" && setSearch("")}
              placeholder="Search stories, writers, tags…"
            />
            {search && (
              <button className="explore-mobile-search-clear" onClick={() => setSearch("")}>
                <Icon name="x" size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile discovery: topics + filtered references — hidden on desktop */}
        {blogTags.length > 0 && (
          <div className="explore-mobile-discover">
            <div className="mob-disc-section">
              <div className="mob-disc-label"><Icon name="tag" size={10} /> Topics</div>
              <div className="mob-tags-row">
                {blogTags.slice(0, 14).map(t => (
                  <span
                    key={t.name}
                    className={`mob-tag-chip${activeTag === t.name ? " active" : ""}`}
                    onClick={() => handleTagClick(t.name)}
                  >
                    #{t.name}<span className="n">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>

            {isFiltering && mobileLinks.length > 0 && (
              <div className="mob-disc-section">
                <div className="mob-disc-label"><Icon name="bookmark" size={10} /> References</div>
                <div className="mob-refs-list">
                  {mobileLinks.map(l => (
                    <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="mob-ref-item">
                      {l.favicon ? (
                        <img src={l.favicon} style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0 }} alt=""
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Icon name="globe" size={11} style={{ flexShrink: 0, color: "var(--fg-muted)" }} />
                      )}
                      <span className="mob-ref-title">{l.title || getDomain(l.url)}</span>
                      <span className="mob-ref-domain">{getDomain(l.url)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTag && (
          <div className="active-tag-row">
            <span className="active-tag-label">Tag:</span>
            <span className="lc-tag" style={{ cursor: "pointer" }} onClick={() => setActiveTag("")}>
              #{activeTag} <span style={{ opacity: 0.6 }}>×</span>
            </span>
          </div>
        )}

        {postsLoading ? (
          <div className="explore-loading">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="explore-empty">
            <Icon name="feather" size={32} />
            <p>No stories found{search ? ` for "${search}"` : activeTag ? ` tagged #${activeTag}` : ""}.</p>
          </div>
        ) : (
          <div className="explore-cards-wrap">
            <div className="explore-feed-label">
              {isFiltering ? "Results" : "All stories"}
            </div>
            <div className="cards explore-cards">
              {posts.map((p, i) => {
                const tagsList = (p.tags || "").split(",").map(t => t.trim()).filter(Boolean);
                return (
                  <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none" }}>
                    <article className="post-card">
                      <div className="post-body">
                        {tagsList.length > 0 && (
                          <div className="lc-tags">
                            {tagsList.slice(0, 2).map(t => (
                              <span key={t} className="lc-tag"
                                onClick={e => { e.preventDefault(); handleTagClick(t); }}
                                style={{ cursor: "pointer" }}
                              >{t}</span>
                            ))}
                          </div>
                        )}
                        <h3 className="post-title">{p.title}</h3>
                        {p.reading_time > 0 && (
                          <div className="post-readtime-inline">
                            <Icon name="book" size={10} /> {p.reading_time} min read
                          </div>
                        )}
                        <div className="post-meta">
                          <Link href={`/user/${p.author_handle || toHandle(p.author_name)}`}
                            onClick={e => e.stopPropagation()} className="post-author"
                            style={{ textDecoration: "none", color: "inherit" }}>
                            <img
                              src={p.author_avatar || avatarFallback(p.author_name)}
                              onError={e => { (e.target as HTMLImageElement).src = avatarFallback(p.author_name); }}
                              style={{ width: 18, height: 18, borderRadius: "5px", objectFit: "cover", flexShrink: 0 }}
                              alt={p.author_name} loading="lazy"
                            />
                            {p.author_name}
                          </Link>
                          <span className="meta-dot">·</span>
                          <span>{p.pub_date}</span>
                          <span style={{ flex: 1 }} />
                          <button
                            onClick={e => toggleBookmark(e, p)}
                            disabled={bookmarking.has(p.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", display: "flex", alignItems: "center", color: bookmarked.has(p.id) ? "var(--accent)" : "var(--fg-soft)" }}
                          >
                            <Icon name="bookmark" size={12} fill={bookmarked.has(p.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
