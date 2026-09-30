"use client";

import { useEffect, useRef } from "react";
import {
  attachGravity,
  MODE_DRAWS,
  resolvePreset,
  setGravitySprite,
  type OrbState,
} from "thinking-orbs";

/**
 * Entry-screen orb drawn with the thinking-orbs engine, plus the library's cursor gravity:
 * the pointer bends toward the orb as it nears. Design element only.
 */

// Raster of the macOS arrow pointer. The library hides the real cursor near the orb and
// draws this in its place, so it must match the OS pointer; hence macOS + fine pointer only.
const ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="24" viewBox="0 0 16 24">
<path d="M1 1 L1 20.2 L6 15.3 L9.1 21.8 L11.8 20.5 L8.8 14.2 L15 14.2 Z"
 fill="#000" stroke="#fff" stroke-width="1.15" stroke-linejoin="round"/>
</svg>`;
const MAC_ARROW_SPRITE = {
  src: `data:image/svg+xml;utf8,${encodeURIComponent(ARROW_SVG)}`,
  width: 16,
  height: 24,
  hotX: 1,
  hotY: 1,
};

function hasMatchingCursorSprite(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const platform = `${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
  const isMac = /Mac|iPad|iPhone/.test(platform);
  const finePointer = window.matchMedia?.("(pointer: fine)")?.matches ?? false;
  return isMac && finePointer;
}

export function Orb({
  state = "solving",
  size = 200,
  cursorGravity = true,
  className = "",
}: {
  state?: OrbState;
  size?: number;
  cursorGravity?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !cursorGravity || !hasMatchingCursorSprite()) return;
    setGravitySprite(MAC_ARROW_SPRITE);
    return attachGravity(canvas, { reach: 240 });
  }, [cursorGravity]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    // The 64px preset carries the tuned dot count and speed; only the pixel size differs.
    const { mode, speed, opts } = resolvePreset(state, 64);
    const draw = (seconds: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      MODE_DRAWS[mode](ctx, size, seconds, true, opts);
    };
    if (still) {
      draw(0.6);
      return;
    }
    let frame = 0;
    const loop = () => {
      draw((performance.now() / 1000) * speed);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [size, state]);

  return (
    <canvas
      key={`${state}-${size}`}
      ref={ref}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
