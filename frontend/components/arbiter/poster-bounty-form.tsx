"use client";

// poster-bounty-form.tsx — F1: brief + amount + deadline → rubric preview → approve/freeze.
//
// Every field has a real label and a format hint, and errors appear under the field that
// caused them. The checks here mirror app/api/bounty/route.ts exactly — they are a courtesy
// so you learn about a bad address before waiting out a ~15s rubric call, never the
// authority. The server re-validates everything and remains the only thing that decides.
//
// Field names in the request body are untouched.

import { useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { FormField, FIELD_INPUT_CLASS, fieldBorder } from "@/components/ui/form-field";

interface RubricItem { item_id: string; criterion: string; weight: number }

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
type Errors = Partial<Record<"poster" | "worker" | "brief" | "amount" | "deadline", string>>;

export function PosterBountyForm({ onChanged }: { onChanged: () => void }) {
  const [poster, setPoster] = useState("");
  const [worker, setWorker] = useState("");
  const [brief, setBrief] = useState("");
  const [amount, setAmount] = useState("5");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [draft, setDraft] = useState<{ id: string; rubric: RubricItem[] } | null>(null);

  /** Clear a field's error the moment it is edited. Leaving it red while someone fixes it
   *  keeps telling them they are wrong after they have stopped being wrong. */
  function edit<T>(setter: (v: T) => void, key: keyof Errors) {
    return (value: T) => {
      setter(value);
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };
  }

  /** Mirrors the server's rules so the failure lands on the field, not in a banner. */
  function validate(): Errors {
    const e: Errors = {};
    if (!ADDR_RE.test(poster)) e.poster = "Needs a wallet address: 0x followed by 40 hex characters.";
    if (!ADDR_RE.test(worker)) e.worker = "Needs a wallet address: 0x followed by 40 hex characters.";
    if (brief.trim().length < 20) e.brief = `At least 20 characters — currently ${brief.trim().length}.`;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) e.amount = "Must be more than 0.";
    const dl = new Date(deadline);
    if (Number.isNaN(dl.getTime())) e.deadline = "Pick a date and time.";
    else if (dl.getTime() <= Date.now()) e.deadline = "Must be in the future.";
    return e;
  }

  async function createBounty() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) { setMsg(""); return; }

    setBusy(true); setMsg("Reading the brief and drafting a rubric — about 15 seconds.");
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
      setMsg("");
      onChanged();
    } catch (err) { setMsg(`Could not create it: ${err instanceof Error ? err.message : err}`); }
    finally { setBusy(false); }
  }

  async function approveRubric() {
    if (!draft) return;
    setBusy(true); setMsg("Freezing the rubric…");
    try {
      const res = await fetch(`/api/bounty/${draft.id}/approve-rubric`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setMsg(j.note ?? "Rubric frozen. The bounty is open for work.");
      setDraft(null);
      onChanged();
    } catch (err) { setMsg(`Could not freeze it: ${err instanceof Error ? err.message : err}`); }
    finally { setBusy(false); }
  }

  const inp = (k: keyof Errors) => `${FIELD_INPUT_CLASS} ${fieldBorder(!!errors[k])}`;

  return (
    <div>
      <div className="grid gap-4">
        <FormField id="poster" label="Your wallet" hint="The address that funds the escrow and gets the refund if work is rejected." error={errors.poster}>
          <input id="poster" className={inp("poster")} placeholder="0x0000…0000" value={poster} onChange={(e) => edit(setPoster, "poster")(e.target.value)} />
        </FormField>

        <FormField id="worker" label="Who is doing the work" hint="One bounty is assigned to one worker. This address gets paid on release." error={errors.worker}>
          <input id="worker" className={inp("worker")} placeholder="0x0000…0000" value={worker} onChange={(e) => edit(setWorker, "worker")(e.target.value)} />
        </FormField>

        <FormField
          id="brief"
          label="What needs to be done"
          hint="Plain language. The arbiter turns this into the scoring rubric, so anything you leave out cannot be scored."
          error={errors.brief}
        >
          <textarea id="brief" rows={5} className={inp("brief")} value={brief} onChange={(e) => edit(setBrief, "brief")(e.target.value)} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="amount" label="Amount to escrow" hint="In USDC, held on Arc testnet." error={errors.amount}>
            <input id="amount" type="number" min="0.1" step="0.1" className={inp("amount")} value={amount} onChange={(e) => edit(setAmount, "amount")(e.target.value)} />
          </FormField>
          <FormField id="deadline" label="Deadline" hint="Must be in the future." error={errors.deadline}>
            <input id="deadline" type="datetime-local" className={inp("deadline")} value={deadline} onChange={(e) => edit(setDeadline, "deadline")(e.target.value)} />
          </FormField>
        </div>

        <div>
          <PillButton variant="primary" disabled={busy || !!draft} onClick={createBounty}>
            {busy && !draft ? "Drafting the rubric…" : "Create and draft the rubric"}
          </PillButton>
        </div>
      </div>

      {draft && (
        <div className="mt-5 border-t border-[var(--color-ink)]/10 pt-5">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            The arbiter proposes to score it like this
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
            Approving freezes these criteria. They cannot be edited afterwards — that is what stops
            anyone moving the goalposts once work has started.
          </p>
          <ul className="mt-3 space-y-2.5">
            {draft.rubric.map((r) => (
              <li key={r.item_id} className="flex items-baseline justify-between gap-4 border-b border-[var(--color-ink)]/5 pb-2.5 last:border-0">
                <span className="text-sm leading-relaxed text-[var(--color-ink)]">{r.criterion}</span>
                <span className="tnum shrink-0 font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-muted)]">
                  {r.weight}%
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <PillButton variant="primary" disabled={busy} onClick={approveRubric}>
              Approve and open the bounty
            </PillButton>
          </div>
        </div>
      )}

      {msg && <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)]">{msg}</p>}
    </div>
  );
}
