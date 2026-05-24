"use client";

import { useState, useEffect } from "react";
import { AuthArt, SignInForm, SignUpForm, ForgotForm } from "@/components/auth-forms";

type FormView = "signin" | "signup" | "forgot";

function LoginContent() {
  const [view, setView] = useState<FormView>("signin");
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "1") setView("signup");
    if (params.get("verified") === "1") setBanner({ type: "success", msg: "Email verified! You can now sign in." });
    if (params.get("error")) setBanner({ type: "error", msg: decodeURIComponent(params.get("error")!) });
  }, []);

  return (
    <div className="auth-shell">
      <AuthArt />
      <div style={{ width: "100%", maxWidth: 420 }}>
        {banner && (
          <div style={{
            margin: "0 0 16px",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            background: banner.type === "success" ? "color-mix(in oklab,var(--accent) 15%,transparent)" : "color-mix(in oklab,#ef4444 15%,transparent)",
            color: banner.type === "success" ? "var(--accent)" : "#ef4444",
            border: `1px solid ${banner.type === "success" ? "color-mix(in oklab,var(--accent) 30%,transparent)" : "color-mix(in oklab,#ef4444 30%,transparent)"}`,
          }}>
            {banner.msg}
          </div>
        )}
        {view === "signin" && <SignInForm switchTo={setView} />}
        {view === "signup" && <SignUpForm switchTo={setView} />}
        {view === "forgot" && <ForgotForm switchTo={setView} />}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (

      <LoginContent />

  );
}
