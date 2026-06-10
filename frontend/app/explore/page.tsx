"use client";

import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { PublicHeader } from "@/components/explore-shell";
import { ExploreView } from "@/components/explore-view";
import { PublicFooter } from "@/components/sections";

function ExploreContent() {
  const { user } = useAuth();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  }

  return (
    <div className="explore-page explore-app">
      <PublicHeader loggedIn={!!user} username={user?.username} handle={user?.handle} avatar={user?.avatar} showNav />
      <div className="explore-app-body">
        <div className="container-wide explore-app-container">
          <ExploreView />
        </div>
      </div>
      <PublicFooter />
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
