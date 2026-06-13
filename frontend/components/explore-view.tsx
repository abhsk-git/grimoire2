"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Icon } from "./icons";

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
interface UserResult { id: number; name: string; handle: string; avatar: string; bio: string; }

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}


const TYPED_QUERIES = ["claude code", "#linux", "sed and awk", "@abhishek", "wireshark filters", "#cloud", "deliverability"];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

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
  const isMobile = useIsMobile();
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


  const debouncedSearch = useDebounce(search, 300);
  const debouncedTag = useDebounce(activeTag, 300);

  const isAuthorSearch = debouncedSearch.startsWith("@") && debouncedSearch.length > 1;
  const [authorResults, setAuthorResults] = useState<UserResult[]>([]);
  const [authorsLoading, setAuthorsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthorSearch) { setAuthorResults([]); return; }
    setAuthorsLoading(true);
    const q = debouncedSearch.slice(1);
    fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => setAuthorResults(d.users || []))
      .catch(() => {})
      .finally(() => setAuthorsLoading(false));
  }, [isAuthorSearch, debouncedSearch]);

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
    if (!debouncedSearch && !debouncedTag) { setMobileLinks([]); return; }
    const p = new URLSearchParams({ per_page: "5" });
    if (debouncedSearch) p.set("q", debouncedSearch);
    if (debouncedTag) p.set("tag", debouncedTag);
    fetch(`/api/explore?${p}`).then(r => r.ok ? r.json() : { links: [] }).then(d => setMobileLinks(d.links || [])).catch(() => {});
  }, [debouncedSearch, debouncedTag]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const p = new URLSearchParams({ per_page: "18" });
      if (debouncedSearch) p.set("q", debouncedSearch);
      if (debouncedTag) p.set("tag", debouncedTag);
      const r = await fetch(`/api/blog/posts?${p}`);
      if (r.ok) {
        const data = await r.json();
        setPosts(data.posts || []);
        setTotalPosts(data.total || data.posts?.length || 0);
      }
    } catch {}
    finally { setPostsLoading(false); }
  }, [debouncedSearch, debouncedTag]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function handleTagClick(tag: string) {
    setActiveTag(prev => prev === tag ? "" : tag);
    setSearch("");
  }

  const isFiltering = !!(search || activeTag);
  const typedQuery = useTypewriter(TYPED_QUERIES, !search && !searchFocused);

  const sortedSidebarLinks = useMemo(() => {
    return sortOrder === "oldest"
      ? [...sidebarLinks].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      : [...sidebarLinks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sidebarLinks, sortOrder]);

  const displayPosts = useMemo(() => {
    const sorted = sortOrder === "oldest"
      ? [...posts].sort((a, b) => a.id - b.id)
      : [...posts].sort((a, b) => b.id - a.id);
    return isFiltering ? sorted : sorted.slice(0, isMobile ? 5 : 8);
  }, [posts, sortOrder, isFiltering, isMobile]);

  const mobileDisplayLinks = useMemo(() => {
    if (isFiltering) return mobileLinks;
    return isMobile ? sortedSidebarLinks.slice(0, 3) : [];
  }, [isFiltering, mobileLinks, isMobile, sortedSidebarLinks]);

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
            {!search && !searchFocused && (
              <span className="desktop-hero-ph" aria-hidden="true">
                search the grimoire: <span className="ph-typed">{typedQuery}</span><span className="ph-caret" />
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
      <div className={`explore-layout${isFiltering ? " searching" : ""}`}>

        {/* ── RIGHT SIDEBAR — desktop only ── */}
        <aside className="explore-sidebar">
          {/* Public links */}
          {sidebarLinks.length > 0 && (
            <div className="sidebar-feed-wrap">
              <div className="feed-head">
                <span className="feed-count-label">
                  <b>{String(sidebarLinks.length).padStart(2, "0")}</b>
                  <span>sites</span>
                </span>
                <span className="feed-head-grow" />
                <button className="feed-sort-btn" onClick={() => setSortOrder(o => o === "recent" ? "oldest" : "recent")}>
                  {sortOrder === "recent" ? "Recent" : "Oldest"}
                  <Icon name="chevron-right" size={12} style={{ transform: sortOrder === "recent" ? "rotate(90deg)" : "rotate(-90deg)" }} />
                </button>
              </div>
              <div className="dw-card">
                {sortedSidebarLinks.map(l => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="dw-ref-row" style={{ textDecoration: "none" }}>
                    {l.favicon ? (
                      <img src={l.favicon} style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} alt=""
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <Icon name="globe" size={13} />
                    )}
                    <span className="dw-row-title">{l.title || getDomain(l.url)}</span>
                    <div className="dw-row-end">
                      <span className="dw-row-meta">{getDomain(l.url)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Filtered links when searching */}
          {isFiltering && mobileLinks.length > 0 && (
            <div className="sidebar-feed-wrap">
              <div className="feed-head">
                <span className="feed-count-label">
                  <b>{String(mobileLinks.length).padStart(2, "0")}</b>
                  <span>matching sites</span>
                </span>
              </div>
              <div className="dw-card">
                {mobileLinks.map(l => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="dw-ref-row" style={{ textDecoration: "none" }}>
                    {l.favicon ? (
                      <img src={l.favicon} style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} alt=""
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <Icon name="globe" size={13} />
                    )}
                    <span className="dw-row-title">{l.title || getDomain(l.url)}</span>
                    <div className="dw-row-end">
                      <span className="dw-row-meta">{getDomain(l.url)}</span>
                    </div>
                  </a>
                ))}
              </div>
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

            </div>
          )}

          {activeTag && (
            <div className="active-tag-row">
              <span className="active-tag-label">Tag:</span>
              <button className="lc-tag" onClick={() => setActiveTag("")} aria-label={`Remove filter: ${activeTag}`}>
                #{activeTag} <span style={{ opacity: 0.6 }}>×</span>
              </button>
            </div>
          )}

          {postsLoading && posts.length === 0 ? (
            <div className="explore-loading">Loading…</div>
          ) : (
            <div style={{ opacity: postsLoading ? 0.5 : 1, transition: "opacity 0.15s" }}>
            <>
              {/* Site links — desktop only, when filtering */}
              {!isMobile && isFiltering && mobileLinks.length > 0 && (
                <div className="feed-links-section">
                  <div className="feed-head">
                    <span className="feed-count-label">
                      <b>{String(mobileLinks.length).padStart(2, "0")}</b>
                      <span>sites</span>
                    </span>
                  </div>
                  <div className="dw-card">
                    {mobileLinks.map(l => (
                      <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="dw-ref-row" style={{ textDecoration: "none" }}>
                        {l.favicon ? (
                          <img src={l.favicon} width={14} height={14} alt="" style={{ borderRadius: 3, flexShrink: 0 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <Icon name="globe" size={13} />
                        )}
                        <span className="dw-row-title">{l.title || getDomain(l.url)}</span>
                        <div className="dw-row-end">
                          <span className="dw-row-meta">{getDomain(l.url)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Author results — shown only for @ searches */}
              {isAuthorSearch && (
                <div className="explore-author-results">
                  <div className="feed-head">
                    <span className="feed-count-label">
                      <b>{authorsLoading ? "…" : String(authorResults.length).padStart(2, "0")}</b>
                      <span>authors</span>
                    </span>
                  </div>
                  {authorResults.length > 0 ? (
                    <div className="dw-card">
                      {authorResults.map(u => {
                        const href = u.handle ? `/user/${u.handle}` : `/user/${u.id}`;
                        const initials = u.name.slice(0, 2).toUpperCase();
                        return (
                          <Link key={u.id} href={href} className="dw-author-row" style={{ textDecoration: "none" }}>
                            {u.avatar ? (
                              <img src={u.avatar} className="dw-author-av" alt={u.name} />
                            ) : (
                              <span className="dw-author-av dw-author-av-initials">{initials}</span>
                            )}
                            <div className="dw-author-info">
                              <span className="dw-author-name">{u.name}</span>
                              {u.handle && <span className="dw-author-handle">@{u.handle}</span>}
                              {u.bio && <span className="dw-author-bio">{u.bio}</span>}
                            </div>
                            <Icon name="arrow-right" size={14} style={{ color: "var(--fg-muted)", flexShrink: 0 }} />
                          </Link>
                        );
                      })}
                    </div>
                  ) : !authorsLoading && (
                    <div className="explore-empty">
                      <Icon name="users" size={28} />
                      <p>No authors found for &quot;{debouncedSearch}&quot;.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Posts — hidden during @ search; or empty state */}
              {!isAuthorSearch && posts.length === 0 ? (
                mobileLinks.length === 0 && (
                  <div className="explore-empty">
                    <Icon name="feather" size={32} />
                    <p>No stories found{search ? ` for "${search}"` : activeTag ? ` tagged #${activeTag}` : ""}.</p>
                  </div>
                )
              ) : !isAuthorSearch && (
                <div className={`explore-feed-wrap${isFiltering && mobileLinks.length > 0 ? " has-links-above" : ""}`}>
                  {/* Feed head: count only, height matched to sidebar via CSS */}
                  <div className="feed-head explore-feed-head">
                    <span className="feed-count-label">
                      <b>{String(posts.length).padStart(2, "0")}</b>
                      {isFiltering
                        ? <span>posts <span style={{color:"var(--fg-soft)"}}>· for &quot;{search || "#" + activeTag}&quot;</span></span>
                        : <span>posts</span>}
                    </span>
                    <span className="feed-head-grow" />
                    <button className="feed-sort-btn explore-mobile-sort" onClick={() => setSortOrder(o => o === "recent" ? "oldest" : "recent")}>
                      {sortOrder === "recent" ? "Recent" : "Oldest"}
                      <Icon name="chevron-right" size={12} style={{ transform: sortOrder === "recent" ? "rotate(90deg)" : "rotate(-90deg)" }} />
                    </button>
                  </div>

                  <div className="dw-card" key={search + activeTag + sortOrder}>
                    {displayPosts.map(p => (
                      <Link key={p.id} href={`/blog/${p.slug}`} className="dw-post-row" style={{ textDecoration: "none" }}>
                        <span className="dw-pill live">post</span>
                        <span className="dw-row-title">{p.title}</span>
                        <div className="dw-row-end">
                          <span className="dw-row-meta">{p.pub_date}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Mobile: references section below posts */}
                  {isMobile && mobileDisplayLinks.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div className="feed-head">
                        <span className="feed-count-label">
                          <b>{String(mobileDisplayLinks.length).padStart(2, "0")}</b>
                          <span>sites</span>
                        </span>
                      </div>
                      <div className="dw-card">
                        {mobileDisplayLinks.map(l => (
                          <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="dw-ref-row" style={{ textDecoration: "none" }}>
                            {l.favicon ? (
                              <img src={l.favicon} width={14} height={14} alt="" style={{ borderRadius: 3, flexShrink: 0 }}
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <Icon name="globe" size={13} />
                            )}
                            <span className="dw-row-title">{l.title || getDomain(l.url)}</span>
                            <div className="dw-row-end">
                              <span className="dw-row-meta">{getDomain(l.url)}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
            </div>
          )}
        </>
        </div>
        )}
        </main>

      </div>
    </>
  );
}
