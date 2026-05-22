"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar?: string;
  banner?: string;
  handle?: string;
  website?: string;
  social_links?: Record<string, string>;
  bio?: string;
  has_password?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser({
          id:           data.id,
          username:     data.name,
          display_name: data.name,
          email:        data.email,
          avatar:       data.avatar,
          banner:       data.banner,
          handle:       data.handle,
          website:      data.website,
          social_links: data.social_links,
          bio:          data.bio,
          has_password: data.has_password,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
