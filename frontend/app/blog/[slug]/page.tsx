"use client";

import { use } from "react";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { BlogPost } from "@/components/blog-post";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: Props) {
  const { slug } = use(params);
  return (
    <ThemeProvider>
      <AuthProvider>
        <BlogPost slug={slug} />
      </AuthProvider>
    </ThemeProvider>
  );
}
