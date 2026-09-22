// tier-pill.tsx — reskin: verdict tier as a calm status pill, not a loud gauge.
// T1 (auto-release) = cyan, T2 (escalate) = amber, T3/REFUSE = muted red.

const TIER_BY_DECISION: Record<string, "T1" | "T2" | "T3"> = {
  RELEASE: "T1",
  ESCALATE: "T2",
  FAIL: "T3",
  REFUSE: "T3",
};

const DECISION_LABEL: Record<string, string> = {
  RELEASE: "T1 · released on its own",
  ESCALATE: "T2 · sent to the poster",
  FAIL: "T3 · scored, did not pass",
  REFUSE: "T3 · declined to judge",
};

const TIER_COLOR: Record<"T1" | "T2" | "T3", string> = {
  T1: "var(--a-ok)",
  T2: "var(--a-warn)",
  T3: "var(--a-bad)",
};

export function TierPill({ decision }: { decision: string }) {
  const tier = TIER_BY_DECISION[decision] ?? "T3";
  const color = TIER_COLOR[tier];
  return (
    <span
      className="a-cut-sm inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-[family-name:var(--font-jetbrains-mono)] font-bold uppercase tracking-[0.05em] border"
      style={{ color: color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
    >
      <span className="h-1.5 w-1.5" style={{ backgroundColor: color }} aria-hidden="true" />
      {DECISION_LABEL[decision] ?? `${tier} · ${decision.toLowerCase()}`}
    </span>
  );
}
