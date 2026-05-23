"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandMark, Icon } from "@/components/icons";

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
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
          {score < 3 ? " — add more variety" : ""}
        </div>
      )}
    </div>
  );
}

function ResetContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="brand-row">
            <span className="brand-mark" style={{ color: "var(--accent)" }}>
              <BrandMark size={26} />
            </span>
            <span>Grimoire</span>
          </div>
          <h1>Invalid link.</h1>
          <p className="sub">
            This reset link is missing a token. Request a new one from the sign-in page.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ width: "100%", textAlign: "center" }}>
            Back to sign in <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="brand-row">
            <span className="brand-mark" style={{ color: "var(--accent)" }}>
              <BrandMark size={26} />
            </span>
            <span>Grimoire</span>
          </div>
          <h1>Password updated.</h1>
          <p className="sub">You can now sign in with your new password.</p>
          <div className="toggle-row" style={{ marginBottom: 24 }}>
            <div className="ico">
              <Icon name="lock" size={16} />
            </div>
            <div className="text">
              <div className="t">Account secured</div>
              <div className="d">Your new password is active.</div>
            </div>
          </div>
          <Link href="/login" className="btn btn-primary" style={{ width: "100%", textAlign: "center" }}>
            Sign in <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>
    );
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
        <h1>Choose a new password.</h1>
        <p className="sub">Pick something strong. This link expires in 1 hour.</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label>New password</label>
          <input
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input
            type="password"
            placeholder="••••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Updating…" : (
            <>Update password <Icon name="arrow-right" size={14} /></>
          )}
        </button>

        <div className="auth-foot">
          Remembered it?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-shell">
      <Suspense fallback={<div className="auth-form-wrap" />}>
        <ResetContent />
      </Suspense>
    </div>
  );
}
