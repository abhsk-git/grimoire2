"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark, Icon } from "./icons";
import { useTheme } from "@/lib/theme";
import { SearchModal, useSearchModal } from "./search-modal";

export type DashView = "posts" | "all" | "public" | "private" | "starred";

interface Collection {
  id: number;
  name: string;
  color: string;
  link_count: number;
}

interface Tag {
  name: string;
  count: number;
}

interface SidebarProps {
  view: DashView;
  setView: (v: DashView) => void;
  open: boolean;
  onClose: () => void;
  username: string;
  email: string;
  totalLinks: number;
  publicLinks: number;
}

const NAV: { id: DashView; label: string; ico: string }[] = [
  { id: "posts",   label: "My Posts",  ico: "feather"  },
  { id: "all",     label: "Saved",     ico: "bookmark" },
  { id: "public",  label: "Public",    ico: "globe"    },
  { id: "private", label: "Private",   ico: "lock"     },
  { id: "starred", label: "Starred",   ico: "star"     },
];

export function DashSidebar({ view, setView, open, onClose, username, email, totalLinks, publicLinks }: SidebarProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch("/api/collections", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCollections(Array.isArray(data) ? data : []));

    fetch("/api/tags", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTags(Array.isArray(data) ? data.slice(0, 12) : []));
  }, []);

  const counts: Record<DashView, number | null> = {
    posts:   null,
    all:     totalLinks,
    public:  publicLinks,
    private: totalLinks - publicLinks,
    starred: null,
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : "ME";

  return (
    <aside className={`side ${open ? "open" : ""}`}>
      <div className="side-brand">
        <span className="brand-mark"><BrandMark size={26} /></span>
        <span>Grimoire</span>
      </div>

      <div className="side-nav">
        {NAV.map((n) => (
          <div
            key={n.id}
            className={`side-item ${view === n.id ? "active" : ""}`}
            onClick={() => { setView(n.id); onClose(); }}
          >
            <Icon name={n.ico} size={16} />
            <span>{n.label}</span>
            {counts[n.id] != null && (
              <span className="count">{counts[n.id]}</span>
            )}
          </div>
        ))}
      </div>

      {collections.length > 0 && (
        <>
          <div className="side-heading">
            <span>Collections</span>
            <button title="New collection"><Icon name="plus" size={13} /></button>
          </div>
          <div>
            {collections.map((c) => (
              <div key={c.id} className="side-coll">
                <span className="swatch" style={{ background: c.color }} />
                <span>{c.name}</span>
                <span className="count">{c.link_count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tags.length > 0 && (
        <>
          <div className="side-heading"><span>Tags</span></div>
          <div className="side-tags">
            {tags.map((t) => (
              <span key={t.name} className="tag">
                #{t.name} <span className="n">{t.count}</span>
              </span>
            ))}
          </div>
        </>
      )}

      <div className="side-foot">
        <Link
          href={`/user/${username.toLowerCase().replace(/\s+/g, '-')}`}
          className="avatar"
          style={{ background: "linear-gradient(135deg,#5b54d6,#8e8df0)", textDecoration: "none" }}
        >
          {initials}
        </Link>
        <Link href={`/user/${username.toLowerCase().replace(/\s+/g, '-')}`} style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}>
          <div className="who">
            <div className="n">{username}</div>
            <div className="e">{email}</div>
          </div>
        </Link>
        <Link
          href="/settings"
          className="icon-btn"
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Settings"
        >
          <Icon name="cmd" size={13} />
        </Link>
      </div>
    </aside>
  );
}

interface HeaderProps {
  view: DashView;
  viewMode: "grid" | "list";
  setViewMode: (m: "grid" | "list") => void;
  onMenu: () => void;
}

export function DashHeader({ view, viewMode, setViewMode, onMenu }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { open, setOpen } = useSearchModal();

  function toggleTheme() {
    const themes = ["light", "dark", "midnight", "geek"] as const;
    const next = themes[(themes.indexOf(theme as typeof themes[number]) + 1) % themes.length];
    setTheme(next);
  }

  return (
    <>
      {open && <SearchModal onClose={() => setOpen(false)} />}
      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={onMenu} aria-label="Open menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="3" width="14" height="2" rx="1" />
            <rect x="1" y="7" width="14" height="2" rx="1" />
            <rect x="1" y="11" width="14" height="2" rx="1" />
          </svg>
        </button>
        <div className="brand">
          <span className="brand-mark"><BrandMark size={22} /></span>
          Grimoire
        </div>
        <div style={{ flex: 1 }} />
        <button className="icon-btn" aria-label="Search" style={{ width: 36, height: 36 }} onClick={() => setOpen(true)}>
          <Icon name="search" size={15} />
        </button>
        <Link href="/write" className="btn btn-primary btn-sm" style={{ padding: "0 12px" }}>
          <Icon name="pen" size={13} /> New
        </Link>
      </div>

      {/* Desktop header */}
      <div className="main-header">
        <div className="main-search" onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
          <Icon name="search" size={15} />
          <input placeholder="Search posts, links, tags…" readOnly style={{ cursor: "pointer" }} />
          <span className="kbd">⌘K</span>
        </div>

        <div style={{ flex: 1 }} />

        <button className="icon-btn" title="Theme" onClick={toggleTheme}>
          <Icon name={theme === "dark" || theme === "midnight" ? "sun" : "moon"} size={16} />
        </button>

        <div className="view-toggle">
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1.2" />
                <rect x="9" y="1" width="6" height="6" rx="1.2" />
                <rect x="1" y="9" width="6" height="6" rx="1.2" />
                <rect x="9" y="9" width="6" height="6" rx="1.2" />
              </svg>
            </button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="14" height="2" rx="1" />
                <rect x="1" y="7" width="14" height="2" rx="1" />
                <rect x="1" y="12" width="14" height="2" rx="1" />
              </svg>
            </button>
        </div>

        <button className="icon-btn" title="Save a reference (⌘S)">
          <Icon name="bookmark" size={15} />
        </button>

        <Link href="/write" className="btn btn-primary btn-sm">
          <Icon name="pen" size={14} /> New post
        </Link>
      </div>
    </>
  );
}
