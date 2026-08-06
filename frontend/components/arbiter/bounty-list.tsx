"use client";

// bounty-list.tsx — bounty rows + expandable detail: judge trigger (F3, SSE), verdict view
// with evidence, escalation APPROVE/REJECT (F4). Bare on purpose.

import { useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PillButton } from "@/components/ui/pill-button";
import { VerdictCertificate } from "@/components/arbiter/verdict-certificate";

interface BountyRow { id: string; status: string; amount_usdc: number; brief: string; worker_id: string; deadline: string }
interface RubricScore { item_id: string; weight: number; score: number; evidence: string[]; reasoning: string }
interface Detail {
  bounty: BountyRow;
  verdict: null | { id: string; decision: string; total_score: number; confidence: number; verdict_hash: string; release_tx: string | null; verdict_json: { rubric_scores: RubricScore[]; confidence_reasoning: string; refusal_reason: string | null } };
  escalation: null | { poster_action: string };
}

export function BountyList({ bounties, onChanged }: { bounties: BountyRow[]; onChanged: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState("");

  async function loadDetail(id: string) {
    setOpen(id); setDetail(null);
    const res = await fetch(`/api/bounty?id=${id}`);
    if (res.ok) setDetail(await res.json());
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
    <GlassPanel tone="light" className="p-5">
      <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]">Bounties</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-ink)]/10 text-left text-[var(--color-ink-muted)]">
            <th className="pb-2 font-normal">id</th><th className="font-normal">status</th><th className="text-right font-normal">USDC</th>
          </tr>
        </thead>
        <tbody>
          {bounties.map((b) => (
            <tr
              key={b.id}
              className="cursor-pointer border-b border-[var(--color-ink)]/5 transition-colors hover:bg-[var(--color-accent)]/5"
              onClick={() => loadDetail(b.id)}
            >
              <td className="py-2 pr-2 font-[family-name:var(--font-jetbrains-mono)] text-[var(--color-ink)]">{b.id.slice(0, 8)}…</td>
              <td className="text-[var(--color-ink)]">{b.status}</td>
              <td className="text-right font-[family-name:var(--font-jetbrains-mono)] text-[var(--color-ink)]">{b.amount_usdc}</td>
            </tr>
          ))}
          {bounties.length === 0 && <tr><td colSpan={3} className="py-3 text-[var(--color-ink-muted)]">no bounties yet</td></tr>}
        </tbody>
      </table>

      {open && detail && (
        <div className="mt-4 border-t border-[var(--color-ink)]/10 pt-4 text-sm">
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-muted)]">{detail.bounty.id}</p>
          <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink)]">{detail.bounty.brief}</p>
          {detail.bounty.status === "SUBMITTED" && (
            <div className="mt-3">
              <PillButton variant="primary" disabled={busy} onClick={() => judge(detail.bounty.id)}>Judge (F3)</PillButton>
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
        </div>
      )}
      {live && <p className="mt-3 break-all font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-muted)]">{live}</p>}
    </GlassPanel>
  );
}
