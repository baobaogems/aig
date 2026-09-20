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
    if (!fixedBountyId && !bountyId.trim()) e.bountyId = "Dán id của bounty bạn đang trả lời.";
    if (mode === "paste" && !content.trim()) e.content = "Chưa có gì để chấm.";
    if (mode === "link" && !/^https?:\/\//i.test(sourceUrl.trim()))
      e.content = "Cần một link http hoặc https công khai.";
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
          ? "Đã nộp. Arbiter đã đọc link và đóng băng nội dung đọc được — sửa nguồn sau này không đổi kết quả."
          : "Đã nộp. Đúng đoạn văn bản này bị đóng băng — sửa nguồn sau này không tính.",
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
            label="Việc nào"
            hint={'Dùng nút "copy id" ở dòng bạn đang trả lời.'}
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
          {([["paste", "Dán nội dung"], ["link", "Gửi link"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={
                "rounded-[var(--radius-pill)] px-3.5 py-1.5 text-sm transition-colors " +
                (mode === k
                  ? "bg-[var(--color-ink)] text-white"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "paste" ? (
          <FormField
            id="content"
            label="Bài của bạn"
            hint="Dán bài đã hoàn thành. Chính đoạn này bị đóng băng và được chấm, từng chữ một."
            error={errors.content}
          >
            <textarea id="content" rows={8} className={inp("content")} value={content} onChange={(e) => edit(setContent, "content")(e.target.value)} />
          </FormField>
        ) : (
          <FormField
            id="source-url"
            label="Link công khai tới bài"
            hint="Arbiter sẽ tự tải và đọc nội dung ở link này, rồi đóng băng đúng những gì đọc được. Trang cần JavaScript mới hiện chữ thì sẽ không đọc được — khi đó hãy dán thẳng nội dung."
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
            {busy ? "Đang nộp…" : mode === "link" ? "Đọc link và nộp" : "Nộp để chấm"}
          </PillButton>
        </div>
      </div>

      {msg && <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)]">{msg}</p>}
    </div>
  );
}
