"use client";

// worker-submit-form.tsx — F2: worker hands in the work → server snapshots it at submit time.
//
// Phase 06 added the second way in. A link used to be stored as a reference the arbiter
// never read, which meant "gửi link" did not actually work: the code said so out loud
// ("a bare link is not judgeable"). Now the server fetches the link and judges what it finds.
//
// Either way one thing is stored — the text — and it is frozen at submit time.

import { useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { FormField, FIELD_INPUT_CLASS, fieldBorder } from "@/components/ui/form-field";

type Errors = Partial<Record<"bountyId" | "content", string>>;

export function WorkerSubmitForm({
  onChanged,
  bountyId: fixedBountyId,
}: {
  onChanged: () => void;
  /** Supplied when the form is opened from a bounty's own page — then there is nothing to
   *  paste, and nothing to paste wrong. The drawer on /arbiter still asks for an id. */
  bountyId?: string;
}) {
  const [typedBountyId, setTypedBountyId] = useState("");
  const bountyId = fixedBountyId ?? typedBountyId;
  const setBountyId = setTypedBountyId;
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  /** Which way the work is being handed in. They are alternatives, not a form to fill twice. */
  const [mode, setMode] = useState<"paste" | "link">("paste");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  /** Clear a field's error as soon as it is edited — see the note in poster-bounty-form. */
  function edit(setter: (v: string) => void, key: keyof Errors) {
    return (value: string) => {
      setter(value);
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };
  }

  async function submit() {
    const e: Errors = {};
    if (!fixedBountyId && !bountyId.trim()) e.bountyId = "Paste the id of the bounty you are answering.";
    if (mode === "paste" && !content.trim()) e.content = "Nothing to grade yet.";
    if (mode === "link" && !/^https?:\/\//i.test(sourceUrl.trim()))
      e.content = "A public http or https link is required.";
    setErrors(e);
    if (Object.keys(e).length > 0) { setMsg(""); return; }

    setBusy(true); setMsg("Submitting…");
    try {
      const res = await fetch("/api/submission", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bounty_id: bountyId.trim(),
          // Send only the one that is in play; the server judges pasted text when both arrive.
          content: mode === "paste" ? content : undefined,
          source_url: sourceUrl.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setMsg(
        mode === "link"
          ? "Submitted. Arbiter read the link and froze what it read — editing the source afterwards changes nothing."
          : "Submitted. Exactly this text is frozen — editing the source afterwards does not count.",
      );
      setContent("");
      onChanged();
    } catch (err) { setMsg(`Could not submit: ${err instanceof Error ? err.message : err}`); }
    finally { setBusy(false); }
  }

  const inp = (k: keyof Errors) => `${FIELD_INPUT_CLASS} ${fieldBorder(!!errors[k])}`;

  return (
    <div>
      <div className="grid gap-4">
        {!fixedBountyId && (
          <FormField
            id="bounty-id"
            label="Which bounty"
            hint={'Use the "copy id" button on the row you are answering.'}
            error={errors.bountyId}
          >
            <input
              id="bounty-id"
              className={`${inp("bountyId")} font-[family-name:var(--font-jetbrains-mono)] text-xs`}
              placeholder="00000000-0000-0000-0000-000000000000"
              value={bountyId}
              onChange={(e) => edit(setBountyId, "bountyId")(e.target.value)}
            />
          </FormField>
        )}

        <div className="flex gap-1.5">
          {([["paste", "Paste content"], ["link", "Send a link"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={
                "rounded-[var(--radius-pill)] px-3.5 py-1.5 text-sm transition-colors " +
                (mode === k
                  ? "bg-[var(--a-text)] text-white"
                  : "text-[var(--a-muted)] hover:text-[var(--a-text)]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "paste" ? (
          <FormField
            id="content"
            label="Your submission"
            hint="Paste the finished work. Exactly this text is frozen and graded, word for word."
            error={errors.content}
          >
            <textarea id="content" rows={8} className={inp("content")} value={content} onChange={(e) => edit(setContent, "content")(e.target.value)} />
          </FormField>
        ) : (
          <FormField
            id="source-url"
            label="Public link to the work"
            hint="Arbiter fetches this link, reads the content, and freezes exactly what it read. A page that needs JavaScript to show its text cannot be read — paste the content directly in that case."
            error={errors.content}
          >
            <input
              id="source-url"
              className={`${FIELD_INPUT_CLASS} ${fieldBorder(!!errors.content)}`}
              placeholder="https://gist.github.com/…"
              value={sourceUrl}
              onChange={(e) => edit(setSourceUrl, "content")(e.target.value)}
            />
          </FormField>
        )}

        <div>
          <PillButton variant="primary" disabled={busy} onClick={submit}>
            {busy ? "Submitting…" : mode === "link" ? "Read link and submit" : "Submit for grading"}
          </PillButton>
        </div>
      </div>

      {msg && <p className="mt-4 text-sm leading-relaxed text-[var(--a-muted)]">{msg}</p>}
    </div>
  );
}
