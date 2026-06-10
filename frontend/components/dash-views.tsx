"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "./icons";
import type { DashView } from "./dash-shell";

// ─── helpers ─────────────────────────────────────────────────────────────────

interface ApiLink {
  id: number;
  url: string;
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  tags: string;
  is_starred: number;
  notes?: string;
  created_at: string;
  visit_count: number;
  collection_name?: string;
  collection_color?: string;
}

interface ApiPost {
  id: number;
  title: string;
  slug: string;
  status: string;
  tags: string;
  reading_time: number;
  views: number;
  likes: number;
  cover_image?: string;
  excerpt?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface ApiStats {
  total: number;
  total_visits: number;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFavInitials(domain: string): string {
  const parts = domain.split(".");
  if (parts.length >= 2) return parts[parts.length - 2].slice(0, 2).toUpperCase();
  return domain.slice(0, 2).toUpperCase();
}

const DOMAIN_COLORS: [string, string][] = [
  ["github.com", "#171717"],
  ["youtube.com", "#ff0000"],
  ["youtu.be", "#ff0000"],
  ["drive.google.com", "#1f6fd9"],
  ["docs.google.com", "#1f6fd9"],
  ["substack.com", "#ff6719"],
  ["medium.com", "#000000"],
  ["dev.to", "#333333"],
  ["stackoverflow.com", "#f58025"],
  ["reddit.com", "#ff4500"],
  ["twitter.com", "#1da1f2"],
  ["x.com", "#000000"],
  ["linkedin.com", "#0077b5"],
  ["notion.so", "#191919"],
  ["obsidian.md", "#7c3aed"],
];

function getFavColor(domain: string): string {
  for (const [d, c] of DOMAIN_COLORS) {
    if (domain.includes(d)) return c;
  }
  let hash = 0;
  for (const ch of domain) hash = (hash << 5) - hash + ch.charCodeAt(0);
  const palette = [
    "#5563d0", "#14613a", "#b46a2a", "#d04f63", "#2f7d4d", "#7c3aed", "#1f6fd9",
  ];
  return palette[Math.abs(hash) % palette.length];
}


function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function postDateLabel(post: ApiPost): string {
  if (post.status === "draft" || !post.published_at) {
    return `Edited ${formatDate(post.updated_at)}`;
  }
  const pubMs  = new Date(post.published_at).getTime();
  const updMs  = new Date(post.updated_at).getTime();
  const edited = updMs - pubMs > 5 * 60 * 1000;
  return edited
    ? `Published ${formatDate(post.published_at)} · edited ${formatDate(post.updated_at)}`
    : `Published ${formatDate(post.published_at)}`;
}

function formatReadTime(minutes: number): string {
  return minutes ? `${minutes} min read` : "";
}

// ─── link card ───────────────────────────────────────────────────────────────

function LinkCard({
  link,
  onStar,
  onDelete,
}: {
  link: ApiLink;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const domain = getDomain(link.url);
  const fav = getFavInitials(domain);
  const favColor = getFavColor(domain);
  const tags = link.tags
    ? link.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div
      className="lc"
      onClick={() => window.open(link.url, "_blank", "noopener")}
    >
      <div className="lc-stripe" style={{ background: favColor }} />
      <div className="lc-body">
        <div className="lc-source">
          <span className="fav" style={{ background: favColor }}>{fav}</span>
          <span>{domain}</span>
        </div>
        <div className="lc-title">{link.title}</div>
        {link.description && (
          <div className="lc-desc">{link.description}</div>
        )}
        {tags.length > 0 && (
          <div className="lc-tags">
            {tags.map((t) => (
              <span key={t} className="lc-tag">
                <span className="h">#</span>{t}
              </span>
            ))}
          </div>
        )}
        <div className="lc-foot">
          <span>{formatDate(link.created_at)}</span>
          <span style={{ flex: 1 }} />
          <button
            aria-label="Delete bookmark"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--fg-muted)" }}
            onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ListRow({
  link,
  onStar,
  onDelete,
}: {
  link: ApiLink;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const domain = getDomain(link.url);
  const fav = getFavInitials(domain);
  const favColor = getFavColor(domain);
  const tags = link.tags
    ? link.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className="list-row"
      onClick={() => window.open(link.url, "_blank", "noopener")}
    >
      <div className="fav" style={{ background: favColor }}>
        {fav}
      </div>
      <div>
        <div className="title">{link.title}</div>
        <div className="desc">
          {domain}
          {link.description
            ? " — " + link.description.slice(0, 80) + "…"
            : ""}
        </div>
      </div>
      <div className="tags">
        {tags.slice(0, 3).map((t) => (
          <span key={t} className="lc-tag">
            <span className="h">#</span>
            {t}
          </span>
        ))}
      </div>
      <span className="when">{formatDate(link.created_at)}</span>
      <button
        aria-label="Delete bookmark"
        style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", color: "var(--fg-muted)", display: "flex", alignItems: "center" }}
        onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
}

// ─── stat strip ──────────────────────────────────────────────────────────────

function StatStrip({ stats }: { stats: ApiStats | null }) {
  const items = [
    { l: "Bookmarks", n: stats?.total ?? null, ico: "bookmark" },
    { l: "Total visits", n: stats?.total_visits ?? null, ico: "zap" },
  ];

  return (
    <div className="dash-stats">
      {items.map((s) => (
        <div key={s.l} className="stat">
          <div className="ico">
            <Icon name={s.ico} size={16} />
          </div>
          <div>
            <div className="n">
              {s.n === null
                ? <span className="stat-skel" />
                : String(s.n)}
            </div>
            <div className="l">{s.l}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── all links view ───────────────────────────────────────────────────────────

interface AllLinksViewProps {
  viewMode: "grid" | "list";
  filter: DashView;
  version?: number;
  onStatsLoaded?: (stats: ApiStats) => void;
}

export function AllLinksView({
  viewMode,
  filter,
  version = 0,
  onStatsLoaded,
}: AllLinksViewProps) {
  const [links, setLinks] = useState<ApiLink[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [availableTags, setAvailableTags] = useState<{ name: string; count: number }[]>([]);
  const [tagDropOpen, setTagDropOpen] = useState(false);
  const tagDropRef = useRef<HTMLDivElement>(null);
  const [undoMsg, setUndoMsg] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLinkRef = useRef<{ id: number; item: ApiLink; idx: number } | null>(null);

  useEffect(() => () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      if (pendingLinkRef.current) {
        fetch(`/api/links/${pendingLinkRef.current.id}`, { method: "DELETE", credentials: "include" });
      }
    }
  }, []);

  const titles: Record<DashView, string> = {
    all:   "Bookmarks",
    posts: "My Posts",
  };

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // fetch user's tags for the picker
  useEffect(() => {
    fetch("/api/tags", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setAvailableTags)
      .catch(() => {});
  }, [version]);

  // close tag dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (tagDropRef.current && !tagDropRef.current.contains(e.target as Node)) {
        setTagDropOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const fetchLinks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ per_page: "50" });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (activeTag) params.set("tag", activeTag);

    fetch(`/api/links?${params}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { links: [], total: 0 }))
      .then((data) => {
        setLinks(data.links ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [filter, debouncedSearch, activeTag, version]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    if (filter !== "all") return;
    fetch("/api/stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setStats(data);
          onStatsLoaded?.(data);
        }
      });
  }, [filter, version]);

  async function toggleStar(linkId: number) {
    const r = await fetch(`/api/links/${linkId}/star`, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      const data = await r.json();
      setLinks((prev) =>
        prev.map((l) =>
          l.id === linkId ? { ...l, is_starred: data.starred ? 1 : 0 } : l
        )
      );
    }
  }

  function deleteLink(linkId: number) {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      if (pendingLinkRef.current) {
        fetch(`/api/links/${pendingLinkRef.current.id}`, { method: "DELETE", credentials: "include" });
      }
    }
    const idx = links.findIndex(l => l.id === linkId);
    const item = links[idx];
    if (!item) return;
    setLinks(prev => prev.filter(l => l.id !== linkId));
    setTotal(t => Math.max(0, t - 1));
    pendingLinkRef.current = { id: linkId, item, idx };
    setUndoMsg(item.title || item.url);
    undoTimerRef.current = setTimeout(() => {
      fetch(`/api/links/${linkId}`, { method: "DELETE", credentials: "include" });
      pendingLinkRef.current = null;
      setUndoMsg(null);
      undoTimerRef.current = null;
    }, 5000);
  }

  function undoLinkDelete() {
    if (!undoTimerRef.current || !pendingLinkRef.current) return;
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    const { item, idx } = pendingLinkRef.current;
    pendingLinkRef.current = null;
    setLinks(prev => { const a = [...prev]; a.splice(idx, 0, item); return a; });
    setTotal(t => t + 1);
    setUndoMsg(null);
  }

  return (
    <div>
      <div className="page-title">
        <h1>
          {titles[filter]}
          <span className="meta">{total} saved</span>
        </h1>
      </div>

      {filter === "all" && <StatStrip stats={stats} />}

      <div className="dash-search-row">
        <div className="dash-search">
          <Icon name="search" size={13} />
          <input
            className="dash-search-input"
            placeholder="Search bookmarks, tags…"
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveTag(null); }}
          />
          {search && (
            <button className="dash-search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div className="tag-drop-wrap" ref={tagDropRef}>
          <button
            className={`filter-chip${activeTag ? " active" : ""}${tagDropOpen ? " open" : ""}`}
            onClick={() => setTagDropOpen(o => !o)}
          >
            <Icon name="tag" size={12} />
            {activeTag ? `#${activeTag}` : "Any tag"}
            {activeTag && (
              <span
                className="close"
                onClick={e => { e.stopPropagation(); setActiveTag(null); setTagDropOpen(false); }}
              >
                ×
              </span>
            )}
          </button>
          {tagDropOpen && availableTags.length > 0 && (
            <div className="tag-drop">
              {availableTags.map(t => (
                <button
                  key={t.name}
                  className={`tag-drop-item${activeTag === t.name ? " active" : ""}`}
                  onClick={() => { setActiveTag(activeTag === t.name ? null : t.name); setTagDropOpen(false); setSearch(""); }}
                >
                  <span className="tag-drop-name">#{t.name}</span>
                  <span className="tag-drop-count">{t.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "var(--fg-soft)",
            fontSize: 14,
          }}
        >
          Loading…
        </div>
      ) : links.length === 0 ? (
        <div className="empty">
          <div className="ico">
            <Icon name="bookmark" size={26} />
          </div>
          <h3>Nothing here yet</h3>
          <p>Save your first link to get started.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="cards">
          {links.map((l) => (
            <LinkCard key={l.id} link={l} onStar={toggleStar} onDelete={deleteLink} />
          ))}
        </div>
      ) : (
        <div className="list-view">
          {links.map((l) => (
            <ListRow key={l.id} link={l} onStar={toggleStar} onDelete={deleteLink} />
          ))}
        </div>
      )}

      {undoMsg !== null && (
        <div className="delete-toast">
          <span className="delete-toast-msg">Bookmark deleted</span>
          <button className="delete-toast-undo" onClick={undoLinkDelete}>Undo</button>
        </div>
      )}
    </div>
  );
}

// ─── post card (grid) ────────────────────────────────────────────────────────

const POST_GRADIENTS = [
  "linear-gradient(135deg,#5563d0,#8e8df0)",
  "linear-gradient(135deg,#14613a,#2f7d4d)",
  "linear-gradient(135deg,#b46a2a,#f4b860)",
  "linear-gradient(135deg,#d04f63,#f08090)",
  "linear-gradient(135deg,#1f6fd9,#5b9cf6)",
  "linear-gradient(135deg,#7c3aed,#a78bfa)",
];

function postGradient(id: number) {
  return POST_GRADIENTS[id % POST_GRADIENTS.length];
}

function PostCard({ post, onDelete }: { post: ApiPost; onDelete: (id: number) => void }) {
  const glyph = post.title ? post.title.charAt(0).toUpperCase() : "·";
  const pillClass = post.status === "published" ? "live" : "draft";
  const pillLabel = post.status === "published" ? "PUBLISHED" : "DRAFT";

  return (
    <div
      className="post-card"
      onClick={() => { window.location.href = `/blog/${post.slug}`; }}
    >
      <div
        className="post-cover"
        style={
          post.cover_image
            ? { backgroundImage: `url(${post.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: postGradient(post.id), display: "flex", alignItems: "center", justifyContent: "center" }
        }
      >
        <div className="post-cover-overlay" />
        <span className={`pill ${pillClass}`} style={{ position: "absolute", top: 10, left: 10, zIndex: 2 }}>{pillLabel}</span>
        {!post.cover_image && (
          <span style={{ fontSize: 40, fontWeight: 800, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>
            {glyph}
          </span>
        )}
      </div>
      <div className="post-body">
        <div className="post-title">{post.title || "Untitled"}</div>
        {post.excerpt && (
          <div className="post-excerpt">{post.excerpt}</div>
        )}
        <div className="post-meta">
          <span>{postDateLabel(post)}</span>
          <span style={{ flex: 1 }} />
          <button
            aria-label="Delete post"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--fg-muted)" }}
            onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── my posts view ────────────────────────────────────────────────────────────

type PostFilter = "all" | "published" | "draft";

export function MyPostsView({ viewMode }: { viewMode: "grid" | "list" }) {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PostFilter>("all");
  const [search, setSearch] = useState("");
  const [undoMsg, setUndoMsg] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPostRef = useRef<{ id: number; item: ApiPost; idx: number } | null>(null);

  useEffect(() => () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      if (pendingPostRef.current) {
        fetch(`/api/blog/posts/${pendingPostRef.current.id}`, { method: "DELETE", credentials: "include" });
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/blog/my-posts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter((p) => {
    if (filter === "published" && p.status !== "published") return false;
    if (filter === "draft" && p.status !== "draft") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.tags || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    drafts: posts.filter((p) => p.status === "draft").length,
  };

  const pillClass = (status: string) => {
    if (status === "published") return "live";
    return "draft";
  };

  const pillLabel = (status: string) => {
    if (status === "published") return "PUBLISHED";
    return "DRAFT";
  };

  const glyph = (title: string) => title.charAt(0).toUpperCase() || "·";

  function deletePost(postId: number) {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      if (pendingPostRef.current) {
        fetch(`/api/blog/posts/${pendingPostRef.current.id}`, { method: "DELETE", credentials: "include" });
      }
    }
    const idx = posts.findIndex(p => p.id === postId);
    const item = posts[idx];
    if (!item) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    pendingPostRef.current = { id: postId, item, idx };
    setUndoMsg(item.title || "Untitled");
    undoTimerRef.current = setTimeout(() => {
      fetch(`/api/blog/posts/${postId}`, { method: "DELETE", credentials: "include" });
      pendingPostRef.current = null;
      setUndoMsg(null);
      undoTimerRef.current = null;
    }, 5000);
  }

  function undoPostDelete() {
    if (!undoTimerRef.current || !pendingPostRef.current) return;
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    const { item, idx } = pendingPostRef.current;
    pendingPostRef.current = null;
    setPosts(prev => { const a = [...prev]; a.splice(idx, 0, item); return a; });
    setUndoMsg(null);
  }

  return (
    <div>
      <div className="page-title">
        <h1>
          My Posts
          <span className="meta">{counts.total} total</span>
        </h1>
        <div className="actions">
          <div className="filter-bar" style={{ margin: 0 }}>
            {(["all", "published", "draft"] as PostFilter[]).map((f) => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <a href="/write" className="btn btn-primary btn-sm new-post-btn">
            <Icon name="pen" size={13} /> New Post
          </a>
        </div>
      </div>

      <div className="dash-search-row">
        <div className="dash-search">
          <Icon name="search" size={13} />
          <input
            className="dash-search-input"
            placeholder="Search posts by title or tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="dash-search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>
      </div>

      {/* stats strip */}
      <div className="dash-stats">
        <div className="stat">
          <div className="ico">
            <Icon name="feather" size={16} />
          </div>
          <div>
            <div className="n">{counts.total}</div>
            <div className="l">Total posts</div>
          </div>
        </div>
        <div className="stat">
          <div className="ico">
            <Icon name="globe" size={16} />
          </div>
          <div>
            <div className="n">{counts.published}</div>
            <div className="l">Published</div>
          </div>
        </div>
        <div className="stat">
          <div className="ico">
            <Icon name="users" size={16} />
          </div>
          <div>
            <div className="n">
              {posts.reduce((s, p) => s + (p.views || 0), 0).toLocaleString()}
            </div>
            <div className="l">Total reads</div>
          </div>
        </div>
        <div className="stat">
          <div className="ico">
            <Icon name="zap" size={16} />
          </div>
          <div>
            <div className="n">
              {posts.reduce((s, p) => s + (p.likes || 0), 0)}
            </div>
            <div className="l">Likes</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "var(--fg-soft)",
            fontSize: 14,
          }}
        >
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="ico">
            <Icon name="feather" size={26} />
          </div>
          <h3>No posts yet</h3>
          <p>
            Start writing your first post. It can be a draft — no pressure to
            publish right away.
          </p>
          <a href="/write" className="btn btn-primary btn-sm">
            <Icon name="pen" size={13} /> Start writing
          </a>
        </div>
      ) : viewMode === "grid" ? (
        <div className="cards">
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} onDelete={deletePost} />
          ))}
        </div>
      ) : (
        <div>
          {filtered.map((p) => (
            <a key={p.id} href={`/blog/${p.slug}`} className="post-row">
              <div className="thumb" style={{ background: p.cover_image ? "none" : postGradient(p.id) }}>
                {p.cover_image
                  ? <img src={p.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : (p.title ? p.title.charAt(0).toUpperCase() : "·")}
              </div>
              <div className="body">
                <div className="t">{p.title || "Untitled"}</div>
                <div className="m">
                  <span>{postDateLabel(p)}</span>
                </div>
              </div>
              <button
                aria-label="Delete post"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", color: "var(--fg-muted)", display: "flex", alignItems: "center" }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); deletePost(p.id); }}
              >
                <Icon name="trash" size={14} />
              </button>
            </a>
          ))}
        </div>
      )}

      {undoMsg !== null && (
        <div className="delete-toast">
          <span className="delete-toast-msg">Post deleted</span>
          <button className="delete-toast-undo" onClick={undoPostDelete}>Undo</button>
        </div>
      )}
    </div>
  );
}
