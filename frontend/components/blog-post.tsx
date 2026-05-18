"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string;
  tags: string;
  status: string;
  reading_time: number;
  views: number;
  likes: number;
  published_at: string | null;
  author_name: string;
  author_avatar: string;
  author_bio: string;
  user_id: number;
  is_owner: boolean;
}

interface Comment {
  id: number;
  content: string;
  author_name: string;
  author_avatar: string;
  user_id: number | null;
  created_at: string;
}

// Port of Flask's _to_html
function toHtml(contentJson: string): string {
  let data: any;
  try {
    data = JSON.parse(contentJson);
  } catch {
    return "<p>Content unavailable.</p>";
  }
  const parts: string[] = [];
  for (const b of data.blocks || []) {
    const bt: string = b.type || "";
    const bd: any = b.data || {};

    if (bt === "paragraph") {
      parts.push(`<p>${bd.text || ""}</p>`);
    } else if (bt === "header") {
      const lvl = Math.min(Math.max(parseInt(bd.level) || 2, 1), 6);
      const text: string = bd.text || "";
      const anchor = text
        .replace(/<[^>]+>/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[-\s]+/g, "-")
        .replace(/^-|-$/g, "");
      parts.push(`<h${lvl} id="${esc(anchor)}">${text}</h${lvl}>`);
    } else if (bt === "list") {
      const tag = bd.style === "ordered" ? "ol" : "ul";
      const items = (bd.items || []).map((i: string) => `<li>${i}</li>`).join("");
      parts.push(`<${tag}>${items}</${tag}>`);
    } else if (bt === "checklist") {
      const rows = (bd.items || [])
        .map(
          (item: any) =>
            `<label class="cl-item"><input type="checkbox"${item.checked ? " checked" : ""} disabled><span>${item.text || ""}</span></label>`
        )
        .join("");
      parts.push(`<div class="blog-checklist">${rows}</div>`);
    } else if (bt === "quote") {
      const cap = bd.caption ? `<cite>${bd.caption}</cite>` : "";
      const align = esc(bd.alignment || "left");
      parts.push(
        `<blockquote style="text-align:${align}"><p>${bd.text || ""}</p>${cap}</blockquote>`
      );
    } else if (bt === "code") {
      const lang = esc(bd.language || "");
      const code = escHtml(bd.code || "");
      parts.push(`<pre><code class="language-${lang}">${code}</code></pre>`);
    } else if (bt === "image") {
      const url = esc(bd.file?.url || bd.url || "");
      const cap: string = bd.caption || "";
      const cls = [
        bd.stretched ? "stretched" : "",
        bd.withBorder ? "bordered" : "",
        bd.withBackground ? "with-bg" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const capHtml = cap ? `<figcaption>${cap}</figcaption>` : "";
      parts.push(
        `<figure class="blog-figure ${cls}"><img src="${url}" alt="${esc(cap)}" loading="lazy">${capHtml}</figure>`
      );
    } else if (bt === "embed") {
      const embed = esc(bd.embed || "");
      const cap: string = bd.caption || "";
      const capHtml = cap ? `<figcaption>${cap}</figcaption>` : "";
      parts.push(
        `<figure class="blog-embed"><iframe src="${embed}" frameborder="0" allowfullscreen loading="lazy"></iframe>${capHtml}</figure>`
      );
    } else if (bt === "table") {
      let rowsHtml = "";
      (bd.content || []).forEach((row: string[], i: number) => {
        const tag = i === 0 ? "th" : "td";
        rowsHtml += "<tr>" + row.map((c) => `<${tag}>${c}</${tag}>`).join("") + "</tr>";
      });
      parts.push(`<div class="table-wrap"><table>${rowsHtml}</table></div>`);
    } else if (bt === "delimiter") {
      parts.push('<div class="blog-delimiter">✦ &nbsp; ✦ &nbsp; ✦</div>');
    } else if (bt === "warning") {
      parts.push(
        `<div class="blog-warning"><strong>${bd.title || ""}</strong><p>${bd.message || ""}</p></div>`
      );
    }
  }
  return parts.join("\n");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=44&background=6366f1&color=fff`;
}

interface Props {
  slug: string;
}

export function BlogPost({ slug }: Props) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/blog/posts/slug/${slug}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPost(data);
        setLikeCount(data.likes || 0);
      });
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    fetch(`/api/blog/posts/${post.id}/comments`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setComments(Array.isArray(data) ? data : []));
  }, [post]);

  useEffect(() => {
    function onScroll() {
      if (!progressRef.current) return;
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      progressRef.current.style.width = total > 0 ? `${(scrolled / total) * 100}%` : "0%";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function toggleLike() {
    if (!post) return;
    const r = await fetch(`/api/blog/posts/${post.id}/like`, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      const data = await r.json();
      setLiked(data.action === "liked");
      setLikeCount((c) => data.action === "liked" ? c + 1 : Math.max(0, c - 1));
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post?.title || "")}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener");
  }

  async function submitComment() {
    if (!post || !commentText.trim() || submitting) return;
    setSubmitting(true);
    const r = await fetch(`/api/blog/posts/${post.id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, author_name: commentName }),
    });
    setSubmitting(false);
    if (r.ok) {
      const c = await r.json();
      setComments((prev) => [...prev, c]);
      setCommentText("");
      setCommentName("");
    }
  }

  async function deleteComment(commentId: number) {
    const r = await fetch(`/api/blog/comments/${commentId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  if (notFound) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
          <div style={{ color: "var(--fg-soft)", marginBottom: 24 }}>Post not found.</div>
          <Link href="/explore" className="btn btn-primary btn-sm">Browse posts</Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  const tagsList = (post.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const contentHtml = toHtml(post.content || "{}");

  return (
    <div className="post-page">
      <div ref={progressRef} className="read-progress" />

      {/* Topbar */}
      <header className="post-topbar">
        <div className="post-topbar-left">
          <Link href="/explore" className="post-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </Link>
          <span style={{ color: "var(--border-hover)" }}>·</span>
          <Link href="/" style={{ fontSize: 14, textDecoration: "none", color: "var(--fg-soft)", fontWeight: 600 }}>
            Grimoire
          </Link>
        </div>
        <div className="post-topbar-actions">
          <button
            className={`btn-like${liked ? " liked" : ""}`}
            onClick={toggleLike}
            style={{ padding: "8px 16px", fontSize: 14 }}
          >
            <span className="heart">♥</span> {likeCount}
          </button>
          <button className="btn-share" onClick={copyLink}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {copied ? "Copied!" : "Share"}
          </button>
          {post.is_owner && (
            <Link href={`/write/${post.id}`} className="post-edit-link">
              Edit post
            </Link>
          )}
        </div>
      </header>

      {/* Cover */}
      {post.cover_image && (
        <div className="post-cover-wrap">
          <img src={post.cover_image} alt={post.title} />
        </div>
      )}

      {/* Article */}
      <article className="post-article">
        {tagsList.length > 0 && (
          <div className="post-tag-row">
            {tagsList.map((tag) => (
              <Link key={tag} href={`/explore?mode=blog&tag=${tag}`} className="post-article-tag">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <h1 className="post-title">{post.title}</h1>

        <div className="post-byline">
          <img
            src={post.author_avatar || avatarFallback(post.author_name)}
            alt={post.author_name}
            onError={(e) => { (e.target as HTMLImageElement).src = avatarFallback(post.author_name); }}
          />
          <div>
            <div className="byline-author">{post.author_name}</div>
            <div className="byline-meta">
              {fmtDate(post.published_at)}
              {post.published_at ? " · " : ""}
              {post.reading_time} min read · {post.views} views
            </div>
          </div>
        </div>

        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      {/* Footer bar */}
      <div className="post-footer-bar">
        <button className={`btn-like${liked ? " liked" : ""}`} onClick={toggleLike}>
          <span className="heart">♥</span> {likeCount} Likes
        </button>
        <button className="btn-share" onClick={copyLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button className="btn-share" onClick={shareTwitter}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.836L2.25 2.25h6.917l4.254 5.622 4.823-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Tweet
        </button>
        {post.is_owner && (
          <Link href={`/write/${post.id}`} className="post-edit-link">
            ✎ Edit this post
          </Link>
        )}
      </div>

      {/* Comments */}
      <div className="comments-wrap">
        <h3 className="comments-title">Discussion</h3>
        <div className="comment-form">
          <textarea
            className="comment-textarea"
            placeholder="Share your thoughts, questions, or feedback…"
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <div className="comment-form-row">
            <input
              type="text"
              className="comment-name-input"
              placeholder="Your name (optional, for guests)"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={submitComment}
              disabled={submitting || !commentText.trim()}
              style={{ flexShrink: 0 }}
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </div>

        {comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--fg-soft)", fontSize: 14 }}>
            No comments yet — be the first!
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <img
                className="comment-avatar"
                src={c.author_avatar || avatarFallback(c.author_name || "?")}
                alt={c.author_name}
                onError={(e) => { (e.target as HTMLImageElement).src = avatarFallback(c.author_name || "?"); }}
              />
              <div className="comment-bubble">
                <div className="comment-header">
                  <span className="comment-author">{c.author_name || "Anonymous"}</span>
                  <span className="comment-date">{fmtDate(c.created_at)}</span>
                  {(user?.id === c.user_id || post.is_owner) && (
                    <button className="comment-delete" onClick={() => deleteComment(c.id)}>
                      delete
                    </button>
                  )}
                </div>
                <div className="comment-text">{c.content}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
