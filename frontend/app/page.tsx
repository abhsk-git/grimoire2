"use client";

import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { PublicHeader } from "@/components/explore-shell";
import { ExploreView } from "@/components/explore-view";
import { PublicFooter } from "@/components/sections";
import { HeroLoggedIn } from "@/components/hero-logged-in";
import { SearchModal, useSearchModal } from "@/components/search-modal";

function HomeContent() {
  const { user, loading } = useAuth();
  const { open, setOpen } = useSearchModal();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  if (user) {
    return (
      <>
        {open && <SearchModal onClose={() => setOpen(false)} />}
        <HeroLoggedIn
          username={user.username}
          displayName={user.display_name}
          onSearchOpen={() => setOpen(true)}
        />
      </>
    );
  }

  return (
    <div className="explore-page explore-app">
      <PublicHeader loggedIn={false} showNav />
      <div className="explore-app-body">
        <div className="container-wide explore-app-container">
          <ExploreView />
        </div>
      </div>
      <PublicFooter />
    </div>
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
