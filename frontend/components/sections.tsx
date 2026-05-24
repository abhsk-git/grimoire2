"use client";

import { Icon, BrandMark } from "./icons";
import { useTheme } from "@/lib/theme";

const PUBLIC_GRIMOIRES = [
  {
    title: "Field Notes from the Internet",
    author: "Maya Chen",
    initials: "MC",
    desc: "Weekly essays on attention, software, and the craft of paying attention.",
    items: 42,
    followers: "2.3k",
    cover: "linear-gradient(135deg, #b46a2a, #f4b860 60%, #d97757)",
  },
  {
    title: "Studies in Typography",
    author: "Iván Reyes",
    initials: "IR",
    desc: "Long-form posts about the shape of letters, and the people who shaped them.",
    items: 28,
    followers: "1.1k",
    cover: "linear-gradient(135deg, #1b3a6b, #5563d0 60%, #8e8df0)",
  },
  {
    title: "How to Read a Paper",
    author: "Dr. Anand Rao",
    initials: "AR",
    desc: "Essays on academic reading, with annotated reading lists at the bottom of each one.",
    items: 31,
    followers: "4.8k",
    cover: "linear-gradient(135deg, #14613a, #2f7d4d 60%, #6abf85)",
  },
];

export function HowItWorks() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">
            <Icon name="feather" size={11} /> The flow
          </span>
          <h2>
            Three motions. <span className="serif">Endless</span> use.
          </h2>
          <p>
            From the first paragraph to the moment a stranger reads your essay
            — Grimoire stays out of your way.
          </p>
        </div>

        <div className="steps">
          <div className="step">
            <div className="num">01 · WRITE</div>
            <h3>Open a page, start typing.</h3>
            <p>
              Markdown shortcuts, slash commands, focus mode. The chrome
              disappears so the words can show up.
            </p>
            <div className="step-visual">
              <div className="editor-mock">
                <div className="h">A small theory of bookmarks</div>
                <div style={{ color: "var(--fg-soft)", fontSize: 10, marginBottom: 6 }}>
                  by maya · draft
                </div>
                <div>
                  A bookmark is a{" "}
                  <span style={{ color: "var(--fg)" }}>promise</span> to your future
                </div>
                <div>self — to come back, to think again, to take</div>
                <div>
                  seriously what passed for fleeting
                  <span className="cursor"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="num">02 · REFERENCE</div>
            <h3>Pull in the things you read.</h3>
            <p>
              Save the link, drop a quote into the post, keep the source
              attached. Your essays cite themselves.
            </p>
            <div className="step-visual">
              <div className="urlbar">
                <span className="pulse"></span>
                <span style={{ color: "var(--fg)" }}>annie.substack.com</span>
              </div>
              <div className="preview-card">
                <div className="img"></div>
                <div className="lines">
                  <div className="l1"></div>
                  <div className="l2"></div>
                  <div className="l3"></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  Insert quote
                </span>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  Save reference
                </span>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="num">03 · PUBLISH</div>
            <h3>Ship to your own page.</h3>
            <p>
              A clean reader page at your-name.grimoire.so. Or your own domain.
              RSS for free, no algorithm in between.
            </p>
            <div className="step-visual">
              <div className="urlbar" style={{ borderColor: "var(--accent)" }}>
                <Icon name="globe" size={11} />
                <span style={{ color: "var(--fg)" }}>maya.grimoire.so/plaintext</span>
              </div>
              <div className="folders">
                <div className="folder">
                  <span className="swatch" style={{ background: "var(--accent)" }}></span>
                  Published · 8
                </div>
                <div className="folder">
                  <span className="swatch" style={{ background: "var(--accent-2)" }}></span>
                  Drafts · 4
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: "auto", flexWrap: "wrap" }}>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  <Icon name="rss" size={9} /> RSS
                </span>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  .md export
                </span>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  Custom domain
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">
            <Icon name="feather" size={11} /> Built for the long thinker
          </span>
          <h2>
            A writing tool that <span className="serif">remembers</span> what
            you've read.
          </h2>
          <p>
            Posts that cite themselves. References that outlive the link. An
            archive of your thinking, kept in plain text.
          </p>
        </div>

        <div className="features">
          <div className="feat wide">
            <div className="ico">
              <Icon name="feather" size={18} />
            </div>
            <h3>A real writing tool, not a textarea</h3>
            <p>
              Markdown, slash commands, inline link previews, and a focus mode
              that hides everything else. Drafts auto-save by the keystroke.
              Publish to a clean reader page at your-name.grimoire.so or your
              own domain.
            </p>
            <div className="feat-visual" style={{ padding: 14 }}>
              <div className="editor-mock" style={{ background: "var(--bg-elev)" }}>
                <div className="h">Notes on plaintext, again</div>
                <div style={{ color: "var(--fg-soft)", fontSize: 10, marginBottom: 4 }}>
                  by maya · 4 min read · auto-saved 2s ago
                </div>
                <div>## Why I keep coming back</div>
                <div>Plaintext is the only format that outlives</div>
                <div>its app. Every other "permanent" is a slow</div>
                <div>
                  trap that you don't notice until the trap
                  <span className="cursor"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="feat col">
            <div className="ico">
              <Icon name="globe" size={18} />
            </div>
            <h3>A page of your own</h3>
            <p>
              Every published post lives at your handle. Clean typography, no
              ads, no algorithm.
            </p>
            <div className="feat-visual">
              <div
                className="urlbar"
                style={{ borderColor: "var(--accent)", marginBottom: 8 }}
              >
                <Icon name="globe" size={11} />
                <span style={{ color: "var(--fg)" }}>maya.grimoire.so</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                {["Notes on plaintext, again", "The shape of letters", "Field Notes #14"].map(
                  (t, i) => (
                    <div
                      key={t}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "var(--bg-elev)",
                        border: "1px solid var(--border)",
                        color: i === 0 ? "var(--fg)" : "var(--fg-muted)",
                      }}
                    >
                      {t}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="feat third">
            <div className="ico">
              <Icon name="bookmark" size={18} />
            </div>
            <h3>References that outlive the link</h3>
            <p>
              Quote a source mid-essay, keep a clean reader copy so it survives
              link rot. Sidebar tucks them away.
            </p>
            <div className="feat-visual" style={{ padding: 12 }}>
              <div
                style={{
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid var(--accent)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                }}
              >
                <div style={{ fontStyle: "italic", color: "var(--fg)" }}>
                  "The point of reading is not to finish the book."
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 6,
                    fontSize: 10,
                    color: "var(--fg-soft)",
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: "#ff6719",
                      color: "white",
                      fontSize: 7,
                      fontWeight: 800,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    SS
                  </span>
                  Annie Mueller
                </div>
              </div>
            </div>
          </div>

          <div className="feat third">
            <div className="ico">
              <Icon name="search" size={18} />
            </div>
            <h3>Search across everything you wrote and read</h3>
            <p>
              Your drafts, your published posts, your saved articles, your
              highlights — one keystroke.
            </p>
            <div className="feat-visual" style={{ padding: 10 }}>
              <div className="search-mock">
                <div className="bar">
                  <Icon name="search" size={12} />
                  <span className="typed">
                    <b>plaintext</b>
                  </span>
                  <span className="kbd" style={{ marginLeft: "auto" }}>
                    ⌘K
                  </span>
                </div>
                <div className="results">
                  <div className="r">
                    <Icon name="feather" size={11} />
                    <span>
                      <mark>Plaintext</mark>, again — your post
                    </span>
                    <span className="k">draft</span>
                  </div>
                  <div className="r">
                    <Icon name="bookmark" size={11} />
                    <span>The .md format will outlive…</span>
                    <span className="k">saved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="feat third">
            <div className="ico">
              <Icon name="users" size={18} />
            </div>
            <h3>Public, private, or unlisted</h3>
            <p>
              Drafts are private until you publish. Each post is public,
              link-only, or kept entirely to yourself.
            </p>
            <div className="feat-visual">
              <div className="share-mock">
                {[
                  { ico: "globe", who: "Notes on plaintext, again", perm: "Public" },
                  { ico: "link", who: "A small theory of bookmarks", perm: "Unlisted" },
                  { ico: "lock", who: "Untitled draft", perm: "Private" },
                ].map((r) => (
                  <div key={r.who} className="row">
                    <Icon name={r.ico} size={13} />
                    <span className="who">{r.who}</span>
                    <span className="perm">{r.perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="feat half">
            <div className="ico">
              <Icon name="rss" size={18} />
            </div>
            <h3>Open by default</h3>
            <p>
              RSS in, RSS out. Markdown export. Custom domain on Pro. An API and
              webhooks. Your writing should outlive any one app — ours included.
            </p>
            <div
              className="feat-visual"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                padding: 24,
                flexWrap: "wrap",
              }}
            >
              <span className="chip" style={{ padding: "8px 14px" }}>
                <Icon name="rss" size={13} /> RSS feed
              </span>
              <span className="chip" style={{ padding: "8px 14px" }}>
                .md export
              </span>
              <span className="chip" style={{ padding: "8px 14px" }}>
                <Icon name="globe" size={13} /> Custom domain
              </span>
              <span className="chip" style={{ padding: "8px 14px" }}>
                <Icon name="cmd" size={13} /> REST + Webhooks
              </span>
            </div>
          </div>

          <div className="feat half">
            <div className="ico">
              <Icon name="sparkles" size={18} />
            </div>
            <h3>Quietly intelligent</h3>
            <p>
              Optional AI: when you're writing, "find related from your archive"
              pulls three of your own saves that fit. Auto-tagging on saves.
              Always opt-in, never the loudest voice in the room.
            </p>
            <div className="feat-visual" style={{ padding: 14 }}>
              <div className="search-mock">
                <div
                  className="r"
                  style={{
                    background: "var(--accent-soft)",
                    borderColor:
                      "color-mix(in oklab, var(--accent) 30%, transparent)",
                  }}
                >
                  <Icon name="sparkles" size={12} />
                  <span>3 of your saves match this paragraph</span>
                  <span className="k">⌘ ↵</span>
                </div>
                <div className="r">
                  <Icon name="bookmark" size={12} />
                  <span>Annie Mueller — Reading like an artist</span>
                  <span className="k">essay</span>
                </div>
                <div className="r">
                  <Icon name="bookmark" size={12} />
                  <span>Paul Graham — The age of the essay</span>
                  <span className="k">writing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Discover() {
  return (
    <section className="section" id="discover" style={{ paddingTop: 20 }}>
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">
            <Icon name="feather" size={11} /> The reading room
          </span>
          <h2>
            Read what the <span className="serif">curious</span> are writing.
          </h2>
          <p>
            Follow other people's grimoires. Subscribe to writers. Watch a
            thought become a public archive.
          </p>
        </div>

        <div className="discover-grid">
          {PUBLIC_GRIMOIRES.map((p) => (
            <a href="/explore" key={p.title} className="public-card">
              <div className="cover" style={{ background: p.cover }}>
                <h3>{p.title}</h3>
              </div>
              <div className="body">
                <p className="desc">{p.desc}</p>
                <div className="meta">
                  <div className="au">
                    <div className="av">{p.initials}</div>
                    <span>{p.author}</span>
                  </div>
                  <span>·</span>
                  <span>{p.items} posts</span>
                  <span>·</span>
                  <span>{p.followers} readers</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTAStrip({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <section className="container">
      <div className="cta">
        <div>
          <h2>
            Start writing your <span className="serif">Grimoire</span>.
          </h2>
          <p>
            Free forever for personal use. No credit card. Your first post can
            be a single sentence — most are.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={onSignIn}>
            Open the editor <Icon name="arrow-right" size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

const SOCIAL_LINKS = [
  {
    name: "X / Twitter", href: "#", bg: "#000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.836L2.25 2.25h6.917l4.254 5.622 4.823-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Discord", href: "#", bg: "#5865F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    ),
  },
  {
    name: "Reddit", href: "#", bg: "#FF4500",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
  },
  {
    name: "Instagram", href: "#",
    bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    name: "Patreon", href: "#", bg: "#FF424D",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.074 1.044 7.038 1.044 11.03c0 3.779.904 12.97 6.399 12.97 4.026 0 4.617-5.11 6.452-7.598 1.297-1.73 2.968-2.208 4.963-2.7 2.655-.675 4.108-2.869 4.099-6.492z" />
      </svg>
    ),
  },
];

const SOCIAL_STAGGER = [0, 8, 0, 8, 0];

export function Footer() {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: "light" as const,
      bg: "linear-gradient(135deg,#f6f6f1 50%,#5b54d6 50%)",
    },
    {
      id: "dark" as const,
      bg: "linear-gradient(135deg,#0c0f14 50%,#3ee07a 50%)",
    },
    {
      id: "geek" as const,
      bg: "linear-gradient(135deg,#f3f4ed 50%,#2da14e 50%)",
    },
    {
      id: "midnight" as const,
      bg: "linear-gradient(135deg,#061114 50%,#36e0c4 50%)",
    },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="foot-grid">
          <div>
            <div className="brand" style={{ marginBottom: 8 }}>
              <span className="brand-mark">
                <BrandMark size={26} />
              </span>
              <span>Grimoire</span>
            </div>
            <p className="foot-tagline">
              Save links. Write stories. Build the archive your future self will
              want to inherit.
            </p>
            <div className="foot-socials">
              {SOCIAL_LINKS.map((s, i) => (
                <a
                  key={s.name}
                  href={s.href}
                  title={s.name}
                  className="foot-social-link"
                  style={{
                    background: s.bg,
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="foot-col">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#features">Web clipper</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#changelog">Changelog</a>
              </li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Community</h4>
            <ul>
              <li>
                <a href="/explore">Discover</a>
              </li>
              <li>
                <a href="/explore">Public grimoires</a>
              </li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Privacy</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© 2026 Grimoire — made for readers who keep notes.</span>
          <div className="theme-row" aria-label="Theme">
            {themes.map((p) => (
              <button
                key={p.id}
                className={"theme-pip" + (theme === p.id ? " active" : "")}
                style={{ background: p.bg }}
                onClick={() => setTheme(p.id)}
                aria-label={p.id}
                title={p.id}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Compact footer for inner pages (explore, blog, user) ─────────────────────
export function PublicFooter({
  links = [
    { label: "About", href: "/#features" },
    { label: "Explore", href: "/explore" },
  ],
}: {
  links?: { label: string; href: string }[];
}) {
  return (
    <footer className="pub-foot">
      <div className="pub-foot-inner">
        <div className="pub-foot-brand">
          <span style={{ color: "var(--accent)", display: "flex" }}>
            <BrandMark size={18} />
          </span>
          <span>Grimoire</span>
        </div>

        <div className="pub-foot-socials">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.href}
              title={s.name}
              className="pub-foot-social"
              style={{ background: s.bg }}
            >
              {s.icon}
            </a>
          ))}
        </div>

        <div className="pub-foot-links">
          {links.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
          <span className="pub-foot-copy">© 2026</span>
        </div>
      </div>
    </footer>
  );
}
