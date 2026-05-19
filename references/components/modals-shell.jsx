/* Shell — navigation through all the new interfaces */

const { useState: useStateM, useEffect: useEffectM } = React;

const MODAL_TWEAKS = /*EDITMODE-BEGIN*/{
  "screen": "pub",
  "theme": "light"
}/*EDITMODE-END*/;

function ModalsShell() {
  const [t, setTweak] = useTweaks(MODAL_TWEAKS);
  const [authMode, setAuthMode] = useStateM('signin');
  const [_, force] = useStateM({});

  useEffectM(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  const screens = {
    signin:    { label: '01 — Sign in',          group: 'Auth' },
    signup:    { label: '02 — Sign up',          group: 'Auth' },
    forgot:    { label: '03 — Forgot password',  group: 'Auth' },
    addlink:   { label: '04 — Add Link modal',   group: 'Overlays' },
    palette:   { label: '05 — Command palette',  group: 'Overlays' },
    profile:   { label: '06 — Profile dropdown', group: 'Overlays' },
    drawer:    { label: '07 — Mobile drawer',    group: 'Overlays' },
    toasts:    { label: '08 — Toasts + empty',   group: 'Overlays' },
    settings:  { label: '09 — Settings page',    group: 'Pages' },
    reader:    { label: '10 — Link reader',      group: 'Pages' },
    coll:      { label: '11 — Collection detail',group: 'Pages' },
    pub:       { label: '12 — Public profile',   group: 'Pages' },
  };

  const setScreen = (v) => setTweak('screen', v);

  // For overlays (add-link, palette), render the dashboard background dimmed underneath
  const renderUnderlay = ['addlink', 'palette'].includes(t.screen);

  return (
    <div data-screen-label={screens[t.screen]?.label || t.screen}>
      {/* Some screens are full-page replacements */}
      {(t.screen === 'signin' || t.screen === 'signup' || t.screen === 'forgot') && (
        <div className="auth-shell">
          <AuthArt />
          {t.screen === 'signin' && <SignInForm switchTo={setScreen} />}
          {t.screen === 'signup' && <SignUpForm switchTo={setScreen} />}
          {t.screen === 'forgot' && <ForgotForm switchTo={setScreen} />}
        </div>
      )}

      {t.screen === 'settings' && <SettingsPage />}
      {t.screen === 'reader'   && <LinkReader />}
      {t.screen === 'coll'     && <CollectionDetail />}
      {t.screen === 'pub'      && <PublicProfile />}
      {t.screen === 'profile'  && <ProfileDropdown theme={t.theme} setTheme={(v) => setTweak('theme', v)} />}
      {t.screen === 'drawer'   && <MobileDrawer />}
      {t.screen === 'toasts'   && <ToastShowcase />}

      {/* Overlays render a dimmed dashboard underneath */}
      {renderUnderlay && (
        <>
          <DashUnderlay />
          {t.screen === 'addlink' && <AddLinkModal onClose={() => setScreen('settings')} />}
          {t.screen === 'palette' && <CommandPalette onClose={() => setScreen('settings')} />}
        </>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Screen">
          <TweakSelect
            label="View"
            value={t.screen}
            onChange={setScreen}
            options={Object.entries(screens).map(([v, m]) => ({ value: v, label: m.label }))}
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

/* Simple dashboard backdrop for the overlays */
const DashUnderlay = () => (
  <div style={{
    minHeight:'100vh', background:'var(--bg)',
    display:'grid', gridTemplateColumns:'248px 1fr'
  }}>
    <div style={{borderRight:'1px solid var(--border)',background:'var(--bg-soft)',padding:18}}>
      <div style={{display:'flex',alignItems:'center',gap:10,fontWeight:700,marginBottom:18,letterSpacing:'-0.02em'}}>
        <span style={{color:'var(--accent)'}}><BrandMark size={24} /></span>
        Grimoire
      </div>
      {DASH_NAV.slice(0, 6).map((n, i) => (
        <div key={n.id} style={{
          display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:8,
          fontSize:14,color:i===0 ? 'var(--accent-ink)':'var(--fg-muted)',
          background:i===0 ? 'var(--accent-soft)':'none',
          fontWeight: i===0 ? 600 : 500
        }}>
          <Icon name={n.ico} size={15} />
          <span>{n.label}</span>
          {n.count != null && <span style={{marginLeft:'auto',fontSize:11,color:'var(--fg-soft)'}}>{n.count}</span>}
        </div>
      ))}
    </div>
    <div style={{padding:28}}>
      <div style={{display:'flex',gap:10,marginBottom:18}}>
        <div style={{flex:1,height:40,borderRadius:12,background:'var(--bg-elev)',border:'1px solid var(--border)'}}></div>
        <div style={{width:40,height:40,borderRadius:10,background:'var(--bg-elev)',border:'1px solid var(--border)'}}></div>
        <div style={{width:110,height:40,borderRadius:999,background:'var(--accent)'}}></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {Array.from({length:6}).map((_, i) => (
          <div key={i} style={{height:280,borderRadius:14,background:'var(--bg-elev)',border:'1px solid var(--border)'}}></div>
        ))}
      </div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<ModalsShell />);
