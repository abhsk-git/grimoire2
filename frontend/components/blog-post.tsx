"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { PublicFooter } from "@/components/sections";
import { editorJsToHtml, sanitizeHtml } from "@/lib/editorjs-renderer";
import {
  CommentMediaBar,
  CommentMediaPreview,
  type CommentMedia,
} from "@/components/gif-sticker-picker";

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
  author_handle?: string;
  user_id: number;
  is_owner: boolean;
}

interface Comment {
  id: number;
  content: string;
  media_url?: string | null;
  media_type?: "gif" | "sticker" | null;
  display_name: string;
  author_name: string;
  avatar: string;
  author_avatar: string;
  user_id: number | null;
  created_at: string;
  parent_id: number | null;
  likes: number;
  dislikes: number;
  replies?: Comment[];
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

// ── Comment vote state (localStorage) ────────────────────────────────────────
const COMMENT_VOTE_KEY = "grimoire_cvotes";
function getVoteMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(COMMENT_VOTE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveVote(id: number, v: number) {
  const m = getVoteMap();
  if (v === 0) delete m[String(id)];
  else m[String(id)] = v;
  if (typeof window !== "undefined")
    localStorage.setItem(COMMENT_VOTE_KEY, JSON.stringify(m));
}
function getStoredVote(id: number): number {
  return getVoteMap()[String(id)] || 0;
}

// ── Flat comment list → nested tree ──────────────────────────────────────────
function buildCommentTree(flat: Comment[]): Comment[] {
  const map = new Map<number, Comment>();
  const roots: Comment[] = [];
  for (const c of flat) map.set(c.id, { ...c, replies: [] });
  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parent_id != null && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ── Comment card (recursive for replies) ─────────────────────────────────────
interface CommentCardProps {
  comment: Comment;
  postId: number;
  postIsOwner: boolean;
  currentUserId: number | null | undefined;
  isLoggedIn: boolean;
  depth?: number;
  onDelete: (id: number) => void;
}

function CommentCard({
  comment,
  postId,
  postIsOwner,
  currentUserId,
  isLoggedIn,
  depth = 0,
  onDelete,
}: CommentCardProps) {
  const [vote, setVote] = useState<number>(() =>
    typeof window !== "undefined" ? getStoredVote(comment.id) : 0
  );
  const [likes, setLikes] = useState(comment.likes ?? 0);
  const [dislikes, setDislikes] = useState(comment.dislikes ?? 0);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyMedia, setReplyMedia] = useState<CommentMedia | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [localReplies, setLocalReplies] = useState<Comment[]>(
    comment.replies ?? []
  );

  const displayName =
    comment.display_name || comment.author_name || "Anonymous";
  const avatar =
    comment.avatar || comment.author_avatar || avatarFallback(displayName);
  const canDelete = !!(
    currentUserId &&
    (currentUserId === comment.user_id || postIsOwner)
  );

  async function castVote(v: 1 | -1) {
    const wasVote = vote;
    const newVote = wasVote === v ? 0 : v;
    setVote(newVote);
    if (wasVote === 1) setLikes((l) => Math.max(0, l - 1));
    if (wasVote === -1) setDislikes((d) => Math.max(0, d - 1));
    if (newVote === 1) setLikes((l) => l + 1);
    if (newVote === -1) setDislikes((d) => d + 1);
    saveVote(comment.id, newVote);
    try {
      const r = await fetch(`/api/blog/comments/${comment.id}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_key: getSessionKey(), vote: v }),
      });
      if (r.ok) {
        const data = await r.json();
        setLikes(data.likes);
        setDislikes(data.dislikes);
        const confirmed = data.action === "removed" ? 0 : v;
        setVote(confirmed);
        saveVote(comment.id, confirmed);
      }
    } catch {}
  }

  async function submitReply() {
    if ((!replyText.trim() && !replyMedia) || submitting) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          parent_id: comment.id,
          media_url: replyMedia?.url,
          media_type: replyMedia?.type,
        }),
      });
      if (r.ok) {
        const nr: Comment = await r.json();
        setLocalReplies((prev) => [
          ...prev,
          { ...nr, likes: 0, dislikes: 0, parent_id: comment.id, replies: [] },
        ]);
        setReplyText("");
        setReplyMedia(null);
        setShowReply(false);
        setShowReplies(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`cmt-row${depth > 0 ? " cmt-reply" : ""}`}>
      <img
        className="cmt-avatar"
        src={avatar}
        alt={displayName}
        onError={(e) => {
          (e.target as HTMLImageElement).src = avatarFallback(displayName);
        }}
      />
      <div className="cmt-body">
        <div className="cmt-meta">
          <span className="cmt-author">{displayName}</span>
          <span className="cmt-date">{fmtDate(comment.created_at)}</span>
          {canDelete && (
            <button
              className="cmt-del"
              onClick={async () => {
                try {
                  const r = await fetch(`/api/blog/comments/${comment.id}`, {
                    method: "DELETE",
                    credentials: "include",
                  });
                  if (r.ok) onDelete(comment.id);
                } catch {}
              }}
            >
              delete
            </button>
          )}
        </div>

        {comment.content && <p className="cmt-text">{comment.content}</p>}

        {comment.media_url && (
          <div
            className={`cmt-media${
              comment.media_type === "sticker" ? " is-sticker" : ""
            }`}
          >
            <img
              src={comment.media_url}
              alt={comment.media_type === "sticker" ? "sticker" : "gif"}
              loading="lazy"
            />
          </div>
        )}

        <div className="cmt-actions">
          <button
            className={`cmt-vote${vote === 1 ? " up" : ""}`}
            onClick={() => castVote(1)}
            title="Upvote"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3 22 21H2z" />
            </svg>
            {likes > 0 && <span>{likes}</span>}
          </button>
          <button
            className={`cmt-vote${vote === -1 ? " down" : ""}`}
            onClick={() => castVote(-1)}
            title="Downvote"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21 2 3h20z" />
            </svg>
            {dislikes > 0 && <span>{dislikes}</span>}
          </button>
          <button
            className={`cmt-reply-btn${showReply ? " active" : ""}`}
            onClick={() => {
              if (!isLoggedIn) { window.location.href = "/login"; return; }
              setShowReply((p) => !p);
            }}
          >
            ↩ Reply
          </button>
        </div>

        {showReply && (
          <div className="cmt-reply-box">
            <textarea
              className="cmt-reply-textarea"
              placeholder={`Reply to ${displayName}…`}
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            {replyMedia && (
              <CommentMediaPreview
                media={replyMedia}
                onClear={() => setReplyMedia(null)}
              />
            )}
            <div className="cmt-reply-btns">
              <CommentMediaBar setMedia={setReplyMedia} />
              <button
                className="btn btn-primary btn-sm"
                onClick={submitReply}
                disabled={submitting || (!replyText.trim() && !replyMedia)}
              >
                {submitting ? "Posting…" : "Post reply"}
              </button>
              <button
                className="cmt-cancel-btn"
                onClick={() => { setShowReply(false); setReplyText(""); setReplyMedia(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {localReplies.length > 0 && depth < 2 && (
          <div className="cmt-thread">
            <button
              className="cmt-toggle"
              onClick={() => setShowReplies((p) => !p)}
            >
              <span className="cmt-toggle-arrow">{showReplies ? "▾" : "▸"}</span>
              {showReplies ? "Hide" : "Show"} {localReplies.length}{" "}
              {localReplies.length === 1 ? "reply" : "replies"}
            </button>
            {showReplies && (
              <div className="cmt-replies">
                {localReplies.map((r) => (
                  <CommentCard
                    key={r.id}
                    comment={r}
                    postId={postId}
                    postIsOwner={postIsOwner}
                    currentUserId={currentUserId}
                    isLoggedIn={isLoggedIn}
                    depth={depth + 1}
                    onDelete={(id) =>
                      setLocalReplies((prev) => prev.filter((x) => x.id !== id))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  slug: string;
}

export function BlogPost({ slug }: Props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const readingMode = settings.appearance.readingMode ?? "spacious";
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [composeMedia, setComposeMedia] = useState<CommentMedia | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
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

  const sortedComments = useMemo(() => {
    const tree = buildCommentTree(comments);
    if (sortBy === "top") {
      return [...tree].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    }
    return [...tree].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [comments, sortBy]);

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

  async function submitComment() {
    if (!post || !user || (!commentText.trim() && !composeMedia) || submitting) return;
    setSubmitting(true);
    const r = await fetch(`/api/blog/posts/${post.id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: commentText,
        media_url: composeMedia?.url,
        media_type: composeMedia?.type,
      }),
    });
    setSubmitting(false);
    if (r.ok) {
      const c = await r.json();
      setComments((prev) => [
        ...prev,
        { ...c, likes: c.likes ?? 0, dislikes: c.dislikes ?? 0, parent_id: null, replies: [] },
      ]);
      setCommentText("");
      setComposeMedia(null);
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
  const rawContent = post.content || "";
  const contentHtml = rawContent.trim().startsWith("{")
    ? editorJsToHtml(rawContent)
    : sanitizeHtml(rawContent);

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
      <article className={`post-article post-article--${readingMode}`}>
        <h1 className="post-title">{post.title}</h1>

        <Link href={`/user/${post.author_handle ?? post.author_name.toLowerCase().replace(/\s+/g, '-')}`} style={{ textDecoration: "none", color: "inherit" }}>
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
        {post.is_owner && (
          <Link href={`/write/${post.id}`} className="eng-edit">✎ Edit</Link>
        )}
      </div>

      {/* Comments */}
      <div className="comments-wrap">
        <div className="cmt-header">
          <div className="cmt-header-left">
            <h3 className="cmt-title">Discussion</h3>
            {comments.length > 0 && (
              <span className="cmt-count">{comments.length}</span>
            )}
          </div>
          {comments.length > 1 && (
            <select
              className="cmt-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "top")}
            >
              <option value="newest">Newest</option>
              <option value="top">Top rated</option>
            </select>
          )}
        </div>

        {user ? (
          <div className="cmt-compose">
            <img
              className="cmt-compose-avatar"
              src={user.avatar || avatarFallback(user.display_name || user.username)}
              alt={user.display_name || user.username}
              onError={(e) => {
                (e.target as HTMLImageElement).src = avatarFallback(
                  user.display_name || user.username
                );
              }}
            />
            <div className="cmt-compose-inner">
              <textarea
                className="cmt-compose-textarea"
                placeholder="Share your thoughts…"
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              {composeMedia && (
                <CommentMediaPreview
                  media={composeMedia}
                  onClear={() => setComposeMedia(null)}
                />
              )}
              <div className="cmt-compose-footer">
                <CommentMediaBar setMedia={setComposeMedia} />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={submitComment}
                  disabled={submitting || (!commentText.trim() && !composeMedia)}
                >
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="cmt-login-gate">
            <span>Sign in to join the discussion</span>
            <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
          </div>
        )}

        {sortedComments.length === 0 ? (
          <div className="cmt-empty">
            No comments yet — be the first to share your thoughts.
          </div>
        ) : (
          <div className="cmt-list">
            {sortedComments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                postId={post.id}
                postIsOwner={post.is_owner}
                currentUserId={user?.id}
                isLoggedIn={!!user}
                depth={0}
                onDelete={(id) =>
                  setComments((prev) => prev.filter((x) => x.id !== id && x.parent_id !== id))
                }
              />
            ))}
          </div>
        )}
      </div>

      <PublicFooter
        links={[
          { label: "Home", href: "/" },
          { label: "Explore", href: "/explore" },
          { label: "Privacy", href: "#" },
        ]}
      />
    </div>
  );
}
