"use client";

// =============================================================================
// bounty-action-panel.tsx — every action that belongs to one bounty, in one place.
//
// The detail page is a server component so a stranger can read the brief and the criteria
// with no wallet and no JavaScript. Everything that needs a session is fenced off here.
//
// Judging is NOT a button. Handing work in and finding out whether it passed is one action
// from the worker's side: they submit, the arbiter grades, the result appears. A "Chấm bài
// này" button sitting under a fresh submission asked the worker to request their own grade,
// and left the bounty parked in SUBMITTED if nobody pressed it.
//
// So submitting starts the run, and a page that loads on an ungraded submission starts it
// too — that second path is what rescues a run whose tab was closed halfway.
//
// What it offers depends on who is asking — and the server checks again regardless. Every
// route re-derives the caller from the session cookie and refuses a stranger whatever this
// component chose to render.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { ClaimButton } from "@/components/arbiter/claim-button";
import { WorkerSubmitForm } from "@/components/arbiter/worker-submit-form";
import { WalletConnectButton } from "@/components/arbiter/wallet-connect-button";
import { JudgingProgress } from "@/components/arbiter/judging-progress";
import { VerdictCertificate } from "@/components/arbiter/verdict-certificate";
import { useJudgeStream } from "@/components/arbiter/use-judge-stream";
import { SettlementPanel } from "@/components/arbiter/settlement-panel";
import { useCountdown } from "@/components/arbiter/use-countdown";
import { isClaimable, type BountyState } from "@/lib/arbiter/bounty-display";
import { submissionWindow } from "@/lib/arbiter/submission-window";

interface RubricItem { item_id: string; criterion: string; weight: number }

interface Detail {
  bounty: {
    id: string; status: string; poster_id: string; worker_id: string | null; deadline: string;
    amount_usdc: number;
    /** When the arbiter recorded the submission on-chain. Drives the settlement clock. */
    submitted_at: string | null;
    /** 2 = opened on the frozen v2 escrow and finishing under its rules. */
    escrow_version: number;
  };
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

  const { stage, busy, judge } = useJudgeStream(load);
  // Ticking clock rather than a Date.now() read during render: the submission window closes
  // at the deadline, and a tab left open must stop offering the form at that moment, not at
  // whatever moment it last happened to re-render.
  const now = useCountdown();

  const same = (a?: string | null, b?: string | null) =>
    Boolean(a && b && a.toLowerCase() === b.toLowerCase());
  const isWorker = same(session, detail?.bounty.worker_id);
  const isPoster = same(session, detail?.bounty.poster_id);
  const isParty = isWorker || isPoster;

  // The page was rendered on the server and knows nothing about this browser, so the panel
  // asks once on mount. Until the answers arrive it offers nothing, rather than flashing a
  // button the visitor may not be entitled to.
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setSession(j?.address ?? null))
      .catch(() => alive && setSession(null));
    // Fetch-on-mount: `load` only sets state after an await, so there is no cascading render
    // here. The rule cannot see past the call and flags it anyway.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => {
      alive = false;
    };
  }, [load]);

  // Rescue path: a submission that was never graded (the tab closed mid-run, or the stream
  // broke) would otherwise sit in SUBMITTED forever waiting for a button that no longer
  // exists. Fires at most once per mount so a failing run cannot become a loop.
  const autoJudged = useRef(false);
  useEffect(() => {
    if (autoJudged.current || busy || !detail) return;
    if (detail.bounty.status !== "SUBMITTED" || detail.verdict) return;
    if (!isParty) return; // the server only accepts a judge call from the two parties
    autoJudged.current = true;
    void judge(bountyId, (detail.rubric?.items_json ?? []).map((r) => r.criterion));
  });


  // One rule, the same one the server enforces, so the form is never offered when a submission
  // would be rejected — nor hidden when it would be accepted.
  const submitWindow = detail
    ? submissionWindow({
        status: detail.bounty.status,
        lastDecision: detail.verdict?.decision ?? null,
        deadline: detail.bounty.deadline,
        now,
      })
    : null;

  const heading = isWorker && submitWindow?.allowed ? (submitWindow.isRetry ? "Edit and resubmit" : "Submit work")
    : busy ? "Grading..."
    : isClaimable(state) ? "Accept bounty"
    : "This bounty";

  return (
    <section className="grid gap-4">
      <div 
        className="rounded-[var(--radius-card)] border px-5 py-4"
        style={{ background: "var(--a-card)", borderColor: "var(--a-line-dim)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--a-text)]">
            {heading}
          </h2>
          <WalletConnectButton onSession={setSession} />
        </div>

        <div className="mt-3">
          {/* Worker's turn. Coming from the bounty's own page there is no id to paste and
              therefore none to paste wrong. Submitting starts the grading run immediately —
              handing work in and learning whether it passed is one action, not two. */}
          {isWorker && submitWindow?.allowed && (
            <>
              {submitWindow.isRetry && (
                <p className="mb-3 text-sm leading-relaxed text-[var(--a-muted)]">
                  Previous attempt failed. Read the grading below to see which criteria missed, fix them and
                  resubmit — the rubric does not change, so targeted fixes will pass.
                </p>
              )}
              <WorkerSubmitForm
                bountyId={bountyId}
                onChanged={async () => {
                  await load();
                  autoJudged.current = true; // this run is ours; don't let the rescue path double-fire
                  await judge(bountyId, (detail?.rubric?.items_json ?? []).map((r) => r.criterion));
                }}
              />
            </>
          )}

          {/* Grading in flight, or waiting on someone. The reason comes from the same rule. */}
          {isWorker && submitWindow && !submitWindow.allowed && (
            <p className="text-sm leading-relaxed text-[var(--a-muted)]">{submitWindow.reason}</p>
          )}

          {!isWorker && isClaimable(state) &&
            (session ? (
              <ClaimButton bountyId={bountyId} onClaimed={load} />
            ) : (
              <p className="text-sm text-[var(--a-muted)]">
                Connect wallet to accept. Reading the task and grading rubric does not require login.
              </p>
            ))}

          {!isParty && !isClaimable(state) && (
            <p className="text-sm text-[var(--a-muted)]">
              {state === "in-progress" && "Someone has accepted this bounty."}
              {state === "submitted" && "Submission received, waiting for grading."}
              {state === "expired" && "Expired — no longer claimable. Poster can reclaim funds."}
              {state === "closed" && "Bounty is closed."}
            </p>
          )}
        </div>
      </div>

      {stage && <JudgingProgress stage={stage} />}


      {detail?.verdict && (
        <VerdictCertificate
          verdict={detail.verdict}
          rubric={detail.rubric?.items_json ?? null}
          escalation={detail.escalation}
        />
      )}

      {/* AFTER the verdict, deliberately. Deciding whether to pay means reading what the arbiter
          found first, and this panel used to sit above a long verdict card: you scrolled past the
          buttons to read the evidence, then could not find them again. Evidence, then decision. */}
      {detail && (
        <SettlementPanel
          bountyId={bountyId}
          amountUsdc={Number(detail.bounty.amount_usdc)}
          submittedAt={detail.bounty.submitted_at}
          status={detail.bounty.status}
          escrowVersion={detail.bounty.escrow_version}
          verdict={detail.verdict}
          isPoster={isPoster}
          isWorker={isWorker}
          onChanged={load}
        />
      )}
    </section>
  );
}
