"use client";

// worker-submit-form.tsx — F2: worker pastes the deliverable → server snapshots it at submit time.

import { useState } from "react";

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

  const inp = "border border-gray-400 px-2 py-1 w-full text-sm";
  return (
    <section className="border border-gray-400 p-3">
      <h2 className="font-bold mb-2">Worker — submit deliverable (F2)</h2>
      <div className="grid gap-2">
        <input className={inp} placeholder="bounty id (from the list below)" value={bountyId} onChange={(e) => setBountyId(e.target.value)} />
        <textarea className={inp} rows={6} placeholder="deliverable text — this exact snapshot is what gets judged" value={content} onChange={(e) => setContent(e.target.value)} />
        <input className={inp} placeholder="source URL (optional, metadata only)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
        <button className="border border-black px-3 py-1 disabled:opacity-50" disabled={busy} onClick={submit}>Submit</button>
      </div>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </section>
  );
}
