"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import { Wordmark } from "@/components/Brand";
import { Constellation } from "@/components/Constellation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (r.ok) router.push("/ask");
      else setError(((await r.json()) as { error?: string }).error ?? "Sign-in failed");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="landing-bg relative flex-1 flex items-center justify-center p-6">
      <Constellation />
      <div className="w-full max-w-md rise">
        <div className="mb-8 text-center">
          <div className="inline-flex">
            <Wordmark />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight leading-[1.05]">
            Find it. Understand it. <span className="text-gradient">Trust it.</span>
          </h1>
        </div>

        <form onSubmit={submit} className="cozy-card p-6 space-y-4">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted2)]">
              Username
            </span>
            <div className="relative mt-1.5">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted2)]" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-3 text-white outline-none transition focus:border-[var(--selected-stroke)] focus:ring-4 focus:ring-sky-400/10"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted2)]">
              Password
            </span>
            <div className="relative mt-1.5">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted2)]" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-10 text-white outline-none transition focus:border-[var(--selected-stroke)] focus:ring-4 focus:ring-sky-400/10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted2)] hover:text-white transition"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error && (
            <div className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !username || !password}
            className="btn-primary cozy-press inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold disabled:opacity-40"
          >
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
