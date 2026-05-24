"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useTheme } from "./theme";
import { useRealm } from "./realm";

export interface EditorSettings {
  slashMenu:         boolean;
  autosave:          boolean;
  autosaveInterval:  number;
  wordCount:         boolean;
  readingTime:       boolean;
}

export interface AppearanceSettings {
  theme:       string;
  readingMode: "compact" | "spacious" | "serif";
  realm:       string;
}

export interface PublishingSettings {
  defaultVisibility: "draft" | "published";
  defaultTags:       string;
  rssEnabled:        boolean;
  aboutAuthor:       string;
}

export interface PrivacySettings {
  hideFromExplore:     boolean;
  disableComments:     boolean;
  allowAnonymousVotes: boolean;
}

export interface NotificationSettings {
  onComment:    boolean;
  onReply:      boolean;
  weeklyDigest: boolean;
}

export interface UserSettings {
  editor:        EditorSettings;
  appearance:    AppearanceSettings;
  publishing:    PublishingSettings;
  privacy:       PrivacySettings;
  notifications: NotificationSettings;
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
    theme:       "dark",
    readingMode: "spacious",
    realm:       "default",
  },
  publishing: {
    defaultVisibility: "draft",
    defaultTags:       "",
    rssEnabled:        true,
    aboutAuthor:       "",
  },
  privacy: {
    hideFromExplore:     false,
    disableComments:     false,
    allowAnonymousVotes: true,
  },
  notifications: {
    onComment:    true,
    onReply:      true,
    weeklyDigest: false,
  },
};

interface SettingsContextValue {
  settings: UserSettings;
  loaded:   boolean;
  update:   (patch: DeepPartial<UserSettings>) => Promise<void>;
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
  const { setTheme } = useTheme();
  const { setRealm } = useRealm();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings) {
          const s = { ...DEFAULTS, ...data.settings } as UserSettings;
          for (const key of Object.keys(DEFAULTS) as (keyof UserSettings)[]) {
            (s as any)[key] = { ...(DEFAULTS as any)[key], ...((data.settings as any)[key] ?? {}) };
          }
          setSettings(s);
          if (s.appearance?.theme) setTheme(s.appearance.theme as any);
          if (s.appearance?.realm) setRealm(s.appearance.realm as any);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback(async (patch: DeepPartial<UserSettings>) => {
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
        setSettings(prev => {
          const merged = { ...prev };
          for (const key of Object.keys(DEFAULTS) as (keyof UserSettings)[]) {
            (merged as any)[key] = { ...(DEFAULTS as any)[key], ...(saved as any)[key] };
          }
          return merged;
        });
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
