"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BrandMark, Icon } from "./icons";
import { useTheme } from "@/lib/theme";
import { SearchModal, useSearchModal } from "./search-modal";
import { useMobileDrawerGesture } from "@/lib/use-mobile-drawer-gesture";
interface HeaderProps {
  loggedIn?: boolean;
  username?: string;
  handle?: string;
  avatar?: string;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
  onSearchOpen?: () => void;
}

export function Header({ loggedIn, username, handle, avatar, onSignIn, onSignUp, onSignOut, onSearchOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { open: localSearchOpen, setOpen: setLocalSearchOpen } = useSearchModal();
  const [menuOpen, setMenuOpen] = useState(false);
  useMobileDrawerGesture(menuOpen, setMenuOpen);
  const menuRef = useRef<HTMLDivElement>(null);
  const parts = (username || "").trim().split(/\s+/).filter(Boolean);
  const initials = (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || "ME").slice(0, 2)).toUpperCase();
  const profileHref = `/user/${handle ?? username?.toLowerCase().replace(/\s+/g, "-") ?? "me"}`;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <>
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark"><BrandMark size={28} /></span>
          <span>grimoire</span>
        </Link>

        {loggedIn ? (
          <nav className="nav-links">
            <Link href="/explore">Explore</Link>
            <Link href="/write">New post</Link>
          </nav>
        ) : (
          <nav className="nav-links">
            <Link href="/explore">Explore</Link>
            <Link href="/login">New post</Link>
          </nav>
        )}

        <div className="header-right">
          <button className="theme-cycle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} title={`${theme} theme — switch theme`} aria-label={`${theme} theme active; switch theme`}>
            <Icon name={theme === "light" ? "sun" : "moon"} size={14} />
            <span>{theme}</span>
          </button>
          {loggedIn ? (
            <>
              <button className="search-input" onClick={() => onSearchOpen ? onSearchOpen() : setLocalSearchOpen(true)} aria-label="Search">
                <Icon name="search" size={14} />
                <span className="search-input-ph">Search your grimoire…</span>
                <span className="kbd">⌘K</span>
              </button>
              <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
                <Icon name="layout-grid" size={14} /> Dashboard
              </Link>
              <div ref={menuRef} style={{ position: "relative" }}>
                <button className={`avatar${avatar ? " has-photo" : ""}`} onClick={() => setMenuOpen(v => !v)} title="Account menu">
                  {avatar ? <img src={avatar} alt={username} /> : initials}
                </button>
                {menuOpen && (
                  <div className="user-dropdown">
                    <div className="mobile-account-head">
                      <span className={`mobile-account-avatar${avatar ? " has-photo" : ""}`}>{avatar ? <img src={avatar} alt={username}/> : initials}</span>
                      <span><b>{username}</b><small>Your workspace</small></span>
                    </div>
                    <Link href="/dashboard" className="user-dropdown-item mobile-account-only" onClick={() => setMenuOpen(false)}><Icon name="layout-grid" size={13}/>Dashboard</Link>
                    <Link href="/explore" className="user-dropdown-item mobile-account-only" onClick={() => setMenuOpen(false)}><Icon name="globe" size={13}/>Explore</Link>
                    <Link href="/write" className="user-dropdown-item mobile-account-only" onClick={() => setMenuOpen(false)}><Icon name="pen" size={13}/>New post</Link>
                    <Link href={profileHref} className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                      <Icon name="users" size={13} /> Profile
                    </Link>
                    <Link href="/settings" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                      <Icon name="settings" size={13} /> Settings
                    </Link>
                    <div className="user-dropdown-sep" />
                    <button className="user-dropdown-item user-dropdown-signout" onClick={() => { setMenuOpen(false); onSignOut?.(); }}>
                      <Icon name="arrow-right" size={13} /> Sign out
                    </button>
                  </div>
                )}
              </div>
              {menuOpen && <button className="mobile-account-backdrop" aria-label="Close account menu" onClick={() => setMenuOpen(false)}/>}
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={onSignIn}>Sign in</button>
              <button className="btn btn-primary btn-sm header-getstarted" onClick={onSignUp}>
                Get started <Icon name="arrow-right" size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
    {localSearchOpen && <SearchModal onClose={() => setLocalSearchOpen(false)}/>}
    </>
  );
}
