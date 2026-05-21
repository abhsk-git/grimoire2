"use client";

import { use } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { PublicHeader } from "@/components/explore-shell";
import { UserProfile } from "@/components/user-profile";
import { BrandMark } from "@/components/icons";

function ProfileContent({ handle }: { handle: string }) {
  const { user } = useAuth();
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicHeader loggedIn={!!user} username={user?.username} />
      <UserProfile handle={handle} />
      <footer className="public-foot">
        <div
          className="container-wide"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
            <span style={{ color: "var(--accent)" }}>
              <BrandMark size={20} />
            </span>
            <span>Grimoire</span>
            <span style={{ color: "var(--fg-soft)", fontWeight: 400, fontSize: 13 }}>
              · a quiet writing tool with a memory
            </span>
          </div>
          <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--fg-muted)" }}>
            <a href="#">About</a>
            <a href="#">Manifesto</a>
            <a href="#">Privacy</a>
            <a href="/explore">Explore</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function UserPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);

  return (

      <AuthProvider>
        <ProfileContent handle={handle} />
      </AuthProvider>

  );
}
