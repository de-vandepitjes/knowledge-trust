"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { SourceCard as SourceCardT } from "@/lib/types";
import { SignalChip } from "./SignalChip";

const TYPE_LABEL: Record<SourceCardT["type"], string> = {
  policy: "Policy",
  cla: "Client agreement",
  handover: "Handover note",
  chat: "Teams chat",
};

type Doc = { content: string };

export function SourceCard({ source, rank }: { source: SourceCardT; rank: number }) {
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const pct = Math.round(source.score * 100);
  const bar = pct >= 75 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-rose-400";

  async function toggle() {
    setOpen((o) => !o);
    if (!doc) {
      const r = await fetch(`/api/sources/${source.id}`);
      if (r.ok) setDoc((await r.json()) as Doc);
    }
  }

  return (
    <div
      className={`cozy-card rise p-4 ${source.relevant ? "" : "opacity-60"}`}
      style={{ animationDelay: `${rank * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-[var(--muted)] ring-1 ring-white/10 font-mono">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted2)]">
            {TYPE_LABEL[source.type]}
            {!source.relevant && (
              <span className="ml-2 normal-case tracking-normal">· not about this question</span>
            )}
          </div>
          <div className="mt-0.5 font-bold leading-snug">{source.title}</div>
          <p className="mt-1 text-sm text-[var(--muted)]">{source.claim}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {source.signals.map((s) => (
              <SignalChip key={s.key} signal={s} />
            ))}
          </div>
        </div>
        <div className="w-20 shrink-0 text-right">
          <div className="text-xl font-extrabold tabular-nums font-mono">{pct}%</div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10">
            <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted2)]">
            reliability
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2 text-sm">
        <button
          onClick={() => setShowWhy((v) => !v)}
          className="cozy-press inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
        >
          Why this score
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showWhy ? "rotate-180" : ""}`}
          />
        </button>
        <button
          onClick={toggle}
          className="cozy-press inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
        >
          {open ? "Hide document" : "Open document"}
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      {showWhy && (
        <ul className="cozy-card-soft mt-3 space-y-1.5 p-3 text-sm text-[var(--muted)]">
          {source.signals.map((s) => (
            <li key={s.key} className="flex gap-3">
              <span className="w-24 shrink-0 text-[var(--muted2)]">
                {s.key === "sourceType" ? "Source type" : s.key[0].toUpperCase() + s.key.slice(1)}
              </span>
              <span>
                <span className="font-semibold text-white/90">{s.label}.</span> {s.detail}
              </span>
            </li>
          ))}
          <li className="pt-1 text-xs text-[var(--muted2)] font-mono">
            weights: scope ×3 · freshness ×2 · consensus ×2 · ownership ×1 · type ×1
          </li>
        </ul>
      )}

      {open && (
        <div className="cozy-card-soft mt-3 p-3">
          <div className="text-xs text-[var(--muted2)] font-mono">
            updated {source.updatedAt}
            {source.owner
              ? ` · ${source.owner.name}, ${source.owner.team}${source.owner.active ? "" : " (left)"}`
              : " · no owner"}
            {" · "}
            {source.scope.country}
            {source.scope.pc ? ` · PC ${source.scope.pc}` : ""}
          </div>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap font-sans text-sm text-white/85">
            {doc ? doc.content : "Loading…"}
          </pre>
        </div>
      )}
    </div>
  );
}
