"use client";

import { useEffect, useRef, useState } from "react";

export type CommentMedia = { url: string; type: "gif" | "sticker" };

/**
 * Rewrite a GIPHY media URL to a lighter rendition (animated WebP).
 * GIPHY exposes every rendition at the same path — only the trailing filename
 * changes (`giphy.gif` = full original, often several MB → `200w.webp` =
 * 200px-wide animated WebP, typically 10–50KB). Animated WebP is supported by
 * every current browser and is dramatically smaller than the equivalent GIF,
 * so this is what makes the picker grid and posted comments feel instant.
 *
 * Non-GIPHY URLs (e.g. self-hosted `/static/stickers/*.svg`) are returned
 * untouched. The transform is idempotent — re-applying it is a no-op.
 */
export function giphyLight(url: string, rendition = "200w"): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("giphy.com")) return url;
    u.pathname = u.pathname.replace(/\/[^/]+\.(gif|webp|mp4)$/i, `/${rendition}.webp`);
    return u.toString();
  } catch {
    return url;
  }
}

interface GiphyGif {
  id: string;
  url: string;
  preview: string;
  dims: [number, number];
  description: string;
}
interface Sticker {
  id: string;
  label: string;
  url: string;
}

interface Props {
  initialTab: "gif" | "sticker";
  onSelect: (media: CommentMedia) => void;
  onClose: () => void;
}

