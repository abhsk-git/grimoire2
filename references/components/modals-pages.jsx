/* ============ PAGES: Settings, Link reader, Collection detail ============ */

const SETTINGS_TABS = [
  { id: 'profile',      label: 'Profile',         ico: 'users' },
  { id: 'appearance',   label: 'Appearance',      ico: 'sun' },
  { id: 'reader',       label: 'Writing & saving', ico: 'feather' },
  { id: 'integrations', label: 'Integrations',    ico: 'link' },
  { id: 'api',          label: 'API & webhooks',  ico: 'cmd' },
  { id: 'billing',      label: 'Billing',         ico: 'sparkles' },
  { id: 'danger',       label: 'Danger zone',     ico: 'lock' },
];

const SettingsPage = () => {
  const [tab, setTab] = React.useState('appearance');
  const [theme, setTheme] = React.useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>
      <div style={{borderBottom:'1px solid var(--border)',background:'var(--bg-soft)'}}>
        <div style={{maxWidth:1080,margin:'0 auto',padding:'14px 28px',display:'flex',alignItems:'center',gap:10}}>
          <Icon name="chevron-right" size={16} style={{transform:'rotate(180deg)',color:'var(--fg-soft)'}} />
          <span style={{color:'var(--fg-soft)',fontSize:13}}>Back to grimoire</span>
        </div>
      </div>

      <div className="settings-shell">
        <aside className="settings-side">
          <h2>Settings</h2>
          {SETTINGS_TABS.map(s => (
            <div key={s.id}
              className={'item' + (tab === s.id ? ' active' : '')}
              onClick={() => setTab(s.id)}>
              <Icon name={s.ico} size={15} />
              <span>{s.label}</span>
            </div>
          ))}
        </aside>

        <main className="settings-main">
          {tab === 'profile' && <ProfileSettings />}
          {tab === 'appearance' && <AppearanceSettings theme={theme} setTheme={setTheme} />}
          {tab === 'reader' && <ReaderSettings />}
          {tab === 'integrations' && <IntegrationsSettings />}
          {tab === 'api' && <ApiSettings />}
          {tab === 'billing' && <BillingSettings />}
          {tab === 'danger' && <DangerSettings />}
        </main>
      </div>
    </div>
  );
};

const ProfileSettings = () => (
  <>
    <h1>Profile</h1>
    <p className="desc">How you appear inside Grimoire and on your public grimoire page.</p>

    <div className="s-section">
      <h3>Identity</h3>
      <p className="desc">Your name, handle and the URL where people read your public archive.</p>

      <div style={{display:'flex',gap:18,alignItems:'flex-start',marginBottom:20}}>
        <div className="avatar" style={{width:64,height:64,fontSize:22,borderWidth:0,background:'linear-gradient(135deg,#5b54d6,#8e8df0)'}}>AB</div>
        <div style={{flex:1}}>
          <div style={{display:'flex',gap:6,marginBottom:6}}>
            <button className="btn btn-ghost btn-sm">Upload</button>
            <button className="btn btn-ghost btn-sm">Use initials</button>
            <button className="btn btn-ghost btn-sm" style={{color:'#c8453d'}}>Remove</button>
          </div>
          <div style={{fontSize:11,color:'var(--fg-soft)'}}>PNG/JPG · max 2MB · 512×512 looks best.</div>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Display name</label>
          <input defaultValue="Abhishek" />
        </div>
        <div className="field">
          <label>Handle</label>
          <input defaultValue="abhishek" />
          <div className="hint">grimoire.so/<b style={{color:'var(--fg)'}}>abhishek</b></div>
        </div>
      </div>

      <div className="field">
        <label>Bio</label>
        <textarea defaultValue="Cybersecurity learner. Plaintext maximalist. Keeping a record of everything worth reading twice."></textarea>
        <div className="hint">160 chars max · shown on your public grimoire.</div>
      </div>

      <div className="field-row">
        <div className="field"><label>Email</label><input defaultValue="abhishek@sysnode.in" /></div>
        <div className="field"><label>Website</label><input placeholder="https://sysnode.in" defaultValue="https://sysnode.in" /></div>
      </div>

      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button className="btn btn-ghost btn-sm">Discard</button>
        <button className="btn btn-primary btn-sm">Save changes</button>
      </div>
    </div>
  </>
);

