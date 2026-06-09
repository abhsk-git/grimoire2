"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { Icon } from "./icons";
import { useTheme } from "@/lib/theme";
import { ImageCropModal } from "./image-crop-modal";
import { PasswordInput } from "./auth-forms";

type Tab = "profile" | "social" | "editor" | "appearance" | "publishing" | "privacy" | "notifications" | "account";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile",       label: "Profile",       icon: "user"    },
  { id: "social",        label: "Social links",  icon: "link"    },
  { id: "editor",        label: "Editor",         icon: "feather" },
  { id: "appearance",    label: "Appearance",     icon: "sun"     },
  { id: "publishing",    label: "Publishing",     icon: "rss"     },
  { id: "privacy",       label: "Privacy",        icon: "lock"    },
  { id: "notifications", label: "Notifications",  icon: "inbox"   },
  { id: "account",       label: "Account",        icon: "settings"},
];

// ── Primitives ────────────────────────────────────────────────────────────────

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

function SettRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sett-section">
      <div className="sett-section-title">{title}</div>
      <div className="sett-card">{children}</div>
    </div>
  );
}

function SaveMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  const ok = msg.toLowerCase().includes("saved") || msg.toLowerCase().includes("updated") || msg.toLowerCase().includes("changed");
  return <span className={`sett-msg${ok ? " ok" : " err"}`}>{msg}</span>;
}

