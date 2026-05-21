"use client";

import { AuthProvider } from "@/lib/auth";
import { WriteEditor } from "@/components/write-editor";

export default function WritePage() {
  return (

      <AuthProvider>
        <WriteEditor />
      </AuthProvider>

  );
}
