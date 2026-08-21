"use client";

// =============================================================================
// nano-agents-card.tsx — v3.1 dashboard card: aggregated agent nanopayments.
// One row per paying agent (buyer): calls + total USDC + last seen. Reads
// /api/nanopay/agents. Replaces the per-call feed rows (which v3.1 dropped).
// =============================================================================

import { useEffect, useState } from "react";

interface Agent {
  buyer: string;
  call_count: number;
  total_usdc: number;
  points_awarded: number;
  last_at: string;
}

interface AgentsResponse {
  agents: Agent[];
  totals: { calls: number; usdc: number };
}

interface Transfer {
  id: string;
  from: string;
  usdc: number;
  status: string;
  at: string;
}

const short = (a: string) => (a?.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

export function NanoAgentsCard({ merchantWallet }: { merchantWallet: string }) {
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[] | null>(null);

  useEffect(() => {
    if (!merchantWallet) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const d = await fetch(
          `/api/nanopay/agents?merchant=${merchantWallet}`,
        ).then((r) => r.json());
        if (!cancelled && !d.error) setData(d);
      } catch {
        // ignore — keep last known data
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Per-call list (from Circle Gateway transfers — not AIG DB)
      try {
        const d = await fetch(
          `/api/nanopay/transfers?merchant=${merchantWallet}`,
        ).then((r) => r.json());
        if (!cancelled && !d.error) setTransfers(d.transfers ?? []);
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [merchantWallet]);

  const agents = data?.agents ?? [];

  return (
    <div className="bg-white border border-[#CBCCC9] shadow-[0_1px_1.75px_0_#0000000d]">
      <div className="flex flex-row items-center justify-between px-6 py-4 border-b border-[#CBCCC9]">
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[#111111]">
          Agent Nanopayments
        </span>
        {data && (
          <span className="font-[family-name:var(--font-geist-sans)] text-xs text-[#666666]">
            {data.totals.calls} calls · ${data.totals.usdc.toFixed(6)} USDC · {agents.length} agents
          </span>
        )}
      </div>

      {loading ? (
        <p className="px-6 py-6 text-sm text-[#666666]">Loading…</p>
      ) : agents.length === 0 ? (
        <p className="px-6 py-6 text-sm text-[#666666]">
          No agent nanopayments yet. Agents paying x402 endpoints appear here.
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#CBCCC9] text-left">
              {["Agent", "Calls", "Total USDC", "Last"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-2 font-[family-name:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-wider text-[#666666] font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.buyer} className="border-b border-[#F2F3F0] last:border-0">
                <td className="px-6 py-3 font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#111111]">
                  {short(a.buyer)}
                </td>
                <td className="px-6 py-3 font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#111111]">
                  {Number(a.call_count).toLocaleString()}
                </td>
                <td className="px-6 py-3 font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#111111]">
                  ${Number(a.total_usdc).toFixed(6)}
                </td>
                <td className="px-6 py-3 font-[family-name:var(--font-geist-sans)] text-xs text-[#666666]">
                  {new Date(a.last_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Per-call list — individual nanopayments (Circle Gateway transfers) */}
      <div className="border-t border-[#CBCCC9]">
        <div className="px-6 py-3 font-[family-name:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-wider text-[#666666] font-medium">
          Individual calls{transfers ? ` (${transfers.length})` : ""}
        </div>
        {transfers === null ? (
          <p className="px-6 pb-4 text-sm text-[#666666]">Loading…</p>
        ) : transfers.length === 0 ? (
          <p className="px-6 pb-4 text-sm text-[#666666]">No individual calls yet.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {["Time", "Agent", "USDC", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-wider text-[#999] font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-t border-[#F2F3F0]">
                    <td className="px-6 py-2 font-[family-name:var(--font-geist-sans)] text-xs text-[#666666] whitespace-nowrap">
                      {new Date(t.at).toLocaleString()}
                    </td>
                    <td className="px-6 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#111111]">
                      {short(t.from)}
                    </td>
                    <td className="px-6 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#111111]">
                      ${t.usdc.toFixed(6)}
                    </td>
                    <td className="px-6 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-[#DFE6E1] text-[#004D1A]"
                        title={t.id}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
