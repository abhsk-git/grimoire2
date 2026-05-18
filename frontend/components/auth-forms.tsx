"use client";

import { useState } from "react";
import { BrandMark, Icon } from "./icons";

type FormView = "signin" | "signup" | "forgot";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.69-1.56 2.69-3.86 2.69-6.62z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.46-.81 5.95-2.18l-2.9-2.26c-.81.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.34A9 9 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3-2.34z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3 2.34C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.83-.27.83-.59v-2.1c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.49.99.1-.77.42-1.3.76-1.6-2.66-.3-5.47-1.34-5.47-5.94 0-1.32.47-2.4 1.24-3.25-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.85 1.23 1.93 1.23 3.25 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.83.59A12 12 0 0 0 12 .3z" />
    </svg>
  );
}

export function AuthArt() {
  return (
    <div className="auth-art">
      <div className="brand-row">
        <span className="brand-mark">
          <BrandMark size={28} />
        </span>
        <span>Grimoire</span>
      </div>

      <div className="floats">
        <div className="card c1">
          <div className="src">
            <span className="fav" style={{ background: "#ff6719" }}>SS</span>
            annie.substack.com
          </div>
          <div className="t">On reading like an artist</div>
        </div>
        <div className="card c2">
          <div className="src">
            <span className="fav" style={{ background: "#171717" }}>GH</span>
            github.com
          </div>
          <div className="t">tldraw — infinite canvas SDK</div>
        </div>
        <div className="card c3">
          <div className="src">
            <span className="fav" style={{ background: "#1f6fd9" }}>D</span>
            drive.google.com
          </div>
          <div className="t">SQL Notes — Joins &amp; windows</div>
        </div>
      </div>

      <div className="auth-quote">
        &ldquo;I write to find out{" "}
        <span className="accent">what I think.</span> Everything else — the
        links, the highlights, the saved articles — is just the conversation
        I&rsquo;m having with myself in the margins.&rdquo;
      </div>
      <div className="auth-credit">
        <div
          className="avatar"
          style={{
            width: 24,
            height: 24,
            fontSize: 10,
            borderWidth: 0,
            background: "linear-gradient(135deg,#b46a2a,#f4b860)",
          }}
        >
          MC
        </div>
        <span>
          <b>Maya Chen</b> · from <i>Notes on plaintext, again</i>
        </span>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const score = [len >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  const labels = ["", "Weak", "Fair", "Strong", "Very strong"];
  return (
    <div>
      <div className="password-strength">
        <span className={score >= 1 ? "on" : ""} />
        <span className={score >= 2 ? "on" : ""} />
        <span className={score >= 3 ? "on" : ""} />
        <span className={score >= 4 ? "on" : ""} />
      </div>
      {password && (
        <div className="hint" style={{ marginTop: 4 }}>
          {labels[score]}
          {score < 3 && password.length > 0 ? " — add more variety" : ""}
        </div>
      )}
    </div>
  );
}

export function SignInForm({ switchTo }: { switchTo: (v: FormView) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed. Please try again.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="brand-row">
          <span className="brand-mark" style={{ color: "var(--accent)" }}>
            <BrandMark size={26} />
          </span>
          <span>Grimoire</span>
        </div>
        <h1>Welcome back.</h1>
        <p className="sub">Sign in to open your grimoire.</p>

        <div className="auth-providers">
          <a href="/api/auth/google" className="btn btn-ghost">
            <GoogleIcon /> Continue with Google
          </a>
        </div>

        <div className="divider">or with email</div>

        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@somewhere.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label style={{ display: "flex", justifyContent: "space-between" }}>
            Password
            <a onClick={() => switchTo("forgot")}>Forgot?</a>
          </label>
          <input
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <div
            className={`switch ${keepSignedIn ? "on" : ""}`}
            onClick={() => setKeepSignedIn((v) => !v)}
            role="switch"
            aria-checked={keepSignedIn}
          />
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            Keep me signed in on this device
          </span>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}{" "}
          {!loading && <Icon name="arrow-right" size={14} />}
        </button>

        <div className="auth-foot">
          New to Grimoire?{" "}
          <a onClick={() => switchTo("signup")}>Create an account</a>
        </div>
      </form>
    </div>
  );
}

export function SignUpForm({ switchTo }: { switchTo: (v: FormView) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the terms to continue."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="brand-row">
          <span className="brand-mark" style={{ color: "var(--accent)" }}>
            <BrandMark size={26} />
          </span>
          <span>Grimoire</span>
        </div>
        <h1>Start writing.</h1>
        <p className="sub">Free forever for personal use. No credit card.</p>

        <div className="auth-providers">
          <a href="/api/auth/google" className="btn btn-ghost">
            <GoogleIcon /> Sign up with Google
          </a>
        </div>
        <div className="divider">or with email</div>

        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label>Display name</label>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 18,
            fontSize: 12,
            color: "var(--fg-muted)",
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            I agree to the{" "}
            <a style={{ color: "var(--accent)", fontWeight: 600 }}>Terms</a>{" "}
            and acknowledge the{" "}
            <a style={{ color: "var(--accent)", fontWeight: 600 }}>
              Privacy Policy
            </a>
            .
          </span>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Creating account…" : "Open my editor"}{" "}
          {!loading && <Icon name="arrow-right" size={14} />}
        </button>

        <div className="auth-foot">
          Already have an account?{" "}
          <a onClick={() => switchTo("signin")}>Sign in</a>
        </div>
      </form>
    </div>
  );
}

export function ForgotForm({ switchTo }: { switchTo: (v: FormView) => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="auth-form-wrap">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="brand-row">
          <span className="brand-mark" style={{ color: "var(--accent)" }}>
            <BrandMark size={26} />
          </span>
          <span>Grimoire</span>
        </div>
        <h1>Reset your password.</h1>
        <p className="sub">
          {sent
            ? "If that address is in our system, you'll hear from us shortly."
            : "We'll email you a one-time sign-in link."}
        </p>

        {!sent && (
          <>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Send me a magic link <Icon name="zap" size={14} />
            </button>
          </>
        )}

        {sent && (
          <div className="toggle-row">
            <div className="ico">
              <Icon name="inbox" size={16} />
            </div>
            <div className="text">
              <div className="t">Check your inbox</div>
              <div className="d">
                Link expires in 15 minutes.{" "}
                <a
                  style={{ color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}
                  onClick={() => setSent(false)}
                >
                  Resend.
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="auth-foot">
          Remembered it?{" "}
          <a onClick={() => switchTo("signin")}>Back to sign in</a>
        </div>
      </form>
    </div>
  );
}
