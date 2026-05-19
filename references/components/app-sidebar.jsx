/* Sidebar + header for app shell */

const Sidebar = ({ view, setView, open, onClose }) => {
  return (
    <aside className={'side' + (open ? ' open' : '')}>
      <div className="side-brand">
        <span className="brand-mark"><BrandMark size={26} /></span>
        <span>Grimoire</span>
      </div>

      <div className="side-nav">
        {DASH_NAV.map(n => (
          <div key={n.id}
            className={'side-item' + (view === n.id ? ' active' : '')}
            onClick={() => { setView(n.id); onClose && onClose(); }}>
            <Icon name={n.ico} size={16} />
            <span>{n.label}</span>
            {n.count != null && <span className="count">{n.count}</span>}
          </div>
        ))}
      </div>

      <div className="side-heading">
        <span>Collections</span>
        <button title="New collection"><Icon name="plus" size={13} /></button>
      </div>
      <div>
        {DASH_COLLECTIONS.map((c, i) => (
          <div key={i} className="side-coll">
            <span className="swatch" style={{background: c.color}}></span>
            <span>{c.name}</span>
            <span className="count">{c.count}</span>
          </div>
        ))}
      </div>

      <div className="side-heading"><span>Tags</span></div>
      <div className="side-tags">
        {DASH_TAGS.map(t => (
          <span key={t.t} className="tag">#{t.t} <span className="n">{t.n}</span></span>
        ))}
      </div>

      <div className="side-foot">
        <div className="avatar" style={{background:'linear-gradient(135deg,#5b54d6,#8e8df0)'}}>AB</div>
        <div className="who">
          <div className="n">abhishek</div>
          <div className="e">abhishek@sysnode.in</div>
        </div>
        <button className="icon-btn" style={{width:28,height:28,borderRadius:6}}><Icon name="cmd" size={13} /></button>
      </div>
    </aside>
  );
};

const AppHeader = ({ viewMode, setViewMode, onAdd, view, onMenu }) => {
  return (
    <>
      <div className="mobile-topbar">
        <button className="hamburger" onClick={onMenu} aria-label="Open menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="3" width="14" height="2" rx="1"/>
            <rect x="1" y="7" width="14" height="2" rx="1"/>
            <rect x="1" y="11" width="14" height="2" rx="1"/>
          </svg>
        </button>
        <div className="brand">
          <span className="brand-mark"><BrandMark size={22} /></span>
          Grimoire
        </div>
        <div style={{flex:1}}></div>
        <button className="icon-btn" aria-label="Search" style={{width:36,height:36}}><Icon name="search" size={15} /></button>
        <button className="btn btn-primary btn-sm" style={{padding:'0 12px'}}>
          <Icon name="pen" size={13} /> New
        </button>
      </div>

      <div className="main-header">
      <div className="main-search">
        <Icon name="search" size={15} />
        <input placeholder="Search links, tags, notes…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="spacer" style={{flex:1}}></div>

      <button className="icon-btn" title="Theme"><Icon name="sun" size={16} /></button>

      {view !== 'editor' && view !== 'posts' && (
        <div className="view-toggle">
          <button className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')} title="Grid view">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1.2"/>
              <rect x="9" y="1" width="6" height="6" rx="1.2"/>
              <rect x="1" y="9" width="6" height="6" rx="1.2"/>
              <rect x="9" y="9" width="6" height="6" rx="1.2"/>
            </svg>
          </button>
          <button className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')} title="List view">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" rx="1"/>
              <rect x="1" y="7" width="14" height="2" rx="1"/>
              <rect x="1" y="12" width="14" height="2" rx="1"/>
            </svg>
          </button>
        </div>
      )}

      {view !== 'editor' && (
        <button className="icon-btn" title="Save a reference (⌘ S)" onClick={onAdd}>
          <Icon name="bookmark" size={15} />
        </button>
      )}
      <button className="btn btn-primary btn-sm">
        <Icon name="pen" size={14} /> New post
      </button>
      </div>
    </>
  );
};

Object.assign(window, { Sidebar, AppHeader });
