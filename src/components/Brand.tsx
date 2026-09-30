import Image from "next/image";

/** Official SD Worx logo (from the hackathon brief), shown unaltered on a white pill. */
export function SdWorxLogo({ height = 22 }: { height?: number }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1.5">
      <Image
        src="/sdworx-logo.png"
        alt="SD Worx"
        height={height}
        width={Math.round(height * 3.4)}
        priority
      />
    </span>
  );
}

export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="inline-flex items-center gap-3">
      <SdWorxLogo height={size === "sm" ? 18 : 22} />
      <span className="h-4 w-px bg-white/20" />
      <span className={`font-semibold text-white/85 ${size === "sm" ? "text-sm" : "text-base"}`}>
        Trust Receipt
      </span>
    </span>
  );
}
