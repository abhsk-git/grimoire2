"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function avatarFallback(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=44&background=6366f1&color=fff`;
}

const toHandle = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

const TYPED_QUERIES = ["claude code", "#linux", "sed and awk", "@abhishek", "wireshark filters", "#cloud", "deliverability"];

function useTypewriter(words: string[], active: boolean) {
  const [text, setText] = useState("");
  const i = useRef(0);
  const ch = useRef(0);
  const del = useRef(false);
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = words[i.current % words.length];
      if (!del.current) {
        ch.current++;
        setText(word.slice(0, ch.current));
        if (ch.current >= word.length) { del.current = true; timer = setTimeout(tick, 1400); return; }
      } else {
        ch.current--;
        setText(word.slice(0, ch.current));
        if (ch.current <= 0) { del.current = false; i.current++; }
      }
      timer = setTimeout(tick, del.current ? 45 : 80);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [active]);
  return text;
}

export function ExploreView() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); inputRef.current?.focus();
      }
      if (e.key === "Escape") setSearch("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  const [posts, setPosts]           = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  const [blogTags, setBlogTags]     = useState<Tag[]>([]);
  const [sidebarLinks, setSidebarLinks] = useState<Link_[]>([]);
  const [mobileLinks, setMobileLinks] = useState<Link_[]>([]);

  useEffect(() => {
    fetch("/api/blog/tags").then(r => r.ok ? r.json() : []).then(setBlogTags).catch(() => {});
    fetch("/api/explore?per_page=8").then(r => r.ok ? r.json() : { links: [] }).then(d => setSidebarLinks(d.links || [])).catch(() => {});
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
      if (r.ok) {
        const data = await r.json();
        setPosts(data.posts || []);
        setTotalPosts(data.total || data.posts?.length || 0);
      }
    } catch {}
    finally { setPostsLoading(false); }
  }, [search, activeTag]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function handleTagClick(tag: string) {
    setActiveTag(prev => prev === tag ? "" : tag);
    setSearch("");
  }

  const isFiltering = !!(search || activeTag);
  const typedQuery = useTypewriter(TYPED_QUERIES, !search && !searchFocused);

  const displayPosts = useMemo(() => {
    const sorted = sortOrder === "oldest"
      ? [...posts].sort((a, b) => a.id - b.id)
      : [...posts].sort((a, b) => b.id - a.id);
    return isFiltering ? sorted : sorted.slice(0, 5);
  }, [posts, sortOrder, isFiltering]);

  const EXAMPLES = [
    { label: "claude code", q: "claude code" },
    { label: "linux", q: "#linux", pfx: "#" },
    { label: "cybersecurity", q: "#cybersecurity", pfx: "#" },
    { label: "abhishek", q: "@abhishek", pfx: "@" },
    { label: "deliverability", q: "deliverability" },
  ];

  return (
    <>
      {/* ── Desktop-only hero (full-width, hidden on mobile) ── */}
      <section className="desktop-feed-hero" aria-label="Explore hero">
        <div className="desktop-hero-bg" aria-hidden="true">
          <div className="desktop-hero-aurora" />
          <div className="desktop-hero-grid" />
          <div className="desktop-hero-scan" />
        </div>
        <div className="desktop-feed-hero-inner">
          <span className="desktop-hero-eyebrow">
            <span className="desktop-hero-live-dot" />
            The reading room · {totalPosts || posts.length} stories live
          </span>
          <h1>Open the <span className="hero-accent">Grimoire</span>.</h1>
          <p className="hero-sub">Field notes, terminal lore, and essays from people who go deep. Search by keyword, <b style={{color:"var(--accent-ink)"}}>&#35;tag</b>, or <b style={{color:"var(--accent-ink)"}}>&#64;author</b>.</p>

          <div className="desktop-hero-search">
            <span className="search-lead"><Icon name="search" size={20} /></span>
            {!search && (
              <span className="desktop-hero-ph" aria-hidden="true">
                Search the grimoire — <span className="ph-typed">{typedQuery}</span><span className="ph-caret" />
              </span>
            )}
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search stories, tags, and writers"
            />
            {search ? (
              <button className="search-clear" onClick={() => { setSearch(""); inputRef.current?.focus(); }} aria-label="Clear search">
                <Icon name="x" size={16} />
              </button>
            ) : (
              <span className="search-kbd">⌘K</span>
            )}
          </div>

          <div className="desktop-hero-examples">
            <span className="ex-lbl">try:</span>
            {EXAMPLES.map(ex => (
              <button key={ex.label} className="desktop-ex-chip" onClick={() => { setSearch(ex.q); inputRef.current?.focus(); }}>
                {ex.pfx && <span className="ex-pfx">{ex.pfx}</span>}{ex.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main layout: feed + sidebar ── */}
      <div className="explore-layout">

        {/* ── RIGHT SIDEBAR — desktop only ── */}
        <aside className="explore-sidebar">
          {/* Public links */}
          {sidebarLinks.length > 0 && (
            <>
              <div className="feed-head" style={{ marginBottom: 6 }}>
                <span className="feed-count-label">
                  <b>{String(sidebarLinks.length).padStart(2, "0")}</b>
                  <span>sites</span>
                </span>
                <span className="feed-head-grow" />
              </div>
              <div className="side-card">
              <div className="side-links-list">
                {sidebarLinks.map(l => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="side-link-row">
                    <span className="side-link-fav">
                      {l.favicon ? (
                        <img src={l.favicon} style={{ width: 14, height: 14, borderRadius: 3 }} alt=""
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Icon name="globe" size={14} />
                      )}
                    </span>
                    <span className="side-link-meta">
                      <div className="side-link-name">{l.title || getDomain(l.url)}</div>
                      <div className="side-link-domain">{getDomain(l.url)}</div>
                    </span>
                    <span className="side-link-ext"><Icon name="arrow-right" size={14} /></span>
                  </a>
                ))}
              </div>
            </div>
            </>
          )}

          {/* Topics cloud */}
          {blogTags.length > 0 && (
            <div className="side-card">
              <div className="side-card-head">
                <Icon name="tag" size={13} /> Browse topics
                <span className="sc-grow" />
                <span className="sc-n">{blogTags.length}</span>
              </div>
              <div className="side-card-body">
                <div className="topic-cloud-wrap">
                  {blogTags.slice(0, 12).map(t => (
                    <button key={t.name} className="topic-chip" onClick={() => handleTagClick(t.name)}>
                      #{t.name} <span className="topic-n">{t.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fallback: filtered links when searching */}
          {(isFiltering ? mobileLinks : []).length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-section-head">
                <Icon name="bookmark" size={11} /> Matching links
              </div>
              {(isFiltering ? mobileLinks : []).map(l => (
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

        {/* ── MAIN FEED ── */}
        <main className="explore-main">

          {/* Mobile hero — sticky, shown on mobile only */}
          <div className="explore-main-hero">
            <div className="explore-hero-prefix">grimoire://explore</div>
            <h1 className="explore-main-title">
              Open the <span className="serif">Grimoire</span>.
            </h1>
            <p className="explore-main-sub">Read what the curious are writing<span className="hero-cursor">_</span></p>

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

          {/* Mobile discovery: topics + filtered references */}
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
            <div className="explore-feed-wrap">
              {/* Feed head: count + sort (desktop) */}
              <div className="feed-head">
                <span className="feed-count-label">
                  <b>{String(posts.length).padStart(2, "0")}</b>
                  {isFiltering
                    ? <span>results <span style={{color:"var(--fg-soft)"}}>· for &quot;{search || "#" + activeTag}&quot;</span></span>
                    : <span>posts <span style={{color:"var(--fg-soft)"}}>· latest · {totalPosts || posts.length} total</span></span>}
                </span>
                <span className="feed-head-grow" />
                <button className="feed-sort-btn" onClick={() => setSortOrder(o => o === "recent" ? "oldest" : "recent")}>
                  {sortOrder === "recent" ? "Recent" : "Oldest"}
                  <Icon name="chevron-right" size={12} style={{ transform: sortOrder === "recent" ? "rotate(90deg)" : "rotate(-90deg)" }} />
                </button>
              </div>

              <div className="feed-list" key={search + activeTag + sortOrder}>
                {displayPosts.map((p, i) => {
                  const tagsList = (p.tags || "").split(",").map(t => t.trim()).filter(Boolean);
                  const isSaved = bookmarked.has(p.id);
                  return (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="feed-row" style={{ animationDelay: `${i * 35}ms` }}>
                      {/* Desktop: index number */}
                      <span className="feed-index">{String(i + 1).padStart(2, "0")}</span>

                      {/* Content wrapper (flex col on both desktop and mobile) */}
                      <div className="feed-row-content">
                        <div className="feed-row-head">
                          <div className="feed-tags">
                            {tagsList.slice(0, 3).map(t => (
                              <span key={t} className="feed-tag"
                                onClick={e => { e.preventDefault(); handleTagClick(t); }}
                              >#{t}</span>
                            ))}
                          </div>
                          {/* Mobile bookmark (hidden on desktop via CSS) */}
                          <button
                            className="feed-bookmark"
                            onClick={e => toggleBookmark(e, p)}
                            disabled={bookmarking.has(p.id)}
                            style={{ color: isSaved ? "var(--accent)" : "var(--fg-muted)" }}
                          >
                            <Icon name="bookmark" size={12} fill={isSaved ? "currentColor" : "none"} />
                          </button>
                        </div>

                        <div className="feed-title">{p.title}</div>

                        {/* Desktop: excerpt */}
                        {p.excerpt && (
                          <p className="feed-excerpt">{p.excerpt}</p>
                        )}

                        <div className="feed-meta">
                          <img
                            src={p.author_avatar || avatarFallback(p.author_name)}
                            onError={e => { (e.target as HTMLImageElement).src = avatarFallback(p.author_name); }}
                            className="feed-avatar" alt={p.author_name} loading="lazy"
                          />
                          <Link href={`/user/${p.author_handle || toHandle(p.author_name)}`}
                            onClick={e => e.stopPropagation()} className="feed-author">
                            {p.author_name}
                          </Link>
                          <span className="feed-dot">·</span>
                          <span>{p.pub_date}</span>
                          {p.reading_time > 0 && (
                            <><span className="feed-dot">·</span><span>{p.reading_time} min read</span></>
                          )}
                        </div>
                      </div>

                      {/* Desktop: right-side bookmark */}
                      <div className="feed-row-aside">
                        <button
                          className={`feed-bookmark-desktop${isSaved ? " saved" : ""}`}
                          onClick={e => toggleBookmark(e, p)}
                          disabled={bookmarking.has(p.id)}
                          aria-label="Save story"
                        >
                          <Icon name="bookmark" size={17} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>

            </div>
          )}
        </main>

      </div>
    </>
  );
}
