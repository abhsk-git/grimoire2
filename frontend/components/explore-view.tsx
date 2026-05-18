"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Icon } from "./icons";

type Tab = "stories" | "writers" | "references";

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
  author_name: string;
  author_avatar: string;
}

interface Writer {
  id: number;
  name: string;
  avatar: string;
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
}

interface Tag {
  name: string;
  count: number;
}

const COVER_GRADIENTS = [
  "linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)",
  "linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)",
  "linear-gradient(135deg,#14613a,#2f7d4d 60%,#6abf85)",
  "linear-gradient(135deg,#5b54d6,#8e8df0 60%,#b486f0)",
  "linear-gradient(135deg,#d04f63,#f08197 60%,#f4b860)",
  "linear-gradient(135deg,#2f4f6b,#1b6a8b 60%,#5ab4d0)",
];

function coverStyle(post: Post, idx: number): React.CSSProperties {
  if (post.cover_image) return { backgroundImage: `url(${post.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" };
  return { background: COVER_GRADIENTS[idx % COVER_GRADIENTS.length] };
}

function avatarFallback(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=44&background=6366f1&color=fff`;
}

function fmtViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

export function ExploreView() {
  const [tab, setTab] = useState<Tab>("stories");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");

  // Stories
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [blogTags, setBlogTags] = useState<Tag[]>([]);

  // Writers
  const [writers, setWriters] = useState<Writer[]>([]);
  const [writersLoading, setWritersLoading] = useState(false);

  // References
  const [links, setLinks] = useState<Link_[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkTags, setLinkTags] = useState<Tag[]>([]);
  const [linksTotal, setLinksTotal] = useState(0);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    const params = new URLSearchParams({ per_page: "20" });
    if (search) params.set("q", search);
    if (activeTag) params.set("tag", activeTag);
    const r = await fetch(`/api/blog/posts?${params}`);
    if (r.ok) {
      const data = await r.json();
      setPosts(data.posts || []);
    }
    setPostsLoading(false);
  }, [search, activeTag]);

  const fetchBlogTags = useCallback(async () => {
    const r = await fetch("/api/blog/tags");
    if (r.ok) setBlogTags(await r.json());
  }, []);

  const fetchWriters = useCallback(async () => {
    setWritersLoading(true);
    const r = await fetch("/api/blog/writers");
    if (r.ok) setWriters(await r.json());
    setWritersLoading(false);
  }, []);

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    const params = new URLSearchParams({ per_page: "24" });
    if (search) params.set("q", search);
    if (activeTag) params.set("tag", activeTag);
    const r = await fetch(`/api/explore?${params}`);
    if (r.ok) {
      const data = await r.json();
      setLinks(data.links || []);
      setLinksTotal(data.total || 0);
    }
    setLinksLoading(false);
  }, [search, activeTag]);

  const fetchLinkTags = useCallback(async () => {
    const r = await fetch("/api/explore/trending-tags");
    if (r.ok) setLinkTags(await r.json());
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts();
    fetchBlogTags();
  }, [fetchPosts, fetchBlogTags]);

  // Tab-specific fetches
  useEffect(() => {
    if (tab === "writers") fetchWriters();
    if (tab === "references") { fetchLinks(); fetchLinkTags(); }
  }, [tab, fetchWriters, fetchLinks, fetchLinkTags]);

  // Re-fetch when search/tag changes
  useEffect(() => {
    if (tab === "stories") fetchPosts();
    if (tab === "references") fetchLinks();
  }, [search, activeTag, tab, fetchPosts, fetchLinks]);

  function handleTagClick(tag: string) {
    setActiveTag(prev => prev === tag ? "" : tag);
  }

  const featured = posts.filter(p => p.featured);
  const fresh = posts.filter(p => !p.featured);
  // If no featured posts, treat top 2 as featured
  const displayFeatured = featured.length > 0 ? featured.slice(0, 2) : posts.slice(0, 2);
  const displayFresh = featured.length > 0 ? fresh : posts.slice(2);

  return (
    <div>
      <div className="explore-hero">
        <span className="eyebrow">
          <Icon name="feather" size={11} /> The reading room
        </span>
        <h1>Open the <span className="serif">Grimoire</span>.</h1>
        <p>Read what the curious are writing · then close the tab.</p>

        <div className="explore-tabs">
          {(["stories", "writers", "references"] as Tab[]).map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => { setTab(t); setSearch(""); setActiveTag(""); }}
            >
              <Icon name={t === "stories" ? "feather" : t === "writers" ? "users" : "bookmark"} size={14} />
              <div style={{ textAlign: "left" }}>
                <div>{t.charAt(0).toUpperCase() + t.slice(1)}</div>
                <div className="sub">
                  {t === "stories" ? "Essays & posts" : t === "writers" ? "People to follow" : "Public links"}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Search bar for stories + references */}
        {tab !== "writers" && (
          <div className="explore-search">
            <Icon name="search" size={15} />
            <input
              placeholder={tab === "stories" ? "Search stories, tags…" : "Search links, tags…"}
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveTag(""); }}
            />
            {(search || activeTag) && (
              <button className="explore-search-clear" onClick={() => { setSearch(""); setActiveTag(""); }}>
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── STORIES ── */}
      {tab === "stories" && (
        <>
          {postsLoading ? (
            <div className="explore-loading">Loading stories…</div>
          ) : posts.length === 0 ? (
            <div className="explore-empty">
              <Icon name="feather" size={32} />
              <p>No stories found{search ? ` for "${search}"` : activeTag ? ` tagged #${activeTag}` : ""}.</p>
            </div>
          ) : (
            <>
              {!search && !activeTag && displayFeatured.length > 0 && (
                <div className="explore-section">
                  <h2>Featured</h2>
                  <div className="featured-grid">
                    {displayFeatured.map((p, i) => (
                      <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none" }}>
                        <article className="feature-post">
                          <div className="cover" style={coverStyle(p, i)}>
                            {p.featured ? <span className="pill" style={{ background: "rgba(255,255,255,0.18)" }}>Featured</span> : null}
                            <h3>{p.title}</h3>
                          </div>
                          <div className="info">
                            <div className="by">
                              <img
                                className="avatar"
                                src={p.author_avatar || avatarFallback(p.author_name)}
                                onError={e => { (e.target as HTMLImageElement).src = avatarFallback(p.author_name); }}
                                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "none" }}
                                alt={p.author_name}
                              />
                              <div className="name">{p.author_name}</div>
                            </div>
                            {p.excerpt && (
                              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "var(--fg-soft)", marginTop: 8 }}>
                                {p.excerpt.slice(0, 140)}{p.excerpt.length > 140 ? "…" : ""}
                              </p>
                            )}
                            <div className="stats">
                              {p.pub_date} · {p.reading_time} min · {fmtViews(p.views)} views · {p.likes} likes
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="explore-section">
                <h2>{search || activeTag ? "Results" : "Fresh today"}</h2>
                <div className="cards">
                  {displayFresh.map((p, i) => {
                    const tagsList = (p.tags || "").split(",").map(t => t.trim()).filter(Boolean);
                    return (
                      <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none" }}>
                        <article className="post-card">
                          <div className="post-cover" style={coverStyle(p, i)} />
                          <div className="post-body">
                            <div className="post-by">
                              <img
                                src={p.author_avatar || avatarFallback(p.author_name)}
                                onError={e => { (e.target as HTMLImageElement).src = avatarFallback(p.author_name); }}
                                style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }}
                                alt={p.author_name}
                              />
                              <span style={{ fontWeight: 600 }}>{p.author_name}</span>
                              <span>·</span>
                              <span>{p.pub_date}</span>
                            </div>
                            <h3 className="post-title">{p.title}</h3>
                            {tagsList.length > 0 && (
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                                {tagsList.slice(0, 3).map(t => (
                                  <span key={t} className="lc-tag">#{t}</span>
                                ))}
                              </div>
                            )}
                            <div className="post-meta">
                              <span><Icon name="book" size={11} /> {p.reading_time} min</span>
                              <span><Icon name="star" size={11} /> {p.likes}</span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {blogTags.length > 0 && (
            <div className="explore-section">
              <h2>Topics</h2>
              <div className="tag-cloud">
                {blogTags.map(t => (
                  <span
                    key={t.name}
                    className={`tag${activeTag === t.name ? " active" : ""}`}
                    onClick={() => handleTagClick(t.name)}
                    style={{ cursor: "pointer" }}
                  >
                    <Icon name="feather" size={11} /> {t.name} <span className="n">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── WRITERS ── */}
      {tab === "writers" && (
        <div className="explore-section">
          <h2>Most-read writers</h2>
          {writersLoading ? (
            <div className="explore-loading">Loading writers…</div>
          ) : writers.length === 0 ? (
            <div className="explore-empty"><p>No writers yet.</p></div>
          ) : (
            <div className="writers-grid">
              {writers.map((w, i) => (
                <div key={w.id} className="writer-card">
                  <div className="rank">#{i + 1}</div>
                  <img
                    src={w.avatar || avatarFallback(w.name)}
                    onError={e => { (e.target as HTMLImageElement).src = avatarFallback(w.name); }}
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    alt={w.name}
                  />
                  <div className="info">
                    <div className="name">{w.name}</div>
                    <div className="counts">
                      <span><b style={{ color: "var(--fg)" }}>{w.post_count}</b> posts</span>
                      <span>·</span>
                      <span><b style={{ color: "var(--fg)" }}>{fmtViews(w.total_views)}</b> views</span>
                      <span>·</span>
                      <span><b style={{ color: "var(--fg)" }}>{w.total_likes}</b> likes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REFERENCES ── */}
      {tab === "references" && (
        <>
          {linksLoading ? (
            <div className="explore-loading">Loading references…</div>
          ) : links.length === 0 ? (
            <div className="explore-empty">
              <Icon name="bookmark" size={32} />
              <p>No public links found{search ? ` for "${search}"` : activeTag ? ` tagged #${activeTag}` : ""}.</p>
            </div>
          ) : (
            <div className="explore-section">
              <h2>
                {search || activeTag
                  ? `Results ${linksTotal > 0 ? `(${linksTotal})` : ""}`
                  : `Public references${linksTotal > 0 ? ` · ${linksTotal}` : ""}`}
              </h2>
              <div className="cards">
                {links.map(l => {
                  const tagsList = (l.tags || "").split(",").map(t => t.trim()).filter(Boolean);
                  const domain = getDomain(l.url);
                  return (
                    <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      <article className="post-card">
                        {l.image ? (
                          <div className="post-cover" style={{ backgroundImage: `url(${l.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        ) : (
                          <div className="post-cover" style={{ background: COVER_GRADIENTS[l.id % COVER_GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name="link" size={22} />
                          </div>
                        )}
                        <div className="post-body">
                          <div className="post-by">
                            {l.favicon ? (
                              <img src={l.favicon} style={{ width: 14, height: 14, borderRadius: 2 }} alt="" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : null}
                            <span style={{ color: "var(--fg-muted)", fontSize: 12 }}>{domain}</span>
                            <span>·</span>
                            <span style={{ fontSize: 12 }}>{l.author_name}</span>
                          </div>
                          <h3 className="post-title">{l.title || domain}</h3>
                          {l.description && (
                            <p style={{ fontSize: 13, color: "var(--fg-soft)", lineHeight: 1.5, marginBottom: 6 }}>
                              {l.description.slice(0, 100)}{l.description.length > 100 ? "…" : ""}
                            </p>
                          )}
                          {tagsList.length > 0 && (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {tagsList.slice(0, 3).map(t => (
                                <span key={t} className="lc-tag">#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {linkTags.length > 0 && (
            <div className="explore-section">
              <h2>Browse by tag</h2>
              <div className="tag-cloud">
                {linkTags.map(t => (
                  <span
                    key={t.name}
                    className={`tag${activeTag === t.name ? " active" : ""}`}
                    onClick={() => handleTagClick(t.name)}
                    style={{ cursor: "pointer" }}
                  >
                    #{t.name} <span className="n">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
