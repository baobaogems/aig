"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ArbiterNav } from "@/components/arbiter/arbiter-nav";
import { PageBackdrop } from "@/components/arbiter/ui/page-backdrop";
import { WalletConnectButton } from "@/components/arbiter/wallet-connect-button";
import { RoleSwitch } from "@/components/arbiter/dashboard/role-switch";
import { Lane } from "@/components/arbiter/dashboard/lane";
import { DecisionCard } from "@/components/arbiter/dashboard/decision-card";
import { CompactRow } from "@/components/arbiter/dashboard/compact-row";
import { getPosterLane, getWorkerLane } from "@/lib/arbiter/dashboard-lanes";
import type { SettlementVerdict } from "@/components/arbiter/settlement-panel";

export default function DashboardPage() {
  const [session, setSession] = useState<string | null>(null);
  const [bounties, setBounties] = useState<any[]>([]);
  const [verdicts, setVerdicts] = useState<Record<string, SettlementVerdict>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [role, setRole] = useState<"posted" | "claimed">("posted");

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bounty?view=all`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      
      const related = j.bounties.filter((b: any) => 
        (b.poster_id && b.poster_id.toLowerCase() === session.toLowerCase()) || 
        (b.worker_id && b.worker_id.toLowerCase() === session.toLowerCase())
      );

      // fetch verdicts for JUDGED bounties
      const dict: Record<string, SettlementVerdict> = {};
      await Promise.all(related.map(async (b: any) => {
        if (b.status === "JUDGED" || b.status === "RELEASED" || b.status === "REFUNDED" || b.status === "REFUSED") {
          const detailRes = await fetch(`/api/bounty?id=${b.id}`);
          if (detailRes.ok) {
            const detailJ = await detailRes.json();
            if (detailJ.verdict) {
              dict[b.id] = detailJ.verdict;
            }
          }
        }
      }));

      setBounties(related);
      setVerdicts(dict);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { postedActionCount, claimedActionCount, posterLanes, workerLanes } = useMemo(() => {
    let pAct = 0;
    let cAct = 0;
    
    const pLanes: Record<string, any[]> = { needs_decision: [], in_progress: [], settled: [] };
    const wLanes: Record<string, any[]> = { needs_submission: [], waiting: [], results: [] };

    if (!session) return { postedActionCount: 0, claimedActionCount: 0, posterLanes: pLanes, workerLanes: wLanes };
    const me = session.toLowerCase();

    for (const b of bounties) {
      const isPoster = b.poster_id && b.poster_id.toLowerCase() === me;
      const isWorker = b.worker_id && b.worker_id.toLowerCase() === me;

      if (isPoster) {
        const lane = getPosterLane(b.status);
        if (lane) {
          pLanes[lane].push(b);
          if (lane === "needs_decision") pAct++;
        }
      }
      
      if (isWorker) {
        const lane = getWorkerLane(b.status, true);
        if (lane) {
          wLanes[lane].push(b);
          if (lane === "needs_submission") cAct++;
        }
      }
    }

    return { postedActionCount: pAct, claimedActionCount: cAct, posterLanes: pLanes, workerLanes: wLanes };
  }, [bounties, session]);

  const isDryRun = process.env.NEXT_PUBLIC_DRY_RUN === "true";

  return (
    <div className="arbiter-ui">
      <PageBackdrop />
      <ArbiterNav
        current="dashboard"
        pendingDecisions={postedActionCount}
        walletSlot={<WalletConnectButton onSession={setSession} />}
      />
      <main className="bg-grain relative z-[1] min-h-screen px-4 pb-20 pt-12">
        <div className="mx-auto max-w-[800px]">
          
          <div className="mt-[26px]">
            <p className="a-eyebrow">MY WORKSPACE</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[0.02em] m-0 uppercase">MY DASHBOARD</h2>
            <p className="max-w-2xl text-[12.5px] leading-relaxed mt-2" style={{ color: "var(--a-muted)" }}>
              What you posted and what you claimed, sorted by <b style={{ color: "var(--a-text)" }}>whose move it is</b> — not by technical status.
            </p>
            {isDryRun && (
              <p className="mt-2 text-[12.5px] font-bold text-[var(--a-acc)] border border-[var(--a-acc)] p-2 bg-[rgba(var(--a-acc-rgb),0.1)]">
                NOTE: DRY-RUN MODE IS ON. No funds actually move on chain.
              </p>
            )}
          </div>

          {!session ? (
            <div className="mt-8 text-center text-sm text-[var(--a-subtle)]">
              Connect your wallet to see the dashboard.
            </div>
          ) : loading ? (
            <div className="mt-8 text-sm text-[var(--a-subtle)]">Loading…</div>
          ) : (
            <>
              <RoleSwitch
                role={role}
                onRoleChange={setRole}
                postedActionCount={postedActionCount}
                claimedActionCount={claimedActionCount}
              />

              {error && <p className="text-sm text-[var(--a-bad)] mb-4">{error}</p>}

              {role === "posted" ? (
                <div>
                  <Lane title="Needs your decision" count={posterLanes.needs_decision.length} hint="Arbiter has finished grading. The funds stay in escrow until you act." active={true}>
                    {posterLanes.needs_decision.map((b) => (
                      verdicts[b.id] ? <DecisionCard key={b.id} bounty={b} verdict={verdicts[b.id]} onChanged={refresh} /> : <CompactRow key={b.id} bounty={b} role="poster" />
                    ))}
                  </Lane>
                  
                  <Lane title="In progress" count={posterLanes.in_progress.length} hint="Nothing for you to do yet.">
                    {posterLanes.in_progress.map((b) => <CompactRow key={b.id} bounty={b} role="poster" />)}
                  </Lane>
                  
                  <Lane title="Settled" count={posterLanes.settled.length}>
                    {posterLanes.settled.map((b) => <CompactRow key={b.id} bounty={b} role="poster" />)}
                  </Lane>
                </div>
              ) : (
                <div>
                  <Lane title="Needs your submission" count={workerLanes.needs_submission.length} hint="In progress — miss the deadline and you lose the slot." active={true}>
                    {workerLanes.needs_submission.map((b) => <CompactRow key={b.id} bounty={b} role="worker" />)}
                  </Lane>
                  
                  <Lane title="Waiting on others" count={workerLanes.waiting.length} hint="Waiting on Arbiter or on the poster to decide.">
                    {workerLanes.waiting.map((b) => <CompactRow key={b.id} bounty={b} role="worker" />)}
                  </Lane>
                  
                  <Lane title="Results" count={workerLanes.results.length}>
                    {workerLanes.results.map((b) => <CompactRow key={b.id} bounty={b} role="worker" />)}
                  </Lane>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
