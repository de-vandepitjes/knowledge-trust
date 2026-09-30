"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive constellation backdrop: drifting star nodes joined by faint lines, a swirl and
 * glow around the pointer. Full-viewport, fixed, behind everything.
 * Design element ported from the Portfolio-Software landing page.
 */

const COLORS = [
  "rgba(96, 165, 250, ",
  "rgba(56, 189, 248, ",
  "rgba(129, 140, 248, ",
  "rgba(147, 197, 253, ",
  "rgba(165, 180, 252, ",
] as const;

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  size: number;
  baseSize: number;
  color: string;
  life: number;
};

const rgba = (color: string, alpha: number) =>
  `${color}${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;

export function Constellation() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, lastX: -9999, lastY: -9999, vx: 0, vy: 0, active: false };

    let width = 0;
    let height = 0;
    let frameId = 0;
    let nodes: Node[] = [];
    const nodeMargin = 36;
    const connectionDistance = reducedMotion ? 148 : 168;
    const mouseRadius = 212;

    function resetNodes() {
      const area = width * height;
      const target = reducedMotion
        ? Math.max(96, Math.min(150, Math.round(area / 18000)))
        : Math.max(150, Math.min(220, Math.round(area / 11000)));
      const cell = reducedMotion ? 152 : 120;
      const cols = Math.max(6, Math.ceil(width / cell));
      const rows = Math.max(6, Math.ceil(height / cell));
      const jx = width / cols;
      const jy = height / rows;
      const out: Node[] = [];
      const make = (x: number, y: number, v: number): Node => {
        const baseSize = 0.95 + Math.random() * 1.85;
        return {
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * v,
          vy: (Math.random() - 0.5) * v,
          size: baseSize,
          baseSize,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          life: Math.random(),
        };
      };
      for (let r = 0; r < rows; r += 1)
        for (let c = 0; c < cols; c += 1) {
          if (Math.random() < (reducedMotion ? 0.14 : 0.08)) continue;
          out.push(
            make(
              (c + 0.18 + Math.random() * 0.64) * jx,
              (r + 0.18 + Math.random() * 0.64) * jy,
              0.24,
            ),
          );
        }
      while (out.length < target)
        out.push(make(Math.random() * width, Math.random() * height, 0.22));
      nodes = out;
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, reducedMotion ? 1 : 1.25);
      canvas!.width = Math.max(1, Math.floor(width * ratio));
      canvas!.height = Math.max(1, Math.floor(height * ratio));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
      resetNodes();
    }

    function move(nextX: number, nextY: number, clamp: number) {
      const can = pointer.active && pointer.lastX > -9000 && pointer.lastY > -9000;
      pointer.vx = can ? Math.max(-clamp, Math.min(clamp, nextX - pointer.lastX)) : 0;
      pointer.vy = can ? Math.max(-clamp, Math.min(clamp, nextY - pointer.lastY)) : 0;
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.lastX = nextX;
      pointer.lastY = nextY;
      pointer.active = true;
    }
    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY, 24);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY, 20);
    };
    function leave() {
      pointer.active = false;
      pointer.x = pointer.y = pointer.lastX = pointer.lastY = -9999;
      pointer.vx = pointer.vy = 0;
    }

    function render() {
      const c = ctx!;
      c.clearRect(0, 0, width, height);
      const time = Date.now() * 0.001;

      for (const n of nodes) {
        n.life += 0.003;
        n.vx += Math.sin(n.life * 2 + n.baseX * 0.01) * 0.15 * 0.02;
        n.vy += Math.cos(n.life * 1.5 + n.baseY * 0.01) * 0.02;
        if (pointer.active && !reducedMotion) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const d = Math.hypot(dx, dy);
          if (d < mouseRadius) {
            const force = (mouseRadius - d) / mouseRadius;
            const angle = Math.atan2(dy, dx);
            const swirl = angle + Math.PI * 0.5;
            n.vx +=
              Math.cos(swirl) * force * 0.062 +
              Math.cos(angle) * force * 0.026 +
              pointer.vx * force * 0.006;
            n.vy +=
              Math.sin(swirl) * force * 0.062 +
              Math.sin(angle) * force * 0.026 +
              pointer.vy * force * 0.006;
            n.size = Math.min(n.size + force * 0.16, 5.1);
          } else n.size += (n.baseSize - n.size) * 0.09;
        }
        n.vx += (n.baseX - n.x) * 0.001;
        n.vy += (n.baseY - n.y) * 0.001;
        n.vx = Math.max(-2.4, Math.min(2.4, n.vx * 0.97));
        n.vy = Math.max(-2.4, Math.min(2.4, n.vy * 0.97));
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -nodeMargin) n.x = width + nodeMargin;
        if (n.x > width + nodeMargin) n.x = -nodeMargin;
        if (n.y < -nodeMargin) n.y = height + nodeMargin;
        if (n.y > height + nodeMargin) n.y = -nodeMargin;
      }

      const grid = new Map<string, number[]>();
      const cellOf = (n: Node) =>
        [
          Math.floor((n.x + nodeMargin) / connectionDistance),
          Math.floor((n.y + nodeMargin) / connectionDistance),
        ] as const;
      nodes.forEach((n, i) => {
        const [cx, cy] = cellOf(n);
        const key = `${cx},${cy}`;
        const b = grid.get(key);
        if (b) b.push(i);
        else grid.set(key, [i]);
      });

      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        const [cx, cy] = cellOf(n);
        for (let oy = -1; oy <= 1; oy += 1)
          for (let ox = -1; ox <= 1; ox += 1) {
            const b = grid.get(`${cx + ox},${cy + oy}`);
            if (!b) continue;
            for (const j of b) {
              if (j <= i) continue;
              const o = nodes[j];
              const d = Math.hypot(o.x - n.x, o.y - n.y);
              if (d >= connectionDistance) continue;
              const strength = 1 - d / connectionDistance;
              let alpha = 0.06 + strength * 0.22;
              let lw = 0.5 + strength * 0.46;
              let blur = 0;
              if (pointer.active) {
                const md = Math.hypot(pointer.x - (n.x + o.x) * 0.5, pointer.y - (n.y + o.y) * 0.5);
                if (md < mouseRadius) {
                  const boost = (1 - md / mouseRadius) * 0.48;
                  alpha += boost;
                  lw += boost * 1.2;
                  blur = 12 + boost * 20;
                  c.shadowColor = rgba(n.color, 0.22 + boost * 0.35);
                }
              }
              c.beginPath();
              c.moveTo(n.x, n.y);
              c.lineTo(o.x, o.y);
              c.strokeStyle = rgba(n.color, alpha);
              c.lineWidth = lw;
              c.shadowBlur = blur;
              c.stroke();
              c.shadowBlur = 0;
            }
          }
      }

      for (const n of nodes) {
        const pulse = Math.sin(time * 2 + n.life * 10) * 0.3 + 0.7;
        const pd = pointer.active ? Math.hypot(pointer.x - n.x, pointer.y - n.y) : mouseRadius * 4;
        const boost = pointer.active ? Math.max(0, 1 - pd / mouseRadius) : 0;
        const haloR = Math.max(5.5, n.size * 3.2);
        const halo = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
        halo.addColorStop(0, rgba(n.color, 0.1 * pulse + boost * 0.16));
        halo.addColorStop(1, rgba(n.color, 0));
        c.beginPath();
        c.arc(n.x, n.y, haloR, 0, Math.PI * 2);
        c.fillStyle = halo;
        c.fill();
        c.beginPath();
        c.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        c.fillStyle = rgba(n.color, 0.74 * pulse + 0.14 + boost * 0.24);
        c.fill();
        if (n.size > 1.6) {
          const g = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size * 2.6);
          g.addColorStop(0, rgba(n.color, 0.12 + boost * 0.14));
          g.addColorStop(1, rgba(n.color, 0));
          c.beginPath();
          c.arc(n.x, n.y, n.size * 2.6, 0, Math.PI * 2);
          c.fillStyle = g;
          c.fill();
        }
      }

      if (pointer.active) {
        const glow = c.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          mouseRadius,
        );
        glow.addColorStop(0, "rgba(96, 165, 250, 0.032)");
        glow.addColorStop(0.5, "rgba(96, 165, 250, 0.014)");
        glow.addColorStop(1, "rgba(96, 165, 250, 0)");
        c.fillStyle = glow;
        c.fillRect(0, 0, width, height);
      }
      frameId = window.requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", leave, { passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("mouseleave", leave);
    frameId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  return <canvas ref={ref} className="constellation-canvas" aria-hidden />;
}
