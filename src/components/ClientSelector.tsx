"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

type Client = { id: string; name: string; country: string; pc?: string };

export function ClientSelector({
  clients,
  value,
  onChange,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const selected = clients.find((c) => c.id === value);
  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      (c.pc ?? "").includes(search)
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cozy-press flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-left text-sm text-white transition hover:bg-white/[0.08]"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="font-semibold">{selected.name}</span>
            <span className="font-mono text-xs text-[var(--muted2)]">
              {selected.country}
              {selected.pc ? ` · PC ${selected.pc}` : ""}
            </span>
          </span>
        ) : (
          <span className="text-[var(--muted2)]">Select a client…</span>
        )}
        <ChevronDown className={`h-4 w-4 text-[var(--muted2)] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/10 bg-[rgba(14,18,38,0.97)] shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <Search className="h-4 w-4 text-[var(--muted2)]" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--muted2)]"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-[var(--muted2)] hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--muted2)]">No clients found</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:bg-white/[0.08] ${
                    c.id === value ? "bg-white/[0.06] text-white" : "text-[var(--muted)]"
                  }`}
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className="ml-auto font-mono text-xs text-[var(--muted2)]">
                    {c.country}
                    {c.pc ? ` · PC ${c.pc}` : ""}
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-white/10 px-4 py-1.5 text-[11px] text-[var(--muted2)]">
            {filtered.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
