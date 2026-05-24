"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { BrandMark, Icon } from "./icons";
import { SearchModal, useSearchModal } from "./search-modal";
import { BookmarkModal, useBookmarkModal } from "./bookmark-modal";
import { NewCollectionModal } from "./collection-modal";

export type DashView = "posts" | "all";

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
  selectedCollection: number | null;
  onSelectCollection: (id: number | null, name: string | null) => void;
  collectionsKey?: number;
  onSignOut: () => void;
}

const NAV: { id: DashView; label: string; ico: string }[] = [
  { id: "posts", label: "My Posts",  ico: "feather"  },
  { id: "all",   label: "Bookmarks", ico: "bookmark" },
];

export function DashSidebar({ view, setView, open, onClose, username, email, totalLinks, selectedCollection, onSelectCollection, collectionsKey = 0, onSignOut }: SidebarProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [collVersion, setCollVersion] = useState(0);
  const [newCollOpen, setNewCollOpen] = useState(false);

  useEffect(() => {
    fetch("/api/collections", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCollections(Array.isArray(data) ? data : []));
  }, [collVersion, collectionsKey]);

  useEffect(() => {
    fetch("/api/tags", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTags(Array.isArray(data) ? data.slice(0, 12) : []));
  }, []);

  async function deleteCollection(id: number) {
    if (!window.confirm("Delete this collection? Links inside will not be deleted.")) return;
    const r = await fetch(`/api/collections/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) {
      setCollections(prev => prev.filter(c => c.id !== id));
      if (selectedCollection === id) onSelectCollection(null, null);
    }
  }

  const counts: Record<DashView, number | null> = {
    posts: null,
    all:   totalLinks,
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : "ME";

  return (
    <aside className={`side ${open ? "open" : ""}`}>
      <Link href="/" className="side-brand" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="brand-mark"><BrandMark size={26} /></span>
        <span>Grimoire</span>
      </Link>

      <div className="side-nav">
        {NAV.map((n) => (
          <div
            key={n.id}
            className={`side-item ${view === n.id && !selectedCollection ? "active" : ""}`}
            onClick={() => { setView(n.id); onSelectCollection(null, null); onClose(); }}
          >
            <Icon name={n.ico} size={16} />
            <span>{n.label}</span>
            {counts[n.id] != null && (
              <span className="count">{counts[n.id]}</span>
            )}
          </div>
        ))}
      </div>

      <>
        <div className="side-heading">
          <span>Collections</span>
          <button title="New collection" onClick={() => setNewCollOpen(true)}>
            <Icon name="plus" size={13} />
          </button>
        </div>
        {collections.length > 0 && (
          <div>
            {collections.map((c) => (
              <div
                key={c.id}
                className={`side-coll ${selectedCollection === c.id ? "active" : ""}`}
                onClick={() => { setView("all"); onSelectCollection(c.id, c.name); onClose(); }}
              >
                <span className="swatch" style={{ background: c.color }} />
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                <span className="count">{c.link_count}</span>
                <button
                  className="del-btn"
                  title="Delete collection"
                  onClick={e => { e.stopPropagation(); deleteCollection(c.id); }}
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </>

      {newCollOpen && createPortal(
        <NewCollectionModal
          onClose={() => setNewCollOpen(false)}
          onCreated={() => setCollVersion((v) => v + 1)}
        />,
        document.body
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
        <Link href="/settings" className="side-foot-btn" title="Settings">
          <Icon name="settings" size={15} />
          <span>Settings</span>
        </Link>
        <button className="side-foot-btn side-foot-signout" onClick={onSignOut} title="Sign out">
          <Icon name="arrow-right" size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

interface HeaderProps {
  view: DashView;
  viewMode: "grid" | "list";
  setViewMode: (m: "grid" | "list") => void;
  onMenu: () => void;
  onBookmarkSaved?: () => void;
  username: string;
  handle?: string;
  avatar?: string;
  onSignOut: () => void;
}

export function DashHeader({ view, viewMode, setViewMode, onMenu, onBookmarkSaved, username, handle, avatar, onSignOut }: HeaderProps) {
  const { open, setOpen } = useSearchModal();
  const { open: bmOpen, setOpen: setBmOpen } = useBookmarkModal();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const initials = username ? username.slice(0, 2).toUpperCase() : "ME";
  const profileHref = `/user/${handle ?? username.toLowerCase().replace(/\s+/g, "-")}`;

  useEffect(() => {
    function handler(e: MouseEvent) {
      const inMobile = mobileMenuRef.current?.contains(e.target as Node);
      const inDesktop = desktopMenuRef.current?.contains(e.target as Node);
      if (!inMobile && !inDesktop) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  return (
    <>
      {open && <SearchModal onClose={() => setOpen(false)} />}
      {bmOpen && <BookmarkModal onClose={() => setBmOpen(false)} onSaved={() => { onBookmarkSaved?.(); }} />}
      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={onMenu} aria-label="Open menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="3" width="14" height="2" rx="1" />
            <rect x="1" y="7" width="14" height="2" rx="1" />
            <rect x="1" y="11" width="14" height="2" rx="1" />
          </svg>
        </button>
        <Link href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="brand-mark"><BrandMark size={22} /></span>
          Grimoire
        </Link>
        <div style={{ flex: 1 }} />
        <button className="icon-btn" aria-label="Search" style={{ width: 36, height: 36 }} onClick={() => setOpen(true)}>
          <Icon name="search" size={15} />
        </button>
        <div ref={mobileMenuRef} style={{ position: "relative" }}>
          <button
            className="avatar"
            style={{ width: 34, height: 34, fontSize: 12, borderRadius: 8 }}
            onClick={() => setUserMenuOpen(v => !v)}
          >
            {avatar ? <img src={avatar} alt={username} /> : initials}
          </button>
          {userMenuOpen && (
            <div className="user-dropdown">
              <Link href={profileHref} className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                <Icon name="users" size={13} /> Profile
              </Link>
              <Link href="/settings" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                <Icon name="settings" size={13} /> Settings
              </Link>
              <div className="user-dropdown-sep" />
              <button className="user-dropdown-item user-dropdown-signout" onClick={() => { setUserMenuOpen(false); onSignOut(); }}>
                <Icon name="arrow-right" size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile speed-dial FAB */}
      {fabOpen && <div className="fab-backdrop" onClick={() => setFabOpen(false)} />}
      <div className="fab-root">
        <div className={`fab-options${fabOpen ? " open" : ""}`}>
          <a href="/write" className="fab-option" onClick={() => setFabOpen(false)}>
            <Icon name="feather" size={14} />
            <span>New Post</span>
          </a>
          <button className="fab-option" onClick={() => { setFabOpen(false); setBmOpen(true); }}>
            <Icon name="bookmark" size={14} />
            <span>Save Bookmark</span>
          </button>
        </div>
        <button
          className={`fab-btn${fabOpen ? " open" : ""}`}
          onClick={() => setFabOpen(v => !v)}
          aria-label="Quick actions"
        >
          <Icon name="plus" size={22} />
        </button>
      </div>

      {/* Desktop header */}
      <div className="main-header">
        <div className="main-search" onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
          <Icon name="search" size={15} />
          <input placeholder="Search posts, links, tags…" readOnly style={{ cursor: "pointer" }} />
          <span className="kbd">⌘K</span>
        </div>

        <div style={{ flex: 1 }} />

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

        <button className="icon-btn" title="Save bookmark (⌘S)" onClick={() => setBmOpen(true)}>
          <Icon name="bookmark" size={15} />
        </button>

        <div ref={desktopMenuRef} style={{ position: "relative" }}>
          <button className="dash-user-pill" onClick={() => setUserMenuOpen(v => !v)}>
            <span className="avatar" style={{ width: 26, height: 26, fontSize: 11, borderRadius: 6, flexShrink: 0 }}>
              {avatar ? <img src={avatar} alt={username} /> : initials}
            </span>
            <span>{username}</span>
          </button>
          {userMenuOpen && (
            <div className="user-dropdown">
              <Link href={profileHref} className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                <Icon name="users" size={13} /> Profile
              </Link>
              <Link href="/settings" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                <Icon name="settings" size={13} /> Settings
              </Link>
              <div className="user-dropdown-sep" />
              <button className="user-dropdown-item user-dropdown-signout" onClick={() => { setUserMenuOpen(false); onSignOut(); }}>
                <Icon name="arrow-right" size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
