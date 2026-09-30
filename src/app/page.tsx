"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, Lock } from "lucide-react";
import { Wordmark } from "@/components/Brand";
import { Orb } from "@/components/Orb";

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
    <main className="relative flex-1 flex items-center justify-center p-6 glow-dust">
      <div className="w-full max-w-2xl rise">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Orb state="solving" size={190} />
          </div>
          <div className="inline-flex">
            <Wordmark />
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight leading-[1.05]">
            Find it. Understand it.
            <br />
            <span className="text-gradient">Trust it.</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)]">
            Payroll answers with a receipt that shows <em>why</em> you can rely on them.
          </p>
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted2)]">
          Sign in as
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => login(p.id)}
              disabled={busy !== null}
              className="cozy-card cozy-press group text-left p-5 disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--selected)] text-lg font-bold ring-1 ring-[var(--selected-stroke)]">
                  {p.name[0]}
                </div>
                <div>
                  <div className="font-bold">{p.name}</div>
                  <div className="text-sm text-[var(--muted2)]">{p.role}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">{BLURB[p.id]}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
                {busy === p.id ? "Signing in…" : "Continue"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-5 text-xs text-[var(--muted2)]">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Demo personas, no passwords
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Fictional SD Worx data
          </span>
        </div>
      </div>
    </main>
  );
}
