// agent-stats-strip.tsx — the track record as a compact strip, not a full-height table.
// It used to be six stacked rows that ate the whole first screen, which pushed the actual
// evidence (the bounty ledger) below the fold. The numbers are the credential, not the
// subject: they earn one band across the top and then get out of the way.
//
// override_rate = poster REJECTs ÷ human-reviewed verdicts — the pitch's headline number.
// Zero logic, same data shape as before.

export interface AgentStats {
  total_verdicts: number;
  t1_auto_release: number;
  /** REFUSE only — verdicts where the arbiter declined to judge. Does NOT include FAIL. */
  refused: number;
  human_reviewed: number;
  overridden: number;
  override_rate: number;
}

export function AgentStatsStrip({ stats }: { stats: AgentStats | null }) {
  if (!stats) {
    return (
      <div className="flex min-h-[4.5rem] items-center rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-white/60 px-5">
        <p className="text-sm text-[var(--color-ink-muted)]">Loading track record…</p>
      </div>
    );
  }

  const cells: [string, string | number][] = [
    ["verdicts", stats.total_verdicts],
    ["released on its own", stats.t1_auto_release],
    // agent_stats counts REFUSE and never counts FAIL, so the remainder was silently
    // missing: a reader adding up released + refused + escalated came up short of the
    // total and three failed verdicts vanished from the record. Derived here rather than
    // by changing the database view.
    ["scored, did not pass", Math.max(0, stats.total_verdicts - stats.t1_auto_release - stats.refused - stats.human_reviewed)],
    ["declined to judge", stats.refused],
    ["sent to a human", stats.human_reviewed],
    // Small-n: a raw count reads honestly where "100.0%" over 1 escalation overstates.
    ["overturned", `${stats.overridden} of ${stats.human_reviewed}`],
  ];

  return (
    // At 375px five cells in two columns left the last one stranded on a row of its own.
    // It spans the full width instead, with a rule above it, so it reads as the summary
    // line it actually is rather than a layout accident.
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-white/60 px-5 py-4 sm:grid-cols-3 lg:grid-cols-6">
      {cells.map(([label, value], i) => (
        <div
          key={label}
          className={
            i === cells.length - 1
              ? "col-span-2 border-t border-[var(--color-ink)]/10 pt-4 sm:col-span-1 sm:border-0 sm:pt-0"
              : undefined
          }
        >
          <p className="tnum font-[family-name:var(--font-jetbrains-mono)] text-2xl font-semibold leading-none text-[var(--color-ink)]">
            {value}
          </p>
          <p className="mt-1.5 text-xs leading-tight text-[var(--color-ink-muted)]">{label}</p>
        </div>
      ))}
    </div>
  );
}
