"use client";

// poster-bounty-form.tsx — F1: brief + amount + deadline → rubric preview → approve/freeze.
// Deliberately bare (plan: logic over styling).

import { useState } from "react";

interface RubricItem { item_id: string; criterion: string; weight: number }

export function PosterBountyForm({ onChanged }: { onChanged: () => void }) {
  const [poster, setPoster] = useState("");
  const [worker, setWorker] = useState("");
  const [brief, setBrief] = useState("");
  const [amount, setAmount] = useState("5");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState<{ id: string; rubric: RubricItem[] } | null>(null);

  async function createBounty() {
    setBusy(true); setMsg("Generating rubric (one LLM call, ~15s)…");
    try {
      const res = await fetch("/api/bounty", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poster_id: poster, worker_id: worker, brief,
          amount_usdc: Number(amount), deadline: new Date(deadline).toISOString(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setDraft({ id: j.bounty.id, rubric: j.rubric.items_json });
      setMsg("Rubric generated — review below, then approve to FREEZE it.");
      onChanged();
    } catch (e) { setMsg(`Error: ${e instanceof Error ? e.message : e}`); }
    finally { setBusy(false); }
  }

  async function approveRubric() {
    if (!draft) return;
    setBusy(true); setMsg("Freezing rubric…");
    try {
      const res = await fetch(`/api/bounty/${draft.id}/approve-rubric`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setMsg(j.note ?? "Rubric frozen — bounty OPEN.");
      setDraft(null);
      onChanged();
    } catch (e) { setMsg(`Error: ${e instanceof Error ? e.message : e}`); }
    finally { setBusy(false); }
  }

  const inp = "border border-gray-400 px-2 py-1 w-full text-sm";
  return (
    <section className="border border-gray-400 p-3">
      <h2 className="font-bold mb-2">Poster — create bounty (F1)</h2>
      <div className="grid gap-2">
        <input className={inp} placeholder="poster wallet 0x…" value={poster} onChange={(e) => setPoster(e.target.value)} />
        <input className={inp} placeholder="worker wallet 0x… (assigned, 1 bounty = 1 worker)" value={worker} onChange={(e) => setWorker(e.target.value)} />
        <textarea className={inp} rows={4} placeholder="brief — plain language, the arbiter drafts the rubric from this" value={brief} onChange={(e) => setBrief(e.target.value)} />
        <div className="flex gap-2">
          <input className={inp} type="number" min="0.1" step="0.1" placeholder="USDC" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className={inp} type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <button className="border border-black px-3 py-1 disabled:opacity-50" disabled={busy || !!draft} onClick={createBounty}>
          Create + generate rubric
        </button>
      </div>
      {draft && (
        <div className="mt-3 border-t border-gray-300 pt-2">
          <p className="text-sm font-bold">Proposed rubric (approving FREEZES it — no edits after):</p>
          <table className="text-sm w-full mt-1">
            <tbody>
              {draft.rubric.map((r) => (
                <tr key={r.item_id} className="border-b border-gray-200">
                  <td className="pr-2 align-top">{r.item_id}</td>
                  <td>{r.criterion}</td>
                  <td className="text-right pl-2">w{r.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="border border-black px-3 py-1 mt-2 disabled:opacity-50" disabled={busy} onClick={approveRubric}>
            Approve — freeze rubric &amp; open bounty
          </button>
        </div>
      )}
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </section>
  );
}
