/** SpinKit folding cube (Tobias Ahlin), recoloured for the theme. */
export function Loader({
  label,
  sub,
  size = "card",
}: {
  label?: React.ReactNode;
  sub?: React.ReactNode;
  size?: "compact" | "card" | "page";
}) {
  return (
    <div className={`fold-loader fold-loader--${size}`} role="status" aria-live="polite">
      <div className="fold-loader__cube-wrap" aria-hidden>
        <span className="fold-loader__cube fold-loader__cube--1" />
        <span className="fold-loader__cube fold-loader__cube--2" />
        <span className="fold-loader__cube fold-loader__cube--4" />
        <span className="fold-loader__cube fold-loader__cube--3" />
      </div>
      {label ? <div className="mt-2 font-semibold text-white/90">{label}</div> : null}
      {sub ? <div className="mt-0.5 text-sm text-[var(--muted2)]">{sub}</div> : null}
    </div>
  );
}
