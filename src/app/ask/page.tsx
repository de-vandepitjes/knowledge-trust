"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Search, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/Brand";
import { Loader } from "@/components/Loader";
import { Receipt } from "@/components/Receipt";
import type { AskResponse } from "@/lib/types";

type Me = {
  id: string;
  name: string;
  role: string;
  clients: { id: string; name: string; country: string; pc?: string }[];
};

const EXAMPLES: Record<string, string[]> = {
  verhaeghe: [
    "What is the maximum employer contribution for meal vouchers for Bakkerij Verhaeghe this year?",
    "How many days of notice does the employer give to terminate a fixed-term contract early after two months?",
    "What is the bicycle allowance for a cross-border worker living in Luxembourg?",
  ],
  delcour: ["What is the maximum eco voucher amount for Delcour Logistics?"],
  fritzco: ["What is the meal voucher employer share for FritzCo Retail?"],
};

const STEPS = [
  "Finding sources",
  "Checking freshness",
  "Checking ownership",
  "Matching scope",
  "Comparing claims",
];

function Loading() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % STEPS.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="cozy-card rise p-8">
      <Loader label={`${STEPS[i]}…`} sub="Building the trust receipt" />
    </div>
  );
}

export default function AskPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [clientId, setClientId] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(async (r) => {
      if (!r.ok) return router.replace("/");
      const m = (await r.json()) as Me;
      setMe(m);
      setClientId(m.clients[0]?.id ?? "");
    });
  }, [router]);

  async function submit(q = question) {
    if (!q.trim() || !clientId) return;
    setQuestion(q);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, clientId }),
      });
      const data = (await r.json()) as AskResponse | { error: string };
      if (!r.ok || "error" in data) setError("error" in data ? data.error : "Something went wrong");
      else setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/");
  }

  const client = me?.clients.find((c) => c.id === clientId);

  return (
    <div className="flex-1">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[rgba(7,10,26,0.55)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Wordmark size="sm" />
          {me && (
            <div className="flex items-center gap-3 text-sm">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--selected)] text-sm font-bold ring-1 ring-[var(--selected-stroke)]">
                {me.name[0]}
              </div>
              <span className="hidden sm:inline">
                <span className="font-semibold">{me.name}</span>
                <span className="text-[var(--muted2)]"> · {me.role}</span>
              </span>
              <button
                onClick={logout}
                className="cozy-press inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-5">
        <section className="cozy-card rise p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted2)]">
            Client
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {me?.clients.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setClientId(c.id);
                  setResult(null);
                }}
                className={`cozy-press rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-sm font-semibold text-[var(--muted)] ${
                  c.id === clientId ? "cozy-selected" : ""
                }`}
              >
                {c.name}
                <span className="ml-1.5 font-mono text-xs opacity-70">
                  {c.country}
                  {c.pc ? ` · PC ${c.pc}` : ""}
                </span>
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="mt-5"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted2)]">
              Question
            </div>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted2)]" />
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={client ? `Ask anything about ${client.name}…` : "Ask a question…"}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3 pl-11 pr-4 text-base text-white placeholder:text-[var(--muted2)] outline-none transition focus:border-[var(--selected-stroke)] focus:bg-white/[0.07] focus:ring-4 focus:ring-sky-400/10"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="btn-primary cozy-press inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-bold disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "Checking" : "Ask"}
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {(EXAMPLES[clientId] ?? []).map((q) => (
              <button
                key={q}
                onClick={() => submit(q)}
                disabled={loading}
                className="cozy-press rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[var(--muted)] hover:bg-white/[0.08] disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {loading && <Loading />}
        {error && (
          <div className="cozy-card rise border-rose-300/30 p-5 text-rose-100">{error}</div>
        )}
        {result && <Receipt result={result} />}
      </main>
    </div>
  );
}
