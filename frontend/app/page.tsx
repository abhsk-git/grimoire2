"use client";

import { AuthProvider, useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { HeroLoggedOut } from "@/components/hero-logged-out";
import { HeroLoggedIn } from "@/components/hero-logged-in";
import { SearchModal, useSearchModal } from "@/components/search-modal";
import {
  HowItWorks,
  Features,
  Discover,
  CTAStrip,
  Footer,
} from "@/components/sections";

function LandingContent() {
  const { user, loading } = useAuth();
  const { open, setOpen } = useSearchModal();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  }

  return (
    <div className="app">
      <Header
        loggedIn={!loading && !!user}
        username={user?.username}
        handle={user?.handle}
        onSignIn={() => (window.location.href = "/login")}
        onSignUp={() => (window.location.href = "/login?signup=1")}
        onSignOut={handleSignOut}
        onSearchOpen={() => setOpen(true)}
      />

      {open && <SearchModal onClose={() => setOpen(false)} />}

      {loading ? (
        <div style={{ height: "60vh", display: "grid", placeItems: "center" }}>
          <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>Loading…</span>
        </div>
      ) : user ? (
        <HeroLoggedIn username={user.username} displayName={user.display_name} onSearchOpen={() => setOpen(true)} />
      ) : (
        <>
          <HeroLoggedOut onSignIn={() => (window.location.href = "/login?signup=1")} />
          <HowItWorks />
          <Features />
          <Discover />
          <CTAStrip onSignIn={() => (window.location.href = "/login?signup=1")} />
          <Footer />
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}
