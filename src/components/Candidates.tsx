"use client";

import { useState } from "react";
import { Check, ListOrdered, Trophy } from "lucide-react";
import type { Candidate, SourceCard } from "@/lib/types";

export function Candidates({
  candidates,
  margin,
  sources,
  question,
  clientId,
}: {
  candidates: Candidate[];
  margin: number;
  sources: SourceCard[];
  question: string;
  clientId: string;
}) {
  const [used, setUsed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  if (candidates.length === 0) return null;
  const clear = candidates.length === 1 || margin >= 0.25;
  const titleOf = (id: string) => sources.find((s) => s.id === id)?.title ?? id;

  async function use(i: number) {
    setBusy(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, clientId, sourceIds: candidates[i].sourceIds }),
      });
      if (r.ok) setUsed(i);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cozy-card rise p-5" style={{ animationDelay: "90ms" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          {clear ? <Trophy className="h-4 w-4" /> : <ListOrdered className="h-4 w-4" />}
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted2)]">
            {clear ? "Clear answer" : "Competing answers"}
          </h2>
        </div>
        <span className="font-mono text-xs text-[var(--muted2)]">
          {candidates.length === 1 ? "single answer" : `margin ${Math.round(margin * 100)} pts`}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {candidates.map((c, i) => (
          <li
            key={i}
            className={`cozy-card-soft flex items-center gap-3 p-3 ${i === 0 ? "border-[var(--selected-stroke)]" : ""}`}
          >
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06] font-mono text-xs font-bold text-[var(--muted)] ring-1 ring-white/10">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white/95">{c.answer}</div>
              <div className="mt-0.5 truncate text-xs text-[var(--muted2)]">
                {c.sourceIds.map(titleOf).join(" · ")}
              </div>
            </div>
            <div className="w-16 shrink-0 text-right">
              <div className="font-mono text-lg font-extrabold tabular-nums">
                {Math.round(c.share * 100)}%
              </div>
              <div className="h-1 w-full rounded-full bg-white/10">
                <div
                  className="h-1 rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.round(c.share * 100)}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => use(i)}
              disabled={busy || used !== null}
              className={`cozy-press inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                used === i ? "cozy-selected" : "border-white/10 bg-white/[0.05] text-[var(--muted)]"
              } disabled:opacity-60`}
            >
              <Check className="h-3.5 w-3.5" />
              {used === i ? "Used" : "Use this"}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[var(--muted2)]">
        {used !== null
          ? "Thanks. The supporting sources count as consulted, and the signal weights moved a little toward what made them reliable."
          : "Marking the answer you act on feeds back into the source scores and the signal weights."}
      </p>
    </section>
  );
}
