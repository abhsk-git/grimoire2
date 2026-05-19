"use client";

import { useState, useEffect } from "react";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DashSidebar, DashHeader, type DashView } from "@/components/dash-shell";
import { AllLinksView, MyPostsView } from "@/components/dash-views";

function DashContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<DashView>("posts");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [totalLinks, setTotalLinks] = useState(0);
  const [publicLinks, setPublicLinks] = useState(0);

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
        publicLinks={publicLinks}
      />
      {drawerOpen && (
        <div
          className="drawer-backdrop open"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <div className="main">
        <DashHeader
          view={view}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onMenu={() => setDrawerOpen(true)}
        />
        <div className="main-body">
          {view === "posts" && <MyPostsView viewMode={viewMode} />}
          {(view === "all" || view === "public" || view === "private" || view === "starred") && (
            <AllLinksView
              viewMode={viewMode}
              filter={view}
              onStatsLoaded={(s) => {
                setTotalLinks(s.total);
                setPublicLinks(s.public_count);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
