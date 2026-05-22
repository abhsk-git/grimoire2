"use client";

import { use } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { PublicHeader } from "@/components/explore-shell";
import { UserProfile } from "@/components/user-profile";
import { PublicFooter } from "@/components/sections";

function ProfileContent({ handle }: { handle: string }) {
  const { user } = useAuth();
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicHeader loggedIn={!!user} username={user?.username} />
      <UserProfile handle={handle} />
      <PublicFooter
        links={[
          { label: "About", href: "#" },
          { label: "Manifesto", href: "#" },
          { label: "Privacy", href: "#" },
          { label: "Explore", href: "/explore" },
        ]}
      />
    </div>
  );
}

export default function UserPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileContent handle={handle} />
      </AuthProvider>
    </ThemeProvider>
  );
}
