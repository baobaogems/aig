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
import { ARBITER_PRIMARY_BUTTON } from "./ui/arbiter-button-classes";

interface RubricItem { item_id: string; criterion: string; weight: number }

type Errors = Partial<Record<"brief" | "amount" | "deadline", string>>;

export function PosterBountyForm({ onChanged }: { onChanged: () => void }) {
  const [brief, setBrief] = useState("");
  const [amount, setAmount] = useState("5");
  // Seven days out, formatted for <input type="datetime-local"> (which wants local time with
  // no timezone suffix). An empty default invited picking "now", which is already in the past
  // by the time the form is submitted — the screenshot that reported this bug showed exactly
  // that: a deadline one minute behind the clock.
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
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
    if (brief.trim().length < 20)
      e.brief = `At least 20 characters — currently ${brief.trim().length}. The clearer the brief, the better the rubric will match your intent.`;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) e.amount = "Must be greater than 0.";
    const dl = new Date(deadline);
    if (Number.isNaN(dl.getTime())) e.deadline = "Choose a date and time.";
    else if (dl.getTime() <= Date.now()) e.deadline = "Deadline must be in the future.";
    return e;
  }

  async function createBounty() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) { setMsg(""); return; }

    setBusy(true); setMsg("Drafting rubric...");
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
    } catch (err) { setMsg(`Failed to create: ${err instanceof Error ? err.message : err}`); }
    finally { setBusy(false); }
  }

  async function approveRubric() {
    if (!draft) return;
    setBusy(true); setMsg("Freezing rubric...");
    try {
      const res = await fetch(`/api/bounty/${draft.id}/approve-rubric`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      if (j.lock) {
        // Live mode: nothing is frozen yet. The poster signs next.
        setLock(j.lock as LockParams);
        setMsg(j.note ?? "");
      } else {
        setMsg(j.note ?? "Rubric frozen. Task is now open on the market.");
        setDraft(null);
      }
      onChanged();
    } catch (err) { setMsg(`Failed to freeze: ${err instanceof Error ? err.message : err}`); }
    finally { setBusy(false); }
  }

  const inp = (k: keyof Errors) => `${FIELD_INPUT_CLASS} ${fieldBorder(!!errors[k])}`;

  return (
    <div>
      <div className="grid gap-4">
        <FormField
          id="brief"
          label="What needs to be done"
          hint="Write in plain language. The arbiter will turn this exactly into a scoring rubric — anything unsaid cannot be graded."
          error={errors.brief}
        >
          <textarea id="brief" rows={5} className={inp("brief")} value={brief} onChange={(e) => edit(setBrief, "brief")(e.target.value)} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="amount" label="Bounty prize" hint="Amount in USDC. Locked in escrow on Arc testnet." error={errors.amount}>
            <input id="amount" type="number" min="0.1" step="0.1" className={inp("amount")} value={amount} onChange={(e) => edit(setAmount, "amount")(e.target.value)} />
          </FormField>
          <FormField id="deadline" label="Deadline" hint="If nobody submits before the deadline, you can reclaim the funds." error={errors.deadline}>
            <input id="deadline" type="datetime-local" className={inp("deadline")} value={deadline} onChange={(e) => edit(setDeadline, "deadline")(e.target.value)} />
          </FormField>
        </div>

        <div>
          <PillButton variant="primary" disabled={busy || !!draft} onClick={createBounty} className={ARBITER_PRIMARY_BUTTON}>
            {busy && !draft ? "Drafting rubric..." : "CREATE TASK AND DRAFT RUBRIC"}
          </PillButton>
        </div>
      </div>

      {draft && (
        <div className="mt-5 border-t border-[var(--a-line-dim)] pt-5">
          <h3 className="text-sm font-semibold text-[var(--a-text)]">
            The arbiter will grade against this rubric
          </h3>
          <div className="mt-1">
            <RubricTable items={draft.rubric} frozen={false} />
          </div>
          <div className="mt-4">
            {lock ? (
              <PosterLockFunds
                lock={lock}
                onDone={() => {
                  setMsg("USDC locked in escrow. Task is on the market, waiting for a worker.");
                  setDraft(null);
                  setLock(null);
                  onChanged();
                }}
              />
            ) : (
              <PillButton variant="primary" disabled={busy} onClick={approveRubric} className={ARBITER_PRIMARY_BUTTON}>
                APPROVE RUBRIC AND LOCK FUNDS
              </PillButton>
            )}
          </div>
        </div>
      )}

      {msg && <p className="mt-4 text-sm leading-relaxed text-[var(--a-muted)]">{msg}</p>}
    </div>
  );
}
