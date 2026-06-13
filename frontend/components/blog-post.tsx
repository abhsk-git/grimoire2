"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  author_social_links?: Record<string, string> | null;
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
  handle?: string | null;
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

function commentName(c: Comment): string {
  return c.display_name || c.author_name || "Anonymous";
}

// Collapse a comment's whole subtree into one chronological list. The thread is
// only ever one level deep: every descendant (reply, reply-to-reply, …) lives
// in the single flat list under its root comment, so nothing keeps indenting.
function flattenReplies(node: Comment): Comment[] {
  const out: Comment[] = [];
  const walk = (n: Comment) => {
    for (const child of n.replies ?? []) {
      out.push(child);
      walk(child);
    }
  };
  walk(node);
  return out.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

// Collect a comment id + every descendant id within a flat list (by parent_id),
// so an optimistic delete removes the whole subtree — matching the backend.
function collectSubtree(flat: Comment[], rootId: number): Set<number> {
  const remove = new Set<number>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of flat) {
      if (c.parent_id != null && remove.has(c.parent_id) && !remove.has(c.id)) {
        remove.add(c.id);
        grew = true;
      }
    }
  }
  return remove;
}

// ── Comment card ──────────────────────────────────────────────────────────────
// A root comment owns its entire thread; replies render flat (isReply) and bubble
// any further reply up to the root via onReplyAdded so the tree never deepens.
interface CommentCardProps {
  comment: Comment;
  postId: number;
  postIsOwner: boolean;
  postAuthorId: number;
  currentUserId: number | null | undefined;
  isLoggedIn: boolean;
  isReply?: boolean;
  parentName?: string;
  onReplyAdded?: (c: Comment) => void;
  onDelete: (id: number) => void;
}

