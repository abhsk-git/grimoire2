"use client";

import { useState, useEffect } from "react";
import { AuthArt, SignInForm, SignUpForm, ForgotForm } from "@/components/auth-forms";

type FormView = "signin" | "signup" | "forgot";

function LoginContent() {
  const [view, setView] = useState<FormView>("signin");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "1") setView("signup");
  }, []);

  return (
    <div className="auth-shell">
      <AuthArt />
      {view === "signin" && <SignInForm switchTo={setView} />}
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
