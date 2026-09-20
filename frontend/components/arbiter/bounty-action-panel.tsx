"use client";

// =============================================================================
// bounty-action-panel.tsx — the one interactive strip on an otherwise static page.
//
// The detail page is a server component so a stranger can read everything without
// JavaScript. Taking the job and handing in the work need a wallet and a session, so they are
// fenced off here rather than turning the whole page client-side.
//
// What it offers depends on who you are, and the server checks again regardless: /api/submission
// refuses anyone who is not the worker on record, whatever this component chose to render.
// =============================================================================

import { useEffect, useState } from "react";
import { ClaimButton } from "@/components/arbiter/claim-button";
import { WorkerSubmitForm } from "@/components/arbiter/worker-submit-form";
import { WalletConnectButton } from "@/components/arbiter/wallet-connect-button";
import { isClaimable, type BountyState } from "@/lib/arbiter/bounty-display";

interface Detail {
  bounty: { worker_id: string | null; status: string };
}

export function BountyActionPanel({ bountyId, state }: { bountyId: string; state: BountyState }) {
  const [session, setSession] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // The page was rendered on the server and knows nothing about this browser's session, so
  // the panel asks once on mount. Until the answer arrives it offers nothing, rather than
  // flashing a button the visitor may not be entitled to.
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setSession(j?.address ?? null))
      .catch(() => alive && setSession(null));

    fetch(`/api/bounty?id=${bountyId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Detail | null) => alive && setWorkerId(j?.bounty.worker_id ?? null))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [bountyId]);

  const isMine = Boolean(session && workerId && session.toLowerCase() === workerId.toLowerCase());

  return (
    <section className="rounded-xl border border-[var(--color-ink)]/10 bg-white/50 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
          {isMine ? "Nộp bài" : isClaimable(state) ? "Nhận việc này" : "Việc này"}
        </h2>
        <WalletConnectButton onSession={setSession} />
      </div>

      <div className="mt-3">
        {isMine ? (
          // Coming from the detail page, the bounty is known — no pasting an id by hand.
          <WorkerSubmitForm bountyId={bountyId} onChanged={() => window.location.reload()} />
        ) : isClaimable(state) ? (
          session ? (
            <ClaimButton bountyId={bountyId} onClaimed={() => window.location.reload()} />
          ) : (
            <p className="text-sm text-[var(--color-ink-muted)]">
              Kết nối ví để nhận việc. Đọc nhiệm vụ và tiêu chí chấm thì không cần đăng nhập.
            </p>
          )
        ) : (
          <p className="text-sm text-[var(--color-ink-muted)]">
            {state === "in-progress" && "Đã có người nhận việc này."}
            {state === "submitted" && "Bài đã nộp, đang chờ Arbiter chấm."}
            {state === "expired" && "Đã quá hạn — không nhận được nữa. Người đăng có thể đòi lại tiền."}
            {state === "closed" && "Việc đã kết thúc."}
          </p>
        )}
      </div>
    </section>
  );
}
