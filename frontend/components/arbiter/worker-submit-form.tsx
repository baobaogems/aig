"use client";

// worker-submit-form.tsx — F2: worker pastes the deliverable → server snapshots it at submit time.

import { useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PillButton } from "@/components/ui/pill-button";

export function WorkerSubmitForm({ onChanged }: { onChanged: () => void }) {
  const [bountyId, setBountyId] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setBusy(true); setMsg("Submitting…");
    try {
      const res = await fetch("/api/submission", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bounty_id: bountyId.trim(), content, source_url: sourceUrl.trim() || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setMsg("Submitted — content snapshot frozen; edits to the source no longer count.");
      setContent("");
      onChanged();
    } catch (e) { setMsg(`Error: ${e instanceof Error ? e.message : e}`); }
    finally { setBusy(false); }
  }

  const inp =
    "rounded-xl border border-[var(--color-ink)]/10 bg-white/80 px-3 py-2 w-full text-sm text-[var(--color-ink)] " +
    "placeholder:text-[var(--color-ink-muted)] outline-none transition-colors focus:border-[var(--color-accent)]";
  return (
    <GlassPanel tone="light" className="p-5">
      <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]">Worker — submit deliverable (F2)</h2>
      <div className="mt-3 grid gap-2.5">
        <input className={inp} placeholder="bounty id (from the list below)" value={bountyId} onChange={(e) => setBountyId(e.target.value)} />
        <textarea className={inp} rows={6} placeholder="deliverable text — this exact snapshot is what gets judged" value={content} onChange={(e) => setContent(e.target.value)} />
        <input className={inp} placeholder="source URL (optional, metadata only)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
        <div>
          <PillButton variant="primary" disabled={busy} onClick={submit}>Submit</PillButton>
        </div>
      </div>
      {msg && <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{msg}</p>}
    </GlassPanel>
  );
}
