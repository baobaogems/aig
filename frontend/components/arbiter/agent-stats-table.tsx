// agent-stats-table.tsx — THE table (plan: "one screenshot = one slide"). Reskinned:
// clean, airy, dark-on-light readout — still zero logic, same data shape.
// override_rate = poster REJECTs ÷ human-reviewed verdicts — the pitch's headline number.

import { GlassPanel } from "@/components/ui/glass-panel";

export interface AgentStats {
  total_verdicts: number;
  t1_auto_release: number;
  refused: number;
  human_reviewed: number;
  overridden: number;
  override_rate: number;
}

export function AgentStatsTable({ stats }: { stats: AgentStats | null }) {
  if (!stats) return <p className="text-sm text-[var(--color-ink-muted)]">stats unavailable</p>;
  const rows: [string, string | number][] = [
    ["Total verdicts", stats.total_verdicts],
    ["T1 autonomous releases", stats.t1_auto_release],
    ["REFUSE (knows its limits)", stats.refused],
    ["Human-reviewed (escalations)", stats.human_reviewed],
    ["Overridden by poster", stats.overridden],
    // Small-n: a raw count reads honestly where "100.0%" over 1 escalation overstates.
    ["Overrides", `${stats.overridden} of ${stats.human_reviewed} escalations`],
  ];
  return (
    <GlassPanel tone="light" className="p-5">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-[var(--color-ink)]/5 last:border-0">
              <td className="py-2 text-[var(--color-ink-muted)]">{k}</td>
              <td className="py-2 text-right font-[family-name:var(--font-jetbrains-mono)] font-semibold text-[var(--color-ink)]">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassPanel>
  );
}