export function GifStickerPicker({ initialTab, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<"gif" | "sticker">(initialTab);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const popRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Load stickers once
  useEffect(() => {
    fetch("/api/blog/stickers", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStickers(Array.isArray(d) ? d : []))
      .catch(() => setStickers([]));
  }, []);

  // Load GIFs (debounced on query) whenever the GIF tab is active
  useEffect(() => {
    if (tab !== "gif") return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const t = setTimeout(() => {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      fetch(`/api/blog/gifs${qs}`, { credentials: "include" })
        .then(async (r) => {
          const d = await r.json().catch(() => ({}));
          if (cancelled) return;
          if (r.status === 503) {
            setError("GIF search isn’t set up yet.");
            setGifs([]);
          } else if (!r.ok) {
            setError("Couldn’t load GIFs. Try again.");
            setGifs([]);
          } else {
            setGifs(Array.isArray(d.results) ? d.results : []);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError("Couldn’t load GIFs. Try again.");
            setGifs([]);
          }
        })
        .finally(() => !cancelled && setLoading(false));
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [tab, query]);

  return (
    <>
      <div className="gsp-backdrop" onClick={onClose} />
      <div className="gsp-pop" ref={popRef} role="dialog" aria-label="Pick a GIF or sticker">
        <div className="gsp-tabs">
          <button
            type="button"
            className={`gsp-tab${tab === "gif" ? " active" : ""}`}
            onClick={() => setTab("gif")}
          >
            GIFs
          </button>
          <button
            type="button"
            className={`gsp-tab${tab === "sticker" ? " active" : ""}`}
            onClick={() => setTab("sticker")}
          >
            Stickers
          </button>
          <a
            className="gsp-attribution"
            href="https://giphy.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Powered by GIPHY"
          >
            <img src="/giphy/powered-by-giphy.gif" alt="Powered by GIPHY" />
          </a>
        </div>

        {tab === "gif" ? (
          <>
            <input
              className="gsp-search"
              placeholder="Search GIFs… (anime, lol, pog)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className="gsp-grid gsp-grid-gif">
              {loading && <div className="gsp-msg">Loading…</div>}
              {!loading && error && <div className="gsp-msg">{error}</div>}
              {!loading && !error && gifs.length === 0 && (
                <div className="gsp-msg">No GIFs found.</div>
              )}
              {!loading &&
                gifs.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="gsp-cell"
                    title={g.description}
                    onClick={() => onSelect({ url: g.url, type: "gif" })}
                  >
                    <img src={g.preview} alt={g.description} loading="lazy" />
                  </button>
                ))}
            </div>
          </>
        ) : (
          <div className="gsp-grid gsp-grid-sticker">
            {stickers.length === 0 && <div className="gsp-msg">No stickers.</div>}
            {stickers.map((s) => (
              <button
                key={s.id}
                type="button"
                className="gsp-cell gsp-cell-sticker"
                title={s.label}
                onClick={() => onSelect({ url: s.url, type: "sticker" })}
              >
                <img src={s.url} alt={s.label} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Inline GIF/sticker panel that lives INSIDE the composer card (no floating
 * popover, so it can't overlap surrounding content). Animates open via a
 * `.gif-panel.open` max-height transition controlled by the `open` prop.
 *
 * The GIF grid is a flex-based vertical masonry: N equal columns each holding a
 * vertical stack, filled round-robin. Column count is responsive — 3 on desktop,
 * 2 at ≤520px — via matchMedia (never CSS `columns`, which reorders on resize).
 *
 * This is the only attachment entry point on every viewport: mobile system
 * keyboards (Gboard/iOS) cannot insert a GIF into a plain web <textarea>, so the
 * in-app picker is required on touch devices too.
 */
export function GifPanel({
  open,
  onSelect,
}: {
  open: boolean;
  onSelect: (m: CommentMedia) => void;
}) {
  const [tab, setTab] = useState<"gif" | "sticker">("gif");
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cols, setCols] = useState(3);

  // Responsive masonry column count (2 on narrow/mobile, 3 otherwise).
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 520px)");
    const apply = () => setCols(mq.matches ? 2 : 3);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Load stickers once, when the panel first opens.
  useEffect(() => {
    if (!open || stickers.length) return;
    fetch("/api/blog/stickers", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStickers(Array.isArray(d) ? d : []))
      .catch(() => setStickers([]));
  }, [open, stickers.length]);

  // Load GIFs (debounced on query) whenever the GIF tab is active and open.
  useEffect(() => {
    if (!open || tab !== "gif") return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const t = setTimeout(() => {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      fetch(`/api/blog/gifs${qs}`, { credentials: "include" })
        .then(async (r) => {
          const d = await r.json().catch(() => ({}));
          if (cancelled) return;
          if (r.status === 503) {
            setError("GIF search isn’t set up yet.");
            setGifs([]);
          } else if (!r.ok) {
            setError("Couldn’t load GIFs. Try again.");
            setGifs([]);
          } else {
            setGifs(Array.isArray(d.results) ? d.results : []);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError("Couldn’t load GIFs. Try again.");
            setGifs([]);
          }
        })
        .finally(() => !cancelled && setLoading(false));
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, tab, query]);

  // Round-robin GIFs into `cols` vertical columns for the masonry layout.
  const columns: GiphyGif[][] = Array.from({ length: cols }, () => []);
  gifs.forEach((g, i) => columns[i % cols].push(g));

  return (
    <div className={`gif-panel${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="gif-panel-inner">
        <div className="gif-panel-top">
          <div className="gif-tabs">
            <button
              type="button"
              className={tab === "gif" ? "active" : ""}
              onClick={() => setTab("gif")}
            >
              GIFs
            </button>
            <button
              type="button"
              className={tab === "sticker" ? "active" : ""}
              onClick={() => setTab("sticker")}
            >
              Stickers
            </button>
          </div>
          <a
            className="gif-giphy"
            href="https://giphy.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Powered by GIPHY"
          >
            <img src="/giphy/powered-by-giphy.gif" alt="Powered by GIPHY" />
          </a>
        </div>

        {tab === "gif" ? (
          <>
            <div className="gif-search">
              <input
                placeholder="Search GIFs… (anime, lol, pog)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="gif-grid">
              {loading && <div className="gif-msg">Loading…</div>}
              {!loading && error && <div className="gif-msg">{error}</div>}
              {!loading && !error && gifs.length === 0 && (
                <div className="gif-msg">No GIFs found.</div>
              )}
              {!loading &&
                !error &&
                columns.map((col, ci) => (
                  <div className="gif-col" key={ci}>
                    {col.map((g) => (
                      <img
                        key={g.id}
                        src={giphyLight(g.preview, "100w")}
                        alt={g.description}
                        title={g.description}
                        loading="lazy"
                        decoding="async"
                        style={
                          g.dims[0] && g.dims[1]
                            ? { aspectRatio: `${g.dims[0]} / ${g.dims[1]}` }
                            : undefined
                        }
                        onClick={() => onSelect({ url: giphyLight(g.url), type: "gif" })}
                      />
                    ))}
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className="gif-sticker-grid">
            {stickers.length === 0 && <div className="gif-msg">No stickers.</div>}
            {stickers.map((s) => (
              <button
                key={s.id}
                type="button"
                className="gif-sticker-cell"
                title={s.label}
                onClick={() => onSelect({ url: s.url, type: "sticker" })}
              >
                <img src={s.url} alt={s.label} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Trigger buttons + popover. Owns picker open/close; reports picks via setMedia. */
export function CommentMediaBar({
  setMedia,
}: {
  setMedia: (m: CommentMedia) => void;
}) {
  const [picker, setPicker] = useState<null | "gif" | "sticker">(null);
  return (
    <div className="cmt-media-tools">
      <button
        type="button"
        className={`cmt-media-btn${picker === "gif" ? " active" : ""}`}
        onClick={() => setPicker((p) => (p === "gif" ? null : "gif"))}
      >
        GIF
      </button>
      <button
        type="button"
        className={`cmt-media-btn${picker === "sticker" ? " active" : ""}`}
        onClick={() => setPicker((p) => (p === "sticker" ? null : "sticker"))}
      >
        ✦ Sticker
      </button>
      {picker && (
        <GifStickerPicker
          initialTab={picker}
          onClose={() => setPicker(null)}
          onSelect={(m) => {
            setMedia(m);
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

/** Removable preview of a selected GIF/sticker, shown above the post button. */
export function CommentMediaPreview({
  media,
  onClear,
}: {
  media: CommentMedia;
  onClear: () => void;
}) {
  return (
    <div className={`cmt-media-preview${media.type === "sticker" ? " is-sticker" : ""}`}>
      <img src={media.url} alt={media.type} />
      <button
        type="button"
        className="cmt-media-remove"
        onClick={onClear}
        aria-label="Remove attachment"
      >
        ×
      </button>
    </div>
  );
}
