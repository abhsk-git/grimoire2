"use client";

import { useState } from "react";
import { Icon } from "./icons";

const FEATURED_POSTS = [
  {
    author: "Maya Chen",
    initials: "MC",
    avBg: "#b46a2a,#f4b860",
    title: "Notes on plaintext, again — why I keep coming back to .md files",
    excerpt:
      '"Plaintext is the only format that outlives its app. Every other \'permanent\' is a slow trap that you don\'t notice until the trap closes."',
    cover: "linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)",
    stats: "247 reads · 28 likes · 4 min · May 14",
    tag: "Featured",
    pillBg: "rgba(255,255,255,0.18)",
  },
  {
    author: "Iván Reyes",
    initials: "IR",
    avBg: "#5563d0,#8e8df0",
    title: "Specimen of the week: Bricolage Grotesque",
    excerpt:
      '"A typeface is an argument about how to look. This one argues for the kind of paying attention I want to do more of."',
    cover: "linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)",
    stats: "1.1k reads · 84 likes · 6 min · May 12",
    tag: "Editor's pick",
    pillBg: "rgba(0,0,0,0.25)",
  },
];

const TOP_WRITERS = [
  { initials: "MC", name: "Maya Chen", handle: "@maya", posts: 42, followers: "2.3k", bg: "linear-gradient(135deg,#b46a2a,#f4b860)" },
  { initials: "IR", name: "Iván Reyes", handle: "@ivan", posts: 28, followers: "1.1k", bg: "linear-gradient(135deg,#5563d0,#8e8df0)" },
  { initials: "AR", name: "Dr. Anand Rao", handle: "@arao", posts: 31, followers: "4.8k", bg: "linear-gradient(135deg,#14613a,#6abf85)" },
  { initials: "SK", name: "Sana Khoury", handle: "@sana", posts: 19, followers: "780", bg: "linear-gradient(135deg,#d04f63,#f08197)" },
  { initials: "TJ", name: "Tomas Järvinen", handle: "@tomas", posts: 17, followers: "612", bg: "linear-gradient(135deg,#2f7d4d,#a8e0bd)" },
  { initials: "AB", name: "abhishek", handle: "@sysnode", posts: 12, followers: "94", bg: "linear-gradient(135deg,#5b54d6,#8e8df0)" },
];

const FRESH_POSTS = [
  { author: "Iván Reyes", initials: "IR", avBg: "linear-gradient(135deg,#5563d0,#8e8df0)", title: "On reading widely — and not regretting it", when: "2h ago", read: "5 min", likes: 12, cover: "linear-gradient(135deg,#14613a,#2f7d4d 60%,#6abf85)" },
  { author: "Dr. Anand Rao", initials: "AR", avBg: "linear-gradient(135deg,#14613a,#6abf85)", title: "How I read a paper, slowly", when: "1 day", read: "8 min", likes: 47, cover: "linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)" },
  { author: "Sana Khoury", initials: "SK", avBg: "linear-gradient(135deg,#d04f63,#f08197)", title: "The small literature of late-night thoughts", when: "2 days", read: "3 min", likes: 28, cover: "linear-gradient(135deg,#d04f63,#f08197 60%,#f4b860)" },
  { author: "abhishek", initials: "AB", avBg: "linear-gradient(135deg,#5b54d6,#8e8df0)", title: "A small theory of bookmarks", when: "3 days", read: "4 min", likes: 14, cover: "linear-gradient(135deg,#5b54d6,#8e8df0 60%,#b486f0)" },
  { author: "Tomas Järvinen", initials: "TJ", avBg: "linear-gradient(135deg,#2f7d4d,#a8e0bd)", title: "Notes from a sabbatical — what I gave up", when: "5 days", read: "7 min", likes: 92, cover: "linear-gradient(135deg,#2f7d4d,#6abf85 60%,#a8e0bd)" },
  { author: "Maya Chen", initials: "MC", avBg: "linear-gradient(135deg,#b46a2a,#f4b860)", title: "Why I still keep a commonplace book", when: "1 week", read: "5 min", likes: 412, cover: "linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)" },
];

const STORY_TOPICS = [
  { t: "essays", n: 42 }, { t: "writing", n: 38 }, { t: "typography", n: 24 },
  { t: "reading", n: 21 }, { t: "plaintext", n: 18 }, { t: "attention", n: 15 },
  { t: "design", n: 14 }, { t: "memoir", n: 12 }, { t: "craft", n: 11 },
  { t: "tools", n: 9 }, { t: "commonplace", n: 8 }, { t: "note-taking", n: 7 },
];