function CommentCard({
  comment,
  postId,
  postIsOwner,
  postAuthorId,
  currentUserId,
  isLoggedIn,
  isReply = false,
  parentName,
  onReplyAdded,
  onDelete,
}: CommentCardProps) {
  const [vote, setVote] = useState<number>(() =>
    typeof window !== "undefined" ? getStoredVote(comment.id) : 0
  );
  const [likes, setLikes] = useState(comment.likes ?? 0);
  const [, setDislikes] = useState(comment.dislikes ?? 0);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyMedia, setReplyMedia] = useState<CommentMedia | null>(null);
  const [replyGifOpen, setReplyGifOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  // Root-only: the single flat thread of all descendants.
  const [threadReplies, setThreadReplies] = useState<Comment[]>(() =>
    isReply ? [] : flattenReplies(comment)
  );

  const displayName = commentName(comment);
  const avatar =
    comment.avatar || comment.author_avatar || avatarFallback(displayName);
  const canDelete = !!(
    currentUserId &&
    (currentUserId === comment.user_id || postIsOwner)
  );

  // Map id → author name so a flattened reply can show who it answered.
  const nameById = useMemo(() => {
    const m = new Map<number, string>();
    m.set(comment.id, displayName);
    for (const r of threadReplies) m.set(r.id, commentName(r));
    return m;
  }, [comment.id, displayName, threadReplies]);

  const addToThread = (c: Comment) =>
    setThreadReplies((prev) => [...prev, c]);

  // The avatar is both a profile link (single click/tap) and the delete
  // affordance for your own comments (double-click on desktop / long-press on
  // touch → inline confirm). Single vs double click is disambiguated with a
  // short timer; a long-press swallows the click that follows it.
  const authorHref = comment.handle ? `/user/${comment.handle}` : null;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const clickTimer = useRef<number | null>(null);
  const longPressedRef = useRef(false);

  async function doDelete() {
    setConfirmDelete(false);
    try {
      const r = await fetch(`/api/blog/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) onDelete(comment.id);
    } catch {}
  }
  function goToProfile() {
    if (authorHref) window.location.href = authorHref;
  }
  function handleAvatarClick() {
    if (longPressedRef.current) { longPressedRef.current = false; return; }
    if (!authorHref) return;
    if (!canDelete) { goToProfile(); return; } // no delete gesture to wait on
    if (clickTimer.current != null) return;
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      goToProfile();
    }, 250);
  }
  function handleAvatarDoubleClick() {
    if (clickTimer.current != null) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    if (canDelete) setConfirmDelete(true);
  }
  function startPress() {
    if (!canDelete) return;
    longPressedRef.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressedRef.current = true;
      setConfirmDelete(true);
    }, 600);
  }
  function cancelPress() {
    if (pressTimer.current != null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  async function castVote(v: 1 | -1) {
    const wasVote = vote;
    const newVote = wasVote === v ? 0 : v;
    setVote(newVote);
    if (wasVote === 1) setLikes((l) => Math.max(0, l - 1));
    if (newVote === 1) setLikes((l) => l + 1);
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
        const reply: Comment = {
          ...nr,
          likes: 0,
          dislikes: 0,
          parent_id: comment.id,
          replies: [],
        };
        // Replies always land in the root's single thread.
        if (isReply) onReplyAdded?.(reply);
        else addToThread(reply);
        setReplyText("");
        setReplyMedia(null);
        setShowReply(false);
        setReplyGifOpen(false);
        if (!isReply) setShowReplies(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`cmt-row${isReply ? " cmt-reply" : ""}`}>
      <img
        className={`cmt-avatar${canDelete ? " cmt-deletable" : ""}${authorHref ? " cmt-clickable" : ""}`}
        src={avatar}
        alt={displayName}
        draggable={false}
        title={
          canDelete
            ? "Click to view profile · double-click or long-press to delete"
            : authorHref
            ? "View profile"
            : undefined
        }
        onError={(e) => {
          (e.target as HTMLImageElement).src = avatarFallback(displayName);
        }}
        onClick={handleAvatarClick}
        onDoubleClick={handleAvatarDoubleClick}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onTouchCancel={cancelPress}
        onContextMenu={(e) => canDelete && e.preventDefault()}
      />
      <div className="cmt-body">
        <div className="cmt-meta">
          <span className="cmt-author">{displayName}</span>
          {comment.user_id != null && comment.user_id === postAuthorId && (
            <span className="cmt-author-badge">Author</span>
          )}
          {parentName && (
            <span className="cmt-reply-to">↳ {parentName}</span>
          )}
          <span className="cmt-date">{relTime(comment.created_at)}</span>
        </div>

        {confirmDelete && (
          <div className="cmt-confirm">
            <span>Delete this comment?</span>
            <button className="cmt-confirm-yes" onClick={doDelete}>Delete</button>
            <button className="cmt-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        )}

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

        {!isReply && threadReplies.length > 0 && (
          <div className="cmt-thread">
            <button
              className="cmt-toggle"
              onClick={() => setShowReplies((p) => !p)}
            >
              <span className="cmt-toggle-arrow">{showReplies ? "▾" : "▸"}</span>
              {showReplies ? "Hide" : "Show"} {threadReplies.length}{" "}
              {threadReplies.length === 1 ? "reply" : "replies"}
            </button>
            {showReplies && (
              <div className="cmt-replies">
                {threadReplies.map((r) => (
                  <CommentCard
                    key={r.id}
                    comment={r}
                    postId={postId}
                    postIsOwner={postIsOwner}
                    postAuthorId={postAuthorId}
                    currentUserId={currentUserId}
                    isLoggedIn={isLoggedIn}
                    isReply
                    parentName={
                      r.parent_id != null && r.parent_id !== comment.id
                        ? nameById.get(r.parent_id)
                        : undefined
                    }
                    onReplyAdded={addToThread}
                    onDelete={(id) =>
                      setThreadReplies((prev) => {
                        const remove = collectSubtree(prev, id);
                        return prev.filter((x) => !remove.has(x.id));
                      })
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

      {post.cover_image && (
        <div className="article-hero">
          <img src={post.cover_image} alt={post.title} />
        </div>
      )}

      {/* Article */}
      <article className={`post-article post-article--${readingMode}`}>
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
        </div>

        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      {/* Post end — editorial, no cards */}
      {(() => {
        const socials = post.author_social_links || {};
        const socialEntries = Object.entries(socials).filter(([, v]) => v);
        const socialMeta: Record<string, { label: string; href: (u: string) => string; icon: React.ReactElement }> = {
          x:         { label: "X / Twitter", href: (u) => `https://x.com/${u}`,          icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.836L2.25 2.25h6.917l4.254 5.622 4.823-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
          github:    { label: "GitHub",      href: (u) => `https://github.com/${u}`,      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg> },
          instagram: { label: "Instagram",   href: (u) => `https://instagram.com/${u}`,   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg> },
        };
        return (
          <div className="post-end">

            {/* Author sign-off — right-aligned like a letter */}
            <div className="post-sign">
              <Link href={authorHref} className="post-sign-by">
                by {post.author_name.toLowerCase()}
              </Link>
              {socialEntries.length > 0 && (
                <div className="post-sign-socials">
                  <span className="post-sign-follow">follow on</span>
                  {socialEntries.map(([key, username]) => {
                    const meta = socialMeta[key];
                    if (!meta) return null;
                    return (
                      <a key={key} href={meta.href(username)} target="_blank" rel="noopener noreferrer"
                         className="post-sign-icon" title={`${meta.label}: @${username}`}>
                        {meta.icon}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Engagement strip — flat, no container */}
            <div className="post-end-engage">
              <button
                className={`pee-btn pee-like${liked ? " is-liked" : ""}${justLiked ? " just-liked" : ""}`}
                onClick={toggleLike}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {likeCount} {likeCount === 1 ? "like" : "likes"}
              </button>
              <button className="pee-btn" onClick={scrollToDiscuss}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </button>
              <div style={{ flex: 1 }} />
              <button className="pee-btn" onClick={copyLink}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                {copied ? "Copied!" : "Share"}
              </button>
              <button className={`pee-btn${saved ? " is-saved" : ""}`} onClick={toggleSave}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {saved ? "Saved" : "Save"}
              </button>
              {post.is_owner && (
                <Link href={`/write/${post.id}`} className="pee-btn pee-edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </Link>
              )}
            </div>

          </div>
        );
      })()}

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
                onDelete={(id) =>
                  setComments((prev) => {
                    const remove = collectSubtree(prev, id);
                    return prev.filter((x) => !remove.has(x.id));
                  })
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
