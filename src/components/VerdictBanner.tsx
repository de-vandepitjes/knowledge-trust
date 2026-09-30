import { AlertTriangle, CheckCircle2, OctagonX } from "lucide-react";
import type { Verdict } from "@/lib/types";

const STYLE: Record<
  Verdict,
  {
    ring: string;
    glow: string;
    iconBg: string;
    title: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  safe: {
    ring: "border-emerald-300/30",
    glow: "shadow-[0_0_80px_-30px_rgba(52,211,153,0.9)]",
    iconBg: "bg-emerald-400/20 text-emerald-200",
    title: "Safe to act",
    Icon: CheckCircle2,
  },
  verify: {
    ring: "border-amber-300/35",
    glow: "shadow-[0_0_80px_-30px_rgba(251,191,36,0.9)]",
    iconBg: "bg-amber-400/20 text-amber-100",
    title: "Verify before acting",
    Icon: AlertTriangle,
  },
  stop: {
    ring: "border-rose-300/35",
    glow: "shadow-[0_0_80px_-30px_rgba(251,113,133,0.9)]",
    iconBg: "bg-rose-500/20 text-rose-100",
    title: "Don't act on this yet",
    Icon: OctagonX,
  },
};

export function VerdictBanner({ verdict, summary }: { verdict: Verdict; summary: string }) {
  const s = STYLE[verdict];
  return (
    <div className={`cozy-card rise flex items-start gap-4 border p-5 ${s.ring} ${s.glow}`}>
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${s.iconBg}`}>
        <s.Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted2)]">
          Trust verdict
        </div>
        <div className="text-2xl font-extrabold tracking-tight leading-tight">{s.title}</div>
        <p className="mt-1 text-sm/relaxed text-[var(--muted)]">{summary}</p>
      </div>
    </div>
  );
}
