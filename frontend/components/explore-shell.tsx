"use client";

import Link from "next/link";
import { BrandMark, Icon } from "./icons";
import { useTheme } from "@/lib/theme";

interface PublicHeaderProps {
  loggedIn?: boolean;
  username?: string;
}

export function PublicHeader({ loggedIn, username }: PublicHeaderProps) {
  const { theme, setTheme } = useTheme();
  const initials = username ? username.slice(0, 2).toUpperCase() : "ME";

  function toggleTheme() {
    const themes = ["light", "dark", "midnight", "geek"] as const;
    const next = themes[(themes.indexOf(theme as typeof themes[number]) + 1) % themes.length];
    setTheme(next);
  }

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <BrandMark size={28} />
          </span>
          <span>Grimoire</span>
        </Link>

        <div className="public-search">
          <Icon name="search" size={15} />
          <input placeholder="Search posts, writers, tags…" />
          <span className="kbd">⌘K</span>
        </div>

        <div className="public-header-right">
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="btn btn-primary btn-sm public-dash">
                My Dashboard <Icon name="arrow-right" size={13} />
              </Link>
              <Link href="/write" className="btn btn-ghost btn-sm">
                <Icon name="pen" size={13} /> Write
              </Link>
              <button className="icon-btn" aria-label="Theme" onClick={toggleTheme}>
                <Icon
                  name={theme === "dark" || theme === "midnight" ? "sun" : "moon"}
                  size={16}
                />
              </button>
              <Link
                href={`/user/${username ? username.toLowerCase().replace(/\s+/g, '-') : ''}`}
                className="avatar"
                style={{ background: "linear-gradient(135deg,#5b54d6,#8e8df0)", textDecoration: "none" }}
              >
                {initials}
              </Link>
            </>
          ) : (
            <>
              <button className="icon-btn" aria-label="Theme" onClick={toggleTheme}>
                <Icon
                  name={theme === "dark" || theme === "midnight" ? "sun" : "moon"}
                  size={16}
                />
              </button>
              <Link href="/" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/" className="btn btn-primary btn-sm">
                Get started <Icon name="arrow-right" size={13} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
