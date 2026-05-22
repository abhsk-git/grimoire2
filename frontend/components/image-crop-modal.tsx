"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ImageCropModalProps {
  file: File;
  aspectRatio: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  outputWidth?: number;
  label?: string;
}

export function ImageCropModal({
  file,
  aspectRatio,
  onConfirm,
  onCancel,
  outputWidth = 1400,
  label = "Adjust image",
}: ImageCropModalProps) {
  const [src, setSrc] = useState("");
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setLoaded(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clamp = useCallback((ox: number, oy: number, s: number) => {
    const vp = viewportRef.current;
    const img = imgRef.current;
    if (!vp || !img || !img.naturalWidth) return { x: ox, y: oy };
    const vW = vp.clientWidth;
    const vH = vp.clientHeight;
    const maxX = Math.max(0, (img.naturalWidth * s - vW) / 2);
    const maxY = Math.max(0, (img.naturalHeight * s - vH) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, []);

  function handleImgLoad() {
    const vp = viewportRef.current;
    const img = imgRef.current;
    if (!vp || !img) return;
    const cover = Math.max(vp.clientWidth / img.naturalWidth, vp.clientHeight / img.naturalHeight);
    setMinScale(cover);
    setScale(cover);
    scaleRef.current = cover;
    setOffset({ x: 0, y: 0 });
    setLoaded(true);
  }

  // Mouse drag
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragRef.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  }

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent) {
      const dx = e.clientX - dragRef.current.mx;
      const dy = e.clientY - dragRef.current.my;
      const next = clamp(dragRef.current.ox + dx, dragRef.current.oy + dy, scaleRef.current);
      setOffset(next);
    }
    function onUp() { setDragging(false); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, clamp]);

  // Scroll to zoom
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const next = Math.max(minScale, Math.min(minScale * 5, scaleRef.current * (1 - e.deltaY * 0.0008)));
      scaleRef.current = next;
      setScale(next);
      setOffset(o => clamp(o.x, o.y, next));
    }
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [minScale, clamp]);

  // Touch drag
  const touchRef = useRef({ active: false, x: 0, y: 0 });
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchRef.current = { active: true, x: t.clientX, y: t.clientY };
    dragRef.current = { mx: t.clientX, my: t.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - dragRef.current.mx;
    const dy = t.clientY - dragRef.current.my;
    const next = clamp(dragRef.current.ox + dx, dragRef.current.oy + dy, scaleRef.current);
    setOffset(next);
  }

  async function handleConfirm() {
    const vp = viewportRef.current;
    const img = imgRef.current;
    if (!vp || !img) return;

    const vW = vp.clientWidth;
    const vH = vp.clientHeight;
    const { naturalWidth: iW, naturalHeight: iH } = img;
    const s = scaleRef.current;
    const { x: ox, y: oy } = offsetRef.current;

    // Image top-left in viewport coords (image is centered + offset)
    const imgLeft = vW / 2 + ox - (iW * s) / 2;
    const imgTop  = vH / 2 + oy - (iH * s) / 2;

    // Crop rect in natural image pixels
    const srcX = Math.max(0, -imgLeft / s);
    const srcY = Math.max(0, -imgTop / s);
    const srcW = Math.min(iW - srcX, vW / s);
    const srcH = Math.min(iH - srcY, vH / s);

    const outH = Math.round(outputWidth / aspectRatio);
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outH);
    canvas.toBlob(blob => { if (blob) onConfirm(blob); }, "image/jpeg", 0.93);
  }

  return (
    <div className="crop-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="crop-modal">
        <div className="crop-head">
          <span className="crop-title">{label}</span>
          <button className="crop-close" onClick={onCancel} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div
          className="crop-viewport"
          ref={viewportRef}
          style={{ aspectRatio: String(aspectRatio), cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { touchRef.current.active = false; }}
        >
          {!loaded && (
            <div className="crop-loading">
              <div className="crop-spinner" />
            </div>
          )}
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              className="crop-img"
              draggable={false}
              onLoad={handleImgLoad}
              style={{
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                opacity: loaded ? 1 : 0,
              }}
            />
          )}
        </div>

        <div className="crop-foot">
          <div className="crop-zoom-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.45">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <input
              type="range"
              className="crop-slider"
              min={minScale}
              max={minScale * 5}
              step={0.0005}
              value={scale}
              onChange={e => {
                const s = +e.target.value;
                scaleRef.current = s;
                setScale(s);
                setOffset(o => clamp(o.x, o.y, s));
              }}
            />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.45">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <div className="crop-actions">
            <span className="crop-hint">Drag to reposition · scroll to zoom</span>
            <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleConfirm}>Crop & use</button>
          </div>
        </div>
      </div>
    </div>
  );
}
