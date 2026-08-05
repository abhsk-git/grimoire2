"use client";

import { useEffect } from "react";

export function useMobileDrawerGesture(open: boolean, setOpen: (open: boolean) => void) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    function onStart(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
    }

    function onEnd(event: TouchEvent) {
      const touch = event.changedTouches[0];
      if (!touch || window.innerWidth > 720) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      if (!open && startX >= viewportWidth - 72 && dx < 0) setOpen(true);
      if (open && dx > 0) setOpen(false);
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [open, setOpen]);
}
