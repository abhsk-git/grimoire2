"use client";

import { useState, useEffect, useCallback } from "react";
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
  is_public: number;
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
  public_count: number;
  total_visits: number;
  collections: number;
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

function getCardType(
  link: ApiLink
): "article" | "placeholder" | "video" | "code" {
  const domain = getDomain(link.url);
  if (domain.includes("youtube") || domain.includes("youtu.be")) return "video";
  if (domain.includes("github") || domain.includes("gitlab")) return "code";
  if (link.image) return "article";
  return "placeholder";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatReadTime(minutes: number): string {
  return minutes ? `${minutes} min read` : "";
}

// ─── link card ───────────────────────────────────────────────────────────────

function LinkCardHero({
  link,
  domain,
}: {
  link: ApiLink;
  domain: string;
}) {
  const type = getCardType(link);
  const fav = getFavInitials(domain);
  const favColor = getFavColor(domain);

  if (type === "video") {
    return (
      <div
        className="lc-hero video"
        style={{
          background:
            "linear-gradient(160deg,#2d5fb8 0%,#f9c623 55%,#1b3a8a 100%)",
        }}
      >
        <div className="play">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2.5v11l10-5.5z" />
          </svg>
        </div>
      </div>
    );
  }
  if (type === "code") {
    return (
      <div className="lc-hero code">
        <div>
          <span className="ln">1</span>{" "}
          <span className="cm">// {domain}</span>
        </div>
        <div>
          <span className="ln">2</span>{" "}
          <span className="kw">import</span> {"{ "}
          <span className="fn">Module</span>
          {" }"} <span className="kw">from</span>{" "}
          <span className="st">&apos;lib&apos;</span>
        </div>
        <div>
          <span className="ln">3</span>{" "}
        </div>
        <div>
          <span className="ln">4</span>{" "}
          <span className="kw">export default</span>{" "}
          <span className="kw">function</span> <span className="fn">App</span>(){" "}
          {"{"}
        </div>
        <div>
          <span className="ln">5</span>{"   "}
          <span className="kw">return</span> &lt;
          <span className="fn">Module</span> /&gt;
        </div>
      </div>
    );
  }
  if (type === "article" && link.image) {
    return (
      <div
        className="lc-hero img"
        style={{
          background: `linear-gradient(135deg, ${favColor}, color-mix(in oklab, ${favColor} 40%, #8e8df0))`,
        }}
      />
    );
  }
  return (
    <div className="lc-hero placeholder">
      <div className="site">
        <span
          className="fav"
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            background: favColor,
            color: "white",
            display: "inline-grid",
            placeItems: "center",
            fontSize: 8,
            fontWeight: 800,
          }}
        >
          {fav}
        </span>
        {domain}
      </div>
    </div>
  );
}

