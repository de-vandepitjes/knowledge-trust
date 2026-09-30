import type { AskResponse } from "@/lib/types";
import { SourceCard } from "./SourceCard";
import { VerdictBanner } from "./VerdictBanner";

export function Receipt({ result }: { result: AskResponse }) {
  const { answer, receipt } = result;
  const titleOf = (id: string) => receipt.sources.find((s) => s.id === id)?.title ?? id;

  return (
    <div className="space-y-5">
      <VerdictBanner verdict={receipt.verdict} summary={receipt.summary} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-slate-500">Answer</h2>
          {result.cached && (
            <span
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500"
              title={result.cachedAt}
            >
              served from cache, model unavailable
            </span>
          )}
        </div>
        <p className="mt-2 text-lg leading-relaxed">{answer}</p>
      </section>

      {(receipt.conflicts.length > 0 || receipt.askWho) && (
        <div className="grid gap-4 md:grid-cols-2">
          {receipt.conflicts.length > 0 && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h2 className="text-xs uppercase tracking-wider text-red-700">Sources disagree</h2>
              <ul className="mt-2 space-y-2 text-sm text-red-900">
                {receipt.conflicts.map((c, i) => (
                  <li key={i}>
                    <div className="font-medium">{c.what}</div>
                    <div className="text-red-700/80">
                      {titleOf(c.a)} <span className="opacity-60">vs</span> {titleOf(c.b)}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {receipt.askWho && (
            <section className="rounded-2xl border border-[#0f2a5f]/20 bg-white p-5">
              <h2 className="text-xs uppercase tracking-wider text-slate-500">Who to ask</h2>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[#0f2a5f] text-white flex items-center justify-center text-lg font-semibold">
                  {receipt.askWho.name[0]}
                </div>
                <div>
                  <div className="font-semibold">{receipt.askWho.name}</div>
                  <div className="text-sm text-slate-500">{receipt.askWho.team}</div>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{receipt.askWho.reason}</p>
            </section>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-slate-500">
          Sources checked · {receipt.sources.length}
        </h2>
        <div className="space-y-3">
          {receipt.sources.map((s, i) => (
            <SourceCard key={s.id} source={s} rank={i + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
