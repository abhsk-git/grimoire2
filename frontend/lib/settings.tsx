"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface EditorSettings {
  slashMenu:         boolean;
  autosave:          boolean;
  autosaveInterval:  number;   // seconds
  wordCount:         boolean;
  readingTime:       boolean;
}

export interface AppearanceSettings {
  theme: string;
}

export interface UserSettings {
  editor:     EditorSettings;
  appearance: AppearanceSettings;
}

const DEFAULTS: UserSettings = {
  editor: {
    slashMenu:        true,
    autosave:         true,
    autosaveInterval: 4,
    wordCount:        true,
    readingTime:      true,
  },
  appearance: {
    theme: "dark",
  },
};

interface SettingsContextValue {
  settings:  UserSettings;
  loaded:    boolean;
  update:    (patch: DeepPartial<UserSettings>) => Promise<void>;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  loaded:   false,
  update:   async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings) setSettings(data.settings as UserSettings);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback(async (patch: DeepPartial<UserSettings>) => {
    // Optimistic update
    setSettings(prev => {
      const next = { ...prev };
      for (const key of Object.keys(patch) as (keyof UserSettings)[]) {
        if (patch[key] && typeof patch[key] === "object") {
          (next as any)[key] = { ...(prev as any)[key], ...(patch as any)[key] };
        }
      }
      return next;
    });
    try {
      const res = await fetch("/api/settings", {
        method:      "PATCH",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(patch),
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved as UserSettings);
      }
    } catch {}
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
