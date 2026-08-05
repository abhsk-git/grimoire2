"use client";

import { use } from "react";
import { BlogPost } from "@/components/blog-post";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: Props) {
  const { slug } = use(params);
  return <BlogPost slug={slug} />;
}
