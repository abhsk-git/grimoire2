"use client";

import { useRef } from "react";
import Link from "next/link";
import { BrandMark, Icon } from "./icons";
import { avatarColor, isRealAvatar } from "@/lib/avatar";
interface PublicHeaderProps {
  loggedIn?: boolean;
  username?: string;
  avatar?: string;
}

export function PublicHeader({ loggedIn, username, avatar }: PublicHeaderProps) {
  const initials  = username ? username.slice(0, 2).toUpperCase() : "ME";
  const realPhoto = isRealAvatar(avatar);
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
                href={`/user/${username ? username.toLowerCase().replace(/\s+/g, '-') : ''}`}
                className={`avatar${realPhoto ? " has-photo" : ""}`}
                style={realPhoto ? { textDecoration: "none" } : { background: avatarColor(username || "ME"), textDecoration: "none" }}
              >
                {realPhoto ? <img src={avatar!} alt={username} /> : initials}
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
