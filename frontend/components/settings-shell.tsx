"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { Icon } from "./icons";
import { useTheme } from "@/lib/theme";

type Tab = "profile" | "editor" | "appearance" | "account";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile",    label: "Profile",    icon: "user"    },
  { id: "editor",     label: "Editor",     icon: "edit"    },
  { id: "appearance", label: "Appearance", icon: "eye"     },
  { id: "account",    label: "Account",    icon: "lock"    },
];

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`sett-toggle${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="sett-toggle-knob" />
    </button>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function SettRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sett-row">
      <div className="sett-row-label">
        <span>{label}</span>
        {hint && <span className="sett-row-hint">{hint}</span>}
      </div>
      <div className="sett-row-ctrl">{children}</div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sett-section">
      <div className="sett-section-title">{title}</div>
      <div className="sett-card">{children}</div>
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, refetch } = useAuth();
  const [name, setName]   = useState(user?.username ?? "");
  const [bio,  setBio]    = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]     = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.username);
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.bio) setBio(d.bio); });
  }, [user]);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
      });
      if (r.ok) { setMsg("Saved"); refetch(); }
      else       { setMsg("Failed to save"); }
    } catch   { setMsg("Failed to save"); }
    finally   { setSaving(false); }
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "ME";

  return (
    <Section title="Public profile">
      <div className="sett-avatar-row">
        <div
          className="sett-avatar"
          style={{ background: "linear-gradient(135deg,#5b54d6,#8e8df0)" }}
        >
          {initials}
        </div>
        <div className="sett-avatar-info">
          <span className="sett-avatar-name">{user?.username}</span>
          <span className="sett-avatar-email">{user?.email}</span>
        </div>
      </div>

      <div className="sett-field">
        <label className="sett-label">Display name</label>
        <input
          className="sett-input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="sett-field">
        <label className="sett-label">Bio <span className="sett-label-soft">(shown on your profile page)</span></label>
        <textarea
          className="sett-input sett-textarea"
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="A sentence or two about yourself…"
        />
        <span className="sett-char-count">{bio.length}/300</span>
      </div>

      <div className="sett-save-row">
        {msg && <span className={`sett-msg${msg === "Saved" ? " ok" : " err"}`}>{msg}</span>}
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Section>
  );
}

// ── Editor tab ────────────────────────────────────────────────────────────────

function EditorTab() {
  const { settings, update } = useSettings();
  const e = settings.editor;

  const intervals = [2, 4, 8, 15] as const;

  return (
    <>
      <Section title="Writing tools">
        <SettRow label="Slash command menu" hint="Type / to insert block types">
          <Toggle checked={e.slashMenu} onChange={v => update({ editor: { slashMenu: v } })} />
        </SettRow>
        <SettRow label="Word count" hint="Show word count in editor topbar">
          <Toggle checked={e.wordCount} onChange={v => update({ editor: { wordCount: v } })} />
        </SettRow>
        <SettRow label="Reading time estimate" hint="Show estimated reading time">
          <Toggle checked={e.readingTime} onChange={v => update({ editor: { readingTime: v } })} />
        </SettRow>
      </Section>

      <Section title="Autosave">
        <SettRow label="Autosave drafts" hint="Automatically save while you type">
          <Toggle checked={e.autosave} onChange={v => update({ editor: { autosave: v } })} />
        </SettRow>
        {e.autosave && (
          <SettRow label="Autosave interval">
            <div className="sett-radio-group">
              {intervals.map(s => (
                <button
                  key={s}
                  className={`sett-radio${e.autosaveInterval === s ? " active" : ""}`}
                  onClick={() => update({ editor: { autosaveInterval: s } })}
                >
                  {s}s
                </button>
              ))}
            </div>
          </SettRow>
        )}
      </Section>
    </>
  );
}

// ── Appearance tab ────────────────────────────────────────────────────────────

const THEMES = [
  { id: "light",    label: "Light",    preview: "#f6f5fa", accent: "#5b54d6" },
  { id: "dark",     label: "Dark",     preview: "#0c0f14", accent: "#3ee07a" },
  { id: "midnight", label: "Midnight", preview: "#061114", accent: "#36e0c4" },
  { id: "geek",     label: "Geek",     preview: "#f3f4ed", accent: "#2da14e" },
] as const;

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { update } = useSettings();

  function pickTheme(id: string) {
    setTheme(id as any);
    update({ appearance: { theme: id } });
  }

  return (
    <Section title="Theme">
      <div className="sett-theme-grid">
        {THEMES.map(t => (
          <button
            key={t.id}
            className={`sett-theme-card${theme === t.id ? " active" : ""}`}
            onClick={() => pickTheme(t.id)}
          >
            <div
              className="sett-theme-preview"
              style={{ background: t.preview }}
            >
              <div className="sett-theme-dot" style={{ background: t.accent }} />
              <div className="sett-theme-bars">
                <span style={{ background: t.accent, opacity: 0.8 }} />
                <span style={{ background: t.accent, opacity: 0.5, width: "60%" }} />
                <span style={{ background: t.accent, opacity: 0.3, width: "80%" }} />
              </div>
            </div>
            <span className="sett-theme-label">{t.label}</span>
            {theme === t.id && <span className="sett-theme-check"><Icon name="check" size={12} /></span>}
          </button>
        ))}
      </div>
    </Section>
  );
}

// ── Account tab ───────────────────────────────────────────────────────────────

function AccountTab() {
  const [oldPw, setOldPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState("");

  async function changePassword() {
    if (!oldPw || newPw.length < 8) {
      setMsg("New password must be at least 8 characters");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      });
      const d = await r.json();
      setMsg(r.ok ? "Password changed" : (d.error ?? "Failed"));
      if (r.ok) { setOldPw(""); setNewPw(""); }
    } catch { setMsg("Failed"); }
    finally   { setSaving(false); }
  }

  return (
    <Section title="Change password">
      <div className="sett-field">
        <label className="sett-label">Current password</label>
        <input
          type="password"
          className="sett-input"
          value={oldPw}
          onChange={e => setOldPw(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div className="sett-field">
        <label className="sett-label">New password <span className="sett-label-soft">(min 8 chars)</span></label>
        <input
          type="password"
          className="sett-input"
          value={newPw}
          onChange={e => setNewPw(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="sett-save-row">
        {msg && <span className={`sett-msg${msg === "Password changed" ? " ok" : " err"}`}>{msg}</span>}
        <button className="btn btn-primary btn-sm" onClick={changePassword} disabled={saving}>
          {saving ? "Saving…" : "Update password"}
        </button>
      </div>
    </Section>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function SettingsShell() {
  const [tab, setTab] = useState<Tab>("profile");
  const { user } = useAuth();

  // Read ?tab= from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    if (p && TABS.some(t => t.id === p)) setTab(p as Tab);
  }, []);

  if (!user) {
    return (
      <div className="sett-gate">
        <p>Please <Link href="/login">sign in</Link> to access settings.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sett-page">
        <div className="sett-header">
          <Link href="/dashboard" className="sett-back">
            <Icon name="arrow-left" size={14} /> Dashboard
          </Link>
          <h1 className="sett-title">Settings</h1>
        </div>

        <div className="sett-layout">
          {/* Sidebar tabs */}
          <nav className="sett-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`sett-nav-item${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <Icon name={t.icon} size={15} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="sett-content">
            {tab === "profile"    && <ProfileTab />}
            {tab === "editor"     && <EditorTab />}
            {tab === "appearance" && <AppearanceTab />}
            {tab === "account"    && <AccountTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
