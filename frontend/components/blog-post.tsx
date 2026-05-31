"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { PublicFooter } from "@/components/sections";
import { editorJsToHtml, sanitizeHtml } from "@/lib/editorjs-renderer";
import {
  GifPanel,
  CommentMediaPreview,
  giphyLight,
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

function relTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const secs = Math.max(0, (Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const wks = Math.floor(days / 7);
  if (wks < 5) return `${wks}w ago`;
  return fmtDate(iso);
}

// Total comments including nested replies.
function countComments(list: Comment[]): number {
  return list.reduce(
    (n, c) => n + 1 + (c.replies ? countComments(c.replies) : 0),
    0
  );
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
  postAuthorId: number;
  currentUserId: number | null | undefined;
  isLoggedIn: boolean;
  depth?: number;
  onDelete: (id: number) => void;
}

function CommentCard({
  comment,
  postId,
  postIsOwner,
  postAuthorId,
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
  const [replyGifOpen, setReplyGifOpen] = useState(false);
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
          {comment.user_id != null && comment.user_id === postAuthorId && (
            <span className="cmt-author-badge">Author</span>
          )}
          <span className="cmt-date">{relTime(comment.created_at)}</span>
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
              src={comment.media_type === "sticker" ? comment.media_url : giphyLight(comment.media_url)}
              alt={comment.media_type === "sticker" ? "sticker" : "gif"}
              loading="lazy"
              decoding="async"
            />
            {comment.media_type !== "sticker" && (
              <span className="cmt-media-badge">GIF</span>
            )}
          </div>
        )}

        <div className="cmt-actions">
          <button
            className={`cmt-act${vote === 1 ? " is-liked" : ""}`}
            onClick={() => castVote(1)}
            title="Like"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={vote === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likes > 0 && <span>{likes}</span>}
          </button>
          {depth === 0 && (
            <button
              className={`cmt-act${showReply ? " active" : ""}`}
              onClick={() => {
                if (!isLoggedIn) { window.location.href = "/login"; return; }
                setShowReply((p) => !p);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
              Reply
            </button>
          )}
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
              <div className="cmt-media-tools">
                <button
                  type="button"
                  className={`cmt-media-btn${replyGifOpen ? " active" : ""}`}
                  onClick={() => setReplyGifOpen((p) => !p)}
                  aria-expanded={replyGifOpen}
                >
                  GIF
                </button>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={submitReply}
                disabled={submitting || (!replyText.trim() && !replyMedia)}
              >
                {submitting ? "Posting…" : "Post reply"}
              </button>
              <button
                className="cmt-cancel-btn"
                onClick={() => { setShowReply(false); setReplyText(""); setReplyMedia(null); setReplyGifOpen(false); }}
              >
                Cancel
              </button>
            </div>
            <GifPanel
              open={replyGifOpen}
              onSelect={(m) => {
                setReplyMedia(m);
                setReplyGifOpen(false);
              }}
            />
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
                    postAuthorId={postAuthorId}
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
  const [gifOpen, setGifOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const progressRef = useRef<HTMLDivElement>(null);
  const discussRef = useRef<HTMLDivElement>(null);

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

  // Save/Follow have no backend yet — persist the toggle locally so it survives reloads.
  useEffect(() => {
    if (!post) return;
    try {
      const saves = JSON.parse(localStorage.getItem("grimoire_saved_posts") || "[]");
      setSaved(Array.isArray(saves) && saves.includes(post.id));
      const follows = JSON.parse(localStorage.getItem("grimoire_following") || "[]");
      setFollowing(Array.isArray(follows) && follows.includes(post.user_id));
    } catch {}
  }, [post]);

  function toggleSave() {
    if (!post) return;
    setSaved((prev) => {
      const next = !prev;
      try {
        const saves: number[] = JSON.parse(localStorage.getItem("grimoire_saved_posts") || "[]");
        const updated = next ? [...new Set([...saves, post.id])] : saves.filter((x) => x !== post.id);
        localStorage.setItem("grimoire_saved_posts", JSON.stringify(updated));
      } catch {}
      return next;
    });
  }

  function toggleFollow() {
    if (!post) return;
    setFollowing((prev) => {
      const next = !prev;
      try {
        const follows: number[] = JSON.parse(localStorage.getItem("grimoire_following") || "[]");
        const updated = next ? [...new Set([...follows, post.user_id])] : follows.filter((x) => x !== post.user_id);
        localStorage.setItem("grimoire_following", JSON.stringify(updated));
      } catch {}
      return next;
    });
  }

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
      const nowLiked = data.action === "liked";
      setLiked(nowLiked);
      if (nowLiked) {
        setJustLiked(true);
        setTimeout(() => setJustLiked(false), 360);
      }
      setLikeCount(data.likes ?? (nowLiked ? likeCount + 1 : Math.max(0, likeCount - 1)));
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  function scrollToDiscuss() {
    if (!discussRef.current) return;
    const y = discussRef.current.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
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
  const authorHref = `/user/${
    post.author_handle ?? post.author_name.toLowerCase().replace(/\s+/g, "-")
  }`;
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

      {/* Article */}
      <article className={`post-article post-article--${readingMode}`}>
        {post.cover_image && (
          <div className="article-hero">
            <img src={post.cover_image} alt={post.title} />
          </div>
        )}

        {tagsList.length > 0 && (
          <div className="post-tag-row">
            {tagsList.map((t) => (
              <Link
                key={t}
                href={`/explore?tag=${encodeURIComponent(t)}`}
                className="post-article-tag"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        <h1 className="post-title">{post.title}</h1>

        <div className="post-byline">
          <Link href={authorHref} className="byline-id">
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
          </Link>
          {!post.is_owner && (
            <button
              className={`byline-follow${following ? " is-following" : ""}`}
              onClick={toggleFollow}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      {/* Engagement bar */}
      <div className="post-engagement">
        <button
          className={`eng-btn eng-like${liked ? " is-liked" : ""}${justLiked ? " just-liked" : ""}`}
          onClick={toggleLike}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="eng-count">{likeCount}</span>
        </button>
        <button className="eng-btn" onClick={scrollToDiscuss} title="Jump to discussion">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span className="eng-lbl">Discuss</span>
        </button>
        <div className="eng-sep" />
        <button className="eng-btn" onClick={copyLink} title="Copy link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="eng-lbl">{copied ? "Copied!" : "Share"}</span>
        </button>
        <button
          className={`eng-btn${saved ? " is-active" : ""}`}
          onClick={toggleSave}
          title={saved ? "Saved" : "Save"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span className="eng-lbl">{saved ? "Saved" : "Save"}</span>
        </button>
        <div className="eng-spacer" />
        {post.is_owner && (
          <Link href={`/write/${post.id}`} className="eng-btn eng-owner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="eng-lbl eng-lbl-keep">Edit</span>
          </Link>
        )}
      </div>

      {/* Comments */}
      <div className="comments-wrap" ref={discussRef}>
        <div className="cmt-header">
          <div className="cmt-header-left">
            <h3 className="cmt-title">Discussion</h3>
            {comments.length > 0 && (
              <span className="cmt-count">{comments.length}</span>
            )}
          </div>
          {comments.length > 1 && (
            <button
              className="cmt-sort"
              onClick={() => setSortBy((p) => (p === "newest" ? "top" : "newest"))}
              title="Toggle sort order"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" />
              </svg>
              {sortBy === "newest" ? "Newest" : "Top"}
            </button>
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
                <div className="cmt-media-tools">
                  <button
                    type="button"
                    className={`cmt-media-btn${gifOpen ? " active" : ""}`}
                    onClick={() => setGifOpen((p) => !p)}
                    aria-expanded={gifOpen}
                  >
                    GIF
                  </button>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={submitComment}
                  disabled={submitting || (!commentText.trim() && !composeMedia)}
                >
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>
              <GifPanel
                open={gifOpen}
                onSelect={(m) => {
                  setComposeMedia(m);
                  setGifOpen(false);
                }}
              />
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
            <div className="cmt-empty-ico">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            Be the first to share your thoughts.
          </div>
        ) : (
          <div className="cmt-list">
            {sortedComments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                postId={post.id}
                postIsOwner={post.is_owner}
                postAuthorId={post.user_id}
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
