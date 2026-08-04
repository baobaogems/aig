// agent-stats-table.tsx — THE table (plan: "one screenshot = one slide"). Plain, zero styling.
// override_rate = poster REJECTs ÷ human-reviewed verdicts — the pitch's headline number.

export interface AgentStats {
  total_verdicts: number;
  t1_auto_release: number;
  refused: number;
  human_reviewed: number;
  overridden: number;
  override_rate: number;
}

export function AgentStatsTable({ stats }: { stats: AgentStats | null }) {
  if (!stats) return <p className="text-sm">stats unavailable</p>;
  const rows: [string, string | number][] = [
    ["Total verdicts", stats.total_verdicts],
    ["T1 autonomous releases", stats.t1_auto_release],
    ["REFUSE (knows its limits)", stats.refused],
    ["Human-reviewed (escalations)", stats.human_reviewed],
    ["Overridden by poster", stats.overridden],
    ["Override rate", `${(Number(stats.override_rate) * 100).toFixed(1)}%`],
  ];
  return (
    <table className="text-sm border border-gray-400 w-full">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-gray-200">
            <td className="px-2 py-1">{k}</td>
            <td className="px-2 py-1 text-right font-mono">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
