"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

const COLLECTION_COLORS = [
  "#6366f1", "#14613a", "#b46a2a", "#d04f63", "#2f7d4d",
  "#7c3aed", "#1f6fd9", "#e11d48", "#0891b2", "#65a30d",
];

export function NewCollectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("📁");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/collections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color, icon }),
      });
      if (r.ok) {
        onCreated();
        onClose();
      } else {
        const d = await r.json();
        setError(d.error || "Failed to create collection");
        setLoading(false);
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div
      className="coll-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form className="coll-palette" onSubmit={handleSubmit}>

        <div className="coll-input-row">
          <Icon name="folder" size={16} />
          <input
            ref={inputRef}
            className="coll-input"
            placeholder="Collection name…"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="off"
          />
          <button className="kbd" onClick={onClose} aria-label="Close">ESC</button>
        </div>

        {error && <div className="coll-error">{error}</div>}

        <div className="coll-options">
          <div className="coll-option-row">
            <span className="coll-option-label">Icon</span>
            <input
              className="coll-icon-input"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              maxLength={4}
            />
          </div>
          <div className="coll-option-row">
            <span className="coll-option-label">Color</span>
            <div className="coll-colors">
              {COLLECTION_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`coll-swatch${color === c ? " active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="coll-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>

      </form>
    </div>
  );
}
