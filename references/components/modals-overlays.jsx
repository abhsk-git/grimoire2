/* ============ OVERLAYS: add-link, palette, profile dropdown, mobile drawer, toasts ============ */

const AddLinkModal = ({ onClose }) => {
  const [tags, setTags] = React.useState(['essay', 'reading']);
  const [vis, setVis] = React.useState('private');
  const removeTag = (t) => setTags(tags.filter(x => x !== t));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:580}}>
        <div className="modal-head">
          <h3><Icon name="bookmark" size={14} style={{marginRight:6,verticalAlign:-2}} />Save a reference</h3>
          <button className="x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>URL</label>
            <input defaultValue="https://annie.substack.com/p/reading-like-an-artist" autoFocus />
            <div className="hint" style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)'}}></span>
              Fetched preview · auto-detected as <b style={{color:'var(--fg)'}}>essay</b>
            </div>
          </div>

          <div className="add-preview">
            <div className="img" style={{background:'linear-gradient(135deg,#b46a2a,#f4b860 70%,#d97757)'}}></div>
            <div className="meta">
              <div className="src"><span className="fav" style={{background:'#ff6719'}}>SS</span>annie.substack.com</div>
              <div className="t">On reading like an artist</div>
              <div className="d">"The point of reading is not to finish the book. It is to be changed by it — even a little, even in places you can't name."</div>
            </div>
          </div>

          <div className="field">
            <label>For which post? <span style={{color:'var(--fg-soft)',fontWeight:500}}>· attaches this as a reference</span></label>
            <select defaultValue="bookmarks">
              <option value="">— Not attached to a post —</option>
              <option value="bookmarks">📝  A small theory of bookmarks (draft · 740w)</option>
              <option value="plaintext">📝  Notes on plaintext (published)</option>
              <option value="new">＋  Start a new post with this reference</option>
            </select>
          </div>

          <div className="field">
            <label>Your note <span style={{color:'var(--fg-soft)',fontWeight:500}}>· why this matters to your essay</span></label>
            <textarea placeholder="Future-you will thank you." defaultValue="The line about being changed even in places you can't name — that's the whole thesis of the bookmarks essay." />
          </div>

          <div className="field">
            <label>Tags</label>
            <div className="tag-input">
              {tags.map(t => (
                <span key={t} className="pill">#{t} <span className="x" onClick={() => removeTag(t)}>✕</span></span>
              ))}
              <input placeholder="Add a tag…" />
            </div>
            <div className="tag-suggestions">
              <span className="s" onClick={() => setTags([...tags, 'reading'])}><span className="plus">+</span>reading</span>
              <span className="s"><span className="plus">+</span>attention</span>
              <span className="s"><span className="plus">+</span>writing</span>
              <span style={{fontSize:11,color:'var(--fg-soft)',padding:'3px 4px'}}>· suggested from content</span>
            </div>
          </div>

          <div className="field">
            <label>Collection <span style={{color:'var(--fg-soft)',fontWeight:500}}>· optional</span></label>
            <select defaultValue="reading">
              <option value="reading">📖  Reading list</option>
              <option value="essays">✍️  Essays I love</option>
              <option value="quotes">❝  Pulled quotes</option>
              <option value="">— No collection —</option>
              <option value="new">＋  Create new collection…</option>
            </select>
          </div>

          <div className="field">
            <label>Visibility</label>
            <div className="vis-row">
              <div className={'vis-choice ' + (vis === 'private' ? 'on' : '')} onClick={() => setVis('private')}>
                <div className="l"><Icon name="lock" size={13} /> Private</div>
                <div className="d">Only you can see it</div>
              </div>
              <div className={'vis-choice ' + (vis === 'unlisted' ? 'on' : '')} onClick={() => setVis('unlisted')}>
                <div className="l"><Icon name="link" size={13} /> Unlisted</div>
                <div className="d">Anyone with the link</div>
              </div>
              <div className={'vis-choice ' + (vis === 'public' ? 'on' : '')} onClick={() => setVis('public')}>
                <div className="l"><Icon name="globe" size={13} /> Public</div>
                <div className="d">In your public grimoire</div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <div className="left">
            <span className="kbd">⌘</span><span className="kbd">↵</span> to save
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm">
            <Icon name="bookmark" size={13} /> Save link
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---- COMMAND PALETTE ---- */
const CommandPalette = ({ onClose }) => {
  const items = {
    'Quick actions': [
      { ico: 'pen',      t: 'Start a new post',          s: 'Markdown editor · ⌘+N anywhere', k: '⌘ N' },
      { ico: 'feather',  t: 'Continue your draft',       s: 'A small theory of bookmarks · 740w', k: '⌘ ⏎' },
      { ico: 'sparkles', t: 'AI: find related in archive', s: 'Three of your saves that fit this paragraph', k: '⌘ /' },
      { ico: 'bookmark', t: 'Save a reference',          s: 'Paste URL · attach to current draft', k: '⌘ S' },
    ],
    'Jump to': [
      { ico: 'feather',  t: 'My Posts',       s: '12 posts · 2 drafts',  k: 'G W' },
      { ico: 'globe',    t: 'My public page', s: 'maya.grimoire.so',     k: 'G P' },
      { ico: 'bookmark', t: 'Saved references', s: '247 items', k: 'G S' },
      { ico: 'cmd',      t: 'Settings',       s: 'Profile · Themes · API', k: '⌘ ,' },
    ],
    'Recent posts': [
      { ico: 'feather',  t: 'A small theory of bookmarks',  s: 'draft · 740 words · edited yesterday' },
      { ico: 'feather',  t: 'Notes on plaintext, again',    s: 'published · 412 reads · May 14' },
      { ico: 'feather',  t: 'Untitled draft',                s: 'just now · 0 words' },
    ],
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" size={16} />
          <input placeholder="Search or run a command…" autoFocus defaultValue="" />
          <span className="kbd">esc</span>
        </div>
        <div className="palette-list">
          {Object.entries(items).map(([group, list]) => (
            <React.Fragment key={group}>
              <div className="palette-group">{group}</div>
              {list.map((it, i) => (
                <div key={i} className={'palette-item' + (group === 'Quick actions' && i === 0 ? ' active' : '')}>
                  <div className="ico"><Icon name={it.ico} size={13} /></div>
                  <div className="text">
                    <div className="t">{it.t}</div>
                    <div className="s">{it.s}</div>
                  </div>
                  {it.k && <span className="kbd">{it.k}</span>}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="palette-foot">
          <span className="grp"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span className="grp"><span className="kbd">↵</span> open</span>
          <span className="grp"><span className="kbd">⌘</span><span className="kbd">↵</span> open in new tab</span>
          <span className="grp" style={{marginLeft:'auto'}}><span className="kbd">esc</span> close</span>
        </div>
      </div>
    </div>
  );
};

/* ---- PROFILE DROPDOWN — shown over a mini header ---- */
const ProfileDropdown = ({ theme, setTheme }) => (
  <div className="dd-stage">
    {/* mini fake app header for context */}
    <div style={{
      borderBottom:'1px solid var(--border)', padding:'14px 28px',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      background:'var(--bg-soft)'
    }}>
      <div style={{display:'flex',alignItems:'center',gap:10,fontWeight:700,letterSpacing:'-0.02em'}}>
        <span style={{color:'var(--accent)'}}><BrandMark size={24} /></span>
        Grimoire
      </div>
      <div style={{flex:1}}></div>
      <div className="search-input" style={{width:280}}>
        <Icon name="search" size={14} />
        <input placeholder="Search…" />
      </div>
    </div>

    <div className="dd-anchor">
      <button className="dd-trigger">
        <div className="avatar" style={{width:30,height:30,fontSize:11,borderWidth:0,background:'linear-gradient(135deg,#5b54d6,#8e8df0)'}}>AB</div>
        <div style={{textAlign:'left',lineHeight:1.1}}>
          <div style={{fontSize:13,fontWeight:600}}>abhishek</div>
          <div style={{fontSize:11,color:'var(--fg-soft)'}}>@sysnode</div>
        </div>
        <Icon name="chevron-right" size={13} style={{transform:'rotate(90deg)',color:'var(--fg-soft)'}} />
      </button>

      <div className="dd-menu">
        <div className="dd-profile">
          <div className="avatar" style={{width:38,height:38,fontSize:14,borderWidth:0,background:'linear-gradient(135deg,#5b54d6,#8e8df0)'}}>AB</div>
          <div style={{minWidth:0,flex:1}}>
            <div className="name">abhishek</div>
            <div className="email">abhishek@sysnode.in</div>
          </div>
          <span className="badge">FREE</span>
        </div>

        <div className="dd-item"><Icon name="feather" size={14} /> My posts <span className="kbd">G W</span></div>
        <div className="dd-item"><Icon name="globe" size={14} /> View public page <span className="kbd">G P</span></div>
        <div className="dd-item"><Icon name="bookmark" size={14} /> Saved references <span className="kbd">G S</span></div>

        <div className="dd-sep"></div>

        <div className="dd-item"><Icon name="cmd" size={14} /> Settings <span className="kbd">⌘ ,</span></div>
        <div className="dd-item"><Icon name="zap" size={14} /> Import / export</div>
        <div className="dd-item"><Icon name="rss" size={14} /> API & integrations</div>
        <div className="dd-item"><Icon name="sparkles" size={14} /> Upgrade to Pro</div>

        <div className="dd-sep"></div>

        <div style={{fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--fg-soft)',padding:'4px 10px',fontWeight:700}}>Theme</div>
        <div className="dd-theme-row">
          {[
            { id:'light',    bg:'linear-gradient(135deg,#f6f5fa 50%,#5b54d6 50%)' },
            { id:'dark',     bg:'linear-gradient(135deg,#0c0f14 50%,#3ee07a 50%)' },
            { id:'geek',     bg:'linear-gradient(135deg,#f3f4ed 50%,#2da14e 50%)' },
            { id:'midnight', bg:'linear-gradient(135deg,#061114 50%,#36e0c4 50%)' },
          ].map(p => (
            <button key={p.id}
              className={'dd-pip' + (theme === p.id ? ' active' : '')}
              style={{background: p.bg}}
              onClick={() => setTheme(p.id)}
              title={p.id} />
          ))}
        </div>

        <div className="dd-sep"></div>

        <div className="dd-item danger"><Icon name="lock" size={14} /> Sign out <span className="kbd">⌘ ⇧ Q</span></div>
      </div>
    </div>
  </div>
);

/* ---- MOBILE DRAWER ---- */
const MobileDrawer = () => (
  <div style={{background:'var(--bg)',minHeight:'100vh',padding:'20px 0'}}>
    <div className="mobile-frame">
      <div className="mobile-stage">
        <div className="mobile-app" style={{
          background:'var(--bg)',
          padding:'18px 16px',
          color:'var(--fg)'
        }}>
          {/* underlying content visible behind drawer */}
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <div style={{flex:1,height:38,borderRadius:10,background:'var(--bg-soft)'}}></div>
            <div style={{width:38,height:38,borderRadius:10,background:'var(--bg-soft)'}}></div>
          </div>
          <div style={{height:90,borderRadius:14,background:'var(--bg-elev)',marginBottom:10}}></div>
          <div style={{height:90,borderRadius:14,background:'var(--bg-elev)',marginBottom:10}}></div>
          <div style={{height:90,borderRadius:14,background:'var(--bg-elev)'}}></div>
        </div>

        <div className="mobile-drawer">
          <div className="close">✕</div>
          <div className="side-brand" style={{padding:'0 4px 14px',borderBottom:'1px solid var(--border)',marginBottom:10}}>
            <span className="brand-mark"><BrandMark size={22} /></span>
            <span>Grimoire</span>
          </div>
          <div className="side-nav">
            <div className="side-item active"><Icon name="feather" size={15} /><span>My Posts</span><span className="count">12</span></div>
            <div className="side-item"><Icon name="pen" size={15} /><span>New Post</span></div>
            <div className="side-item"><Icon name="sparkles" size={15} /><span>Read</span></div>
            <div className="side-item"><Icon name="bookmark" size={15} /><span>Saved</span><span className="count">247</span></div>
            <div className="side-item"><Icon name="globe" size={15} /><span>Public</span><span className="count">84</span></div>
            <div className="side-item"><Icon name="star" size={15} /><span>Starred</span><span className="count">21</span></div>
          </div>
          <div className="side-heading"><span>Collections</span></div>
          <div className="side-coll"><span className="swatch" style={{background:'#5b54d6'}}></span><span>Essays I love</span><span className="count">38</span></div>
          <div className="side-coll"><span className="swatch" style={{background:'#2f7d4d'}}></span><span>Reading list</span><span className="count">64</span></div>
          <div className="side-coll"><span className="swatch" style={{background:'#b46a2a'}}></span><span>Pulled quotes</span><span className="count">27</span></div>

          <div className="side-foot" style={{margin:'auto -14px 0',padding:'10px 14px'}}>
            <div className="avatar" style={{background:'linear-gradient(135deg,#5b54d6,#8e8df0)'}}>AB</div>
            <div className="who"><div className="n">abhishek</div><div className="e">@sysnode</div></div>
            <Icon name="cmd" size={14} />
          </div>
        </div>
      </div>
    </div>
    <div style={{textAlign:'center',color:'var(--fg-soft)',fontSize:12,marginTop:6}}>
      Mobile drawer — tap brand to open, swipe right to close
    </div>
  </div>
);

/* ---- TOASTS ---- */
const ToastShowcase = () => (
  <div style={{background:'var(--bg)',minHeight:'100vh',padding:'48px 28px',position:'relative'}}>
    <div style={{maxWidth:680,margin:'0 auto'}}>
      <h1 style={{margin:'0 0 6px',fontSize:26,letterSpacing:'-0.025em',fontWeight:700}}>Feedback patterns</h1>
      <p style={{color:'var(--fg-muted)',marginBottom:28}}>Toasts, undo strips and inline confirmations. None of them are blocking.</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <button className="btn btn-ghost">Show success</button>
        <button className="btn btn-ghost">Show error</button>
        <button className="btn btn-ghost">Show with action</button>
        <button className="btn btn-ghost">Show progress</button>
      </div>

      <div className="empty" style={{marginTop:28}}>
        <div className="ico"><Icon name="bookmark" size={26} /></div>
        <h3>No starred saves yet</h3>
        <p>Star the links you keep coming back to — they'll show up here for one-tap access from any device.</p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button className="btn btn-primary btn-sm"><Icon name="bookmark" size={13} /> Browse all links</button>
          <button className="btn btn-ghost btn-sm"><Icon name="globe" size={13} /> Import from Pocket</button>
        </div>
        <div className="quick-tips">
          <span className="chip">Tip: <span className="kbd">⌘ S</span> to save from any site</span>
          <span className="chip">Tip: <span className="kbd">⌘ K</span> to search everything</span>
        </div>
      </div>
    </div>

    <div className="toast-stack">
      <div className="toast success">
        <span className="stripe"></span>
        <div className="ico"><Icon name="bookmark" size={14} /></div>
        <div className="text">
          <div className="t">Reference attached to <b>your draft</b></div>
          <div className="d">"On reading like an artist" → A small theory of bookmarks</div>
          <div className="actions">
            <button>Open draft</button>
            <button>Attach to another post</button>
            <button style={{color:'var(--fg-muted)'}}>Undo</button>
          </div>
        </div>
        <button className="close">✕</button>
      </div>

      <div className="toast info">
        <span className="stripe"></span>
        <div className="ico"><Icon name="sparkles" size={14} /></div>
        <div className="text">
          <div className="t">3 references from your archive fit this paragraph</div>
          <div className="d">Open the palette to insert them inline.</div>
        </div>
        <button className="close">✕</button>
      </div>

      <div className="toast error">
        <span className="stripe"></span>
        <div className="ico"><Icon name="globe" size={14} /></div>
        <div className="text">
          <div className="t">Couldn't fetch preview</div>
          <div className="d">drive.google.com requires sign-in. Reference saved without preview.</div>
          <div className="actions">
            <button>Retry</button>
            <button>Add manually</button>
          </div>
        </div>
        <button className="close">✕</button>
      </div>
    </div>
  </div>
);

Object.assign(window, { AddLinkModal, CommandPalette, ProfileDropdown, MobileDrawer, ToastShowcase });
