"use client";

import { use } from "react";
import { AuthProvider } from "@/lib/auth";
import { BlogPost } from "@/components/blog-post";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: Props) {
  const { slug } = use(params);
  return (

      <AuthProvider>
        <BlogPost slug={slug} />
      </AuthProvider>

  );
}
