"use client";

// =============================================================================
// /app/arbiter/page.tsx — AIG v4 Arbiter.
//
// The landing's primary CTA promises "See it settle on Arc" — a promise to SHOW,
// not an invitation to fill in a form. So this page is an evidence display: the
// track record reads as one band, the bounty ledger is the spine, and the two
// operator forms (F1 create, F2 submit) live in drawers behind buttons.
//
// Flows F1–F5 and every API call are unchanged; this is the display layer only.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { PosterBountyForm } from "@/components/arbiter/poster-bounty-form";
import { WorkerSubmitForm } from "@/components/arbiter/worker-submit-form";
import { BountyList } from "@/components/arbiter/bounty-list";
import { AgentStatsStrip, type AgentStats } from "@/components/arbiter/agent-stats-strip";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { Drawer } from "@/components/ui/drawer";

interface BountyRow { id: string; status: string; amount_usdc: number; brief: string; worker_id: string; deadline: string; created_at: string }

type OpenDrawer = null | "create" | "submit";

export default function ArbiterPage() {
  const [bounties, setBounties] = useState<BountyRow[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<OpenDrawer>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bounty");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setBounties(j.bounties); setStats(j.stats); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const actionClass =
    "rounded-[var(--radius-pill)] border border-[var(--color-ink)]/15 bg-white/70 px-4 py-2 text-sm " +
    "font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]";

  return (
    <main className="bg-grain min-h-screen bg-gradient-to-b from-[var(--color-surface-light)] via-[var(--color-surface-light-2)] to-[var(--color-surface-light)] px-4 pb-16 pt-12">
      <div className="mx-auto grid max-w-3xl gap-6">
        <header>
          <EyebrowLabel>arbiter</EyebrowLabel>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-ink)]">
            Every verdict this arbiter has reached
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
            An AI arbiter escrows USDC on Arc testnet and decides — with measured confidence — whether
            a deliverable earned payment. Transparent and accountable: every verdict hash is on-chain.
          </p>
        </header>

        <AgentStatsStrip stats={stats} />

        {error && (
          <p className="rounded-xl px-4 py-3 text-sm" style={{ color: "var(--color-ink-danger)", backgroundColor: "var(--color-chip-danger)" }}>
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]">
            The ledger
          </h2>
          {/* Operator actions. Outlined, not filled: on this page they are secondary to
              reading the record, and red stays reserved for the primary action inside. */}
          <div className="flex gap-2">
            <button className={actionClass} onClick={() => setDrawer("create")}>+ New bounty</button>
            <button className={actionClass} onClick={() => setDrawer("submit")}>Submit work</button>
          </div>
        </div>

        <BountyList bounties={bounties} loading={loading} onChanged={refresh} />
      </div>

      <Drawer
        open={drawer === "create"}
        onClose={() => setDrawer(null)}
        title="New bounty"
        description="Describe the job in plain language. The arbiter drafts a rubric from it, which you approve and freeze before any money is locked."
      >
        <PosterBountyForm onChanged={refresh} />
      </Drawer>

      <Drawer
        open={drawer === "submit"}
        onClose={() => setDrawer(null)}
        title="Submit work"
        description="What you paste is snapshotted at submit time. Later edits to the source do not count."
      >
        <WorkerSubmitForm onChanged={refresh} />
      </Drawer>
    </main>
  );
}
