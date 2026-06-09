"use client";

import { useState, useEffect } from "react";
import { AuthArt, SignInForm, SignUpForm, ForgotForm } from "@/components/auth-forms";

type FormView = "signin" | "signup" | "forgot";

function LoginContent() {
  const [view, setView] = useState<FormView>("signin");
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [initialPendingToken, setInitialPendingToken] = useState<string | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "1") setView("signup");
    if (params.get("verified") === "1") setBanner({ type: "success", msg: "Email verified! You can now sign in." });
    if (params.get("error")) setBanner({ type: "error", msg: decodeURIComponent(params.get("error")!) });
    const pt = params.get("pending_2fa");
    if (pt) { setInitialPendingToken(pt); window.history.replaceState({}, "", "/login"); }
  }, []);

  return (
    <div className="auth-shell">
      <AuthArt />
      {view === "signin" && <SignInForm switchTo={setView} banner={banner} initialPendingToken={initialPendingToken} />}
      {view === "signup" && <SignUpForm switchTo={setView} />}
      {view === "forgot" && <ForgotForm switchTo={setView} />}
    </div>
  );
}

export default function LoginPage() {
  return (

      <LoginContent />

  );
}
