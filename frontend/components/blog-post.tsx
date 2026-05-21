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
  display_name: string;
  author_name: string;
  avatar: string;
  author_avatar: string;
  user_id: number | null;
  created_at: string;
}

// ── XSS sanitizer ────────────────────────────────────────────────────────────
// Applied to EditorJS text fields that may contain inline HTML (b, i, a, etc.)
// Strips dangerous tags, event handlers, and javascript: URIs.
function sanitize(html: string): string {
  if (!html) return "";
  // Remove script/style/iframe/object/embed blocks
  let s = html.replace(
    /<(?:script|style|iframe|object|embed)[\s>][\s\S]*?<\/(?:script|style|iframe|object|embed)>/gi,
    ""
  );
  // Remove self-closing dangerous tags
  s = s.replace(/<(?:script|style|iframe|object|embed)[^>]*\/>/gi, "");
  // Remove on* event handler attributes
  s = s.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  // Remove javascript: URIs
  s = s.replace(
    /(?:href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi,
    ""
  );
  // Remove data: URIs in src
  s = s.replace(/src\s*=\s*["']?\s*data:[^"'\s>]*/gi, "");
  return s;
}

// ── HTML renderer ─────────────────────────────────────────────────────────────
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
      parts.push(`<p>${sanitize(bd.text || "")}</p>`);
    } else if (bt === "header") {
      const lvl = Math.min(Math.max(parseInt(bd.level) || 2, 1), 6);
      const text = sanitize(bd.text || "");
      const anchor = (bd.text || "")
        .replace(/<[^>]+>/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[-\s]+/g, "-")
        .replace(/^-|-$/g, "");
      parts.push(`<h${lvl} id="${esc(anchor)}">${text}</h${lvl}>`);
    } else if (bt === "list") {
      const tag = bd.style === "ordered" ? "ol" : "ul";
      const items = (bd.items || [])
        .map((i: string) => `<li>${sanitize(i)}</li>`)
        .join("");
      parts.push(`<${tag}>${items}</${tag}>`);
    } else if (bt === "checklist") {
      const rows = (bd.items || [])
        .map(
          (item: any) =>
            `<label class="cl-item"><input type="checkbox"${
              item.checked ? " checked" : ""
            } disabled><span>${sanitize(item.text || "")}</span></label>`
        )
        .join("");
      parts.push(`<div class="blog-checklist">${rows}</div>`);
    } else if (bt === "quote") {
      const cap = bd.caption
        ? `<cite>${sanitize(bd.caption)}</cite>`
        : "";
      const align = esc(bd.alignment || "left");
      parts.push(
        `<blockquote style="text-align:${align}"><p>${sanitize(
          bd.text || ""
        )}</p>${cap}</blockquote>`
      );
    } else if (bt === "code") {
      // Code is always fully escaped — no inline formatting
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
      const capHtml = cap
        ? `<figcaption>${sanitize(cap)}</figcaption>`
        : "";
      parts.push(
        `<figure class="blog-figure ${cls}"><img src="${url}" alt="${esc(
          cap.replace(/<[^>]+>/g, "")
        )}" loading="lazy">${capHtml}</figure>`
      );
    } else if (bt === "embed") {
      const embed = esc(bd.embed || "");
      const cap: string = bd.caption || "";
      const capHtml = cap
        ? `<figcaption>${sanitize(cap)}</figcaption>`
        : "";
      parts.push(
        `<figure class="blog-embed"><iframe src="${embed}" frameborder="0" allowfullscreen loading="lazy"></iframe>${capHtml}</figure>`
      );
    } else if (bt === "table") {
      let rowsHtml = "";
      (bd.content || []).forEach((row: string[], i: number) => {
        const tag = i === 0 ? "th" : "td";
        rowsHtml +=
          "<tr>" +
          row.map((c) => `<${tag}>${sanitize(c)}</${tag}>`).join("") +
          "</tr>";
      });
      parts.push(
        `<div class="table-wrap"><table>${rowsHtml}</table></div>`
      );
    } else if (bt === "delimiter") {
      parts.push('<div class="blog-delimiter">✦ &nbsp; ✦ &nbsp; ✦</div>');
    } else if (bt === "warning") {
      parts.push(
        `<div class="blog-warning"><strong>${sanitize(
          bd.title || ""
        )}</strong><p>${sanitize(bd.message || "")}</p></div>`
      );
    }
  }
  return parts.join("\n");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&size=44&background=6366f1&color=fff`;
}

// Generate or retrieve a stable anonymous session key for likes
function getSessionKey(): string {
  const KEY = "grimoire_session_key";
  let k = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
  if (!k) {
    k = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (typeof window !== "undefined") localStorage.setItem(KEY, k);
  }
  return k;
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
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
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
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setComments(Array.isArray(data) ? data : []));
  }, [post]);

  useEffect(() => {
    function onScroll() {
      if (!progressRef.current) return;
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      progressRef.current.style.width =
        total > 0 ? `${(scrolled / total) * 100}%` : "0%";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function toggleLike() {
    if (!post) return;
    const body: Record<string, string> = {};
    if (!user) {
      body.session_key = getSessionKey();
    }
    const r = await fetch(`/api/blog/posts/${post.id}/like`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const data = await r.json();
      setLiked(data.action === "liked");
      setLikeCount(data.likes ?? (data.action === "liked" ? likeCount + 1 : Math.max(0, likeCount - 1)));
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

  function shareReddit() {
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post?.title || "")}`;
    window.open(url, "_blank", "noopener");
  }

  function shareLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener");
  }

  async function submitComment() {
    if (!post || !commentText.trim() || submitting) return;
    setSubmitting(true);
    const r = await fetch(`/api/blog/posts/${post.id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: commentText,
        author_name: commentName,
      }),
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

  function commentDisplayName(c: Comment): string {
    return c.display_name || c.author_name || "Anonymous";
  }
  function commentAvatar(c: Comment): string {
    return (
      c.avatar ||
      c.author_avatar ||
      avatarFallback(commentDisplayName(c))
    );
  }

  if (notFound) {
    return (
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
          <div style={{ color: "var(--fg-soft)", marginBottom: 24 }}>
            Post not found.
          </div>
          <Link href="/explore" className="btn btn-primary btn-sm">
            Browse posts
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        style={{ height: "100vh", display: "grid", placeItems: "center" }}
      >
        <span style={{ color: "var(--fg-soft)", fontSize: 14 }}>
          Loading…
        </span>
      </div>
    );
  }

  const tagsList = (post.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const contentHtml = toHtml(post.content || "{}");

  return (
    <div className="post-page">
      <div ref={progressRef} className="read-progress" />

      {/* Topbar */}
      <header className="post-topbar">
        <div className="post-topbar-left">
          <Link href="/explore" className="post-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span className="back-label">Back</span>
          </Link>
          <span className="topbar-sep" style={{ color: "var(--border-hover)" }}>·</span>
          <Link href="/" className="topbar-brand-desktop">Grimoire</Link>
        </div>
        <Link href="/" className="topbar-brand-center">Grimoire</Link>
        <div className="post-topbar-actions">
          {post.is_owner && (
            <>
              <Link href={`/write/${post.id}`} className="post-edit-link">Edit post</Link>
              <Link href={`/write/${post.id}`} className="post-edit-icon" title="Edit post">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </Link>
            </>
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
              <Link
                key={tag}
                href={`/explore?mode=blog&tag=${encodeURIComponent(tag)}`}
                className="post-article-tag"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <h1 className="post-title">{post.title}</h1>

        <Link href={`/user/${post.author_name.toLowerCase().replace(/\s+/g, '-')}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="post-byline">
            <img
              src={post.author_avatar || avatarFallback(post.author_name)}
              alt={post.author_name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = avatarFallback(
                  post.author_name
                );
              }}
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
        </Link>

        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      {/* Engagement bar */}
      <div className="post-engagement">
        <button className={`eng-btn eng-like${liked ? " liked" : ""}`} onClick={toggleLike}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{likeCount}</span>
        </button>
        <div className="eng-sep" />
        <button className="eng-btn" onClick={copyLink} title="Copy link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
        <button className="eng-btn" onClick={shareTwitter} title="Share on X">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.836L2.25 2.25h6.917l4.254 5.622 4.823-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="eng-label">X</span>
        </button>
        <button className="eng-btn" onClick={shareReddit} title="Share on Reddit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" opacity=".15"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.19 10.34c.05.22.08.45.08.68 0 2.77-3.22 5.01-7.19 5.01-3.97 0-7.19-2.24-7.19-5.01 0-.23.03-.46.08-.68a1.44 1.44 0 0 1-.57-1.16c0-.8.65-1.44 1.44-1.44.38 0 .73.15.99.39C6.01 9.4 7.88 8.66 10 8.57l1.02-4.8.01-.04c.04-.19.21-.33.4-.3l3.37.7c.18-.36.55-.61.98-.61.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1c-.6 0-1.08-.48-1.1-1.07l-3-.62-.9 4.24c2.1.1 3.94.84 5.22 2.06.26-.24.6-.39.98-.39.8 0 1.44.65 1.44 1.44 0 .46-.22.87-.57 1.16zM9.5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-2.5 3c-1.1 0-2-.3-2.5-.75.14.97 1.18 1.75 2.5 1.75s2.36-.78 2.5-1.75c-.5.45-1.4.75-2.5.75z"/>
          </svg>
          <span className="eng-label">Reddit</span>
        </button>
        <button className="eng-btn" onClick={shareLinkedIn} title="Share on LinkedIn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span className="eng-label">LinkedIn</span>
        </button>
        {post.is_owner && (
          <Link href={`/write/${post.id}`} className="eng-edit">✎ Edit</Link>
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
            {!user && (
              <input
                type="text"
                className="comment-name-input"
                placeholder="Your name (optional)"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
              />
            )}
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
          <div
            style={{
              textAlign: "center",
              padding: "32px",
              color: "var(--fg-soft)",
              fontSize: 14,
            }}
          >
            No comments yet — be the first!
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <img
                className="comment-avatar"
                src={commentAvatar(c)}
                alt={commentDisplayName(c)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = avatarFallback(
                    commentDisplayName(c)
                  );
                }}
              />
              <div className="comment-bubble">
                <div className="comment-header">
                  <span className="comment-author">
                    {commentDisplayName(c)}
                  </span>
                  <span className="comment-date">
                    {fmtDate(c.created_at)}
                  </span>
                  {(user?.id === c.user_id || post.is_owner) && (
                    <button
                      className="comment-delete"
                      onClick={() => deleteComment(c.id)}
                    >
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