const AppearanceSettings = ({ theme, setTheme }) => {
  const apply = (id) => {
    setTheme(id);
    document.documentElement.setAttribute('data-theme', id);
  };
  const themes = [
    { id: 'light',    name: 'Light',    sub: 'Indigo on paper',  s1: '#f6f5fa', s2: '#5b54d6' },
    { id: 'dark',     name: 'Dark',     sub: 'Neon on near-black', s1: '#0c0f14', s2: '#3ee07a' },
    { id: 'geek',     name: 'Geek',     sub: 'Mono · terminal',    s1: '#f3f4ed', s2: '#2da14e' },
    { id: 'midnight', name: 'Midnight', sub: 'Teal on deep teal',  s1: '#061114', s2: '#36e0c4' },
  ];
  return (
    <>
      <h1>Appearance</h1>
      <p className="desc">Tweak how Grimoire looks for you. Affects this device only.</p>

      <div className="s-section">
        <h3>Theme</h3>
        <p className="desc">Pick a palette. You can change it anytime, including from the ⌘K palette.</p>
        <div className="theme-grid">
          {themes.map(th => (
            <div key={th.id}
              className={'theme-card' + (theme === th.id ? ' on' : '')}
              onClick={() => apply(th.id)}>
              <div className="swatch" style={{background: `linear-gradient(135deg, ${th.s1}, ${th.s2})`}}></div>
              <div className="label">
                <div>
                  <div>{th.name}</div>
                  <div style={{fontSize:11,color:'var(--fg-soft)',fontWeight:500}}>{th.sub}</div>
                </div>
                <div className="ck"><Icon name="arrow-right" size={10} strokeWidth={3} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="s-section">
        <h3>Reading</h3>
        <p className="desc">Defaults for the in-app reader and your public posts.</p>

        <div className="s-row">
          <div className="text"><div className="t">Reader font</div><div className="d">Used for article body in the in-app reader.</div></div>
          <div className="segmented">
            <button>Sans</button>
            <button className="active">Serif</button>
            <button>Mono</button>
          </div>
        </div>
        <div className="s-row">
          <div className="text"><div className="t">Reading width</div><div className="d">How wide the reader column is.</div></div>
          <div className="segmented">
            <button>Narrow</button>
            <button className="active">Comfortable</button>
            <button>Wide</button>
          </div>
        </div>
        <div className="s-row">
          <div className="text"><div className="t">Card density</div><div className="d">How many items fit per row.</div></div>
          <div className="segmented">
            <button>Compact</button>
            <button className="active">Cozy</button>
            <button>Spacious</button>
          </div>
        </div>
      </div>

      <div className="s-section">
        <h3>Sidebar</h3>
        <div className="toggle-row">
          <div className="ico"><Icon name="folder" size={15} /></div>
          <div className="text"><div className="t">Always show collection counts</div><div className="d">Tiny number pill next to each item.</div></div>
          <div className="switch on"></div>
        </div>
        <div className="toggle-row">
          <div className="ico"><Icon name="tag" size={15} /></div>
          <div className="text"><div className="t">Show tag cloud</div><div className="d">Tag chips below collections.</div></div>
          <div className="switch on"></div>
        </div>
        <div className="toggle-row">
          <div className="ico"><Icon name="cmd" size={15} /></div>
          <div className="text"><div className="t">Show keyboard shortcuts</div><div className="d">Hints next to menu items.</div></div>
          <div className="switch on"></div>
        </div>
      </div>
    </>
  );
};

const ReaderSettings = () => (
  <>
    <h1>Writing & saving</h1>
    <p className="desc">How the editor behaves, and what happens when you save a reference.</p>

    <div className="s-section">
      <h3>The editor</h3>
      <div className="toggle-row">
        <div className="ico"><Icon name="feather" size={15} /></div>
        <div className="text"><div className="t">Focus mode by default</div><div className="d">Hide sidebar and chrome the moment you start typing.</div></div>
        <div className="switch on"></div>
      </div>
      <div className="toggle-row">
        <div className="ico"><Icon name="pen" size={15} /></div>
        <div className="text"><div className="t">Markdown shortcuts</div><div className="d">Type <code style={{fontFamily:'var(--font-mono)',fontSize:11,padding:'1px 5px',background:'var(--bg-soft)',borderRadius:4}}>##</code> for H2, <code style={{fontFamily:'var(--font-mono)',fontSize:11,padding:'1px 5px',background:'var(--bg-soft)',borderRadius:4}}>{'>'}</code> for blockquote, etc.</div></div>
        <div className="switch on"></div>
      </div>
      <div className="toggle-row">
        <div className="ico"><Icon name="zap" size={15} /></div>
        <div className="text"><div className="t">Auto-save by the keystroke</div><div className="d">No more lost paragraphs.</div></div>
        <div className="switch on"></div>
      </div>
      <div className="s-row">
        <div className="text"><div className="t">Editor font</div><div className="d">Used while writing.</div></div>
        <div className="segmented">
          <button className="active">Serif</button>
          <button>Sans</button>
          <button>Mono</button>
        </div>
      </div>
    </div>

    <div className="s-section">
      <h3>Saving references</h3>
      <div className="toggle-row">
        <div className="ico"><Icon name="bookmark" size={15} /></div>
        <div className="text"><div className="t">Auto-fetch title, image and excerpt</div><div className="d">Off if you save very many references per minute.</div></div>
        <div className="switch on"></div>
      </div>
      <div className="toggle-row">
        <div className="ico"><Icon name="sparkles" size={15} /></div>
        <div className="text"><div className="t">AI auto-tag</div><div className="d">Suggest tags from page content. You can always edit.</div></div>
        <div className="switch on"></div>
      </div>
      <div className="toggle-row">
        <div className="ico"><Icon name="bookmark" size={15} /></div>
        <div className="text"><div className="t">Keep a clean reader copy</div><div className="d">So references survive link rot, even when the source disappears.</div></div>
        <div className="switch on"></div>
      </div>
    </div>

    <div className="s-section">
      <h3>Defaults</h3>
      <div className="s-row">
        <div className="text"><div className="t">New posts default to</div><div className="d">You can override per post.</div></div>
        <div className="segmented">
          <button>Public</button>
          <button>Unlisted</button>
          <button className="active">Draft</button>
        </div>
      </div>
      <div className="s-row">
        <div className="text"><div className="t">New references default to</div></div>
        <div className="segmented">
          <button>Public</button>
          <button>Unlisted</button>
          <button className="active">Private</button>
        </div>
      </div>
    </div>
  </>
);

const IntegrationsSettings = () => {
  const integrations = [
    { ico: 'globe',    name: 'Browser extension', desc: 'Save the current tab with ⌘+S. Available for Chrome, Firefox, Safari.', state: 'Installed · v1.4.2', on: true },
    { ico: 'rss',      name: 'Public RSS feed',  desc: 'A feed of your public saves at grimoire.so/abhishek/feed.xml', state: 'Enabled', on: true },
    { ico: 'inbox',    name: 'Save-by-email',    desc: 'Forward any email to save-abhishek@in.grimoire.so to clip it.', state: 'Enabled', on: true },
    { ico: 'cmd',      name: 'Pocket import',    desc: 'Pull in your existing Pocket archive. Tags and read state preserved.', state: 'Connected · 1,182 imported', on: true },
    { ico: 'bookmark', name: 'Raindrop import',  desc: 'Pull in Raindrop collections.', state: 'Not connected', on: false },
    { ico: 'feather',  name: 'Obsidian sync',    desc: 'Mirror your public posts as Markdown into a vault folder.', state: 'Not connected', on: false },
  ];
  return (
    <>
      <h1>Integrations</h1>
      <p className="desc">Bring links in, push them out, keep the open web open.</p>

      {integrations.map((i, idx) => (
        <div key={idx} className="s-section" style={{padding:'16px 18px',marginBottom:10}}>
          <div className="toggle-row" style={{border:0,padding:0,background:'none',margin:0}}>
            <div className="ico"><Icon name={i.ico} size={16} /></div>
            <div className="text">
              <div className="t">{i.name}</div>
              <div className="d">{i.desc}</div>
              <div className="d" style={{color: i.on ? 'var(--accent)' : 'var(--fg-soft)', fontWeight: 600, marginTop:6}}>{i.state}</div>
            </div>
            <button className={i.on ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}>
              {i.on ? 'Manage' : 'Connect'}
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

const ApiSettings = () => (
  <>
    <h1>API & webhooks</h1>
    <p className="desc">A small, honest REST API. Read your archive, write to it, listen for events.</p>

    <div className="s-section">
      <h3>Personal access tokens</h3>
      <p className="desc">Scoped per-token. Treat them like passwords.</p>

      <div className="api-row">
        <span className="label">read-only</span>
        <span className="key">grm_••••••••••••mZk2</span>
        <span style={{color:'var(--fg-soft)',fontSize:11}}>created May 14</span>
        <button className="btn btn-ghost btn-sm">Copy</button>
        <button className="btn btn-ghost btn-sm" style={{color:'#c8453d'}}>Revoke</button>
      </div>
      <div className="api-row">
        <span className="label">read+write</span>
        <span className="key">grm_••••••••••••Lq7p</span>
        <span style={{color:'var(--fg-soft)',fontSize:11}}>created Apr 3</span>
        <button className="btn btn-ghost btn-sm">Copy</button>
        <button className="btn btn-ghost btn-sm" style={{color:'#c8453d'}}>Revoke</button>
      </div>
      <button className="btn btn-primary btn-sm" style={{marginTop:8}}><Icon name="plus" size={13} /> New token</button>
    </div>

    <div className="s-section">
      <h3>Webhooks</h3>
      <p className="desc">Get a POST on link saved, post published, or collection updated.</p>
      <div className="api-row">
        <span className="label">https://</span>
        <span className="key">sysnode.in/hooks/grimoire</span>
        <span style={{color:'var(--accent)',fontSize:11,fontWeight:600}}>● Active</span>
        <button className="btn btn-ghost btn-sm">Edit</button>
      </div>
      <button className="btn btn-ghost btn-sm"><Icon name="plus" size={13} /> Add webhook</button>
    </div>

    <div className="s-section">
      <h3>Docs</h3>
      <p className="desc" style={{margin:0}}>Read the full API reference at <a style={{color:'var(--accent)',fontWeight:600}}>docs.grimoire.so</a>. SDKs for JS, Python and Go.</p>
    </div>
  </>
);

const BillingSettings = () => (
  <>
    <h1>Billing</h1>
    <p className="desc">You're on the Free plan. Free forever for personal use.</p>

    <div className="s-section">
      <h3>Plan</h3>
      <div style={{display:'flex',gap:16,padding:'12px 0'}}>
        <div style={{flex:1,padding:18,borderRadius:12,border:'2px solid var(--accent)',background:'var(--accent-soft)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
            <h3 style={{margin:0}}>Free</h3>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'var(--accent-ink)'}}>CURRENT</span>
          </div>
          <div style={{fontSize:13,color:'var(--fg-muted)',marginTop:6}}>Unlimited links · 12 posts · Public profile · API</div>
        </div>
        <div style={{flex:1,padding:18,borderRadius:12,border:'1px solid var(--border)'}}>
          <h3 style={{margin:0}}>Pro · ₹399/mo</h3>
          <div style={{fontSize:13,color:'var(--fg-muted)',marginTop:6}}>Custom domain · AI summaries · Unlimited posts · Priority support</div>
          <button className="btn btn-primary btn-sm" style={{marginTop:12}}>Upgrade to Pro</button>
        </div>
      </div>
    </div>
  </>
);

const DangerSettings = () => (
  <>
    <h1>Danger zone</h1>
    <p className="desc">Things that are hard to undo. Read twice.</p>

    <div className="s-section danger-zone">
      <h3>Export your archive</h3>
      <p className="desc">Download a zip with all your links, notes and posts as Markdown + JSON. Yours, always.</p>
      <button className="btn btn-ghost btn-sm">Request export</button>
    </div>

    <div className="s-section danger-zone">
      <h3>Make grimoire private</h3>
      <p className="desc">Hide your public profile and all public saves until you re-enable.</p>
      <button className="btn btn-ghost btn-sm">Hide my grimoire</button>
    </div>

    <div className="s-section danger-zone">
      <h3>Delete account</h3>
      <p className="desc">Permanently removes you, your links, your posts and your public grimoire. We keep nothing.</p>
      <button className="btn btn-danger btn-sm">Delete my account…</button>
    </div>
  </>
);

/* ============ LINK READER ============ */
const LinkReader = () => (
  <div style={{background:'var(--bg)',minHeight:'100vh'}}>
    <div style={{borderBottom:'1px solid var(--border)',background:'color-mix(in oklab,var(--bg) 80%,transparent)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:5}}>
      <div style={{maxWidth:1120,margin:'0 auto',padding:'14px 28px',display:'flex',alignItems:'center',gap:10}}>
        <button className="btn btn-ghost btn-sm">
          <Icon name="chevron-right" size={14} style={{transform:'rotate(180deg)'}} /> Back
        </button>
        <div style={{flex:1}}></div>
        <span className="chip"><Icon name="globe" size={12} /> Public</span>
        <button className="icon-btn"><Icon name="star" size={15} /></button>
        <button className="btn btn-ghost btn-sm"><Icon name="pen" size={13} /> Annotate</button>
        <button className="btn btn-primary btn-sm"><Icon name="link" size={13} /> Open original</button>
      </div>
    </div>

    <div className="reader-shell">
      <aside className="reader-side-l">
        <h4>In this collection</h4>
        <div className="item">A Mathematical Theory of Communication</div>
        <div className="item" style={{color:'var(--accent)',fontWeight:600}}>SQL Notes by Apna College</div>
        <div className="item">Top 500 Cybersecurity Q&amp;A</div>
        <div className="item">Crafting Interpreters — Pratt Parsing</div>

        <h4 style={{marginTop:24}}>Other tags</h4>
        <div className="side-tags" style={{padding:0}}>
          <span className="tag">#sql <span className="n">4</span></span>
          <span className="tag">#cybersecurity <span className="n">9</span></span>
          <span className="tag">#interviewQs <span className="n">3</span></span>
        </div>
      </aside>

      <main>
        <div className="reader-meta-card">
          <div className="domain">
            <span className="fav" style={{background:'#1f6fd9'}}>D</span>
            <span>drive.google.com</span>
            <span>·</span>
            <span>Saved May 10 · 14 days ago</span>
            <span>·</span>
            <span>You opened this <b style={{color:'var(--fg)'}}>3 times</b></span>
          </div>
          <h1>SQL Notes by Apna College — Joins, Window Functions, Indexes</h1>
          <div className="author">
            <Icon name="users" size={14} />
            <span>Annotated by <b style={{color:'var(--fg)'}}>you</b> · 48 pages · 2.1 MB</span>
          </div>
          <div className="actions">
            <span className="lc-tag"><span className="h">#</span>sql</span>
            <span className="lc-tag"><span className="h">#</span>interview</span>
            <span className="lc-tag">📖 Reading list</span>
            <span style={{marginLeft:'auto',display:'flex',gap:6}}>
              <button className="btn btn-ghost btn-sm"><Icon name="folder" size={13} /> Move</button>
              <button className="btn btn-ghost btn-sm"><Icon name="globe" size={13} /> Share</button>
            </span>
          </div>
        </div>

        <div className="reader-body">
          <p>The biggest mistake junior engineers make with <mark className="highlight">SQL joins</mark> is treating them as a way to combine tables instead of as a way to <em>describe relationships between rows</em>. The distinction sounds academic; it is not.</p>

          <div className="reader-note">
            <div className="ti"><Icon name="pen" size={11} /> Your note · May 12</div>
            Remember: an INNER JOIN is the intersection, a LEFT JOIN keeps "the left side at all costs." Review the cardinality slide before next week's interview.
          </div>

          <p>Once you internalize that joins describe relationships, the rest of the operators become trivial. A window function is not magic; it is "give me a running view of these rows, ordered this way, partitioned that way, without collapsing them into a single result."</p>

          <h2>1. Indexes are notes about your data</h2>
          <p>An index is the table of contents at the front of a book. You read it to find a chapter; you don't read every page. <mark className="highlight">A composite index works left-to-right</mark>, which is why the order of columns inside it matters.</p>

          <p>If you have an index on (a, b, c), a query filtering on (a) uses it. A query filtering on (b) does not. A query filtering on (a, b) uses it partially.</p>

          <h2>2. EXPLAIN is a reading skill, not a tool</h2>
          <p>Learn to read query plans the way you learn to read poetry — slowly, with patience. The numbers matter less than the shape.</p>
        </div>
      </main>

      <aside className="reader-side-r">
        <h4>Your highlights</h4>
        <div className="reader-note" style={{margin:'8px 0'}}>
          "SQL joins describe relationships between rows."
          <div style={{fontSize:11,color:'var(--fg-soft)',marginTop:4}}>Highlighted May 12</div>
        </div>
        <div className="reader-note" style={{margin:'8px 0'}}>
          "A composite index works left-to-right."
          <div style={{fontSize:11,color:'var(--fg-soft)',marginTop:4}}>Highlighted May 12</div>
        </div>

        <h4 style={{marginTop:24}}>Related from your archive</h4>
        <div className="item">Crafting Interpreters — Pratt Parsing</div>
        <div className="item">PostgreSQL window functions cheatsheet</div>
        <div className="item">Designing Data-Intensive Applications · Ch.3</div>

        <button className="btn btn-ghost btn-sm" style={{marginTop:14,width:'100%'}}>
          <Icon name="sparkles" size={13} /> AI: find more like this
        </button>
      </aside>
    </div>
  </div>
);

/* ============ COLLECTION DETAIL ============ */
const CollectionDetail = () => (
  <div style={{background:'var(--bg)',minHeight:'100vh'}}>
    <div style={{maxWidth:1240,margin:'0 auto',padding:'28px'}}>
      <div className="coll-hero">
        <div className="bg" style={{background:'linear-gradient(135deg,#2f7d4d,#6abf85 60%,#a8e0bd)'}}></div>
        <div className="info">
          <div className="swatch" style={{background:'#2f7d4d'}}>🛡</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span className="chip"><Icon name="globe" size={12} /> Public</span>
              <span className="chip" style={{background:'var(--bg-soft)'}}>grimoire.so/abhishek/cybersecurity</span>
            </div>
            <h1>Cybersecurity</h1>
            <div className="meta">
              <span>38 links</span>
              <span>·</span>
              <span>Started Mar 2026</span>
              <span>·</span>
              <span>12 followers</span>
              <span>·</span>
              <span>Last added 2 hours ago</span>
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-ghost btn-sm"><Icon name="rss" size={13} /> RSS</button>
            <button className="btn btn-ghost btn-sm"><Icon name="pen" size={13} /> Edit</button>
            <button className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Add to collection</button>
          </div>
        </div>
      </div>

      <p style={{fontSize:15,color:'var(--fg-muted)',maxWidth:680,lineHeight:1.6,margin:'0 0 22px'}}>
        Everything I'm reading while preparing for cybersecurity interviews — books, papers, PDFs, conference talks. I revisit this list weekly and prune what I no longer need.
      </p>

      <div className="filter-bar">
        <button className="filter-chip active">All 38</button>
        <button className="filter-chip">PDFs 12</button>
        <button className="filter-chip">Articles 18</button>
        <button className="filter-chip">Videos 4</button>
        <button className="filter-chip">Code 4</button>
        <span className="sep">·</span>
        <button className="filter-chip">Sort: Most opened</button>
      </div>

      <div className="cards">
        {DASH_LINKS.slice(0, 6).map(l => <LinkCard key={l.id} link={l} />)}
      </div>
    </div>
  </div>
);

/* ============ PUBLIC PROFILE VIEWING PAGE ============ */
const PublicProfile = () => {
  const [tab, setTab] = React.useState('posts');

  const POSTS = [
    { title: 'A small theory of bookmarks',                cover: 'linear-gradient(135deg,#5b54d6,#8e8df0 60%,#b486f0)', when: 'May 14',  read: '4 min', likes: 247, pinned: false, excerpt: 'On the difference between hoarding and curating — and why future-you needs a reason to come back.' },
    { title: 'Notes on plaintext, again',                  cover: 'linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)', when: 'May 02',  read: '5 min', likes: 412, pinned: false, excerpt: 'Why I keep coming back to .md files — and why portable formats win, eventually.' },
    { title: 'On reading widely — and not regretting it',  cover: 'linear-gradient(135deg,#14613a,#2f7d4d 60%,#6abf85)', when: 'Apr 18',  read: '6 min', likes: 88,  pinned: false, excerpt: 'A working theory of attention, and why a slow reader is often the more useful one.' },
    { title: 'The small literature of late-night thoughts',cover: 'linear-gradient(135deg,#d04f63,#f08197 60%,#f4b860)', when: 'Apr 04',  read: '3 min', likes: 64,  pinned: false, excerpt: 'A defence of the half-thought, the journal entry, the page nobody else needs to see.' },
    { title: 'Why I still keep a commonplace book',         cover: 'linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)', when: 'Mar 22', read: '5 min', likes: 56,  pinned: false, excerpt: 'On Renaissance reading practices, and what they have to teach a software engineer.' },
    { title: 'How I read a paper, slowly',                  cover: 'linear-gradient(135deg,#2f7d4d,#6abf85 60%,#a8e0bd)', when: 'Mar 09', read: '8 min', likes: 124, pinned: false, excerpt: 'My step-by-step ritual for reading something I want to keep.' },
  ];

  const COLLS = [
    { name: 'Essays I love',       items: 38, color: '#5b54d6', sub: 'A handpicked archive of writing about writing.' },
    { name: 'Reading list',         items: 64, color: '#2f7d4d', sub: 'Everything I want to read this season.' },
    { name: 'Pulled quotes',        items: 27, color: '#b46a2a', sub: 'Lines I refuse to forget.' },
  ];

  const FOLLOWERS = [
    { n: 'Iván Reyes',     s: '@ivan · 28 posts',   bg: 'linear-gradient(135deg,#5563d0,#8e8df0)', i: 'IR' },
    { n: 'Dr. Anand Rao',  s: '@arao · 31 posts',   bg: 'linear-gradient(135deg,#14613a,#6abf85)', i: 'AR' },
    { n: 'Sana Khoury',    s: '@sana · 19 posts',   bg: 'linear-gradient(135deg,#d04f63,#f08197)', i: 'SK' },
    { n: 'Tomas Järvinen', s: '@tomas · 17 posts',  bg: 'linear-gradient(135deg,#2f7d4d,#a8e0bd)', i: 'TJ' },
  ];

  return (
    <div className="profile-page">
      <div style={{borderBottom:'1px solid var(--border)',background:'color-mix(in oklab, var(--bg) 80%, transparent)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:10}}>
        <div style={{maxWidth:1080,margin:'0 auto',padding:'14px 28px',display:'flex',alignItems:'center',gap:10}}>
          <Icon name="chevron-right" size={16} style={{transform:'rotate(180deg)',color:'var(--fg-soft)'}} />
          <span style={{color:'var(--fg-soft)',fontSize:13}}>grimoire.so/maya</span>
          <div style={{flex:1}}></div>
          <button className="btn btn-ghost btn-sm"><Icon name="rss" size={13} /> Subscribe via RSS</button>
          <button className="btn btn-ghost btn-sm"><Icon name="link" size={13} /> Share</button>
        </div>
      </div>

      <div className="profile-cover"></div>

      <div className="profile-shell">
        <div className="profile-head">
          <div className="av" style={{background:'linear-gradient(135deg,#b46a2a,#f4b860)'}}>MC</div>

          <div className="meta">
            <h1>Maya Chen</h1>
            <div className="handle">
              <span>@maya</span>
              <span className="verified"><Icon name="zap" size={9} strokeWidth={3} /> WRITER</span>
              <span>·</span>
              <span>Brooklyn, NY</span>
            </div>
            <p className="bio">
              Software writer. Plaintext maximalist. Writing weekly essays about attention, craft, and the things that survive when an app does not. Currently keeping a commonplace book in the open.
            </p>
            <div className="links">
              <a><Icon name="globe" size={13} /> mayachen.dev</a>
              <a><Icon name="rss" size={13} /> RSS feed</a>
              <a><Icon name="users" size={13} /> @maya on bsky</a>
              <span style={{color:'var(--fg-soft)'}}>· joined March 2024</span>
            </div>
          </div>

          <div className="actions">
            <button className="btn btn-primary btn-sm">
              <Icon name="users" size={13} /> Follow
            </button>
            <button className="btn btn-ghost btn-sm">
              <Icon name="inbox" size={13} /> Get new posts by email
            </button>
          </div>

          <div className="profile-stats">
            <div className="stat-col"><span className="n">42</span><span className="l">Posts</span></div>
            <div className="stat-col"><span className="n">12.4k</span><span className="l">Reads</span></div>
            <div className="stat-col"><span className="n">2,341</span><span className="l">Readers</span></div>
            <div className="stat-col"><span className="n">128</span><span className="l">References</span></div>
            <div className="stat-col"><span className="n">8</span><span className="l">Collections</span></div>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>
            <Icon name="feather" size={14} /> Posts <span className="ct">42</span>
          </button>
          <button className={tab === 'colls' ? 'active' : ''} onClick={() => setTab('colls')}>
            <Icon name="folder" size={14} /> Collections <span className="ct">8</span>
          </button>
          <button className={tab === 'refs' ? 'active' : ''} onClick={() => setTab('refs')}>
            <Icon name="bookmark" size={14} /> References <span className="ct">128</span>
          </button>
          <button className={tab === 'about' ? 'active' : ''} onClick={() => setTab('about')}>
            <Icon name="users" size={14} /> About
          </button>
        </div>

        {tab === 'posts' && (
          <div>
            {/* Pinned post */}
            <div className="profile-pinned">
              <div className="cover" style={{background:'linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)'}}>
                <span className="pin"><Icon name="star" size={10} /> PINNED</span>
                <h2>Notes on plaintext, again — why I keep coming back to .md files</h2>
              </div>
              <div className="info">
                <span className="when">Published May 02 · 5 min read</span>
                <p>"Plaintext is the only format that outlives its app. Every other 'permanent' is a slow trap that you don't notice until the trap closes."</p>
                <div className="stats">
                  <span><Icon name="users" size={11} /> 412 reads</span>
                  <span><Icon name="star" size={11} /> 28 likes</span>
                  <span><Icon name="link" size={11} /> 14 references</span>
                </div>
                <button className="btn btn-ghost btn-sm" style={{alignSelf:'flex-start'}}>
                  Read post <Icon name="arrow-right" size={13} />
                </button>
              </div>
            </div>

            <div className="cards">
              {POSTS.map((p, i) => (
                <article key={i} className="post-card">
                  <div className="post-cover" style={{background: p.cover}}></div>
                  <div className="post-body">
                    <div className="post-by">
                      <span style={{fontWeight:600,color:'var(--fg-muted)'}}>{p.when}</span>
                      <span>·</span>
                      <span>{p.read}</span>
                    </div>
                    <h3 className="post-title">{p.title}</h3>
                    <p style={{margin:'0 0 4px',fontSize:13,color:'var(--fg-muted)',lineHeight:1.5,
                      display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                      {p.excerpt}
                    </p>
                    <div className="post-meta">
                      <span><Icon name="star" size={11} /> {p.likes}</span>
                      <span><Icon name="users" size={11} /> {Math.floor(p.likes * 2.4)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === 'colls' && (
          <div className="cards">
            {COLLS.map((c, i) => (
              <div key={i} className="lc" style={{cursor:'pointer'}}>
                <div className="lc-hero gradient" style={{
                  background: `linear-gradient(135deg, ${c.color}, color-mix(in oklab, ${c.color} 40%, white))`,
                  height: 130
                }}>
                  <div style={{display:'flex',flexDirection:'column',gap:4,color:'white'}}>
                    <span style={{
                      fontSize:11,fontWeight:700,letterSpacing:'0.08em',
                      opacity:0.85,textTransform:'uppercase'
                    }}>Collection · {c.items} items</span>
                    <div style={{
                      fontFamily:'var(--font-display)',fontStyle:'normal',
                      fontSize:22,fontWeight:700,letterSpacing:'-0.02em'
                    }}>{c.name}</div>
                  </div>
                </div>
                <div className="lc-body">
                  <div className="lc-desc">{c.sub}</div>
                  <div className="lc-foot" style={{marginTop:'auto'}}>
                    <Icon name="globe" size={11} />
                    <span>Public</span>
                    <span style={{marginLeft:'auto',color:'var(--accent)',fontWeight:600}}>View →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'refs' && (
          <div className="cards">
            {DASH_LINKS.filter(l => l.public).slice(0, 6).map(l => <LinkCard key={l.id} link={l} />)}
          </div>
        )}

        {tab === 'about' && (
          <div className="about-grid">
            <div className="about-col-l">
              <h2>About me</h2>
              <p>I write essays about software, attention, and the slow practice of paying attention to what I read. I'm a software writer based in Brooklyn — by which I mean I write code on weekdays and write words on weekends, and the difference between the two has gotten smaller every year.</p>

              <h2>What I write about</h2>
              <p>Plaintext as a practice. Reading widely as a craft. Why an app outlives its founders only if the format outlives the app. Sometimes typography. Sometimes the small literature of late-night thoughts.</p>

              <h2>How to read this archive</h2>
              <p>Start with the pinned post — that's the closest thing I have to a thesis. Everything else is footnotes to it, with a few seasons of essay-as-experiment scattered through.</p>

              <h2>Get in touch</h2>
              <p>I read every email. You can find me at maya@mayachen.dev or in the comments on any post. I write back, eventually.</p>
            </div>

            <div className="about-side">
              <div className="about-card">
                <h3>Currently reading</h3>
                <div className="item">
                  <div className="av" style={{background:'#ff6719'}}>SS</div>
                  <div className="text">
                    <div className="n">On reading like an artist</div>
                    <div className="s">annie.substack.com</div>
                  </div>
                </div>
                <div className="item">
                  <div className="av" style={{background:'#171717'}}>OB</div>
                  <div className="text">
                    <div className="n">Obsidian Publish architecture</div>
                    <div className="s">obsidian.md</div>
                  </div>
                </div>
                <div className="item">
                  <div className="av" style={{background:'#f0652f'}}>PG</div>
                  <div className="text">
                    <div className="n">The age of the essay</div>
                    <div className="s">paulgraham.com</div>
                  </div>
                </div>
              </div>

              <div className="about-card">
                <h3>Followed by</h3>
                {FOLLOWERS.map((f, i) => (
                  <div key={i} className="item">
                    <div className="av" style={{background: f.bg}}>{f.i}</div>
                    <div className="text">
                      <div className="n">{f.n}</div>
                      <div className="s">{f.s}</div>
                    </div>
                  </div>
                ))}
                <div className="item" style={{borderBottom:0}}>
                  <span style={{color:'var(--fg-soft)',fontSize:12}}>and 2,337 others…</span>
                </div>
              </div>

              <div className="about-card">
                <h3>Subscribe</h3>
                <p style={{margin:'0 0 10px',fontSize:13,color:'var(--fg-muted)',lineHeight:1.5}}>
                  Get every new essay in your inbox. No tracker pixels, no marketing copy. Unsubscribe with one click.
                </p>
                <div style={{display:'flex',gap:6}}>
                  <input
                    placeholder="you@example.com"
                    style={{flex:1,fontFamily:'inherit',fontSize:13,padding:'8px 10px',
                      borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',
                      color:'var(--fg)',outline:'none'}}
                  />
                  <button className="btn btn-primary btn-sm">Sub</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { SettingsPage, LinkReader, CollectionDetail, PublicProfile });
