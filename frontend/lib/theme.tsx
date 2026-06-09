"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "retro";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("grimoire-theme") as Theme | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme);

  useEffect(() => {
    // Sync data-theme attribute in case the lazy initializer ran before hydration
    document.documentElement.setAttribute("data-theme", theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("grimoire-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
