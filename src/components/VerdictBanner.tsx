import type { Verdict } from "@/lib/types";

const STYLE: Record<Verdict, { bg: string; ring: string; title: string; icon: string }> = {
  safe: { bg: "bg-emerald-600", ring: "ring-emerald-200", title: "Safe to act", icon: "✓" },
  verify: { bg: "bg-amber-500", ring: "ring-amber-200", title: "Verify before acting", icon: "!" },
  stop: { bg: "bg-red-600", ring: "ring-red-200", title: "Don't act on this yet", icon: "✕" },
};

export function VerdictBanner({ verdict, summary }: { verdict: Verdict; summary: string }) {
  const s = STYLE[verdict];
  return (
    <div className={`flex items-start gap-4 rounded-2xl ${s.bg} text-white p-5 ring-4 ${s.ring}`}>
      <div className="h-11 w-11 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
        {s.icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider opacity-80">Trust verdict</div>
        <div className="text-2xl font-semibold leading-tight">{s.title}</div>
        <p className="mt-1 text-sm/relaxed opacity-95">{summary}</p>
      </div>
    </div>
  );
}
