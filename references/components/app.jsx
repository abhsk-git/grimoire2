const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "loggedIn": false
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  return (
    <div className="app" data-screen-label={t.loggedIn ? 'Logged-in dashboard landing' : 'Marketing landing'}>
      <Header loggedIn={t.loggedIn} onSignOut={() => setTweak('loggedIn', false)} />

      {t.loggedIn ? <HeroLoggedIn /> : <HeroLoggedOut />}

      {!t.loggedIn && <HowItWorks />}
      <Features />
      <Discover />
      <CTAStrip />

      <Footer theme={t.theme} setTheme={(v) => setTweak('theme', v)} />

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
              { value: 'light',    label: 'Light — paper green' },
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
