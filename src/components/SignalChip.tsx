import { Clock, FileText, MapPin, Scale, UserRound } from "lucide-react";
import type { Level, Signal } from "@/lib/types";

export const LEVEL_STYLE: Record<Level, string> = {
  green: "bg-emerald-400/12 text-emerald-200 border-emerald-300/25",
  amber: "bg-amber-400/12 text-amber-100 border-amber-300/30",
  red: "bg-rose-500/14 text-rose-100 border-rose-300/30",
};

export const LEVEL_DOT: Record<Level, string> = {
  green: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
  red: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
};

const ICON: Record<Signal["key"], React.ComponentType<{ className?: string }>> = {
  freshness: Clock,
  ownership: UserRound,
  scope: MapPin,
  consensus: Scale,
  sourceType: FileText,
};

export function SignalChip({ signal }: { signal: Signal }) {
  const Icon = ICON[signal.key];
  return (
    <span
      title={signal.detail}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${LEVEL_STYLE[signal.level]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[signal.level]}`} />
      <Icon className="h-3.5 w-3.5 opacity-80" />
      {signal.label}
    </span>
  );
}
