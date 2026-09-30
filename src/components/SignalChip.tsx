import type { Level, Signal } from "@/lib/types";

export const LEVEL_STYLE: Record<Level, string> = {
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-800 border-red-200",
};

export const LEVEL_DOT: Record<Level, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const ICON: Record<Signal["key"], string> = {
  freshness: "🕒",
  ownership: "👤",
  scope: "📍",
  consensus: "⚖️",
  sourceType: "📄",
};

export function SignalChip({ signal }: { signal: Signal }) {
  return (
    <span
      title={signal.detail}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${LEVEL_STYLE[signal.level]}`}
    >
      <span className={`h-2 w-2 rounded-full ${LEVEL_DOT[signal.level]}`} />
      <span aria-hidden>{ICON[signal.key]}</span>
      {signal.label}
    </span>
  );
}
