"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "./icons";

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  author_name: string;
  author_handle?: string;
  reading_time?: number;
  tags?: string;
}

interface SearchModalProps {
  onClose: () => void;
}

function avatarFallback(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c63ff&color=fff&size=64`;
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
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await r.json();
        setResults(data);
        setSelected(0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const navigate = useCallback((slug: string) => {
    window.location.href = `/blog/${slug}`;
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (results.length === 0) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter")     { navigate(results[selected].slug); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, selected, navigate, onClose]);

  return (
    <div className="search-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-palette">
        <div className="search-palette-input-row">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            className="search-palette-input"
            placeholder="Search posts, topics, tags…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          {loading && <div className="search-spinner" />}
          <span className="kbd" onClick={onClose} style={{ cursor: "pointer" }}>ESC</span>
        </div>

        {results.length > 0 && (
          <div className="search-palette-results">
            {results.map((r, i) => (
              <button
                key={r.id}
                className={`search-result-item${i === selected ? " selected" : ""}`}
                onClick={() => navigate(r.slug)}
                onMouseEnter={() => setSelected(i)}
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
            ))}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="search-palette-empty">
            No posts found for <strong>"{query}"</strong>
          </div>
        )}

        {!query && (
          <div className="search-palette-hint">
            Start typing to search all published posts
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
