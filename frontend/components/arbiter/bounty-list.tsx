"use client";

// bounty-list.tsx — bounty rows + expandable detail: judge trigger (F3, SSE), verdict view
// with evidence, escalation APPROVE/REJECT (F4). Bare on purpose.

import { useState } from "react";

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

  /** F4 tail — return locked USDC to the poster once the deadline has passed (never released). */
  async function refund(id: string) {
    setBusy(true); setLive("refunding…");
    try {
      const res = await fetch("/api/refund", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bounty_id: id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setLive(j.refund_tx ? `refunded: ${j.refund_tx}` : (j.note ?? "refund note"));
      await loadDetail(id); onChanged();
    } catch (e) { setLive(`Error: ${e instanceof Error ? e.message : e}`); }
    finally { setBusy(false); }
  }

  const v = detail?.verdict;
  const canRefund = !!detail && detail.bounty.status !== "RELEASED" && detail.bounty.status !== "REFUNDED"
    && new Date(detail.bounty.deadline).getTime() <= Date.now();
  return (
    <section className="border border-gray-400 p-3">
      <h2 className="font-bold mb-2">Bounties</h2>
      <table className="text-sm w-full">
        <thead><tr className="text-left border-b border-gray-400"><th>id</th><th>status</th><th className="text-right">USDC</th></tr></thead>
        <tbody>
          {bounties.map((b) => (
            <tr key={b.id} className="border-b border-gray-200 cursor-pointer" onClick={() => loadDetail(b.id)}>
              <td className="font-mono pr-2">{b.id.slice(0, 8)}…</td>
              <td>{b.status}</td>
              <td className="text-right">{b.amount_usdc}</td>
            </tr>
          ))}
          {bounties.length === 0 && <tr><td colSpan={3} className="py-2">no bounties yet</td></tr>}
        </tbody>
      </table>

      {open && detail && (
        <div className="mt-3 border-t border-gray-300 pt-2 text-sm">
          <p className="font-mono text-xs">{detail.bounty.id}</p>
          <p className="whitespace-pre-wrap mt-1">{detail.bounty.brief}</p>
          {detail.bounty.status === "SUBMITTED" && (
            <button className="border border-black px-3 py-1 mt-2 disabled:opacity-50" disabled={busy} onClick={() => judge(detail.bounty.id)}>
              Judge (F3)
            </button>
          )}
          {v && (
            <div className="mt-2">
              <p className="font-bold">{v.decision} — score {v.total_score}, confidence {v.confidence}</p>
              <p className="text-xs font-mono break-all">verdictHash {v.verdict_hash}{v.release_tx && ` · release ${v.release_tx}`}</p>
              {v.verdict_json.rubric_scores.map((s) => (
                <div key={s.item_id} className="border-l-2 border-gray-300 pl-2 mt-1">
                  <p>{s.item_id} [w{s.weight}] {s.score}/100 — {s.reasoning}</p>
                  <p className="text-xs italic">evidence: “{s.evidence[0]}”</p>
                </div>
              ))}
              <p className="mt-1 text-xs">confidence: {v.verdict_json.confidence_reasoning}</p>
              {detail.bounty.status === "JUDGED" && !detail.escalation && (
                <div className="flex gap-2 mt-2">
                  <button className="border border-black px-3 py-1 disabled:opacity-50" disabled={busy} onClick={() => act("APPROVE")}>APPROVE — release</button>
                  <button className="border border-black px-3 py-1 disabled:opacity-50" disabled={busy} onClick={() => act("REJECT")}>REJECT</button>
                </div>
              )}
              {detail.escalation && <p className="mt-1">poster action: {detail.escalation.poster_action}</p>}
            </div>
          )}
          {canRefund && (
            <div className="mt-2">
              <button className="border border-black px-3 py-1 disabled:opacity-50" disabled={busy} onClick={() => refund(detail.bounty.id)}>
                Refund (admin, deadline passed — returns locked USDC to poster)
              </button>
            </div>
          )}
        </div>
      )}
      {live && <p className="text-xs mt-2 font-mono break-all">{live}</p>}
    </section>
  );
}
