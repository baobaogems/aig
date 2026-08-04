"use client";

// =============================================================================
// /app/arbiter/page.tsx — AIG v4 Arbiter: minimal driving UI for flows F1–F5
// + the public track-record stats table (override_rate). Logic over styling —
// the budget cut is deliberate (plan phase-04).
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { PosterBountyForm } from "@/components/arbiter/poster-bounty-form";
import { WorkerSubmitForm } from "@/components/arbiter/worker-submit-form";
import { BountyList } from "@/components/arbiter/bounty-list";
import { AgentStatsTable, type AgentStats } from "@/components/arbiter/agent-stats-table";

interface BountyRow { id: string; status: string; amount_usdc: number; brief: string; worker_id: string; deadline: string }

export default function ArbiterPage() {
  const [bounties, setBounties] = useState<BountyRow[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bounty");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setBounties(j.bounties); setStats(j.stats); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <main className="max-w-3xl mx-auto p-4 grid gap-4">
      <header>
        <h1 className="text-xl font-bold">AIG v4 — Arbiter track record</h1>
        <p className="text-sm">
          An AI arbiter escrows USDC on Arc testnet and decides — with measured confidence — whether
          a deliverable earned payment. Transparent and accountable: every verdict hash is on-chain.
        </p>
      </header>

      <AgentStatsTable stats={stats} />
      {error && <p className="text-sm text-red-700">{error}</p>}

      <PosterBountyForm onChanged={refresh} />
      <WorkerSubmitForm onChanged={refresh} />
      <BountyList bounties={bounties} onChanged={refresh} />
    </main>
  );
}
