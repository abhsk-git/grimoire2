"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BrandMark, Icon } from "./icons";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = username ? username.slice(0, 2).toUpperCase() : "ME";
  const profileHref = `/user/${handle ?? username?.toLowerCase().replace(/\s+/g, "-") ?? "me"}`;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark"><BrandMark size={28} /></span>
          <span>Grimoire</span>
        </Link>

        {loggedIn ? (
          <nav className="nav-links">
            <a href="/write">Write</a>
            <a href="/explore">Explore</a>
          </nav>
        ) : (
          <nav className="nav-links">
            <a href="/#features">Writing</a>
            <a href="/#discover">Read</a>
            <a href="/#features">References</a>
          </nav>
        )}

        <div className="header-right">
          {loggedIn ? (
            <>
              <div className="search-input" onClick={onSearchOpen} style={{ cursor: "pointer" }}>
                <Icon name="search" size={14} />
                <input placeholder="Search your grimoire…" readOnly style={{ cursor: "pointer" }} onClick={onSearchOpen} />
                <span className="kbd">⌘K</span>
              </div>
              <a href="/dashboard" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
                <Icon name="layout-grid" size={14} /> Dashboard
              </a>
              <div ref={menuRef} style={{ position: "relative" }}>
                <button className="avatar" onClick={() => setMenuOpen(v => !v)} title="Account menu">
                  {avatar ? <img src={avatar} alt={username} /> : initials}
                </button>
                {menuOpen && (
                  <div className="user-dropdown">
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
  );
}
