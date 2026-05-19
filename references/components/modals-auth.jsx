/* ============ AUTH SCREENS ============ */

const AuthArt = () => (
  <div className="auth-art">
    <div className="brand-row">
      <span className="brand-mark"><BrandMark size={28} /></span>
      <span>Grimoire</span>
    </div>

    <div className="floats">
      <div className="card c1">
        <div className="src"><span className="fav" style={{background:'#ff6719'}}>SS</span>annie.substack.com</div>
        <div className="t">On reading like an artist</div>
      </div>
      <div className="card c2">
        <div className="src"><span className="fav" style={{background:'#171717'}}>GH</span>github.com</div>
        <div className="t">tldraw — infinite canvas SDK</div>
      </div>
      <div className="card c3">
        <div className="src"><span className="fav" style={{background:'#1f6fd9'}}>D</span>drive.google.com</div>
        <div className="t">SQL Notes — Joins & windows</div>
      </div>
    </div>

    <div className="auth-quote">
      "I write to find out <span className="accent">what I think.</span>
      Everything else — the links, the highlights, the saved articles —
      is just the conversation I'm having with myself in the margins."
    </div>
    <div className="auth-credit">
      <div className="avatar" style={{width:24,height:24,fontSize:10,borderWidth:0,background:'linear-gradient(135deg,#b46a2a,#f4b860)'}}>MC</div>
      <span><b>Maya Chen</b> · from <i>Notes on plaintext, again</i></span>
    </div>
  </div>
);

const SignInForm = ({ switchTo }) => (
  <div className="auth-form-wrap">
    <div className="auth-form">
      <div className="brand-row">
        <span className="brand-mark" style={{color:'var(--accent)'}}><BrandMark size={26} /></span>
        <span>Grimoire</span>
      </div>
      <h1>Welcome back.</h1>
      <p className="sub">Sign in to open your grimoire.</p>

      <div className="auth-providers">
        <button className="btn btn-ghost"><GoogleIcon /> Continue with Google</button>
        <button className="btn btn-ghost"><GitHubIcon /> Continue with GitHub</button>
      </div>

      <div className="divider">or with email</div>

      <div className="field">
        <label>Email</label>
        <input type="email" placeholder="you@somewhere.in" defaultValue="abhishek@sysnode.in" />
      </div>
      <div className="field">
        <label style={{display:'flex',justifyContent:'space-between'}}>
          Password
          <a onClick={() => switchTo('forgot')} style={{color:'var(--accent)',fontWeight:600,fontSize:11,cursor:'pointer'}}>Forgot?</a>
        </label>
        <input type="password" placeholder="••••••••••" defaultValue="••••••••••" />
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18}}>
        <div className="switch on"></div>
        <span style={{fontSize:13,color:'var(--fg-muted)'}}>Keep me signed in on this device</span>
      </div>

      <button className="btn btn-primary" style={{width:'100%'}}>
        Sign in <Icon name="arrow-right" size={14} />
      </button>

      <div className="auth-foot">
        New to Grimoire? <a onClick={() => switchTo('signup')} style={{cursor:'pointer'}}>Create an account</a>
      </div>
    </div>
  </div>
);

const SignUpForm = ({ switchTo }) => (
  <div className="auth-form-wrap">
    <div className="auth-form">
      <div className="brand-row">
        <span className="brand-mark" style={{color:'var(--accent)'}}><BrandMark size={26} /></span>
        <span>Grimoire</span>
      </div>
      <h1>Start writing.</h1>
      <p className="sub">Free forever for personal use. No credit card.</p>

      <div className="auth-providers">
        <button className="btn btn-ghost"><GoogleIcon /> Sign up with Google</button>
        <button className="btn btn-ghost"><GitHubIcon /> Sign up with GitHub</button>
      </div>
      <div className="divider">or with email</div>

      <div className="field-row">
        <div className="field">
          <label>Display name</label>
          <input placeholder="Abhishek" defaultValue="Abhishek" />
        </div>
        <div className="field">
          <label>Handle</label>
          <input placeholder="username" defaultValue="abhishek" />
          <div className="hint">grimoire.so/<b style={{color:'var(--fg)'}}>abhishek</b></div>
        </div>
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" placeholder="you@example.com" />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" placeholder="At least 10 characters" defaultValue="••••••••••••" />
        <div className="password-strength">
          <span className="on"></span><span className="on"></span><span className="on"></span><span></span>
        </div>
        <div className="hint">Strong — three out of four. Add a number for one more.</div>
      </div>

      <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:18,fontSize:12,color:'var(--fg-muted)'}}>
        <input type="checkbox" defaultChecked style={{marginTop:2}} />
        <span>I agree to the <a style={{color:'var(--accent)',fontWeight:600}}>Terms</a> and acknowledge the <a style={{color:'var(--accent)',fontWeight:600}}>Privacy Policy</a>.</span>
      </div>

      <button className="btn btn-primary" style={{width:'100%'}}>
        Open my editor <Icon name="arrow-right" size={14} />
      </button>

      <div className="auth-foot">
        Already have an account? <a onClick={() => switchTo('signin')} style={{cursor:'pointer'}}>Sign in</a>
      </div>
    </div>
  </div>
);

const ForgotForm = ({ switchTo }) => (
  <div className="auth-form-wrap">
    <div className="auth-form">
      <div className="brand-row">
        <span className="brand-mark" style={{color:'var(--accent)'}}><BrandMark size={26} /></span>
        <span>Grimoire</span>
      </div>
      <h1>Reset your password.</h1>
      <p className="sub">We'll email you a one-time sign-in link. No password reset spirals.</p>

      <div className="field">
        <label>Email</label>
        <input type="email" placeholder="you@example.com" defaultValue="abhishek@sysnode.in" />
      </div>

      <button className="btn btn-primary" style={{width:'100%'}}>
        Send me a magic link <Icon name="zap" size={14} />
      </button>

      <div className="toggle-row" style={{marginTop:18}}>
        <div className="ico"><Icon name="inbox" size={16} /></div>
        <div className="text">
          <div className="t">Check your inbox</div>
          <div className="d">Link expires in 15 minutes. Didn't get it? <a style={{color:'var(--accent)',fontWeight:600}}>Resend.</a></div>
        </div>
      </div>

      <div className="auth-foot">
        Remembered it? <a onClick={() => switchTo('signin')} style={{cursor:'pointer'}}>Back to sign in</a>
      </div>
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18">
    <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.69-1.56 2.69-3.86 2.69-6.62z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.46-.81 5.95-2.18l-2.9-2.26c-.81.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.34A9 9 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3-2.34z" fill="#FBBC05"/>
    <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3 2.34C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);
const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.83-.27.83-.59v-2.1c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.49.99.1-.77.42-1.3.76-1.6-2.66-.3-5.47-1.34-5.47-5.94 0-1.32.47-2.4 1.24-3.25-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.85 1.23 1.93 1.23 3.25 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.83.59A12 12 0 0 0 12 .3z"/>
  </svg>
);

Object.assign(window, { AuthArt, SignInForm, SignUpForm, ForgotForm });
