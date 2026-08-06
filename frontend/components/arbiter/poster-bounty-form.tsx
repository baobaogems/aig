"use client";

// poster-bounty-form.tsx — F1: brief + amount + deadline → rubric preview → approve/freeze.
// Deliberately bare (plan: logic over styling).

import { useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PillButton } from "@/components/ui/pill-button";

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

  const inp =
    "rounded-xl border border-[var(--color-ink)]/10 bg-white/80 px-3 py-2 w-full text-sm text-[var(--color-ink)] " +
    "placeholder:text-[var(--color-ink-muted)] outline-none transition-colors focus:border-[var(--color-accent)]";
  return (
    <GlassPanel tone="light" className="p-5">
      <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]">Poster — create bounty (F1)</h2>
      <div className="mt-3 grid gap-2.5">
        <input className={inp} placeholder="poster wallet 0x…" value={poster} onChange={(e) => setPoster(e.target.value)} />
        <input className={inp} placeholder="worker wallet 0x… (assigned, 1 bounty = 1 worker)" value={worker} onChange={(e) => setWorker(e.target.value)} />
        <textarea className={inp} rows={4} placeholder="brief — plain language, the arbiter drafts the rubric from this" value={brief} onChange={(e) => setBrief(e.target.value)} />
        <div className="flex gap-2.5">
          <input className={inp} type="number" min="0.1" step="0.1" placeholder="USDC" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className={inp} type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div>
          <PillButton variant="primary" disabled={busy || !!draft} onClick={createBounty}>
            Create + generate rubric
          </PillButton>
        </div>
      </div>
      {draft && (
        <div className="mt-4 border-t border-[var(--color-ink)]/10 pt-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Proposed rubric (approving FREEZES it — no edits after):</p>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {draft.rubric.map((r) => (
                <tr key={r.item_id} className="border-b border-[var(--color-ink)]/5">
                  <td className="py-1.5 pr-2 align-top font-[family-name:var(--font-jetbrains-mono)] text-[var(--color-ink-muted)]">{r.item_id}</td>
                  <td className="py-1.5 text-[var(--color-ink)]">{r.criterion}</td>
                  <td className="py-1.5 pl-2 text-right font-[family-name:var(--font-jetbrains-mono)] text-[var(--color-ink-muted)]">w{r.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <PillButton variant="primary" disabled={busy} onClick={approveRubric}>
              Approve — freeze rubric &amp; open bounty
            </PillButton>
          </div>
        </div>
      )}
      {msg && <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{msg}</p>}
    </GlassPanel>
  );
}
