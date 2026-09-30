import { GitCompareArrows, UserRoundCheck } from "lucide-react";
import type { AskResponse } from "@/lib/types";
import { SourceCard } from "./SourceCard";
import { VerdictBanner } from "./VerdictBanner";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted2)]">
      {children}
    </h2>
  );
}

export function Receipt({ result }: { result: AskResponse }) {
  const { answer, receipt } = result;
  const titleOf = (id: string) => receipt.sources.find((s) => s.id === id)?.title ?? id;

  return (
    <div className="space-y-4">
      <VerdictBanner verdict={receipt.verdict} summary={receipt.summary} />

      <section className="cozy-card rise p-5" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center justify-between">
          <Label>Answer</Label>
          {result.cached && (
            <span
              className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] text-[var(--muted2)]"
              title={result.cachedAt}
            >
              served from cache · model unavailable
            </span>
          )}
        </div>
        <p className="mt-2 text-lg leading-relaxed text-white/95">{answer}</p>
      </section>

      {(receipt.conflicts.length > 0 || receipt.askWho) && (
        <div className="grid gap-4 md:grid-cols-2">
          {receipt.conflicts.length > 0 && (
            <section
              className="cozy-card rise border-rose-300/25 p-5"
              style={{ animationDelay: "120ms" }}
            >
              <div className="flex items-center gap-2 text-rose-200">
                <GitCompareArrows className="h-4 w-4" />
                <Label>Sources disagree</Label>
              </div>
              <ul className="mt-3 space-y-3 text-sm">
                {receipt.conflicts.map((c, i) => (
                  <li key={i}>
                    <div className="font-semibold text-white/95">{c.what}</div>
                    <div className="mt-0.5 text-[var(--muted2)]">
                      {titleOf(c.a)} <span className="opacity-60">vs</span> {titleOf(c.b)}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {receipt.askWho && (
            <section className="cozy-card rise p-5" style={{ animationDelay: "160ms" }}>
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <UserRoundCheck className="h-4 w-4" />
                <Label>Who to ask</Label>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--selected)] text-lg font-bold ring-1 ring-[var(--selected-stroke)]">
                  {receipt.askWho.name[0]}
                </div>
                <div>
                  <div className="font-bold">{receipt.askWho.name}</div>
                  <div className="text-sm text-[var(--muted2)]">{receipt.askWho.team}</div>
                </div>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{receipt.askWho.reason}</p>
            </section>
          )}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <Label>Sources checked</Label>
          <span className="font-mono text-xs text-[var(--muted2)]">{receipt.sources.length}</span>
        </div>
        <div className="space-y-3">
          {receipt.sources.map((s, i) => (
            <SourceCard key={s.id} source={s} rank={i + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
