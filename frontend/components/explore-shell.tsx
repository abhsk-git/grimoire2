"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BrandMark, Icon } from "./icons";
import { useTheme } from "@/lib/theme";
import { useRouter } from "next/navigation";
import { useMobileDrawerGesture } from "@/lib/use-mobile-drawer-gesture";
interface PublicHeaderProps {
  loggedIn?: boolean;
  username?: string;
  handle?: string;
  avatar?: string;
  showNav?: boolean;
  showSearch?: boolean;
  onSignOut?: () => void;
}

export function PublicHeader({ loggedIn, username, handle, avatar, showNav, showSearch = true, onSignOut }: PublicHeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const parts = (username || "").trim().split(/\s+/).filter(Boolean);
  const initials = (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || "ME").slice(0, 2)).toUpperCase();
  const searchRef = useRef<HTMLInputElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  useMobileDrawerGesture(accountOpen, setAccountOpen);

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const q = searchRef.current?.value.trim();
      if (q) router.push(`/explore?q=${encodeURIComponent(q)}`);
    }
  }

  async function signOut() {
    setAccountOpen(false);
    if (onSignOut) return onSignOut();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  }

  return (
    <>
    <header className="public-header">
      <div className="public-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <BrandMark size={28} />
          </span>
          <span>grimoire</span>
        </Link>

        {showNav && <span style={{ flex: 1 }} />}

        {showSearch && (
          <div className="public-search">
            <Icon name="search" size={15} />
            <input ref={searchRef} placeholder="Search posts, writers, tags…" onKeyDown={handleSearch} />
            <span className="kbd">⌘K</span>
          </div>
        )}

        <div className="public-header-right">
          <button className="theme-cycle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} title={`${theme} theme — switch theme`} aria-label={`${theme} theme active; switch theme`}>
            <Icon name={theme === "light" ? "sun" : "moon"} size={14} />
            <span>{theme}</span>
          </button>
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="btn btn-primary btn-sm public-dash public-desktop-account">
                My Dashboard <Icon name="arrow-right" size={13} />
              </Link>
              <Link href="/write" className="btn btn-ghost btn-sm public-desktop-account">
                <Icon name="pen" size={13} /> New post
              </Link>
              <Link href="/settings" className="btn btn-ghost btn-sm public-desktop-account"><Icon name="settings" size={13}/> Settings</Link>
              <button className="btn btn-ghost btn-sm public-desktop-account" onClick={signOut}><Icon name="arrow-right" size={13}/> Sign out</button>
              <Link href={`/user/${handle ?? (username ? username.toLowerCase().replace(/\s+/g, '-') : '')}`} className={`avatar public-desktop-account${avatar ? " has-photo" : ""}`} style={avatar ? { textDecoration: "none" } : { background: "linear-gradient(135deg,#5b54d6,#8e8df0)", textDecoration: "none" }}>{avatar ? <img src={avatar} alt={username} /> : initials}</Link>
              <button className={`avatar public-mobile-account-trigger${avatar ? " has-photo" : ""}`} onClick={() => setAccountOpen(true)} aria-label="Open account menu">{avatar ? <img src={avatar} alt={username}/> : initials}</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/login?signup=1" className="btn btn-primary btn-sm">
                Get started <Icon name="arrow-right" size={13} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
    {loggedIn && accountOpen && <button className="mobile-account-backdrop" aria-label="Close account menu" onClick={() => setAccountOpen(false)}/>}
    {loggedIn && <aside className={`mobile-account-panel${accountOpen ? " open" : ""}`} aria-hidden={!accountOpen}>
      <div className="mobile-account-panel-top"><span>Workspace</span><button onClick={() => setAccountOpen(false)}><Icon name="x" size={16}/></button></div>
      <Link href={`/user/${handle ?? (username ? username.toLowerCase().replace(/\s+/g, '-') : '')}`} className="mobile-account-head" onClick={() => setAccountOpen(false)}><span className={`mobile-account-avatar${avatar ? " has-photo" : ""}`}>{avatar ? <img src={avatar} alt={username}/> : initials}</span><span><b>{username}</b><small>View profile</small></span></Link>
      <nav><Link href="/dashboard"><Icon name="layout-grid" size={15}/>Dashboard</Link><Link href="/explore"><Icon name="globe" size={15}/>Explore</Link><Link href="/write"><Icon name="pen" size={15}/>New post</Link><Link href="/settings"><Icon name="settings" size={15}/>Settings</Link></nav>
      <button className="mobile-account-signout" onClick={signOut}><Icon name="arrow-right" size={15}/>Sign out</button>
    </aside>}
    </>
  );
}
