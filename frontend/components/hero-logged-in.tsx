import { Icon } from "./icons";

interface HeroLoggedInProps {
  username?: string;
  displayName?: string;
}

export function HeroLoggedIn({ username, displayName }: HeroLoggedInProps) {
  const name = displayName || username || "there";
  const greeting = getGreeting();

  return (
    <section className="hero logged-in">
      <div className="container">
        <div className="hello-row">
          <div>
            <span className="eyebrow">
              <Icon name="feather" size={11} /> {greeting}
            </span>
            <h1 style={{ marginTop: 14 }}>
              Welcome back,{" "}
              <span style={{ color: "var(--accent)" }}>
                {name}
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>.</span>
              </span>
            </h1>
            <p className="meta" style={{ marginTop: 6 }}>
              Your writing space is ready.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/explore" className="btn btn-ghost btn-sm">
              <Icon name="globe" size={13} /> Explore
            </a>
            <a href="/write" className="btn btn-primary btn-sm">
              <Icon name="pen" size={13} /> New post
            </a>
          </div>
        </div>

        <div className="quick-grid">
          <QuickCard
            ico="pen"
            title="Continue draft"
            desc="Pick up where you left off"
            k="⌘ ⏎"
            href="/write"
          />
          <QuickCard
            ico="feather"
            title="Start a new post"
            desc="Empty page, no distractions"
            k="⌘ N"
            href="/write"
          />
          <QuickCard
            ico="bookmark"
            title="Save a reference"
            desc="Paste a URL · for your next post"
            k="⌘ S"
            href="/dashboard"
          />
          <QuickCard
            ico="search"
            title="Search everything"
            desc="Drafts, posts, saves & highlights"
            k="⌘ K"
            href="/dashboard"
          />
        </div>

        <div className="logged-grid">
          <div>
            <div className="section-h">
              <h2>Your writing</h2>
              <a href="/dashboard?tab=posts">All posts →</a>
            </div>
            <PostsCard />
          </div>

          <div>
            <div className="section-h">
              <h2>For your next essay</h2>
              <a href="/dashboard">All saves →</a>
            </div>
            <SavesCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickCard({
  ico,
  title,
  desc,
  k,
  href,
}: {
  ico: string;
  title: string;
  desc: string;
  k: string;
  href: string;
}) {
  return (
    <a href={href} className="quick-card" style={{ textDecoration: "none" }}>
      <div className="ico">
        <Icon name={ico} size={16} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div className="shortcut">
        <span className="kbd">{k}</span>
      </div>
    </a>
  );
}

function PostsCard() {
  return (
    <div className="posts-card">
      <div className="posts-row">
        <span className="pill live">Live</span>
        <div className="text">
          <div className="t">Notes on plaintext, again</div>
          <div className="m">Published · 412 reads · 4 min</div>
        </div>
        <Icon name="chevron-right" size={15} />
      </div>
      <div className="posts-row">
        <span className="pill draft">Draft</span>
        <div className="text">
          <div className="t">A small theory of bookmarks</div>
          <div className="m">740 words · edited yesterday</div>
        </div>
        <Icon name="chevron-right" size={15} />
      </div>
      <div className="posts-row">
        <span className="pill draft">Draft</span>
        <div className="text">
          <div className="t">Untitled draft</div>
          <div className="m">Started this morning</div>
        </div>
        <Icon name="chevron-right" size={15} />
      </div>
      <a
        href="/write"
        className="btn btn-ghost btn-sm"
        style={{ marginTop: 14, width: "100%", textDecoration: "none" }}
      >
        <Icon name="plus" size={13} /> Start a new post
      </a>
    </div>
  );
}

function SavesCard() {
  const saves = [
    { bg: "#ff6719", label: "SS", title: "Reading like an artist", domain: "annie.substack.com", when: "2h ago" },
    { bg: "#171717", label: "GH", title: "obsidian-md / obsidian-publish", domain: "github.com", when: "yesterday" },
    { bg: "#f0652f", label: "YC", title: "The age of the essay", domain: "paulgraham.com", when: "3 days ago" },
  ];

  return (
    <div className="posts-card">
      {saves.map((s) => (
        <div key={s.label} className="posts-row" style={{ alignItems: "center" }}>
          <span
            className="col-tag"
            style={{ background: s.bg, color: "white", fontSize: 9, fontWeight: 800 }}
          >
            {s.label}
          </span>
          <div className="text">
            <div className="t" style={{ fontSize: 13 }}>
              {s.title}
            </div>
            <div className="m">
              {s.domain} · {s.when}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
