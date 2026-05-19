/* Public Explore page — standalone shell with simple header (no sidebar) */

const { useState: useStateE, useEffect: useEffectE } = React;

const EXPLORE_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "midnight",
  "loggedIn": true
}/*EDITMODE-END*/;

const PublicHeader = ({ loggedIn, onSignOut }) => (
  <header className="public-header">
    <div className="public-header-inner">
      <a href="#" className="brand">
        <span className="brand-mark"><BrandMark size={28} /></span>
        <span>Grimoire</span>
      </a>

      <div className="public-search">
        <Icon name="search" size={15} />
        <input placeholder="Search posts, writers, tags…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="public-header-right">
        {loggedIn ? (
          <>
            <button className="btn btn-primary btn-sm public-dash">
              My Dashboard <Icon name="arrow-right" size={13} />
            </button>
            <button className="btn btn-ghost btn-sm">
              <Icon name="pen" size={13} /> Write
            </button>
            <button className="icon-btn" aria-label="Theme"><Icon name="sun" size={16} /></button>
            <button className="avatar" onClick={onSignOut} title="Sign out (demo)"
              style={{background:'linear-gradient(135deg,#5b54d6,#8e8df0)'}}>AB</button>
          </>
        ) : (
          <>
            <button className="icon-btn" aria-label="Theme"><Icon name="sun" size={16} /></button>
            <button className="btn btn-ghost btn-sm">Sign in</button>
            <button className="btn btn-primary btn-sm">
              Get started <Icon name="arrow-right" size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  </header>
);

function ExploreApp() {
  const [t, setTweak] = useTweaks(EXPLORE_TWEAKS);

  useEffectE(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  return (
    <div className="explore-page" data-screen-label={t.loggedIn ? 'Explore — signed in' : 'Explore — public'}>
      <PublicHeader loggedIn={t.loggedIn} onSignOut={() => setTweak('loggedIn', false)} />
      <main className="public-main">
        <div className="container-wide">
          <ExploreView />
        </div>
      </main>
      <footer className="public-foot">
        <div className="container-wide" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10,fontWeight:600}}>
            <span style={{color:'var(--accent)'}}><BrandMark size={20} /></span>
            <span>Grimoire</span>
            <span style={{color:'var(--fg-soft)',fontWeight:400,fontSize:13}}>· a quiet writing tool with a memory</span>
          </div>
          <div style={{display:'flex',gap:18,fontSize:13,color:'var(--fg-muted)'}}>
            <a>About</a>
            <a>Manifesto</a>
            <a>Privacy</a>
            <a>RSS</a>
            <a>Open API</a>
          </div>
        </div>
      </footer>

      <TweaksPanel title="Tweaks">
        <TweakSection label="View">
          <TweakRadio
            label="Auth state"
            value={t.loggedIn ? 'in' : 'out'}
            onChange={(v) => setTweak('loggedIn', v === 'in')}
            options={[
              { value: 'out', label: 'Logged out' },
              { value: 'in',  label: 'Logged in' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Theme">
          <TweakSelect
            label="Palette"
            value={t.theme}
            onChange={(v) => setTweak('theme', v)}
            options={[
              { value: 'light',    label: 'Light — indigo' },
              { value: 'dark',     label: 'Dark — neon green' },
              { value: 'geek',     label: 'Geek — terminal mono' },
              { value: 'midnight', label: 'Midnight — teal' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ExploreApp />);
