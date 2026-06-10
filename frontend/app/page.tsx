"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

function RootRedirect() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      window.location.replace(user ? "/dashboard" : "/explore");
    }
  }, [loading, user]);

  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>Loading…</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootRedirect />
      </AuthProvider>
    </ThemeProvider>
  );
}
