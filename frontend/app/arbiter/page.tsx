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
import { EyebrowLabel } from "@/components/ui/eyebrow-label";

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
    <main className="bg-grain min-h-screen bg-gradient-to-b from-[var(--color-surface-light)] via-[var(--color-surface-light-2)] to-[var(--color-surface-light)] px-4 pb-16 pt-12">
      <div className="mx-auto grid max-w-3xl gap-5">
        <header>
          <EyebrowLabel>arbiter</EyebrowLabel>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-ink)]">
            AIG v4 — track record
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
            An AI arbiter escrows USDC on Arc testnet and decides — with measured confidence — whether
            a deliverable earned payment. Transparent and accountable: every verdict hash is on-chain.
          </p>
        </header>

        <AgentStatsTable stats={stats} />
        {error && <p className="text-sm text-red-700">{error}</p>}

        <PosterBountyForm onChanged={refresh} />
        <WorkerSubmitForm onChanged={refresh} />
        <BountyList bounties={bounties} onChanged={refresh} />
      </div>
    </main>
  );
}
