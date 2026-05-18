"use client";

import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { WriteEditor } from "@/components/write-editor";

export default function WritePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WriteEditor />
      </AuthProvider>
    </ThemeProvider>
  );
}
