import { ShieldCheck } from "lucide-react";

export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${s}`}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/30">
        <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
      </span>
      Trust<span className="text-gradient">Receipt</span>
    </span>
  );
}
