"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#0f2a5f] text-white px-3 py-1 text-sm font-medium">
              Trust Receipt
            </span>
            <span className="hidden text-sm text-slate-500 sm:inline">
              Find it. Understand it. Trust it.
            </span>
          </div>
          {me && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-700">
                <span className="font-medium">{me.name}</span> · {me.role}
              </span>
              <button onClick={logout} className="text-slate-500 hover:underline">
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-xs uppercase tracking-wider text-slate-500">Client</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {me?.clients.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setClientId(c.id);
                  setResult(null);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  c.id === clientId
                    ? "border-[#0f2a5f] bg-[#0f2a5f] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {c.name}{" "}
                <span className="opacity-70">
                  · {c.country}
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
            className="mt-4"
          >
            <label className="text-xs uppercase tracking-wider text-slate-500">Question</label>
            <div className="mt-1 flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={client ? `Ask anything about ${client.name}…` : "Ask a question…"}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[#0f2a5f] focus:ring-2 focus:ring-[#0f2a5f]/20"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="rounded-xl bg-[#0f2a5f] px-5 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading ? "Checking…" : "Ask"}
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {(EXAMPLES[clientId] ?? []).map((q) => (
              <button
                key={q}
                onClick={() => submit(q)}
                disabled={loading}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0f2a5f]" />
            Finding sources, checking freshness, ownership, scope and consensus…
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            {error}
          </div>
        )}
        {result && <Receipt result={result} />}
      </main>
    </div>
  );
}
