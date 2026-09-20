"use client";

// poster-bounty-form.tsx — F1: brief + amount + deadline → rubric preview → approve → sign.
//
// Phase 03/04 changed two things here. The poster is no longer typed into a box — it is
// whoever signed in, because an address you type is a claim and an address you sign with is
// proof. And the worker box is gone entirely: bounties open to the board, and the worker
// arrives by claiming (components/arbiter/claim-button.tsx).
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
import { PosterLockFunds, type LockParams } from "@/components/arbiter/poster-lock-funds";
import { RubricTable } from "@/components/arbiter/rubric-table";

interface RubricItem { item_id: string; criterion: string; weight: number }

type Errors = Partial<Record<"brief" | "amount" | "deadline", string>>;

export function PosterBountyForm({ onChanged }: { onChanged: () => void }) {
  const [brief, setBrief] = useState("");
  const [amount, setAmount] = useState("5");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [draft, setDraft] = useState<{ id: string; rubric: RubricItem[] } | null>(null);
  /** Set once the rubric is approved in LIVE mode: the parameters the poster must now sign. */
  const [lock, setLock] = useState<LockParams | null>(null);

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
        // No poster_id, no worker_id: the poster comes from the session cookie, and the
        // bounty opens unassigned so anyone can claim it.
        body: JSON.stringify({
          brief, amount_usdc: Number(amount), deadline: new Date(deadline).toISOString(),
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
      if (j.lock) {
        // Live mode: nothing is frozen yet. The poster signs next.
        setLock(j.lock as LockParams);
        setMsg(j.note ?? "");
      } else {
        setMsg(j.note ?? "Rubric đã đóng băng. Việc đã mở trên chợ.");
        setDraft(null);
      }
      onChanged();
    } catch (err) { setMsg(`Could not freeze it: ${err instanceof Error ? err.message : err}`); }
    finally { setBusy(false); }
  }

  const inp = (k: keyof Errors) => `${FIELD_INPUT_CLASS} ${fieldBorder(!!errors[k])}`;

  return (
    <div>
      <div className="grid gap-4">
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
          <div className="mt-1">
            <RubricTable items={draft.rubric} frozen={false} />
          </div>
          <div className="mt-4">
            {lock ? (
              <PosterLockFunds
                lock={lock}
                onDone={() => {
                  setMsg("USDC đã vào escrow. Việc đã lên chợ, chờ người nhận.");
                  setDraft(null);
                  setLock(null);
                  onChanged();
                }}
              />
            ) : (
              <PillButton variant="primary" disabled={busy} onClick={approveRubric}>
                Duyệt rubric và khoá tiền
              </PillButton>
            )}
          </div>
        </div>
      )}

      {msg && <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)]">{msg}</p>}
    </div>
  );
}
