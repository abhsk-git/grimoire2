"use client";

import Link from "next/link";
import { BrandMark, Icon } from "./icons";
interface PublicHeaderProps {
  loggedIn?: boolean;
  username?: string;
}

export function PublicHeader({ loggedIn, username }: PublicHeaderProps) {
  const initials = username ? username.slice(0, 2).toUpperCase() : "ME";

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
