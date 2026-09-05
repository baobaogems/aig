// threshold-bar.tsx — a value against the gate it has to clear. Deliberately NOT a
// progress bar: no gradient, no glow, no animation, no rounded "fill to 100%" framing.
// This is an accountability readout, so the thing that must be legible in one glance is
// the RELATION to the threshold, not how full the bar is.
//
// The threshold values are not passed as decoration — callers read them from
// lib/arbiter/tiers.ts (TIER_THRESHOLDS), which is what actually gates the money.

export interface ThresholdBarProps {
  /** What is being measured, e.g. "score" or "confidence". */
  label: string;
  /** 0–100. */
  value: number;
  /** 0–100. The gate this value must reach to qualify for T1 auto-release. */
  threshold: number;
  /** Tier colour token, e.g. "var(--color-tier-t1)". Passed in so the bar speaks the
   *  same colour language as the TierPill next to it. */
  color: string;
  /** Which surface it sits on. The landing renders it on obsidian; /arbiter renders it on
   *  the light surface, where on-dark ink and a white track would be invisible. */
  tone?: "dark" | "light";
}

export function ThresholdBar({ label, value, threshold, color, tone = "dark" }: ThresholdBarProps) {
  const clear = value >= threshold;
  const onDark = tone === "dark";
  const muted = onDark ? "var(--color-on-dark-muted)" : "var(--color-ink-muted)";
  const strong = onDark ? "var(--color-on-dark)" : "var(--color-ink)";
  const track = onDark ? "bg-white/10" : "bg-[var(--color-ink)]/10";
  const verdict = clear ? "clears the gate" : "below the gate";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-wide" style={{ color: muted }}>{label}</span>
        <span className="tnum font-[family-name:var(--font-jetbrains-mono)] text-xs" style={{ color: muted }}>
          <span style={{ color: strong }}>{value}</span> · gate {threshold}
        </span>
      </div>

      {/* The bar. role=img + aria-label because the shape carries the meaning; screen
          readers get the same sentence a sighted reader gets in one glance. */}
      <div
        role="img"
        aria-label={`${label} ${value}, gate ${threshold}, ${verdict}`}
        className={`relative mt-1.5 h-1.5 w-full rounded-full ${track}`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, backgroundColor: color, opacity: clear ? 0.9 : 0.55 }}
        />
        {/* the gate itself — a hard tick, drawn over the fill so it stays readable
            whether the value clears it or falls short */}
        <div
          className="absolute -top-1 -bottom-1 w-px"
          style={{ left: `${threshold}%`, backgroundColor: strong }}
        />
      </div>
    </div>
  );
}
