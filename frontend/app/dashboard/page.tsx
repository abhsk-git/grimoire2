"use client";

import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DashSidebar, DashHeader, type DashView } from "@/components/dash-shell";
import { AllLinksView, MyPostsView } from "@/components/dash-views";

function DashContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<DashView>("posts");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [totalLinks, setTotalLinks] = useState(0);
  const [linksVersion, setLinksVersion] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  }

  if (!user) return null;

  return (
    <div className="shell">
      <DashSidebar
        view={view}
        setView={setView}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        username={user.username}
        email={user.email}
        totalLinks={totalLinks}
        onSignOut={handleSignOut}
      />
      {drawerOpen && (
        <div className="drawer-backdrop open" onClick={() => setDrawerOpen(false)} />
      )}
      <div className="main">
        <DashHeader
          view={view}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onMenu={() => setDrawerOpen(true)}
          onBookmarkSaved={() => setLinksVersion(v => v + 1)}
          username={user.username}
          handle={user.handle}
          avatar={user.avatar}
          onSignOut={handleSignOut}
        />
        <div className="main-body">
          {view === "posts" && <MyPostsView viewMode={viewMode} />}
          {view === "all" && (
            <AllLinksView
              viewMode={viewMode}
              filter={view}
              version={linksVersion}
              onStatsLoaded={(s) => setTotalLinks(s.total)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashContent />
    </AuthProvider>
  );
}
