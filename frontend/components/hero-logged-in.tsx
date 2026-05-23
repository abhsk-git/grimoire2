"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

interface HeroLoggedInProps {
  username?: string;
  displayName?: string;
  onSearchOpen?: () => void;
}

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

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function domainOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function domainColor(domain: string) {
  const colors = ["#6c63ff","#ff6719","#0070f3","#10b981","#f59e0b","#ef4444","#8b5cf6"];
  let h = 0;
  for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

export function HeroLoggedIn({ username, displayName, onSearchOpen }: HeroLoggedInProps) {
  const name = displayName || username || "there";
  const greeting = getGreeting();
  const [posts, setPosts] = useState<Post[]>([]);
  const [links, setLinks] = useState<SavedLink[]>([]);

  useEffect(() => {
    fetch("/api/blog/my-posts", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts((data as Post[]).slice(0, 3)))
      .catch(() => {});
    fetch("/api/links?per_page=3", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr: SavedLink[] = Array.isArray(data) ? data : ((data as { links?: SavedLink[] }).links ?? []);
        setLinks(arr.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="hero logged-in">
      <div className="container">
        <div className="hello-row">
          <div>
            <span className="eyebrow">
              <Icon name="feather" size={11} /> {greeting}
            </span>
            <h1 style={{ marginTop: 14 }}>
              Welcome back,{" "}
              <span style={{ color: "var(--accent)" }}>
                {name}
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>.</span>
              </span>
            </h1>
            <p className="meta" style={{ marginTop: 6 }}>
              Your writing space is ready.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/explore" className="btn btn-ghost btn-sm">
              <Icon name="globe" size={13} /> Explore
            </a>
            <a href="/write" className="btn btn-primary btn-sm">
              <Icon name="pen" size={13} /> New post
            </a>
          </div>
        </div>

        <div className="quick-grid">
          <QuickCard ico="pen"      title="Continue draft"    desc="Pick up where you left off"       k="⌘ ⏎" href="/dashboard?tab=posts" />
          <QuickCard ico="feather"  title="Start a new post"  desc="Empty page, no distractions"      k="⌘ N" href="/write" />
          <QuickCard ico="bookmark" title="Save a reference"  desc="Paste a URL · for your next post" k="⌘ S" href="/dashboard" />
          <QuickCard ico="search"   title="Search everything" desc="Posts, tags, saves & highlights"  k="⌘ K" href="#" onClick={onSearchOpen} />
        </div>

        <div className="logged-grid">
          <div>
            <div className="section-h">
              <h2>Your writing</h2>
              <a href="/dashboard?tab=posts">All posts →</a>
            </div>
            <PostsCard posts={posts} />
          </div>

          <div>
            <div className="section-h">
              <h2>For your next essay</h2>
              <a href="/dashboard">All saves →</a>
            </div>
            <SavesCard links={links} />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickCard({ ico, title, desc, k, href, onClick }: {
  ico: string; title: string; desc: string; k: string; href: string; onClick?: () => void;
}) {
  return (
    <a href={href} className="quick-card" style={{ textDecoration: "none" }}
       onClick={onClick ? e => { e.preventDefault(); onClick(); } : undefined}>
      <div className="ico"><Icon name={ico} size={16} /></div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div className="shortcut"><span className="kbd">{k}</span></div>
    </a>
  );
}

function PostsCard({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="posts-card">
        <div className="posts-empty">
          <Icon name="feather" size={22} />
          <p>No posts yet. Start writing!</p>
        </div>
        <a href="/write" className="btn btn-ghost btn-sm"
           style={{ marginTop: 14, width: "100%", textDecoration: "none" }}>
          <Icon name="plus" size={13} /> Start a new post
        </a>
      </div>
    );
  }
  return (
    <div className="posts-card">
      {posts.map(p => (
        <a key={p.id} href={p.status === "published" ? `/blog/${p.slug}` : `/write/${p.id}`}
           className="posts-row" style={{ textDecoration: "none", color: "inherit" }}>
          <span className={`pill ${p.status === "published" ? "live" : "draft"}`}>
            {p.status === "published" ? "Live" : "Draft"}
          </span>
          <div className="text">
            <div className="t">{p.title}</div>
            <div className="m">
              {p.status === "published"
                ? `${p.views ?? 0} reads · ${p.reading_time ?? 1} min read`
                : `Edited ${timeAgo(p.updated_at)}`}
            </div>
          </div>
          <Icon name="chevron-right" size={15} />
        </a>
      ))}
      <a href="/write" className="btn btn-ghost btn-sm"
         style={{ marginTop: 14, width: "100%", textDecoration: "none" }}>
        <Icon name="plus" size={13} /> Start a new post
      </a>
    </div>
  );
}

function SavesCard({ links }: { links: SavedLink[] }) {
  if (links.length === 0) {
    return (
      <div className="posts-card">
        <div className="posts-empty">
          <Icon name="bookmark" size={22} />
          <p>No saved references yet.</p>
        </div>
        <a href="/dashboard" className="btn btn-ghost btn-sm"
           style={{ marginTop: 14, width: "100%", textDecoration: "none" }}>
          <Icon name="plus" size={13} /> Save a reference
        </a>
      </div>
    );
  }
  return (
    <div className="posts-card">
      {links.map(l => {
        const domain = domainOf(l.url);
        const label = domain.slice(0, 2).toUpperCase();
        const bg = domainColor(domain);
        return (
          <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
             className="posts-row" style={{ alignItems: "center", textDecoration: "none", color: "inherit" }}>
            {l.favicon
              ? <img src={l.favicon} alt="" style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0 }}
                     onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <span className="col-tag" style={{ background: bg, color: "white", fontSize: 9, fontWeight: 800 }}>{label}</span>
            }
            <div className="text">
              <div className="t" style={{ fontSize: 13 }}>{l.title || domain}</div>
              <div className="m">{domain} · {timeAgo(l.created_at)}</div>
            </div>
          </a>
        );
      })}
      <a href="/dashboard" className="btn btn-ghost btn-sm"
         style={{ marginTop: 14, width: "100%", textDecoration: "none" }}>
        <Icon name="plus" size={13} /> Save a reference
      </a>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
