"use client";

// bounty-list.tsx — bounty rows + expandable detail: judge trigger (F3, SSE), verdict view
// with evidence, escalation APPROVE/REJECT (F4). Bare on purpose.

import { useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PillButton } from "@/components/ui/pill-button";
import { VerdictCertificate } from "@/components/arbiter/verdict-certificate";
import { BountyRow } from "@/components/arbiter/bounty-row";
import { JudgingProgress, type JudgeStage, type JudgeVerdict } from "@/components/arbiter/judging-progress";

interface BountyRow { id: string; status: string; amount_usdc: number; brief: string; worker_id: string; deadline: string; created_at: string }
interface RubricScore { item_id: string; weight: number; score: number; evidence: string[]; reasoning: string }
interface RubricItem { item_id: string; criterion: string; weight: number }
interface Detail {
  bounty: BountyRow;
  // Already returned by GET /api/bounty?id= (store.getBountyDetail) — the page simply was
  // not declaring it, so the criterion text was fetched and then thrown away.
  rubric: null | { items_json: RubricItem[] };
  verdict: null | { id: string; decision: string; total_score: number; confidence: number; verdict_hash: string; release_tx: string | null; verdict_json: { rubric_scores: RubricScore[]; confidence_reasoning: string; refusal_reason: string | null } };
  escalation: null | { poster_action: string };
}

export function BountyList({ bounties, loading, onChanged }: { bounties: BountyRow[]; loading?: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<JudgeStage | null>(null);

  async function loadDetail(id: string) {
    setOpen(id); setDetail(null);
    const res = await fetch(`/api/bounty?id=${id}`);
    if (res.ok) setDetail(await res.json());
  }

  /** Clicking the open row closes it; the live log is per-row, so it clears too. */
  function toggle(id: string) {
    if (open === id) { setOpen(null); setDetail(null); setStage(null); return; }
    setStage(null);
    loadDetail(id);
  }

  /** F3 — judge over SSE. Three events arrive: judging, verdict, done. The phases below
   *  mirror exactly those; nothing is inferred in between. */
  async function judge(id: string, criteria: string[]) {
    setBusy(true);
    setStage({ kind: "grading", startedAt: Date.now(), criteria });
    let verdict: JudgeVerdict | null = null;
    let sawDone = false;
    try {
      const res = await fetch("/api/judge", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bounty_id: id }),
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n"); buf = events.pop() ?? "";
        for (const ev of events) {
          const type = ev.match(/^event: (.+)$/m)?.[1];
          const data = ev.match(/^data: (.+)$/m)?.[1];
          if (!type || !data) continue;
          const payload = JSON.parse(data);
          if (type === "verdict") { verdict = payload as JudgeVerdict; setStage({ kind: "verdict", verdict }); }
          if (type === "done") { sawDone = true; setStage({ kind: "done", verdict, status: payload.status }); }
          if (type === "error") throw new Error(payload.message);
        }
      }
      // The stream can end without `done` if the connection is cut. Say so rather than
      // leaving the panel frozen mid-phase looking like it is still working.
      if (!sawDone) {
        setStage({
          kind: "error", afterVerdict: verdict !== null,
          message: "The stream closed before the run reported finishing.",
        });
      }
      await loadDetail(id); onChanged();
    } catch (e) {
      setStage({
        kind: "error", afterVerdict: verdict !== null,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally { setBusy(false); }
  }

  /** F4 — poster acts on the verdict; every action feeds override_rate. */
  async function act(action: "APPROVE" | "REJECT") {
    if (!detail?.verdict) return;
    setBusy(true);
    try {
      const res = await fetch("/api/escalation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict_id: detail.verdict.id, bounty_id: detail.bounty.id, poster_action: action }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setStage(null);
      await loadDetail(detail.bounty.id); onChanged();
    } catch (e) {
      setStage({ kind: "error", afterVerdict: false, message: e instanceof Error ? e.message : String(e) });
    }
    finally { setBusy(false); }
  }

  const v = detail?.verdict;
  return (
    // The heading lives on the page, next to the operator buttons.
    <GlassPanel tone="light" className="overflow-hidden p-0">
      <div className="divide-y divide-[var(--color-ink)]/5">
        {bounties.map((b) => (
          <div key={b.id}>
            <BountyRow bounty={b} expanded={open === b.id} onToggle={() => toggle(b.id)} />

            {open === b.id && (
              <div className="border-t border-[var(--color-ink)]/5 bg-[var(--color-surface-light)]/40 px-4 py-4">
                {!detail && <p className="text-sm text-[var(--color-ink-muted)]">Opening the case…</p>}

                {detail && (
                  <>
                    <h3 className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">The brief</h3>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink)]">
                      {detail.bounty.brief}
                    </p>

                    {detail.bounty.status === "SUBMITTED" && (
                      <div className="mt-4">
                        <PillButton
                          variant="primary"
                          disabled={busy}
                          onClick={() => judge(detail.bounty.id, (detail.rubric?.items_json ?? []).map((r) => r.criterion))}
                        >
                          {busy ? "Judging…" : "Judge this submission"}
                        </PillButton>
                      </div>
                    )}

                    {v && (
                      <VerdictCertificate
                        verdict={v}
                        rubric={detail.rubric?.items_json ?? null}
                        bountyStatus={detail.bounty.status}
                        escalation={detail.escalation}
                        busy={busy}
                        onAct={act}
                      />
                    )}

                    {!v && detail.bounty.status !== "SUBMITTED" && (
                      <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
                        No verdict yet — this bounty has not been judged.
                      </p>
                    )}
                  </>
                )}

                {stage && <JudgingProgress stage={stage} />}
              </div>
            )}
          </div>
        ))}

        {loading && bounties.length === 0 && (
          // Skeleton rows rather than a spinner: the page keeps its shape, so nothing jumps
          // when the real rows land.
          <div aria-busy="true" aria-label="Loading the ledger">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-3 w-3/5 animate-pulse rounded bg-[var(--color-ink)]/8" />
                <div className="ml-auto h-5 w-24 animate-pulse rounded-full bg-[var(--color-ink)]/8" />
              </div>
            ))}
          </div>
        )}

        {/* An empty ledger is the first thing a new deployment shows, so it has to say what
            to do next rather than just reporting nothing. */}
        {!loading && bounties.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-ink)]">No verdicts yet</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Start with <span className="font-medium text-[var(--color-ink)]">+ New bounty</span>: describe a
              job and the arbiter drafts a rubric you can freeze. Then submit work against it, and the
              verdict it reaches will appear here.
            </p>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
