"use client";

// =============================================================================
// bounty-action-panel.tsx — every action that belongs to one bounty, in one place.
//
// The detail page is a server component so a stranger can read the brief and the criteria
// with no wallet and no JavaScript. Everything that needs a session is fenced off here.
//
// This panel also inherited the judge flow and the poster's approve/reject from the old
// accordion on the board. That move is the point of the redesign: the actions now live on the
// thing they act on, addressable by URL, instead of inside a row that had to be expanded.
//
// What it offers depends on who is asking — and the server checks again regardless. Every
// route re-derives the caller from the session cookie and refuses a stranger whatever this
// component chose to render.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { ClaimButton } from "@/components/arbiter/claim-button";
import { WorkerSubmitForm } from "@/components/arbiter/worker-submit-form";
import { WalletConnectButton } from "@/components/arbiter/wallet-connect-button";
import { JudgingProgress } from "@/components/arbiter/judging-progress";
import { VerdictCertificate } from "@/components/arbiter/verdict-certificate";
import { useJudgeStream } from "@/components/arbiter/use-judge-stream";
import { PillButton } from "@/components/ui/pill-button";
import { isClaimable, type BountyState } from "@/lib/arbiter/bounty-display";

interface RubricItem { item_id: string; criterion: string; weight: number }

interface Detail {
  bounty: { id: string; status: string; poster_id: string; worker_id: string | null };
  rubric: null | { items_json: RubricItem[] };
  // Shape mirrors GET /api/bounty?id= — kept local rather than imported from the server
  // module so this client component never pulls a server-only import chain.
  verdict: null | {
    id: string;
    decision: string;
    total_score: number;
    confidence: number;
    verdict_hash: string;
    release_tx: string | null;
    verdict_json: {
      rubric_scores: { item_id: string; weight: number; score: number; evidence: string[]; reasoning: string }[];
      confidence_reasoning: string;
      refusal_reason: string | null;
    };
  };
  escalation: null | { poster_action: string };
}

export function BountyActionPanel({ bountyId, state }: { bountyId: string; state: BountyState }) {
  const [session, setSession] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/bounty?id=${bountyId}`);
    if (r.ok) setDetail(await r.json());
  }, [bountyId]);

  const { stage, setStage, busy, setBusy, judge } = useJudgeStream(load);

  // The page was rendered on the server and knows nothing about this browser, so the panel
  // asks once on mount. Until the answers arrive it offers nothing, rather than flashing a
  // button the visitor may not be entitled to.
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setSession(j?.address ?? null))
      .catch(() => alive && setSession(null));
    load();
    return () => {
      alive = false;
    };
  }, [load]);

  const same = (a?: string | null, b?: string | null) =>
    Boolean(a && b && a.toLowerCase() === b.toLowerCase());

  const isWorker = same(session, detail?.bounty.worker_id);
  const isPoster = same(session, detail?.bounty.poster_id);
  const isParty = isWorker || isPoster;
  const criteria = (detail?.rubric?.items_json ?? []).map((r) => r.criterion);

  /** F4 — the poster answers an escalated verdict; every action feeds the public override rate. */
  async function act(action: "APPROVE" | "REJECT") {
    if (!detail?.verdict) return;
    setBusy(true);
    try {
      const res = await fetch("/api/escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict_id: detail.verdict.id,
          bounty_id: bountyId,
          poster_action: action,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setStage(null);
      await load();
    } catch (e) {
      setStage({
        kind: "error",
        afterVerdict: false,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  const heading = isWorker && state === "unclaimed" ? "Nộp bài"
    : detail?.bounty.status === "SUBMITTED" && isParty ? "Chấm bài"
    : isClaimable(state) ? "Nhận việc này"
    : "Việc này";

  return (
    <section className="grid gap-4">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-light)] bg-white/50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
            {heading}
          </h2>
          <WalletConnectButton onSession={setSession} />
        </div>

        <div className="mt-3">
          {/* Worker, work not yet handed in — coming from the bounty's own page there is no
              id to paste and therefore none to paste wrong. */}
          {isWorker && detail?.bounty.status === "OPEN" && (
            <WorkerSubmitForm bountyId={bountyId} onChanged={load} />
          )}

          {/* Either party may start the judging run; the server re-checks. */}
          {detail?.bounty.status === "SUBMITTED" && isParty && (
            <PillButton disabled={busy} onClick={() => judge(bountyId, criteria)}>
              {busy ? "Đang chấm…" : "Chấm bài này"}
            </PillButton>
          )}

          {!isWorker && isClaimable(state) &&
            (session ? (
              <ClaimButton bountyId={bountyId} onClaimed={load} />
            ) : (
              <p className="text-sm text-[var(--color-ink-muted)]">
                Kết nối ví để nhận việc. Đọc nhiệm vụ và tiêu chí chấm thì không cần đăng nhập.
              </p>
            ))}

          {!isParty && !isClaimable(state) && (
            <p className="text-sm text-[var(--color-ink-muted)]">
              {state === "in-progress" && "Đã có người nhận việc này."}
              {state === "submitted" && "Bài đã nộp, đang chờ chấm."}
              {state === "expired" && "Đã quá hạn — không nhận được nữa. Người đăng có thể đòi lại tiền."}
              {state === "closed" && "Việc đã kết thúc."}
            </p>
          )}
        </div>
      </div>

      {stage && <JudgingProgress stage={stage} />}

      {detail?.verdict && (
        <VerdictCertificate
          verdict={detail.verdict}
          rubric={detail.rubric?.items_json ?? null}
          bountyStatus={detail.bounty.status}
          escalation={detail.escalation}
          busy={busy}
          onAct={isPoster ? act : () => {}}
        />
      )}
    </section>
  );
}
