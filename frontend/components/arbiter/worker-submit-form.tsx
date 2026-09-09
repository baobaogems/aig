"use client";

// worker-submit-form.tsx — F2: worker pastes the deliverable → server snapshots it at
// submit time. Labels, hints and per-field errors, same as the poster form; the request
// body is unchanged.

import { useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { FormField, FIELD_INPUT_CLASS, fieldBorder } from "@/components/ui/form-field";

type Errors = Partial<Record<"bountyId" | "content", string>>;

export function WorkerSubmitForm({ onChanged }: { onChanged: () => void }) {
  const [bountyId, setBountyId] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
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
    if (!bountyId.trim()) e.bountyId = "Paste the id of the bounty you are answering.";
    if (!content.trim()) e.content = "There is nothing here to judge yet.";
    setErrors(e);
    if (Object.keys(e).length > 0) { setMsg(""); return; }

    setBusy(true); setMsg("Submitting…");
    try {
      const res = await fetch("/api/submission", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bounty_id: bountyId.trim(), content, source_url: sourceUrl.trim() || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setMsg("Submitted. This exact text is frozen — later edits to the source no longer count.");
      setContent("");
      onChanged();
    } catch (err) { setMsg(`Could not submit: ${err instanceof Error ? err.message : err}`); }
    finally { setBusy(false); }
  }

  const inp = (k: keyof Errors) => `${FIELD_INPUT_CLASS} ${fieldBorder(!!errors[k])}`;

  return (
    <div>
      <div className="grid gap-4">
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

        <FormField
          id="content"
          label="Your work"
          hint="Paste the finished text. This snapshot is exactly what gets judged, word for word."
          error={errors.content}
        >
          <textarea id="content" rows={8} className={inp("content")} value={content} onChange={(e) => edit(setContent, "content")(e.target.value)} />
        </FormField>

        <FormField id="source-url" label="Where it lives (optional)" hint="Stored as a reference only. The arbiter judges the text above, not this link.">
          <input id="source-url" className={`${FIELD_INPUT_CLASS} ${fieldBorder(false)}`} placeholder="https://" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
        </FormField>

        <div>
          <PillButton variant="primary" disabled={busy} onClick={submit}>
            {busy ? "Submitting…" : "Submit for judgment"}
          </PillButton>
        </div>
      </div>

      {msg && <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)]">{msg}</p>}
    </div>
  );
}
