"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { HeroLoggedIn } from "@/components/hero-logged-in";

function HomeContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace("/explore");
    }
  }, [loading, user]);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/explore";
  }

  if (loading || !user) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  return (
    <HeroLoggedIn
      username={user.username}
      displayName={user.display_name}
      handle={user.handle}
      avatar={user.avatar}
      onSignOut={handleSignOut}
    />
  );
}

export default function HomePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HomeContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
