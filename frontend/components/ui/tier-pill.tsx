// tier-pill.tsx — reskin: verdict tier as a calm status pill, not a loud gauge.
// T1 (auto-release) = cyan, T2 (escalate) = amber, T3/REFUSE = muted red.

const TIER_BY_DECISION: Record<string, "T1" | "T2" | "T3"> = {
  RELEASE: "T1",
  ESCALATE: "T2",
  FAIL: "T3",
  REFUSE: "T3",
};

const TIER_LABEL: Record<"T1" | "T2" | "T3", string> = {
  T1: "T1 · auto-release",
  T2: "T2 · escalated",
  T3: "T3 · refused / failed",
};

const TIER_COLOR: Record<"T1" | "T2" | "T3", string> = {
  T1: "var(--color-tier-t1)",
  T2: "var(--color-tier-t2)",
  T3: "var(--color-tier-t3)",
};

// On a light surface the bright cyan and amber fail WCAG AA as small text (2.88:1 and
// 2.22:1 on white). Same hues, darkened, for the label only — the dot and border keep the
// bright tier colour, where the 3:1 non-text threshold applies. On obsidian the bright
// tokens are already well clear, so tone="dark" keeps them.
const TIER_INK_ON_LIGHT: Record<"T1" | "T2" | "T3", string> = {
  T1: "var(--color-tier-t1-ink)",
  T2: "var(--color-tier-t2-ink)",
  T3: "var(--color-tier-t3)",
};

export function TierPill({ decision, tone = "light" }: { decision: string; tone?: "light" | "dark" }) {
  const tier = TIER_BY_DECISION[decision] ?? "T3";
  const color = TIER_COLOR[tier];
  const ink = tone === "dark" ? color : TIER_INK_ON_LIGHT[tier];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{ color: ink, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {TIER_LABEL[tier]} — {decision}
    </span>
  );
}
