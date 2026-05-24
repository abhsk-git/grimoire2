"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { useAuth } from "@/lib/auth";

interface UserData {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  banner?: string;
  handle?: string;
  website?: string;
  social_links?: Record<string, string>;
}

interface UserLink {
  id: number;
  url: string;
  title: string;
  description: string;
  favicon: string;
  tags: string;
  created_at: string;
}

interface UserPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  reading_time: number;
  views: number;
  likes: number;
  published_at: string;
}

type Tab = "posts" | "refs" | "about";

const RANKS = [
  { name: "Apprentice", min: 0,    max: 50,       color: "#6b7280", bg: "rgba(107,114,128,0.13)", stars: 1 },
  { name: "Scribe",     min: 50,   max: 150,      color: "#22c55e", bg: "rgba(34,197,94,0.13)",   stars: 2 },
  { name: "Arcanist",   min: 150,  max: 350,      color: "#6366f1", bg: "rgba(99,102,241,0.13)",  stars: 3 },
  { name: "Sorcerer",   min: 350,  max: 700,      color: "#a855f7", bg: "rgba(168,85,247,0.13)",  stars: 4 },
  { name: "Archmage",   min: 700,  max: 1200,     color: "#f59e0b", bg: "rgba(245,158,11,0.13)",  stars: 5 },
  { name: "Sage",       min: 1200, max: Infinity, color: "#ef4444", bg: "rgba(239,68,68,0.13)",   stars: 6 },
];

