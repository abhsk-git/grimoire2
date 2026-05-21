"use client";

import { use } from "react";
import { AuthProvider } from "@/lib/auth";
import { WriteEditor } from "@/components/write-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default function WriteEditPage({ params }: Props) {
  const { id } = use(params);
  const postId = parseInt(id, 10);

  return (

      <AuthProvider>
        <WriteEditor postId={isNaN(postId) ? undefined : postId} />
      </AuthProvider>

  );
}
