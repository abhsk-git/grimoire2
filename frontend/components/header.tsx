"use client";

import Link from "next/link";
import { BrandMark, Icon } from "./icons";
import { useTheme } from "@/lib/theme";

interface HeaderProps {
  loggedIn?: boolean;
  username?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSearchOpen?: () => void;
}

export function Header({ loggedIn, username, onSignIn, onSignOut, onSearchOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "ME";

  function toggleTheme() {
    const themes = ["light", "dark", "midnight", "geek"] as const;
    const next = themes[(themes.indexOf(theme as typeof themes[number]) + 1) % themes.length];
    setTheme(next);
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <BrandMark size={28} />
          </span>
          <span>Grimoire</span>
        </Link>

        <nav className="nav-links">
          <a href="#features">Writing</a>
          <a href="#discover">Read</a>
          <a href="#features">References</a>
        </nav>

        <div className="header-right">
          {loggedIn ? (
            <>
              <div className="search-input" onClick={onSearchOpen} style={{ cursor: "pointer" }}>
                <Icon name="search" size={14} />
                <input placeholder="Search your grimoire…" readOnly style={{ cursor: "pointer" }} onClick={onSearchOpen} />
                <span className="kbd">⌘K</span>
              </div>
              <a href="/write" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
                <Icon name="pen" size={14} /> New post
              </a>
              <button
                className="avatar"
                onClick={onSignOut}
                title="Sign out"
                style={{ cursor: "pointer" }}
              >
                {initials}
              </button>
            </>
          ) : (
            <>
              <button className="icon-btn" aria-label="Theme" onClick={toggleTheme}>
                <Icon name={theme === "dark" || theme === "midnight" ? "sun" : "moon"} size={16} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={onSignIn}>
                Sign in
              </button>
              <button className="btn btn-primary btn-sm" onClick={onSignIn}>
                Get started
                <Icon name="arrow-right" size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
