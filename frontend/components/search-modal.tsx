"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "./icons";

interface PostResult {
  type: "post";
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  author_name: string;
  author_handle?: string;
  reading_time?: number;
  tags?: string;
}

interface BookmarkResult {
  type: "bookmark";
  id: number;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  tags?: string;
}

type SearchResult = PostResult | BookmarkResult;

interface SearchModalProps {
  onClose: () => void;
}

function avatarFallback(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c63ff&color=fff&size=64`;
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim() || query.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { credentials: "include" });
        const data = await r.json();
        setResults(Array.isArray(data) ? data : []);
        setSelected(0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const navigate = useCallback((result: SearchResult | undefined) => {
    if (!result) return;
    if (result.type === "post") {
      window.location.href = `/blog/${result.slug}`;
    } else {
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (results.length === 0) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter")     { navigate(results[selected]); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, selected, navigate, onClose]);

  const posts = results.filter(r => r.type === "post") as PostResult[];
  const bookmarks = results.filter(r => r.type === "bookmark") as BookmarkResult[];

  return (
    <div className="search-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-palette">
        <div className="search-palette-input-row">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            className="search-palette-input"
            placeholder="Search posts and bookmarks…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          {loading && <div className="search-spinner" />}
          <button className="kbd" onClick={onClose} aria-label="Close search">ESC</button>
        </div>

        {results.length > 0 && (
          <div className="search-palette-results">
            {posts.length > 0 && (
              <>
                <div className="search-section-label">
                  <Icon name="feather" size={10} /> Posts
                </div>
                {posts.map((r) => {
                  const globalIdx = results.indexOf(r);
                  return (
                    <button
                      key={`post-${r.id}`}
                      className={`search-result-item${globalIdx === selected ? " selected" : ""}`}
                      onClick={() => navigate(r)}
                      onMouseEnter={() => setSelected(globalIdx)}
                    >
                      <div className="search-result-body">
                        <div className="search-result-title">{r.title}</div>
                        {r.excerpt && (
                          <div className="search-result-excerpt">{r.excerpt.slice(0, 100)}{r.excerpt.length > 100 ? "…" : ""}</div>
                        )}
                        <div className="search-result-meta">
                          <span>{r.author_name}</span>
                          {r.reading_time && <><span className="meta-dot">·</span><span>{r.reading_time} min read</span></>}
                          {r.tags && <><span className="meta-dot">·</span><span>{r.tags.split(",")[0]}</span></>}
                        </div>
                      </div>
                      <Icon name="arrow-right" size={13} />
                    </button>
                  );
                })}
              </>
            )}

            {bookmarks.length > 0 && (
              <>
                <div className="search-section-label">
                  <Icon name="bookmark" size={10} /> Bookmarks
                </div>
                {bookmarks.map((r) => {
                  const globalIdx = results.indexOf(r);
                  return (
                    <button
                      key={`bm-${r.id}`}
                      className={`search-result-item${globalIdx === selected ? " selected" : ""}`}
                      onClick={() => navigate(r)}
                      onMouseEnter={() => setSelected(globalIdx)}
                    >
                      {r.favicon && (
                        <img src={r.favicon} alt="" className="search-bm-fav"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                      <div className="search-result-body">
                        <div className="search-result-title">{r.title || getDomain(r.url)}</div>
                        <div className="search-result-meta">
                          <span className="search-bm-domain">{getDomain(r.url)}</span>
                          {r.description && <><span className="meta-dot">·</span><span>{r.description.slice(0, 60)}{r.description.length > 60 ? "…" : ""}</span></>}
                        </div>
                      </div>
                      <Icon name="arrow-up-right" size={13} />
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="search-palette-empty">
            No results for <strong>&ldquo;{query}&rdquo;</strong>
          </div>
        )}

        {!query && (
          <div className="search-palette-hint">
            Search published posts and your saved bookmarks
          </div>
        )}
      </div>
    </div>
  );
}

export function useSearchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}
