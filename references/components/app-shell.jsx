/* App shell — top-level navigation + theme */

const { useState: useStateA, useEffect: useEffectA } = React;

const APP_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "view": "posts",
  "viewMode": "grid"
}/*EDITMODE-END*/;

function AppShell() {
  const [t, setTweak] = useTweaks(APP_TWEAKS);
  const [drawerOpen, setDrawerOpen] = useStateA(false);

  useEffectA(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  const labels = {
    posts:'01 My Posts', editor:'02 Editor', explore:'03 Read',
    all:'04 Saved', public:'05 Public saves', private:'06 Private saves', starred:'07 Starred'
  };

  return (
    <div className="shell" data-screen-label={labels[t.view] || t.view}>
      <Sidebar view={t.view} setView={(v) => setTweak('view', v)}
               open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className={'drawer-backdrop' + (drawerOpen ? ' open' : '')}
           onClick={() => setDrawerOpen(false)}></div>
      <div className="main">
        <AppHeader
          view={t.view}
          viewMode={t.viewMode}
          setViewMode={(v) => setTweak('viewMode', v)}
          onMenu={() => setDrawerOpen(true)}
        />
        <div className="main-body">
          {(t.view === 'all' || t.view === 'public' || t.view === 'private' || t.view === 'starred') && (
            <AllLinksView viewMode={t.viewMode} filter={t.view} />
          )}
          {t.view === 'explore' && <ExploreView />}
          {t.view === 'posts'   && <MyPostsView />}
          {t.view === 'editor'  && <EditorView />}
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Navigate">
          <TweakSelect
            label="View"
            value={t.view}
            onChange={(v) => setTweak('view', v)}
            options={[
              { value: 'posts',   label: '01 — My posts' },
              { value: 'editor',  label: '02 — Post editor' },
              { value: 'explore', label: '03 — Read community' },
              { value: 'all',     label: '04 — Saved (references)' },
              { value: 'public',  label: '05 — Public saves' },
              { value: 'private', label: '06 — Private saves' },
              { value: 'starred', label: '07 — Starred' },
            ]}
          />
          <TweakRadio
            label="Layout"
            value={t.viewMode}
            onChange={(v) => setTweak('viewMode', v)}
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'list', label: 'List' },
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

ReactDOM.createRoot(document.getElementById('root')).render(<AppShell />);
