"use client";

import { useState } from "react";
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
  const bar = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  async function toggle() {
    setOpen((o) => !o);
    if (!doc) {
      const r = await fetch(`/api/sources/${source.id}`);
      if (r.ok) setDoc((await r.json()) as Doc);
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${source.relevant ? "border-slate-200" : "border-dashed border-slate-200 opacity-70"}`}
    >
      <div className="flex items-start gap-3">
        <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              {TYPE_LABEL[source.type]}
            </span>
            {!source.relevant && (
              <span className="text-[11px] uppercase tracking-wide text-slate-400">
                · not about this question
              </span>
            )}
          </div>
          <div className="font-semibold leading-snug">{source.title}</div>
          <p className="mt-1 text-sm text-slate-700">{source.claim}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {source.signals.map((s) => (
              <SignalChip key={s.key} signal={s} />
            ))}
          </div>
        </div>
        <div className="w-20 shrink-0 text-right">
          <div className="text-lg font-semibold tabular-nums">{pct}%</div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
            <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">reliability</div>
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-sm">
        <button onClick={() => setShowWhy((v) => !v)} className="text-[#0f2a5f] hover:underline">
          {showWhy ? "Hide why" : "Why this score?"}
        </button>
        <button onClick={toggle} className="text-[#0f2a5f] hover:underline">
          {open ? "Hide document" : "Open document"}
        </button>
      </div>

      {showWhy && (
        <ul className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {source.signals.map((s) => (
            <li key={s.key} className="flex gap-2">
              <span className="w-24 shrink-0 capitalize text-slate-500">
                {s.key === "sourceType" ? "Source type" : s.key}
              </span>
              <span>
                <span className="font-medium">{s.label}.</span> {s.detail}
              </span>
            </li>
          ))}
          <li className="pt-1 text-xs text-slate-500">
            Weights: scope ×3, freshness ×2, consensus ×2, ownership ×1, source type ×1. Green = 1,
            amber = ½, red = 0.
          </li>
        </ul>
      )}

      {open && (
        <div className="mt-2 rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">
            Updated {source.updatedAt}
            {source.owner
              ? ` · ${source.owner.name}, ${source.owner.team}${source.owner.active ? "" : " (left)"}`
              : " · no owner"}
            {" · "}
            {source.scope.country}
            {source.scope.pc ? ` · PC ${source.scope.pc}` : ""}
          </div>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap font-sans text-sm text-slate-800">
            {doc ? doc.content : "Loading…"}
          </pre>
        </div>
      )}
    </div>
  );
}
