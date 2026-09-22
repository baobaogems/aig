"use client";

// =============================================================================
// /app/arbiter/page.tsx — the board.
//
// Redesigned from a wall of identical rows (see plans/ ui-redesign stop 1–4). The failures it
// was built to fix, by name:
//
//   D1  ten rows with identical spacing read as one undifferentiated block. Now: two sections,
//       56px apart, against 12–16px inside a card — the eye separates them without a rule.
//   E1  the amount had the least weight on screen. Now it is the card's anchor (AmountBlock).
//   H1  "date · worker" glued two kinds of fact together. Now they live in different places.
//   —   four tabs flattened two independent questions ("still open?" and "mine?") into one
//       row where they looked like alternatives. Now: two labelled filter groups.
//
// One filled accent button on the page (E3), and it is the one that puts money into escrow.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { PosterBountyForm } from "@/components/arbiter/poster-bounty-form";
import { WorkerSubmitForm } from "@/components/arbiter/worker-submit-form";
import { BountyGrid } from "@/components/arbiter/bounty-grid";
import { TrackRecordBand } from "@/components/arbiter/track-record-band";
import { ArbiterNav } from "@/components/arbiter/arbiter-nav";
import { PageBackdrop } from "@/components/arbiter/ui/page-backdrop";
import type { AgentStats } from "@/lib/arbiter/store";
import { SectionHeader } from "@/components/ui/section-header";
import { MarketFilter } from "@/components/arbiter/market-filter";
import { PillButton } from "@/components/ui/pill-button";
import { Drawer } from "@/components/ui/drawer";
import { WalletConnectButton } from "@/components/arbiter/wallet-connect-button";
import type { BountyCardData } from "@/components/arbiter/bounty-card";
import { type PrizeBand, inPrizeBand } from "@/lib/arbiter/prize-band";
import { AButton } from "@/components/arbiter/ui/a-button";

interface BountyRow extends BountyCardData {
  created_at: string;
}

type OpenDrawer = null | "create" | "submit";
type StatusFilter = "active" | "ended" | "all";

const OPEN_STATUSES = new Set(["OPEN", "SUBMITTED"]);

export default function ArbiterPage() {
  const [bounties, setBounties] = useState<BountyRow[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<OpenDrawer>(null);
  const [session, setSession] = useState<string | null>(null);
  const [pending, setPending] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [prizeFilter, setPrizeFilter] = useState<PrizeBand>("all");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/bounty?view=all`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setBounties(j.bounties);
      setStats(j.stats);
      setPending(j.pending_decisions ?? null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === "create") setDrawer("create");
      else if (customEvent.detail === "submit") setDrawer("submit");
    };
    window.addEventListener("arbiter:drawer", onDrawer);
    return () => window.removeEventListener("arbiter:drawer", onDrawer);
  }, []);

  // Use a constant "now" for filtering to avoid UI jumping on tick.
  const filterAt = useMemo(() => Date.now(), [bounties]);

  const filteredBounties = useMemo(() => {
    let result = bounties;

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((b) => {
        const isOpen = OPEN_STATUSES.has(b.status) && new Date(b.deadline).getTime() > filterAt;
        return statusFilter === "active" ? isOpen : !isOpen;
      });
    }

    // Filter by prize
    if (prizeFilter !== "all") {
      result = result.filter((b) => inPrizeBand(b.amount_usdc, prizeFilter));
    }

    return result;
  }, [bounties, statusFilter, prizeFilter, filterAt]);

  const activeCountForBand = useMemo(() => {
    const countOpen = bounties.filter((b) => OPEN_STATUSES.has(b.status) && new Date(b.deadline).getTime() > filterAt);
    return countOpen.length;
  }, [bounties, filterAt]);

  const prizeCounts = useMemo(() => {
    const list = bounties.filter((b) => {
      const isOpen = OPEN_STATUSES.has(b.status) && new Date(b.deadline).getTime() > filterAt;
      return statusFilter === "all" ? true : statusFilter === "active" ? isOpen : !isOpen;
    });
    
    return {
      all: list.length,
      under_1: list.filter((b) => inPrizeBand(b.amount_usdc, "under_1")).length,
      "1_to_5": list.filter((b) => inPrizeBand(b.amount_usdc, "1_to_5")).length,
      over_5: list.filter((b) => inPrizeBand(b.amount_usdc, "over_5")).length,
    };
  }, [bounties, statusFilter, filterAt]);

  return (
    <div className="arbiter-ui">
      <PageBackdrop />
      <ArbiterNav
        current="market"
        pendingDecisions={pending}
        walletSlot={<WalletConnectButton onSession={setSession} />}
      />
      <main className="bg-grain relative z-[1] min-h-screen px-4 pb-20 pt-12">
        <div className="mx-auto grid max-w-[1120px] gap-14">
          <div>
            <p className="max-w-2xl text-[12.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
              Posters lock USDC into escrow on the Arc testnet. An AI arbiter grades submissions against a
              frozen rubric, and funds flow automatically when the score passes — all verdicts are hashed
              on-chain.
            </p>
          </div>

          <TrackRecordBand
            stats={stats}
            escrowUsdc={Number(bounties.filter(b => OPEN_STATUSES.has(b.status) && new Date(b.deadline).getTime() > filterAt).reduce((sum, b) => sum + b.amount_usdc, 0).toFixed(3))}
            activeCount={activeCountForBand}
          />

          {error && (
            <p
              className="rounded-xl px-4 py-3 text-sm"
              style={{ color: "var(--color-ink-danger)", backgroundColor: "var(--color-chip-danger)" }}
            >
              {error}
            </p>
          )}

          <section className="grid gap-5">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
              <div>
                <p className="a-eyebrow m-0">ON-CHAIN ESCROW</p>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[0.02em] m-0">
                  MARKET
                </h2>
              </div>
              <div className="flex gap-2">
                <AButton variant="secondary" onClick={() => setDrawer("submit")}>SUBMIT</AButton>
                <AButton variant="solid" onClick={() => setDrawer("create")}>+ Post bounty</AButton>
              </div>
            </div>

            <MarketFilter
              status={statusFilter}
              onStatusChange={setStatusFilter}
              prize={prizeFilter}
              onPrizeChange={setPrizeFilter}
              prizeCounts={prizeCounts}
              resultCount={filteredBounties.length}
            />

            <BountyGrid
              bounties={filteredBounties}
              loading={loading}
              signedIn={Boolean(session)}
              onChanged={refresh}
              emptyTitle=""
              emptyHint=""
            />
            
            {statusFilter === "active" && (bounties.length - activeCountForBand) > 0 && (
              <p className="text-center text-[12px] mt-6" style={{ color: "var(--a-subtle)" }}>
                {(bounties.length - activeCountForBand)} completed bounties are hidden.{" "}
                <button
                  className="font-bold underline hover:text-[var(--a-text)]"
                  onClick={() => setStatusFilter("ended")}
                >
                  View results
                </button>
              </p>
            )}
          </section>
        </div>

        <Drawer
          open={drawer === "create"}
          onClose={() => setDrawer(null)}
          title="Post new bounty"
          description="Describe the task in plain text. The arbiter extracts a rubric from this; you review and freeze it before locking funds."
        >
          <PosterBountyForm onChanged={refresh} />
        </Drawer>

        <Drawer
          open={drawer === "submit"}
          onClose={() => setDrawer(null)}
          title="Nộp bài"
          description="Content is frozen upon submission. Later edits to the source will not be considered."
        >
          <WorkerSubmitForm onChanged={refresh} />
        </Drawer>
      </main>
    </div>
  );
}