function LinkCard({
  link,
  onStar,
}: {
  link: ApiLink;
  onStar: (id: number) => void;
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
      className="lc"
      onClick={() => window.open(link.url, "_blank", "noopener")}
    >
      <span className={`visibility ${link.is_public ? "pub" : "prv"}`}>
        <Icon name={link.is_public ? "globe" : "lock"} size={9} />
        {link.is_public ? "Public" : "Private"}
      </span>
      <LinkCardHero link={link} domain={domain} />
      <div className="lc-body">
        <div className="lc-source">
          <span className="fav" style={{ background: favColor }}>
            {fav}
          </span>
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
                <span className="h">#</span>
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="lc-foot">
          <span>{formatDate(link.created_at)}</span>
          <span>·</span>
          <span>{link.is_public ? "Public" : "Private"}</span>
          <button
            className="star"
            title={link.is_starred ? "Unstar" : "Star"}
            style={{
              color: link.is_starred ? "#f4b860" : undefined,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onStar(link.id);
            }}
          >
            <Icon name="star" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ListRow({
  link,
  onStar,
}: {
  link: ApiLink;
  onStar: (id: number) => void;
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
      <span className="vis">
        <Icon name={link.is_public ? "globe" : "lock"} size={11} />
        {link.is_public ? "Public" : "Private"}
      </span>
      <span className="when">{formatDate(link.created_at)}</span>
      <button
        style={{
          color: link.is_starred ? "#f4b860" : "var(--fg-soft)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
        title={link.is_starred ? "Unstar" : "Star"}
        onClick={(e) => {
          e.stopPropagation();
          onStar(link.id);
        }}
      >
        <Icon name="star" size={14} />
      </button>
    </div>
  );
}

// ─── stat strip ──────────────────────────────────────────────────────────────

function StatStrip({ stats }: { stats: ApiStats | null }) {
  const items = [
    { l: "References", n: stats?.total ?? "—", ico: "bookmark" },
    { l: "Public", n: stats?.public_count ?? "—", ico: "globe" },
    { l: "Collections", n: stats?.collections ?? "—", ico: "folder" },
    { l: "Total visits", n: stats?.total_visits ?? "—", ico: "zap" },
  ];

  return (
    <div className="dash-stats">
      {items.map((s) => (
        <div key={s.l} className="stat">
          <div className="ico">
            <Icon name={s.ico} size={16} />
          </div>
          <div>
            <div className="n">{String(s.n)}</div>
            <div className="l">{s.l}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── New Collection modal ────────────────────────────────────────────────────

const COLLECTION_COLORS = [
  "#6366f1", "#14613a", "#b46a2a", "#d04f63", "#2f7d4d",
  "#7c3aed", "#1f6fd9", "#e11d48", "#0891b2", "#65a30d",
];

function NewCollectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("📁");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/collections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color, icon }),
      });
      if (r.ok) {
        onCreated();
        onClose();
      } else {
        const d = await r.json();
        setError(d.error || "Failed to create collection");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <form
        className="auth-form"
        style={{ maxWidth: 360, width: "100%", padding: 24 }}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>New collection</h2>
        {error && (
          <div className="auth-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        <div className="field">
          <label>Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Design resources"
            required
          />
        </div>
        <div className="field">
          <label>Icon</label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📁"
            maxLength={4}
          />
        </div>
        <div className="field">
          <label>Color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {COLLECTION_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "2px solid var(--fg)" : "2px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── all links view ───────────────────────────────────────────────────────────

interface AllLinksViewProps {
  viewMode: "grid" | "list";
  filter: DashView;
  onStatsLoaded?: (stats: ApiStats) => void;
}

export function AllLinksView({
  viewMode,
  filter,
  onStatsLoaded,
}: AllLinksViewProps) {
  const [links, setLinks] = useState<ApiLink[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionsVersion, setCollectionsVersion] = useState(0);

  const titles: Record<DashView, string> = {
    all: "Saved · references",
    public: "Public references",
    private: "Private references",
    starred: "Starred",
    posts: "My Posts",
  };

  const fetchLinks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ per_page: "50" });
    if (filter === "public") params.set("public", "1");
    if (filter === "private") params.set("public", "0");
    if (filter === "starred") params.set("starred", "1");
    if (activeTag) params.set("tag", activeTag);

    fetch(`/api/links?${params}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { links: [], total: 0 }))
      .then((data) => {
        setLinks(data.links ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [filter, activeTag]);

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
  }, [filter]);

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
      // Remove from starred view if unstarred
      if (filter === "starred" && !data.starred) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
        setTotal((t) => Math.max(0, t - 1));
      }
    }
  }

  return (
    <div>
      <div className="page-title">
        <h1>
          {titles[filter]}
          <span className="meta">{total} saved</span>
        </h1>
        <div className="actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setCollectionModalOpen(true)}
          >
            <Icon name="folder" size={13} /> New collection
          </button>
        </div>
      </div>

      {filter === "all" && <StatStrip stats={stats} />}

      <div className="filter-bar">
        <button className="filter-chip">
          <Icon name="folder" size={12} /> Collection: All
        </button>
        <button className="filter-chip">
          <Icon name="tag" size={12} /> Any tag
        </button>
        <span className="sep">·</span>
        <button className="filter-chip">
          Sort: Recently saved{" "}
          <Icon
            name="chevron-right"
            size={11}
            style={{ transform: "rotate(90deg)" }}
          />
        </button>
        {activeTag && (
          <>
            <span className="sep">·</span>
            <button
              className="filter-chip active"
              onClick={() => setActiveTag(null)}
            >
              #{activeTag} <span className="close">×</span>
            </button>
          </>
        )}
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
          <p>
            {filter === "starred"
              ? "Star the links you keep coming back to — they'll show up here."
              : "Save your first link to get started."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="cards">
          {links.map((l) => (
            <LinkCard key={l.id} link={l} onStar={toggleStar} />
          ))}
        </div>
      ) : (
        <div className="list-view">
          {links.map((l) => (
            <ListRow key={l.id} link={l} onStar={toggleStar} />
          ))}
        </div>
      )}

      {collectionModalOpen && (
        <NewCollectionModal
          onClose={() => setCollectionModalOpen(false)}
          onCreated={() => setCollectionsVersion((v) => v + 1)}
        />
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

function PostCard({ post }: { post: ApiPost }) {
  const glyph = post.title ? post.title.charAt(0).toUpperCase() : "·";
  const pillClass = post.status === "published" ? "live" : "draft";
  const pillLabel = post.status === "published" ? "PUBLISHED" : "DRAFT";

  return (
    <div
      className="post-card"
      onClick={() => { window.location.href = `/write/${post.id}`; }}
    >
      <div
        className="post-cover"
        style={
          post.cover_image
            ? { backgroundImage: `url(${post.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: postGradient(post.id), display: "flex", alignItems: "center", justifyContent: "center" }
        }
      >
        {!post.cover_image && (
          <span style={{ fontSize: 40, fontWeight: 800, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
            {glyph}
          </span>
        )}
      </div>
      <div className="post-body">
        <span className={`pill ${pillClass}`} style={{ alignSelf: "flex-start" }}>{pillLabel}</span>
        <div className="post-title">{post.title || "Untitled"}</div>
        {post.excerpt && (
          <div className="post-excerpt">{post.excerpt}</div>
        )}
        <div className="post-meta">
          <span><Icon name="feather" size={11} />{formatDate(post.updated_at)}</span>
          {post.reading_time > 0 && <span>{formatReadTime(post.reading_time)}</span>}
          {post.views > 0 && <span><Icon name="users" size={11} />{post.views.toLocaleString()}</span>}
          {post.likes > 0 && <span><Icon name="star" size={11} />{post.likes}</span>}
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

  useEffect(() => {
    fetch("/api/blog/my-posts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter((p) => {
    if (filter === "all") return true;
    if (filter === "published") return p.status === "published";
    if (filter === "draft") return p.status === "draft";
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
          <a href="/write" className="btn btn-primary btn-sm">
            <Icon name="pen" size={13} /> New Post
          </a>
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
            <Icon name="star" size={16} />
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
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <div>
          {filtered.map((p) => (
            <div key={p.id} className="post-row">
              <div className="thumb">{p.title ? p.title.charAt(0).toUpperCase() : "·"}</div>
              <div className="body">
                <div className="t">{p.title || "Untitled"}</div>
                <div className="m">
                  <span>{formatDate(p.updated_at)}</span>
                  <span>·</span>
                  {p.reading_time > 0 && (
                    <span>{formatReadTime(p.reading_time)}</span>
                  )}
                  {p.views > 0 && (
                    <span>{p.views.toLocaleString()} views</span>
                  )}
                  {p.likes > 0 && <span>{p.likes} likes</span>}
                </div>
              </div>
              <span className={`pill ${p.status === "published" ? "live" : "draft"}`}>
                {p.status === "published" ? "PUBLISHED" : "DRAFT"}
              </span>
              <div className="icons">
                <button
                  title="Edit"
                  onClick={() => { window.location.href = `/write/${p.id}`; }}
                >
                  <Icon name="pen" size={14} />
                </button>
                {p.status === "published" && (
                  <button
                    title="View"
                    onClick={() => window.open(`/blog/${p.slug}`, "_blank")}
                  >
                    <Icon name="globe" size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
