import { Icon } from "./icons";

interface HeroLoggedOutProps {
  onSignIn?: () => void;
}

export function HeroLoggedOut({ onSignIn }: HeroLoggedOutProps) {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <span className="eyebrow">
            <Icon name="sparkles" size={11} />
            Your personal Grimoire
          </span>
          <h1>
            Where ideas <span className="serif">become</span>
            <br />
            <span className="accent">essays.</span>
          </h1>
          <p className="lede">
            Grimoire is a quiet writing tool with a memory.{" "}
            <em>Publish posts</em> at your own URL, keep the links and notes
            that fed each piece, and watch your thinking compound over years.
          </p>

          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={onSignIn}>
              Start writing
              <Icon name="arrow-right" size={15} />
            </button>
            <a href="/explore" className="btn btn-ghost btn-lg">
              <Icon name="globe" size={14} />
              Read the public archive
            </a>
          </div>

        </div>

        <div className="showcase">
          <PostShowcase />
          <BookmarksFloat />
          <DraftsFloat />
        </div>
      </div>

      <div
        className="container"
        style={{
          marginTop: 56,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span className="chip">
          <Icon name="feather" size={12} /> Distraction-free editor
        </span>
        <span className="chip">
          <Icon name="globe" size={12} /> Your own at-URL
        </span>
        <span className="chip">
          <Icon name="rss" size={12} /> Markdown · RSS · custom domain
        </span>
        <span className="chip">
          <Icon name="bookmark" size={12} /> Linked references
        </span>
        <span className="chip">
          <Icon name="search" size={12} /> Full-text search
        </span>
        <span className="chip">
          <Icon name="sparkles" size={12} /> Optional, quiet AI
        </span>
      </div>
    </section>
  );
}

function PostShowcase() {
  return (
    <div className="book">
      <div className="book-content">
        <div className="book-topbar">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span style={{ width: 12 }}></span>
          <span className="tab active">
            <Icon name="feather" size={11} />
            grimoire.so/maya/plaintext
          </span>
          <span className="spacer"></span>
          <span className="chip" style={{ padding: "2px 8px", fontSize: 11 }}>
            <Icon name="globe" size={10} /> Public
          </span>
        </div>
        <div style={{ padding: "24px 36px", overflow: "hidden", flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--fg-soft)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Essay · 4 min read
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 30,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              margin: "0 0 14px",
              fontWeight: 700,
            }}
          >
            Notes on plaintext,{" "}
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--accent)",
              }}
            >
              again
            </span>
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 14,
              marginBottom: 14,
              borderBottom: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--fg-soft)",
            }}
          >
            <div
              className="avatar"
              style={{
                width: 24,
                height: 24,
                fontSize: 10,
                borderWidth: 0,
                background: "linear-gradient(135deg,#b46a2a,#f4b860)",
              }}
            >
              MC
            </div>
            <span>
              <b style={{ color: "var(--fg)" }}>Maya Chen</b>
            </span>
            <span>·</span>
            <span>May 14</span>
            <span>·</span>
            <span>412 reads</span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--fg)",
              display: "-webkit-box",
              WebkitLineClamp: 7,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <p style={{ margin: "0 0 0.8em" }}>
              Plaintext is the only format that outlives its app. Every other
              "permanent" is a slow trap that you don't notice until the trap
              closes.
            </p>
            <p style={{ margin: "0 0 0.8em" }}>
              I keep coming back to .md files because they ask nothing of me. No
              subscription. No login. No "we're sunsetting." Just text —
              searchable, diff-able, portable through three operating systems and
              twelve laptops.
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            <span className="lc-tag">
              <span className="h">#</span>essay
            </span>
            <span className="lc-tag">
              <span className="h">#</span>writing
            </span>
            <span className="lc-tag">
              <span className="h">#</span>plaintext
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookmarksFloat() {
  return (
    <div className="float-card note" style={{ width: 240 }}>
      <div className="head">
        <span className="dot"></span>
        <span>References · this essay</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { bg: "#ff6719", label: "SS", title: "On reading like an artist" },
          { bg: "#171717", label: "GH", title: "obsidian/obsidian-md" },
          { bg: "#f0652f", label: "YC", title: "Paul Graham — The age of the essay" },
        ].map((r) => (
          <div
            key={r.label}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: r.bg,
                color: "white",
                fontSize: 9,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {r.title}
            </span>
          </div>
        ))}
      </div>
      <div className="foot">
        <Icon name="bookmark" size={11} />
        <span>3 of 247 saves</span>
      </div>
    </div>
  );
}

function DraftsFloat() {
  return (
    <div className="float-card editor">
      <div className="head">
        <span className="dot"></span>
        <span>In the drafts folder</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
            A small theory of bookmarks
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-soft)", marginTop: 2 }}>
            740 words · edited today
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--fg-muted)",
            }}
          >
            Untitled draft
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-soft)", marginTop: 2 }}>
            just now
          </div>
        </div>
      </div>
      <div className="foot">
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          <Icon name="pen" size={11} /> Continue writing
        </span>
      </div>
    </div>
  );
}
