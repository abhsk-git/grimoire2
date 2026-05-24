"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";

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

  const avatarBg = avatarColor(user.id);

  return (
    <div className="profile-page">
      <div
        className="profile-cover"
        style={user.banner ? { backgroundImage: `url(${user.banner})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />

      <div className="profile-shell">
        <div className="profile-head">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="av"
              style={{ objectFit: "cover" }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                el.nextElementSibling?.removeAttribute("style");
              }}
            />
          ) : null}
          <div
            className="av"
            style={{ background: avatarBg, display: user.avatar ? "none" : undefined }}
          >
            {initials(user.name)}
          </div>

          <div className="meta">
            <h1>{user.name}</h1>
            <div className="handle">
              <span>@{user.handle ?? user.name.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            {user.bio && <p className="bio">{user.bio}</p>}
            {(user.website || (user.social_links && Object.values(user.social_links).some(Boolean))) && (
              <div className="links">
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer">
                    <Icon name="globe" size={12} />
                    {user.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
                {user.social_links?.x && (
                  <a href={`https://x.com/${user.social_links.x}`} target="_blank" rel="noopener noreferrer">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.836L2.25 2.25h6.917l4.254 5.622 4.823-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    x.com/{user.social_links.x}
                  </a>
                )}
                {user.social_links?.github && (
                  <a href={`https://github.com/${user.social_links.github}`} target="_blank" rel="noopener noreferrer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
                    {user.social_links.github}
                  </a>
                )}
                {user.social_links?.instagram && (
                  <a href={`https://instagram.com/${user.social_links.instagram}`} target="_blank" rel="noopener noreferrer">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                    {user.social_links.instagram}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="actions">
            <button className="btn btn-ghost btn-sm">
              <Icon name="rss" size={13} /> RSS
            </button>
            <button className="btn btn-ghost btn-sm">
              <Icon name="link" size={13} /> Share
            </button>
          </div>

          <div className="profile-stats">
            <div className="stat-col">
              <span className="n">{posts.length}</span>
              <span className="l">Posts</span>
            </div>
            <div className="stat-col">
              <span className="n">{posts.reduce((s, p) => s + (p.views || 0), 0).toLocaleString()}</span>
              <span className="l">Reads</span>
            </div>
            <div className="stat-col">
              <span className="n">{posts.reduce((s, p) => s + (p.likes || 0), 0).toLocaleString()}</span>
              <span className="l">Likes</span>
            </div>
            <div className="stat-col">
              <span className="n">{links.length}</span>
              <span className="l">References</span>
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
