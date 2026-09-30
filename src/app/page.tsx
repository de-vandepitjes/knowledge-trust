"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Persona = { id: string; name: string; role: string };

const BLURB: Record<string, string> = {
  lien: "Inherited the Bakkerij Verhaeghe and Delcour portfolios last month.",
  tom: "Handles FritzCo Retail. No access to Lien's clients.",
};

export default function LoginPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/login")
      .then((r) => r.json())
      .then(setPersonas)
      .catch(() => setPersonas([]));
  }, []);

  async function login(id: string) {
    setBusy(id);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (r.ok) router.push("/ask");
    else setBusy(null);
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0f2a5f] text-white px-4 py-1.5 text-sm font-medium tracking-wide">
            Trust Receipt
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">
            Find it. Understand it. Trust it.
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Payroll answers with a receipt that shows <em>why</em> you can rely on them.
          </p>
        </div>

        <p className="mb-3 text-sm font-medium text-slate-500 uppercase tracking-wide">
          Sign in as
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => login(p.id)}
              disabled={busy !== null}
              className="group text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0f2a5f] hover:shadow-md disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[#0f2a5f] text-white flex items-center justify-center text-lg font-semibold">
                  {p.name[0]}
                </div>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-slate-500">{p.role}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{BLURB[p.id]}</p>
              <div className="mt-4 text-sm font-medium text-[#0f2a5f] group-hover:underline">
                {busy === p.id ? "Signing in…" : "Continue →"}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          Demo personas, no passwords. Hackathon proof of concept for SD Worx. All data is
          fictional.
        </p>
      </div>
    </main>
  );
}