function computeXP(posts: UserPost[], links: UserLink[]) {
  const totalReads = posts.reduce((s, p) => s + (p.views || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  return Math.round(posts.length * 10 + links.length * 2 + totalReads * 0.1 + totalLikes * 0.5);
}

function getRank(xp: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

function xpProgress(xp: number, rank: typeof RANKS[0]) {
  if (rank.max === Infinity) return 100;
  return Math.min(100, ((xp - rank.min) / (rank.max - rank.min)) * 100);
}

const COVER_GRADIENTS = [
  "linear-gradient(135deg,#5b54d6,#8e8df0 60%,#b486f0)",
  "linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)",
  "linear-gradient(135deg,#14613a,#2f7d4d 60%,#6abf85)",
  "linear-gradient(135deg,#d04f63,#f08197 60%,#f4b860)",
  "linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)",
  "linear-gradient(135deg,#2f7d4d,#6abf85 60%,#a8e0bd)",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(id: number) {
  const colors = [
    "linear-gradient(135deg,#5b54d6,#8e8df0)",
    "linear-gradient(135deg,#14613a,#6abf85)",
    "linear-gradient(135deg,#d04f63,#f08197)",
    "linear-gradient(135deg,#b46a2a,#f4b860)",
    "linear-gradient(135deg,#1b3a6b,#5563d0)",
    "linear-gradient(135deg,#2f7d4d,#a8e0bd)",
  ];
  return colors[id % colors.length];
}

export function UserProfile({ handle }: { handle: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [links, setLinks] = useState<UserLink[]>([]);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user: authUser } = useAuth();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user/${encodeURIComponent(handle)}`)
      .then((r) => {
        if (!r.ok) throw new Error("User not found");
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setLinks(data.links ?? []);
        setPosts(data.posts ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [handle]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-cover" />
        <div className="profile-shell">
          <div className="profile-head" style={{ opacity: 0.5 }}>
            <div className="av" style={{ background: "var(--bg-inset)" }} />
            <div className="meta">
              <div style={{ height: 28, width: 200, background: "var(--bg-inset)", borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 14, width: 120, background: "var(--bg-inset)", borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "var(--fg-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h2 style={{ margin: "0 0 6px" }}>User not found</h2>
          <p style={{ fontSize: 14 }}>This profile doesn&apos;t exist or has been removed.</p>
          <Link href="/explore" className="btn btn-ghost btn-sm" style={{ marginTop: 12, display: "inline-flex" }}>
            ← Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = authUser && (authUser.id === user.id);
  const avatarBg = avatarColor(user.id);
  const xp = computeXP(posts, links);
  const rank = getRank(xp);
  const pct = xpProgress(xp, rank);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const xpToNext = nextRank ? nextRank.min - xp : 0;

  return (
    <div className="profile-page">
      <div className="profile-cover">
        {user.banner && (
          <img
            src={user.banner}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0, transition: "opacity 0.4s ease" }}
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
      </div>

      <div className="profile-shell">
        <div className="profile-head">
          <div className="profile-left">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="av"
                style={{ objectFit: "cover", opacity: 0, transition: "opacity 0.3s ease" }}
                onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = "none";
                  (el.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "");
                }}
              />
            ) : null}
            <div
              className="av"
              style={{ background: avatarBg, display: user.avatar ? "none" : undefined }}
            >
              {initials(user.name)}
            </div>
            <h1>{user.name}</h1>
            <div className="handle">
              <span>@{user.handle ?? user.name.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
          </div>

          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
            {isOwner && (
              <Link href="/settings" className="btn btn-ghost btn-sm" title="Settings" style={{ padding: "0 10px" }}>
                <Icon name="settings" size={14} />
              </Link>
            )}
            <button
              className="btn btn-ghost btn-sm"
              title="Copy profile link"
              style={{ padding: "0 10px" }}
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              <Icon name="link" size={14} />
            </button>
          </div>

          <div className="xp-bar-wrap">
            <div className="xp-bar-label">
              <span style={{ color: rank.color, fontWeight: 700 }}>
                {"✦".repeat(Math.min(rank.stars, 5))}{rank.stars > 5 ? "★" : ""} {rank.name}
              </span>
              <span>
                {nextRank
                  ? <>{xpToNext} XP to <strong style={{ color: nextRank.color }}>{nextRank.name}</strong></>
                  : <span style={{ color: rank.color, fontWeight: 700 }}>Max Rank</span>
                }
              </span>
            </div>
            <div className="xp-bar-track">
              <div
                className="xp-bar-fill"
                style={{ width: `${pct}%`, background: rank.color }}
              />
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={tab === "posts" ? "active" : ""} onClick={() => setTab("posts")}>
            <Icon name="feather" size={14} /> Posts <span className="ct">{posts.length}</span>
          </button>
          <button className={tab === "refs" ? "active" : ""} onClick={() => setTab("refs")}>
            <Icon name="bookmark" size={14} /> References <span className="ct">{links.length}</span>
          </button>
          <button className={tab === "about" ? "active" : ""} onClick={() => setTab("about")}>
            <Icon name="users" size={14} /> About
          </button>
        </div>

        {tab === "posts" && (
          <div>
            {posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--fg-muted)" }}>
                <Icon name="feather" size={32} />
                <p style={{ marginTop: 12 }}>No published posts yet.</p>
              </div>
            ) : (
              <div className="cards">
                {posts.map((p, i) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <article className="post-card">
                      <div className="post-cover" style={{ background: COVER_GRADIENTS[i % COVER_GRADIENTS.length] }}>
                        <div className="post-cover-overlay" />
                        <span className="post-readtime">{p.reading_time} min</span>
                      </div>
                      <div className="post-body">
                        <div className="post-by" style={{ color: "var(--fg-muted)", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                          <span>{p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                          <span>·</span>
                          <span>{p.reading_time} min read</span>
                        </div>
                        <h3 className="post-title">{p.title}</h3>
                        {p.excerpt && (
                          <p className="post-excerpt">{p.excerpt}</p>
                        )}
                        <div className="post-meta">
                          <span className="meta-stat"><Icon name="zap" size={11} /> {p.likes}</span>
                          <span className="meta-stat"><Icon name="users" size={11} /> {p.views}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "refs" && (
          <div>
            {links.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--fg-muted)" }}>
                <Icon name="bookmark" size={32} />
                <p style={{ marginTop: 12 }}>No public references yet.</p>
              </div>
            ) : (
              <div className="cards">
                {links.map((l) => {
                  const tags = l.tags ? l.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
                  const stripeColor = `hsl(${(l.id * 47) % 360}, 55%, 50%)`;
                  return (
                    <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                      <article className="lc ref-card">
                        <div className="lc-stripe" style={{ background: stripeColor }} />
                        <div className="lc-body">
                          {tags.length > 0 && (
                            <div className="lc-tags">
                              {tags.slice(0, 3).map((t) => (
                                <span key={t} className="lc-tag"><span className="h">#</span>{t}</span>
                              ))}
                            </div>
                          )}
                          <h3 className="lc-title">{l.title || l.url}</h3>
                          {l.description && <p className="lc-desc">{l.description}</p>}
                          <div className="lc-foot">
                            {l.favicon && (
                              <img
                                src={l.favicon}
                                alt=""
                                width={12}
                                height={12}
                                style={{ borderRadius: 2, objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {(() => { try { return new URL(l.url).hostname.replace(/^www\./, ""); } catch { return l.url; } })()}
                            </span>
                            <span>{l.created_at ? new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                          </div>
                        </div>
                      </article>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "about" && (
          <div className="about-grid">
            <div className="about-col-l">
              <h2>About</h2>
              {user.bio ? (
                <p>{user.bio}</p>
              ) : (
                <p style={{ color: "var(--fg-muted)" }}>This user hasn&apos;t written a bio yet.</p>
              )}
              <h2>Activity</h2>
              <p>
                {posts.length > 0
                  ? `${user.name} has published ${posts.length} post${posts.length !== 1 ? "s" : ""} and saved ${links.length} public reference${links.length !== 1 ? "s" : ""} on Grimoire.`
                  : `${user.name} has saved ${links.length} public reference${links.length !== 1 ? "s" : ""} on Grimoire.`}
              </p>
            </div>

            <div className="about-side">
              {posts.length > 0 && (
                <div className="about-card">
                  <h3>Recent posts</h3>
                  {posts.slice(0, 4).map((p) => (
                    <div key={p.id} className="item">
                      <div className="av" style={{ background: COVER_GRADIENTS[p.id % COVER_GRADIENTS.length], fontSize: 9 }}>
                        {initials(p.title)}
                      </div>
                      <div className="text">
                        <div className="n">{p.title}</div>
                        <div className="s">{p.reading_time} min read · {p.views} views</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {links.length > 0 && (
                <div className="about-card">
                  <h3>Recent references</h3>
                  {links.slice(0, 4).map((l) => {
                    let host = l.url;
                    try { host = new URL(l.url).hostname.replace(/^www\./, ""); } catch {}
                    return (
                      <div key={l.id} className="item">
                        <div className="av" style={{ background: `hsl(${(l.id * 47) % 360}, 55%, 45%)`, fontSize: 9 }}>
                          {host.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text">
                          <div className="n">{l.title || l.url}</div>
                          <div className="s">{host}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
