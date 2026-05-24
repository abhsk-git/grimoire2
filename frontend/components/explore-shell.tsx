"use client";

import { useRef } from "react";
import Link from "next/link";
import { BrandMark, Icon } from "./icons";
interface PublicHeaderProps {
  loggedIn?: boolean;
  username?: string;
  handle?: string;
  avatar?: string;
}

export function PublicHeader({ loggedIn, username, handle, avatar }: PublicHeaderProps) {
  const initials = username ? username.slice(0, 2).toUpperCase() : "ME";
  const searchRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const q = searchRef.current?.value.trim();
      if (q) window.location.href = `/explore?q=${encodeURIComponent(q)}`;
    }
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
          <input ref={searchRef} placeholder="Search posts, writers, tags…" onKeyDown={handleSearch} />
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
              <Link
                href={`/user/${handle ?? (username ? username.toLowerCase().replace(/\s+/g, '-') : '')}`}
                className={`avatar${avatar ? " has-photo" : ""}`}
                style={avatar ? { textDecoration: "none" } : { background: "linear-gradient(135deg,#5b54d6,#8e8df0)", textDecoration: "none" }}
              >
                {avatar ? <img src={avatar} alt={username} /> : initials}
              </Link>
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
  );
}
