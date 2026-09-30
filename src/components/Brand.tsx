/** SD Worx-style mark: the slanted colour stripes, followed by the product name. */
export function SdWorxMark({ className = "h-6" }: { className?: string }) {
  const colors = ["#e63946", "#f77f00", "#fcbf49", "#2a9d8f", "#3a86ff"];
  return (
    <svg viewBox="0 0 34 24" className={className} aria-hidden>
      {colors.map((c, i) => (
        <path
          key={c}
          d={`M${4 + i * 5} 24 L${10 + i * 5} 0 L${13 + i * 5} 0 L${7 + i * 5} 24 Z`}
          fill={c}
        />
      ))}
    </svg>
  );
}

export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  const text = size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={`inline-flex items-center gap-2.5 font-extrabold tracking-tight ${text}`}>
      <SdWorxMark className={size === "sm" ? "h-5" : "h-6"} />
      <span className="font-bold lowercase tracking-normal text-white/95">sd worx</span>
      <span className="h-4 w-px bg-white/20" />
      <span className="font-semibold text-white/80">Trust Receipt</span>
    </span>
  );
}