type Tab = "stories" | "writers" | "references";

export function ExploreView() {
  const [tab, setTab] = useState<Tab>("stories");

  return (
    <div>
      <div className="explore-hero">
        <span className="eyebrow">
          <Icon name="feather" size={11} /> The reading room
        </span>
        <h1>
          Open the <span className="serif">Grimoire</span>.
        </h1>
        <p>Read what the curious are writing · then close the tab.</p>

        <div className="explore-tabs">
          <button
            className={tab === "stories" ? "active" : ""}
            onClick={() => setTab("stories")}
          >
            <Icon name="feather" size={14} />
            <div style={{ textAlign: "left" }}>
              <div>Stories</div>
              <div className="sub">Essays &amp; posts</div>
            </div>
          </button>
          <button
            className={tab === "writers" ? "active" : ""}
            onClick={() => setTab("writers")}
          >
            <Icon name="users" size={14} />
            <div style={{ textAlign: "left" }}>
              <div>Writers</div>
              <div className="sub">People to follow</div>
            </div>
          </button>
          <button
            className={tab === "references" ? "active" : ""}
            onClick={() => setTab("references")}
          >
            <Icon name="bookmark" size={14} />
            <div style={{ textAlign: "left" }}>
              <div>References</div>
              <div className="sub">Public links</div>
            </div>
          </button>
        </div>
      </div>

      {tab !== "references" && (
        <div className="explore-section">
          <h2>Featured this week</h2>
          <div className="featured-grid">
            {FEATURED_POSTS.map((p, i) => (
              <article key={i} className="feature-post">
                <div className="cover" style={{ background: p.cover }}>
                  <span className="pill" style={{ background: p.pillBg }}>
                    {p.tag}
                  </span>
                  <h3>{p.title}</h3>
                </div>
                <div className="info">
                  <div className="by">
                    <div
                      className="avatar"
                      style={{
                        background: `linear-gradient(135deg,${p.avBg})`,
                        borderWidth: 0,
                      }}
                    >
                      {p.initials}
                    </div>
                    <div>
                      <div className="name">{p.author}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>
                      + Follow
                    </button>
                  </div>
                  <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16 }}>
                    {p.excerpt}
                  </p>
                  <div className="stats">{p.stats}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "stories" && (
        <>
          <div className="explore-section">
            <h2>Fresh today</h2>
            <div className="cards">
              {FRESH_POSTS.map((p, i) => (
                <article key={i} className="post-card">
                  <div className="post-cover" style={{ background: p.cover }}></div>
                  <div className="post-body">
                    <div className="post-by">
                      <div
                        className="avatar"
                        style={{ width: 22, height: 22, fontSize: 10, borderWidth: 0, background: p.avBg }}
                      >
                        {p.initials}
                      </div>
                      <span style={{ fontWeight: 600 }}>{p.author}</span>
                      <span>·</span>
                      <span>{p.when}</span>
                    </div>
                    <h3 className="post-title">{p.title}</h3>
                    <div className="post-meta">
                      <span>
                        <Icon name="bookmark" size={11} /> {p.read}
                      </span>
                      <span>
                        <Icon name="star" size={11} /> {p.likes}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="explore-section">
            <h2>Topics</h2>
            <div className="tag-cloud">
              {STORY_TOPICS.map((t) => (
                <span key={t.t} className="tag">
                  <Icon name="feather" size={11} /> {t.t}{" "}
                  <span className="n">{t.n}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "writers" && (
        <div className="explore-section">
          <h2>Most-read writers this week</h2>
          <div className="writers-grid">
            {TOP_WRITERS.map((w, i) => (
              <div key={i} className="writer-card">
                <div className="rank">#{i + 1}</div>
                <div
                  className="avatar"
                  style={{ width: 48, height: 48, fontSize: 17, borderWidth: 0, background: w.bg }}
                >
                  {w.initials}
                </div>
                <div className="info">
                  <div className="name">{w.name}</div>
                  <div className="handle">{w.handle}</div>
                  <div className="counts">
                    <span>
                      <b style={{ color: "var(--fg)" }}>{w.posts}</b> posts
                    </span>
                    <span>·</span>
                    <span>
                      <b style={{ color: "var(--fg)" }}>{w.followers}</b> readers
                    </span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm">+ Follow</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "references" && (
        <div className="explore-section">
          <h2>Topics</h2>
          <div className="tag-cloud">
            {STORY_TOPICS.map((t) => (
              <span key={t.t} className="tag">
                #{t.t} <span className="n">{t.n}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
