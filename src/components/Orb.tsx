"use client";

import { useEffect, useRef } from "react";
import {
  attachGravity,
  MODE_DRAWS,
  resolvePreset,
  setGravitySprite,
  type OrbState,
} from "thinking-orbs";

/** Entry-screen orb drawn with the thinking-orbs engine. Design element only. */

export function Orb({
  state = "solving",
  size = 200,
  className = "",
}: {
  state?: OrbState;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

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
