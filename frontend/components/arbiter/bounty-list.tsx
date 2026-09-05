"use client";

// bounty-list.tsx — bounty rows + expandable detail: judge trigger (F3, SSE), verdict view
// with evidence, escalation APPROVE/REJECT (F4). Bare on purpose.

import { useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PillButton } from "@/components/ui/pill-button";
import { VerdictCertificate } from "@/components/arbiter/verdict-certificate";
import { BountyRow } from "@/components/arbiter/bounty-row";

interface BountyRow { id: string; status: string; amount_usdc: number; brief: string; worker_id: string; deadline: string }
interface RubricScore { item_id: string; weight: number; score: number; evidence: string[]; reasoning: string }
interface Detail {
  bounty: BountyRow;
  verdict: null | { id: string; decision: string; total_score: number; confidence: number; verdict_hash: string; release_tx: string | null; verdict_json: { rubric_scores: RubricScore[]; confidence_reasoning: string; refusal_reason: string | null } };
  escalation: null | { poster_action: string };
}

export function BountyList({ bounties, loading, onChanged }: { bounties: BountyRow[]; loading?: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState("");

  async function loadDetail(id: string) {
    setOpen(id); setDetail(null);
    const res = await fetch(`/api/bounty?id=${id}`);
    if (res.ok) setDetail(await res.json());
  }

  /** Clicking the open row closes it; the live log is per-row, so it clears too. */
  function toggle(id: string) {
    if (open === id) { setOpen(null); setDetail(null); setLive(""); return; }
    setLive("");
    loadDetail(id);
  }

  /** F3 — judge over SSE; show each event line as it arrives. */
  async function judge(id: string) {
    setBusy(true); setLive("judging — evidence-cited grading, ~20s…");
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
          if (type && data) setLive(`${type}: ${data}`);
          if (type === "error") throw new Error(JSON.parse(data ?? "{}").message);
        }
      }
      await loadDetail(id); onChanged();
    } catch (e) { setLive(`Error: ${e instanceof Error ? e.message : e}`); }
    finally { setBusy(false); }
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
      setLive(j.note ?? (j.release_tx ? `released: ${j.release_tx}` : action));
      await loadDetail(detail.bounty.id); onChanged();
    } catch (e) { setLive(`Error: ${e instanceof Error ? e.message : e}`); }
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
                        <PillButton variant="primary" disabled={busy} onClick={() => judge(detail.bounty.id)}>
                          {busy ? "Judging…" : "Judge this submission"}
                        </PillButton>
                      </div>
                    )}

                    {v && (
                      <VerdictCertificate
                        verdict={v}
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

                {live && (
                  <p className="mt-3 break-all font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-muted)]">
                    {live}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && bounties.length === 0 && (
          <p className="px-4 py-6 text-sm text-[var(--color-ink-muted)]">Loading the ledger…</p>
        )}
        {!loading && bounties.length === 0 && (
          <p className="px-4 py-6 text-sm text-[var(--color-ink-muted)]">No bounties yet.</p>
        )}
      </div>
    </GlassPanel>
  );
}
