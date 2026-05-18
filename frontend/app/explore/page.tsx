"use client";

import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { PublicHeader } from "@/components/explore-shell";
import { ExploreView } from "@/components/explore-view";
import { BrandMark } from "@/components/icons";

function ExploreContent() {
  const { user } = useAuth();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  }

  return (
    <div className="explore-page">
      <PublicHeader loggedIn={!!user} username={user?.username} />

      <main className="public-main">
        <div className="container-wide">
          <ExploreView />
        </div>
      </main>

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
            <a href="#">RSS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ExploreContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