// ── Social platform defs ──────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  {
    key: "x",
    label: "X / Twitter",
    prefix: "x.com/",
    placeholder: "username",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.836L2.25 2.25h6.917l4.254 5.622 4.823-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: "#000",
  },
  {
    key: "github",
    label: "GitHub",
    prefix: "github.com/",
    placeholder: "username",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
    color: "#333",
  },
  {
    key: "instagram",
    label: "Instagram",
    prefix: "instagram.com/",
    placeholder: "username",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    color: "#e1306c",
  },
];

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, refetch } = useAuth();

  const [name,          setName]          = useState(user?.username ?? "");
  const [handle,        setHandle]        = useState(user?.handle ?? "");
  const [bio,           setBio]           = useState(user?.bio ?? "");
  const [website,       setWebsite]       = useState(user?.website ?? "");
  const [socials,       setSocials]       = useState<Record<string, string>>(user?.social_links ?? {});
  const [avatarUrl,     setAvatarUrl]     = useState(user?.avatar ?? "");
  const [bannerUrl,     setBannerUrl]     = useState(user?.banner ?? "");
  const [avatarInput,   setAvatarInput]   = useState("");
  const [bannerInput,   setBannerInput]   = useState("");
  const [showBannerUrl,    setShowBannerUrl]    = useState(false);
  const [showAvatarUrl,    setShowAvatarUrl]    = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [uploading,        setUploading]        = useState<"avatar" | "banner" | null>(null);
  const [msg,              setMsg]              = useState("");
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.username ?? "");
    setHandle(user.handle ?? "");
    setBio(user.bio ?? "");
    setWebsite(user.website ?? "");
    setSocials(user.social_links ?? {});
    setAvatarUrl(user.avatar ?? "");
    setBannerUrl(user.banner ?? "");
  }, [user]);

  async function uploadFile(file: File, type: "avatar" | "banner") {
    setUploading(type);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch(`/api/upload/${type}`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const d = await r.json();
      if (r.ok) {
        if (type === "avatar") setAvatarUrl(d.url);
        else setBannerUrl(d.url);
        refetch();
      } else {
        setMsg(d.error ?? "Upload failed");
      }
    } catch {
      setMsg("Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (!name.trim()) { setMsg("Display name cannot be empty"); return; }
    setSaving(true); setMsg("");
    try {
      const body: Record<string, unknown> = {
        name:         name.trim(),
        bio:          bio.trim(),
        handle:       handle.trim().toLowerCase(),
        website:      website.trim(),
        social_links: socials,
        avatar:       avatarUrl,
        banner:       bannerUrl,
      };
      const r = await fetch("/api/profile", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (r.ok) { setMsg("Saved"); refetch(); }
      else       { setMsg(d.error ?? "Failed to save"); }
    } catch { setMsg("Failed to save"); }
    finally   { setSaving(false); }
  }

  const initials = (user?.username ?? "ME").slice(0, 2).toUpperCase();

  return (
    <>
    <div className="sett-section">
      <div className="sett-section-title">Public profile</div>
      <div className="sett-profile-grid">

        {/* Banner — full width */}
        <div className="sett-card sett-profile-banner">
          <div
            className="sett-banner-strip"
            onClick={() => !showBannerUrl && bannerFileRef.current?.click()}
          >
            {bannerUrl ? <img src={bannerUrl} alt="Banner" /> : null}
            <div className="sett-banner-overlay">
              <div className="sett-banner-actions">
                <button className="sett-banner-btn" onClick={e => { e.stopPropagation(); bannerFileRef.current?.click(); }}>
                  <Icon name="upload" size={12} />
                  {uploading === "banner" ? "Uploading…" : "Upload"}
                </button>
                <button className="sett-banner-btn" onClick={e => { e.stopPropagation(); setShowBannerUrl(v => !v); }}>
                  <Icon name="link" size={12} /> URL
                </button>
                {bannerUrl && (
                  <button className="sett-banner-btn sett-banner-remove" onClick={e => { e.stopPropagation(); setBannerUrl(""); setBannerInput(""); setShowBannerUrl(false); }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <input ref={bannerFileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { setPendingBannerFile(f); if (bannerFileRef.current) bannerFileRef.current.value = ""; } }} />
          {showBannerUrl && (
            <div className="sett-inline-url-row">
              <input className="sett-input" placeholder="https://example.com/banner.jpg" value={bannerInput} onChange={e => setBannerInput(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={() => { setBannerUrl(bannerInput.trim()); setShowBannerUrl(false); }}>Set</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBannerUrl(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* Identity card — left col */}
        <div className="sett-card sett-profile-identity">
          <div className="sett-identity-inner">
            <div className="sett-avatar-clickable" onClick={() => avatarFileRef.current?.click()} title="Change avatar">
              {avatarUrl
                ? <img className="sett-avatar sett-avatar-photo" src={avatarUrl} alt={initials} />
                : <div className="sett-avatar" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-3))" }}>{initials}</div>
              }
              <div className="sett-avatar-hover">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setPendingAvatarFile(f); if (avatarFileRef.current) avatarFileRef.current.value = ""; } }} />
            <div className="sett-identity-right">
              <span className="sett-avatar-name">{user?.username}</span>
              <span className="sett-avatar-email">{user?.email}</span>
              <button className="sett-link-btn" onClick={() => setShowAvatarUrl(v => !v)}>
                {uploading === "avatar" ? "Uploading…" : "Paste image URL"}
              </button>
            </div>
          </div>
          {showAvatarUrl && (
            <div className="sett-identity-url-row">
              <input className="sett-input" placeholder="https://example.com/avatar.jpg" value={avatarInput} onChange={e => setAvatarInput(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={() => { setAvatarUrl(avatarInput.trim()); setShowAvatarUrl(false); }}>Set</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAvatarUrl(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* Fields card — right col */}
        <div className="sett-card sett-profile-fields">
          <div className="sett-field">
            <label className="sett-label">Display name</label>
            <input className="sett-input" value={name} onChange={e => setName(e.target.value)} maxLength={100} />
          </div>
          <div className="sett-field">
            <label className="sett-label">Handle <span className="sett-label-soft">(public URL)</span></label>
            <div className="sett-handle-wrap">
              <span className="sett-handle-prefix">grimoire.sysnode.in/user/</span>
              <input className="sett-handle-input" value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={30} placeholder="yourhandle" />
            </div>
            <span className="sett-handle-hint">2–30 chars · lowercase · hyphens ok</span>
          </div>
          <div className="sett-field">
            <label className="sett-label">Bio <span className="sett-label-soft">(shown on profile)</span></label>
            <textarea className="sett-input sett-textarea" value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={2} placeholder="A short bio…" />
            <span className="sett-char-count">{bio.length}/300</span>
          </div>
          <div className="sett-field" style={{ borderBottom: "none" }}>
            <label className="sett-label">Website</label>
            <div className="sett-handle-wrap">
              <span className="sett-handle-prefix"><Icon name="globe" size={13} /></span>
              <input className="sett-handle-input" value={website} onChange={e => setWebsite(e.target.value)} maxLength={300} placeholder="https://yoursite.com" />
            </div>
          </div>
          <div className="sett-save-row">
            <SaveMsg msg={msg} />
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

      </div>
    </div>

    {pendingBannerFile && (
      <ImageCropModal
        file={pendingBannerFile}
        aspectRatio={4.5}
        label="Adjust banner"
        outputWidth={1400}
        onCancel={() => setPendingBannerFile(null)}
        onConfirm={blob => {
          setPendingBannerFile(null);
          uploadFile(new File([blob], "banner.jpg", { type: "image/jpeg" }), "banner");
        }}
      />
    )}
    {pendingAvatarFile && (
      <ImageCropModal
        file={pendingAvatarFile}
        aspectRatio={1}
        label="Adjust profile photo"
        outputWidth={400}
        onCancel={() => setPendingAvatarFile(null)}
        onConfirm={blob => {
          setPendingAvatarFile(null);
          uploadFile(new File([blob], "avatar.jpg", { type: "image/jpeg" }), "avatar");
        }}
      />
    )}
    </>
  );
}

// ── Social Links Tab ──────────────────────────────────────────────────────────

function SocialLinksTab() {
  const { user, refetch } = useAuth();
  const [socials, setSocials] = useState<Record<string, string>>(user?.social_links ?? {});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) setSocials(user.social_links ?? {});
  }, [user]);

  async function save() {
    setSaving(true); setMsg("");
    try {
      const r = await fetch("/api/profile", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         user?.username ?? "",
          bio:          user?.bio ?? "",
          handle:       user?.handle ?? "",
          website:      user?.website ?? "",
          social_links: socials,
          avatar:       user?.avatar ?? "",
          banner:       user?.banner ?? "",
        }),
      });
      const d = await r.json();
      if (r.ok) { setMsg("Saved"); refetch(); }
      else       { setMsg(d.error ?? "Failed to save"); }
    } catch { setMsg("Failed to save"); }
    finally   { setSaving(false); }
  }

  return (
    <Section title="Social links">
      <div className="sett-socials-list">
        {SOCIAL_PLATFORMS.map(p => (
          <div key={p.key} className="sett-social-row">
            <div className="sett-social-icon" style={{ background: `color-mix(in oklab, ${p.color} 12%, var(--bg-soft))`, color: p.color === "#000" ? "var(--fg)" : p.color }}>
              {p.icon}
            </div>
            <span className="sett-social-prefix">{p.prefix}</span>
            <input
              className="sett-social-input"
              placeholder={p.placeholder}
              value={socials[p.key] ?? ""}
              onChange={e => setSocials(prev => ({ ...prev, [p.key]: e.target.value }))}
              maxLength={100}
            />
          </div>
        ))}
      </div>
      <div className="sett-save-row">
        <SaveMsg msg={msg} />
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save links"}
        </button>
      </div>
    </Section>
  );
}

// ── Editor Tab ────────────────────────────────────────────────────────────────

function EditorTab() {
  const { settings, update } = useSettings();
  const e = settings.editor;
  const intervals = [2, 4, 8, 15] as const;

  return (
    <>
      <Section title="Writing tools">
        <SettRow label="Formatting toolbar" hint="Show the persistent toolbar with all formatting options">
          <Toggle checked={e.toolbar} onChange={v => update({ editor: { toolbar: v } })} />
        </SettRow>
        <SettRow label="Slash command menu" hint="Type / to insert block types">
          <Toggle checked={e.slashMenu} onChange={v => update({ editor: { slashMenu: v } })} />
        </SettRow>
        <SettRow label="Word count" hint="Show word count in the editor topbar">
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

// ── Appearance Tab ────────────────────────────────────────────────────────────

const THEMES = [
  { id: "light", label: "Light", preview: "#f6f5fa", accent: "#5b54d6" },
  { id: "dark",  label: "Dark",  preview: "#0c0f14", accent: "#3ee07a" },
  { id: "retro", label: "Retro", preview: "#fdf8ee", accent: "#7a3b1e" },
] as const;

const READING_MODES = [
  {
    id: "compact" as const,
    label: "Compact",
    lines: [100, 90, 80, 95, 75],
    gap: 2,
  },
  {
    id: "spacious" as const,
    label: "Spacious",
    lines: [100, 85, 70, 90, 65],
    gap: 5,
  },
  {
    id: "serif" as const,
    label: "Serif",
    lines: [100, 88, 72, 94, 68],
    gap: 4,
  },
];

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { settings, update } = useSettings();
  const rm = settings.appearance.readingMode ?? "spacious";

  function pickTheme(id: string) {
    setTheme(id as any);
    update({ appearance: { theme: id } });
  }

  return (
    <>
      <Section title="Theme">
        <div className="sett-theme-grid">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={`sett-theme-card${theme === t.id ? " active" : ""}`}
              onClick={() => pickTheme(t.id)}
            >
              <div className="sett-theme-preview" style={{ background: t.preview }}>
                <div className="sett-theme-dot" style={{ background: t.accent }} />
                <div className="sett-theme-bars">
                  <span style={{ background: t.accent, opacity: 0.8 }} />
                  <span style={{ background: t.accent, opacity: 0.5, width: "60%" }} />
                  <span style={{ background: t.accent, opacity: 0.3, width: "80%" }} />
                </div>
              </div>
              <span className="sett-theme-label">{t.label}</span>
              {theme === t.id && <span className="sett-theme-check"><Icon name="check" size={10} /></span>}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Reading mode">
        <div className="sett-reading-grid">
          {READING_MODES.map(m => (
            <button
              key={m.id}
              className={`sett-reading-card${rm === m.id ? " active" : ""}`}
              data-mode={m.id}
              onClick={() => update({ appearance: { readingMode: m.id } })}
            >
              <div className="sett-reading-preview">
                <div className="rp-title" />
                {m.lines.map((w, i) => (
                  <div
                    key={i}
                    className="rp-line"
                    style={{ width: `${w}%`, marginBottom: m.gap }}
                  />
                ))}
              </div>
              <div className="sett-reading-label">
                <span>{m.label}</span>
                {rm === m.id && (
                  <span className="sett-reading-check">
                    <Icon name="check" size={9} />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

// ── Publishing Tab ────────────────────────────────────────────────────────────

function PublishingTab() {
  const { settings, update } = useSettings();
  const pub = settings.publishing;
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const rssHandle = user?.handle ?? "";
  const rssUrl    = rssHandle ? `grimoire.sysnode.in/api/user/${rssHandle}/rss.xml` : "—";

  function copyRss() {
    navigator.clipboard.writeText(`https://${rssUrl}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <Section title="Defaults">
        <SettRow label="Default post visibility" hint="Applied when you create a new post">
          <div className="sett-vis-pills">
            <button
              className={`sett-vis-pill${pub.defaultVisibility === "draft" ? " active" : ""}`}
              onClick={() => update({ publishing: { defaultVisibility: "draft" } })}
            >
              Draft
            </button>
            <button
              className={`sett-vis-pill${pub.defaultVisibility === "published" ? " active" : ""}`}
              onClick={() => update({ publishing: { defaultVisibility: "published" } })}
            >
              Published
            </button>
          </div>
        </SettRow>

        <div className="sett-field">
          <label className="sett-label">Default tags <span className="sett-label-soft">(comma-separated)</span></label>
          <input
            className="sett-input"
            value={pub.defaultTags}
            onChange={e => update({ publishing: { defaultTags: e.target.value } })}
            placeholder="writing, tech, personal…"
            maxLength={200}
          />
        </div>
      </Section>

      <Section title="RSS feed">
        <SettRow label="Enable RSS feed" hint="Let readers subscribe to your posts">
          <Toggle checked={pub.rssEnabled} onChange={v => update({ publishing: { rssEnabled: v } })} />
        </SettRow>
        {pub.rssEnabled && (
          <div className="sett-field" style={{ borderBottom: "none" }}>
            {rssHandle ? (
              <div className="sett-rss-info">
                <div className="sett-rss-info-text">
                  <Icon name="rss" size={13} />
                  <span>Your feed is live. Share the link so readers can subscribe in any RSS app.</span>
                </div>
                <button className={`sett-rss-copy${copied ? " copied" : ""}`} onClick={copyRss}>
                  <Icon name="link" size={12} />
                  {copied ? "Copied!" : "Copy feed URL"}
                </button>
              </div>
            ) : (
              <span className="sett-handle-hint">Set a handle in Profile to activate your RSS feed URL.</span>
            )}
          </div>
        )}
      </Section>

      <Section title="About the author">
        <div className="sett-field" style={{ borderBottom: "none" }}>
          <label className="sett-label">
            Blurb <span className="sett-label-soft">(appended to every published post)</span>
          </label>
          <textarea
            className="sett-input sett-textarea"
            value={pub.aboutAuthor}
            onChange={e => update({ publishing: { aboutAuthor: e.target.value } })}
            placeholder="A brief note about yourself that readers will see after every post…"
            rows={4}
            maxLength={600}
          />
          <span className="sett-char-count">{pub.aboutAuthor.length}/600</span>
        </div>
      </Section>
    </>
  );
}

// ── Privacy Tab ───────────────────────────────────────────────────────────────

function PrivacyTab() {
  const { settings, update } = useSettings();
  const priv = settings.privacy;

  return (
    <>
      <Section title="Visibility">
        <SettRow label="Hide profile from Explore" hint="Your posts won't appear in public discovery">
          <Toggle checked={priv.hideFromExplore} onChange={v => update({ privacy: { hideFromExplore: v } })} />
        </SettRow>
      </Section>

      <Section title="Comments">
        <SettRow label="Disable comments on all posts" hint="Turns off the discussion section site-wide">
          <Toggle checked={priv.disableComments} onChange={v => update({ privacy: { disableComments: v } })} />
        </SettRow>
        <SettRow label="Allow anonymous votes" hint="Let non-logged-in readers upvote or downvote comments">
          <Toggle checked={priv.allowAnonymousVotes} onChange={v => update({ privacy: { allowAnonymousVotes: v } })} />
        </SettRow>
      </Section>
    </>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
  const { settings, update } = useSettings();
  const notif = settings.notifications;

  return (
    <>
      <div className="sett-section">
        <div className="sett-section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Email notifications
          <span className="sett-notif-badge">Coming soon</span>
        </div>
        <div className="sett-card">
          <SettRow label="New comment on your post" hint="Get notified when someone comments">
            <Toggle checked={notif.onComment} onChange={v => update({ notifications: { onComment: v } })} />
          </SettRow>
          <SettRow label="Reply to your comment" hint="Get notified when someone replies to you">
            <Toggle checked={notif.onReply} onChange={v => update({ notifications: { onReply: v } })} />
          </SettRow>
          <SettRow label="Weekly stats digest" hint="A summary of your post views and likes every Monday">
            <Toggle checked={notif.weeklyDigest} onChange={v => update({ notifications: { weeklyDigest: v } })} />
          </SettRow>
        </div>
      </div>
      <div style={{ padding: "12px 2px", fontSize: 13, color: "var(--fg-soft)", lineHeight: 1.55 }}>
        Preferences are saved and will take effect once email delivery is wired up.
      </div>
    </>
  );
}

// ── Account Tab ───────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, refetch } = useAuth();

  // Password
  const [oldPw,   setOldPw]   = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,   setPwMsg]   = useState("");

  // Email
  const [newEmail,   setNewEmail]   = useState("");
  const [emailPw,    setEmailPw]    = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg,   setEmailMsg]   = useState("");

  // 2FA
  const [tfaPw,    setTfaPw]    = useState("");
  const [tfaSaving, setTfaSaving] = useState(false);
  const [tfaMsg,   setTfaMsg]   = useState("");
  const twoFactorEnabled = !!(user as any)?.two_factor_enabled;

  async function toggle2FA() {
    if (!tfaPw && user?.has_password) { setTfaMsg("Enter your password to confirm"); return; }
    setTfaSaving(true); setTfaMsg("");
    const endpoint = twoFactorEnabled ? "/api/auth/2fa/disable" : "/api/auth/2fa/enable";
    try {
      const r = await fetch(endpoint, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: tfaPw }),
      });
      const d = await r.json();
      if (r.ok) { setTfaMsg(twoFactorEnabled ? "Two-factor auth disabled" : "Two-factor auth enabled"); setTfaPw(""); refetch(); }
      else setTfaMsg(d.error ?? "Failed");
    } catch { setTfaMsg("Failed"); }
    finally { setTfaSaving(false); }
  }

  // Delete
  const [delConfirm, setDelConfirm] = useState("");
  const [delPw,      setDelPw]      = useState("");
  const [deleting,   setDeleting]   = useState(false);
  const [delMsg,     setDelMsg]     = useState("");

  async function changePassword() {
    if (!oldPw || newPw.length < 8) { setPwMsg("New password must be at least 8 characters"); return; }
    setPwSaving(true); setPwMsg("");
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      });
      const d = await r.json();
      setPwMsg(r.ok ? "Password updated" : (d.error ?? "Failed"));
      if (r.ok) { setOldPw(""); setNewPw(""); }
    } catch { setPwMsg("Failed"); }
    finally   { setPwSaving(false); }
  }

  async function changeEmail() {
    if (!newEmail || !newEmail.includes("@")) { setEmailMsg("Enter a valid email"); return; }
    setEmailSaving(true); setEmailMsg("");
    try {
      const r = await fetch("/api/auth/change-email", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_email: newEmail, password: emailPw }),
      });
      const d = await r.json();
      setEmailMsg(r.ok ? "Email updated" : (d.error ?? "Failed"));
      if (r.ok) { setNewEmail(""); setEmailPw(""); refetch(); }
    } catch { setEmailMsg("Failed"); }
    finally   { setEmailSaving(false); }
  }

  async function deleteAccount() {
    if (delConfirm.trim().toLowerCase() !== (user?.username ?? "").toLowerCase()) {
      setDelMsg("Username doesn't match"); return;
    }
    setDeleting(true); setDelMsg("");
    try {
      const r = await fetch("/api/auth/delete-account", {
        method: "DELETE", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: delConfirm, password: delPw }),
      });
      const d = await r.json();
      if (r.ok) window.location.href = "/";
      else setDelMsg(d.error ?? "Failed");
    } catch { setDelMsg("Failed"); }
    finally   { setDeleting(false); }
  }

  return (
    <>
      <div className={user?.has_password ? "sett-account-grid" : ""}>
        {/* Email */}
        <Section title="Email address">
          <div className="sett-field">
            <label className="sett-label">Current email</label>
            <input className="sett-input" value={user?.email ?? ""} readOnly style={{ opacity: 0.6 }} />
          </div>
          <div className="sett-field">
            <label className="sett-label">New email</label>
            <input
              type="email" className="sett-input"
              value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="new@email.com"
            />
          </div>
          {user?.has_password && (
            <div className="sett-field">
              <label className="sett-label">Current password <span className="sett-label-soft">(to confirm)</span></label>
              <PasswordInput className="sett-input"
                value={emailPw} onChange={e => setEmailPw(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          )}
          <div className="sett-save-row">
            <SaveMsg msg={emailMsg} />
            <button className="btn btn-primary btn-sm" onClick={changeEmail} disabled={emailSaving}>
              {emailSaving ? "Updating…" : "Update email"}
            </button>
          </div>
        </Section>

        {/* Password — only for non-OAuth accounts */}
        {user?.has_password && (
          <Section title="Change password">
            <div className="sett-field">
              <label className="sett-label">Current password</label>
              <PasswordInput className="sett-input" value={oldPw} onChange={e => setOldPw(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="sett-field">
              <label className="sett-label">New password <span className="sett-label-soft">(min 8 chars)</span></label>
              <PasswordInput className="sett-input" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="sett-save-row">
              <SaveMsg msg={pwMsg} />
              <button className="btn btn-primary btn-sm" onClick={changePassword} disabled={pwSaving}>
                {pwSaving ? "Saving…" : "Update password"}
              </button>
            </div>
          </Section>
        )}
      </div>

      {/* Two-factor authentication */}
      <Section title="Two-factor authentication">
        <div className="sett-tfa-row">
          <div className="sett-tfa-info">
            <div className="sett-tfa-status">
              <span className={`sett-tfa-badge${twoFactorEnabled ? " on" : ""}`}>
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="sett-label-soft" style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.5 }}>
              {twoFactorEnabled
                ? "A verification code will be emailed to you each time you sign in."
                : "Add an extra layer of security. A code will be emailed to you on each sign-in."}
            </p>
          </div>
        </div>
        {user?.has_password ? (
          <div className="sett-field">
            <label className="sett-label">
              {twoFactorEnabled ? "Enter password to disable" : "Enter password to enable"}
            </label>
            <PasswordInput className="sett-input" value={tfaPw} onChange={e => setTfaPw(e.target.value)} autoComplete="current-password" />
          </div>
        ) : (
          <p className="sett-label-soft" style={{ fontSize: 12, margin: "4px 0 0" }}>
            No password confirmation needed — your identity is verified by Google.
          </p>
        )}
        <div className="sett-save-row">
          <SaveMsg msg={tfaMsg} />
          <button
            className={`btn btn-sm ${twoFactorEnabled ? "btn-ghost" : "btn-primary"}`}
            onClick={toggle2FA}
            disabled={tfaSaving}
          >
            {tfaSaving ? "Saving…" : twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        </div>
      </Section>

      {/* Danger zone */}
      <div className="sett-section">
        <div className="sett-section-title">Danger zone</div>
        <div className="sett-danger">
          <div className="sett-danger-head">
            <Icon name="trash" size={16} />
            <div>
              <div className="sett-danger-title">Delete account</div>
              <div className="sett-danger-desc">
                Permanently deletes your account, all posts, comments, and data. This cannot be undone.
              </div>
            </div>
          </div>
          <div className="sett-danger-body">
            <div className="sett-field" style={{ padding: 0, borderBottom: "none" }}>
              <label className="sett-label">
                Type <strong style={{ color: "var(--fg)" }}>{user?.username}</strong> to confirm
              </label>
              <input
                className="sett-input"
                value={delConfirm}
                onChange={e => setDelConfirm(e.target.value)}
                placeholder={user?.username}
                autoComplete="off"
              />
            </div>
            {user?.has_password && (
              <div className="sett-field" style={{ padding: 0, borderBottom: "none" }}>
                <label className="sett-label">Password</label>
                <PasswordInput className="sett-input"
                  value={delPw} onChange={e => setDelPw(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            )}
            {delMsg && <span className="sett-msg err">{delMsg}</span>}
            <button
              className="sett-danger-btn"
              onClick={deleteAccount}
              disabled={deleting || delConfirm.trim().toLowerCase() !== (user?.username ?? "").toLowerCase()}
            >
              {deleting ? "Deleting…" : "Permanently delete my account"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function SettingsShell() {
  const [tab, setTab] = useState<Tab>("profile");
  const { user } = useAuth();

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

          <div className="sett-content">
            {tab === "profile"       && <ProfileTab />}
            {tab === "social"        && <SocialLinksTab />}
            {tab === "editor"        && <EditorTab />}
            {tab === "appearance"    && <AppearanceTab />}
            {tab === "publishing"    && <PublishingTab />}
            {tab === "privacy"       && <PrivacyTab />}
            {tab === "notifications" && <NotificationsTab />}
            {tab === "account"       && <AccountTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
