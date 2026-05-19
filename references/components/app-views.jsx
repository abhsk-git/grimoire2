/* Views: All Links, Public, Private, Starred, Explore, My Posts, Editor, Empty */

const Sparkline = ({ data, color }) => {
  const w = 60,h = 22;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - v / max * h}`).join(' ');
  return (
    <svg width={w} height={h} className="spark" style={{ color }}>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
      <polyline fill="currentColor" opacity="0.15" stroke="none"
      points={`0,${h} ${points} ${w},${h}`} />
    </svg>);

};

const StatStrip = () =>
<div className="stats">
    {DASH_STATS.map((s, i) =>
  <div key={i} className="stat">
        <div className="ico"><Icon name={s.ico} size={16} /></div>
        <div>
          <div className="n">{s.n}</div>
          <div className="l">{s.l}</div>
        </div>
        <span className="trend">↑ {s.trend}</span>
        <Sparkline data={s.spark} color="currentColor" />
      </div>
  )}
  </div>;


const FilterBar = ({ activeTag, setActiveTag }) =>
<div className="filter-bar">
    <button className="filter-chip"><Icon name="folder" size={12} /> Collection: All</button>
    <button className="filter-chip"><Icon name="tag" size={12} /> Any tag</button>
    <button className="filter-chip"><Icon name="globe" size={12} /> Any visibility</button>
    <span className="sep">·</span>
    <button className="filter-chip">Sort: Recently saved <Icon name="chevron-right" size={11} style={{ transform: 'rotate(90deg)' }} /></button>
    {activeTag &&
  <>
        <span className="sep">·</span>
        <button className="filter-chip active" onClick={() => setActiveTag(null)}>
          #{activeTag} <span className="close">×</span>
        </button>
      </>
  }
  </div>;


/* ====== ALL LINKS VIEW ====== */
const AllLinksView = ({ viewMode, filter }) => {
  const [activeTag, setActiveTag] = React.useState(null);
  let items = DASH_LINKS;
  if (filter === 'public') items = items.filter((l) => l.public);
  if (filter === 'private') items = items.filter((l) => !l.public);
  if (filter === 'starred') items = items.filter((l) => l.starred);

  const titles = {
    all: 'Saved · references', public: 'Public references', private: 'Private references', starred: 'Starred'
  };

  return (
    <div>
      <div className="page-title">
        <h1>{titles[filter] || 'Saved'} <span className="meta">{items.length} of {DASH_LINKS.length} · for your next essay</span></h1>
        <div className="actions">
          <button className="btn btn-ghost btn-sm"><Icon name="zap" size={13} /> Import</button>
          <button className="btn btn-ghost btn-sm"><Icon name="folder" size={13} /> New collection</button>
        </div>
      </div>

      {filter === 'all' && <StatStrip />}

      <FilterBar activeTag={activeTag} setActiveTag={setActiveTag} />

      {viewMode === 'grid' ?
      <div className="cards">
          {items.map((l) => <LinkCard key={l.id} link={l} />)}
        </div> :

      <div className="list-view">
          {items.map((l) => <ListRow key={l.id} link={l} />)}
        </div>
      }
    </div>);

};

/* ====== EXPLORE VIEW ====== */
const ExploreView = () => {
  const [tab, setTab] = React.useState('stories');

  const FEATURED_POSTS = [
    { author: 'Maya Chen',    initials: 'MC', avBg: '#b46a2a,#f4b860',
      title: 'Notes on plaintext, again — why I keep coming back to .md files',
      excerpt: '"Plaintext is the only format that outlives its app. Every other \'permanent\' is a slow trap that you don\'t notice until the trap closes."',
      cover: 'linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)',
      stats: '247 reads · 28 likes · 4 min · May 14', tag: 'Featured', pillBg: 'rgba(255,255,255,0.18)' },
    { author: 'Iván Reyes',   initials: 'IR', avBg: '#5563d0,#8e8df0',
      title: 'Specimen of the week: Bricolage Grotesque',
      excerpt: '"A typeface is an argument about how to look. This one argues for the kind of paying attention I want to do more of."',
      cover: 'linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)',
      stats: '1.1k reads · 84 likes · 6 min · May 12', tag: 'Editor\'s pick', pillBg: 'rgba(0,0,0,0.25)' },
  ];

  const TOP_WRITERS = [
    { initials: 'MC', name: 'Maya Chen',       handle: '@maya',    posts: 42, followers: '2.3k', bg: 'linear-gradient(135deg,#b46a2a,#f4b860)' },
    { initials: 'IR', name: 'Iván Reyes',      handle: '@ivan',    posts: 28, followers: '1.1k', bg: 'linear-gradient(135deg,#5563d0,#8e8df0)' },
    { initials: 'AR', name: 'Dr. Anand Rao',   handle: '@arao',    posts: 31, followers: '4.8k', bg: 'linear-gradient(135deg,#14613a,#6abf85)' },
    { initials: 'SK', name: 'Sana Khoury',     handle: '@sana',    posts: 19, followers: '780',  bg: 'linear-gradient(135deg,#d04f63,#f08197)' },
    { initials: 'TJ', name: 'Tomas Järvinen',  handle: '@tomas',   posts: 17, followers: '612',  bg: 'linear-gradient(135deg,#2f7d4d,#a8e0bd)' },
    { initials: 'AB', name: 'abhishek',        handle: '@sysnode', posts: 12, followers: '94',   bg: 'linear-gradient(135deg,#5b54d6,#8e8df0)' },
  ];

  const FRESH_POSTS = [
    { author: 'Iván Reyes', initials: 'IR', avBg: 'linear-gradient(135deg,#5563d0,#8e8df0)',
      title: 'On reading widely — and not regretting it',  when: '2h ago',  read: '5 min', likes: 12,
      cover: 'linear-gradient(135deg,#14613a,#2f7d4d 60%,#6abf85)' },
    { author: 'Dr. Anand Rao', initials: 'AR', avBg: 'linear-gradient(135deg,#14613a,#6abf85)',
      title: 'How I read a paper, slowly',                  when: '1 day',   read: '8 min', likes: 47,
      cover: 'linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)' },
    { author: 'Sana Khoury',  initials: 'SK', avBg: 'linear-gradient(135deg,#d04f63,#f08197)',
      title: 'The small literature of late-night thoughts', when: '2 days',  read: '3 min', likes: 28,
      cover: 'linear-gradient(135deg,#d04f63,#f08197 60%,#f4b860)' },
    { author: 'abhishek', initials: 'AB', avBg: 'linear-gradient(135deg,#5b54d6,#8e8df0)',
      title: 'A small theory of bookmarks',                 when: '3 days',  read: '4 min', likes: 14,
      cover: 'linear-gradient(135deg,#5b54d6,#8e8df0 60%,#b486f0)' },
    { author: 'Tomas Järvinen', initials: 'TJ', avBg: 'linear-gradient(135deg,#2f7d4d,#a8e0bd)',
      title: 'Notes from a sabbatical — what I gave up',    when: '5 days',  read: '7 min', likes: 92,
      cover: 'linear-gradient(135deg,#2f7d4d,#6abf85 60%,#a8e0bd)' },
    { author: 'Maya Chen', initials: 'MC', avBg: 'linear-gradient(135deg,#b46a2a,#f4b860)',
      title: 'Why I still keep a commonplace book',          when: '1 week', read: '5 min', likes: 412,
      cover: 'linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)' },
  ];

  return (
    <div>
      <div className="explore-hero">
        <span className="eyebrow"><Icon name="feather" size={11} /> The reading room</span>
        <h1>Open the <span className="serif">Grimoire</span>.</h1>
        <p>Read what the curious are writing · then close the tab.</p>

        <div className="explore-tabs">
          <button className={tab === 'stories' ? 'active' : ''} onClick={() => setTab('stories')}>
            <Icon name="feather" size={14} />
            <div style={{ textAlign: 'left' }}>
              <div>Stories</div>
              <div className="sub">Essays & posts</div>
            </div>
          </button>
          <button className={tab === 'writers' ? 'active' : ''} onClick={() => setTab('writers')}>
            <Icon name="users" size={14} />
            <div style={{ textAlign: 'left' }}>
              <div>Writers</div>
              <div className="sub">People to follow</div>
            </div>
          </button>
          <button className={tab === 'references' ? 'active' : ''} onClick={() => setTab('references')}>
            <Icon name="bookmark" size={14} />
            <div style={{ textAlign: 'left' }}>
              <div>References</div>
              <div className="sub">Public links</div>
            </div>
          </button>
        </div>
      </div>

      {/* FEATURED — always visible on Stories + Writers */}
      {tab !== 'references' && (
        <div className="explore-section">
          <h2>Featured this week</h2>
          <div className="featured-grid">
            {FEATURED_POSTS.map((p, i) => (
              <article key={i} className="feature-post">
                <div className="cover" style={{ background: p.cover }}>
                  <span className="pill" style={{ background: p.pillBg }}>{p.tag}</span>
                  <h3>{p.title}</h3>
                </div>
                <div className="info">
                  <div className="by">
                    <div className="avatar" style={{ background: `linear-gradient(135deg,${p.avBg})`, borderWidth: 0 }}>{p.initials}</div>
                    <div>
                      <div className="name">{p.author}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-soft)' }}>{p.handle || ''}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>+ Follow</button>
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16 }}>{p.excerpt}</p>
                  <div className="stats">{p.stats}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* STORIES TAB */}
      {tab === 'stories' && (
        <>
          <div className="explore-section">
            <h2>Fresh today</h2>
            <div className="cards">
              {FRESH_POSTS.map((p, i) => (
                <article key={i} className="post-card">
                  <div className="post-cover" style={{ background: p.cover }}></div>
                  <div className="post-body">
                    <div className="post-by">
                      <div className="avatar" style={{ width: 22, height: 22, fontSize: 10, borderWidth: 0, background: p.avBg }}>{p.initials}</div>
                      <span style={{ fontWeight: 600 }}>{p.author}</span>
                      <span>·</span>
                      <span>{p.when}</span>
                    </div>
                    <h3 className="post-title">{p.title}</h3>
                    <div className="post-meta">
                      <span><Icon name="bookmark" size={11} /> {p.read}</span>
                      <span><Icon name="star" size={11} /> {p.likes}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="explore-section">
            <h2>Topics</h2>
            <div className="tag-cloud">
              {[
                {t:'essays',n:42},{t:'writing',n:38},{t:'typography',n:24},{t:'reading',n:21},
                {t:'plaintext',n:18},{t:'attention',n:15},{t:'design',n:14},{t:'memoir',n:12},
                {t:'craft',n:11},{t:'tools',n:9},{t:'commonplace',n:8},{t:'note-taking',n:7},
              ].map(t => (
                <span key={t.t} className="tag"><Icon name="feather" size={11} /> {t.t} <span className="n">{t.n}</span></span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* WRITERS TAB */}
      {tab === 'writers' && (
        <div className="explore-section">
          <h2>Most-read writers this week</h2>
          <div className="writers-grid">
            {TOP_WRITERS.map((w, i) => (
              <div key={i} className="writer-card">
                <div className="rank">#{i + 1}</div>
                <div className="avatar" style={{ width: 48, height: 48, fontSize: 17, borderWidth: 0, background: w.bg }}>{w.initials}</div>
                <div className="info">
                  <div className="name">{w.name}</div>
                  <div className="handle">{w.handle}</div>
                  <div className="counts">
                    <span><b style={{color:'var(--fg)'}}>{w.posts}</b> posts</span>
                    <span>·</span>
                    <span><b style={{color:'var(--fg)'}}>{w.followers}</b> readers</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm">+ Follow</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REFERENCES TAB (links, but de-emphasised) */}
      {tab === 'references' && (
        <>
          <div className="explore-section">
            <h2>Trending tags</h2>
            <div className="tag-cloud">
              {DASH_TAGS.map((t, i) => (
                <span key={i} className="tag">#{t.t} <span className="n">{t.n}</span></span>
              ))}
            </div>
          </div>
          <div className="explore-section">
            <h2>Recently saved · public</h2>
            <div className="cards">
              {DASH_LINKS.filter((l) => l.public).slice(0, 6).map((l) => <LinkCard key={l.id} link={l} />)}
            </div>
          </div>
        </>
      )}
    </div>);
};

/* ====== MY POSTS VIEW ====== */
const MyPostsView = () =>
<div>
    <div className="page-title">
      <h1>My Posts <span className="meta">{MY_POSTS.length} total · 1 scheduled</span></h1>
      <div className="actions">
        <div className="filter-bar" style={{ margin: 0 }}>
          <button className="filter-chip active">All</button>
          <button className="filter-chip">Published</button>
          <button className="filter-chip">Drafts</button>
          <button className="filter-chip">Scheduled</button>
        </div>
        <button className="btn btn-primary btn-sm"><Icon name="pen" size={13} /> New Post</button>
      </div>
    </div>

    <div className="stats">
      <div className="stat">
        <div className="ico"><Icon name="feather" size={16} /></div>
        <div><div className="n">12</div><div className="l">Total posts</div></div>
      </div>
      <div className="stat">
        <div className="ico"><Icon name="globe" size={16} /></div>
        <div><div className="n">8</div><div className="l">Published</div></div>
        <span className="trend">
</span>
      </div>
      <div className="stat">
        <div className="ico"><Icon name="users" size={16} /></div>
        <div><div className="n">1,247</div><div className="l">Total reads</div></div>
        <span className="trend">
</span>
      </div>
      <div className="stat">
        <div className="ico"><Icon name="star" size={16} /></div>
        <div><div className="n">84</div><div className="l">Likes</div></div>
        <span className="trend">
</span>
      </div>
    </div>

    <div>
      {MY_POSTS.map((p) => <div key={p.id} className="post-row">
          <div className="thumb">{p.glyph}</div>
          <div className="body">
            <div className="t">{p.title}</div>
            <div className="m">
              <span>{p.when}</span>
              <span>·</span>
              <span>{p.meta}</span>
            </div>
          </div>
          <span className={'pill ' + p.state}>
            {p.state === 'live' ? 'PUBLISHED' : p.state === 'sched' ? 'SCHEDULED' : 'DRAFT'}
          </span>
          <div className="icons">
            <button title="Edit"><Icon name="pen" size={14} /></button>
            <button title="View"><Icon name="globe" size={14} /></button>
            <button title="Delete"><Icon name="chevron-right" size={14} /></button>
          </div>
        </div>)}
    </div>
  </div>;


/* ====== EDITOR VIEW ====== */
const EditorView = () =>
<div className="editor-shell">
    <div className="editor-tools">
      <button title="Heading"><Icon name="pen" size={13} />H1</button>
      <button>H2</button>
      <button><b>B</b></button>
      <button><i>I</i></button>
      <span className="sep"></span>
      <button><Icon name="link" size={13} /> Link</button>
      <button><Icon name="bookmark" size={13} /> Insert saved link</button>
      <button><Icon name="globe" size={13} /> Image</button>
      <span className="sep"></span>
      <button><Icon name="sparkles" size={13} /> AI find related</button>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <button className="btn btn-ghost btn-sm">Preview</button>
        <button className="btn btn-primary btn-sm">Publish</button>
      </div>
    </div>

    <div className="editor-meta">
      <span className="pill draft">DRAFT</span>
      <span>Auto-saved a moment ago</span>
      <span>·</span>
      <span>740 words · 4 min read</span>
    </div>

    <input className="editor-title" defaultValue="A small theory of bookmarks" />

    <div className="editor-content">
      <p>
        A bookmark is a promise to your future self — to come back, to think again,
        to take seriously what passed for fleeting. Most of us break that promise.
      </p>
      <p>
        I've been keeping a digital commonplace book for a year now. Here is what I have learned about saving things you actually return to.
      </p>

      <h2>1. The worst archive is the one you cannot search.</h2>
      <p>
        A folder of links is a graveyard with no map. Plain text, tagged, with a one-line note, beats every visual bookmark manager I have ever tried — because the only retrieval system that survives is search.
      </p>

      <div className="saved-quote">
        "The point of reading is not to finish the book. It is to be changed by it — even a little, even in places you can't name."
        <div className="src">
          <span className="fav" style={{ background: '#ff6719' }}>SS</span>
          <span>Annie Mueller · Reading like an artist</span>
        </div>
      </div>

      <h2>2. Save the why, not just the what.</h2>
      <p>
        One line, written the moment you save: "what I want to remember from this." Six months from now, that line is worth more than the link.
        <span className="cursor"></span>
      </p>
    </div>
  </div>;


/* ====== EMPTY VIEW (when filtering shows nothing) ====== */
const EmptyView = ({ what = 'starred', onClear }) =>
<div className="empty">
    <div className="ico"><Icon name={what === 'starred' ? 'star' : 'bookmark'} size={26} /></div>
    <h3>Nothing here yet</h3>
    <p>Star the links you keep coming back to — they'll show up here for one-tap access.</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      <button className="btn btn-primary btn-sm" onClick={onClear}><Icon name="bookmark" size={13} /> Browse all links</button>
      <button className="btn btn-ghost btn-sm"><Icon name="globe" size={13} /> Import from Pocket</button>
    </div>
    <div className="quick-tips">
      <span className="chip">Tip: <span className="kbd">⌘ S</span> on any site to save</span>
      <span className="chip">Tip: <span className="kbd">⌘ K</span> to search everything</span>
    </div>
  </div>;


Object.assign(window, { AllLinksView, ExploreView, MyPostsView, EditorView, EmptyView, StatStrip });