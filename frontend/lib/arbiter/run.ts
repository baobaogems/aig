// run.ts — orchestrator: brief → rubric gen → grade → verdict → decision → (money).
// The judging half is the money-independent heart (GATE 1) and stays importable from a plain
// node script. The settlement half (GATE 2) lives in judgeAndSettle() below and only touches
// lib/escrow.ts through a DYNAMIC import, behind DRY_RUN=false — so the dry-run CLI never
// even loads the money layer.

import { generateRubric, type RubricItem } from "./rubric";
import { gradeSubmission, type JudgeResult } from "./judge";
import { liveCaps } from "./spend-ledger";
import type { SpendCaps } from "./tiers";

export interface DryRunCase {
  id: string;
  brief: string;
  deliverable: string;
  amount_usdc: number;
  /** Optional frozen rubric — when present, skips generation (calibration determinism). */
  rubric?: RubricItem[];
  /** Expected decision for calibration scoring: RELEASE | ESCALATE | FAIL | REFUSE */
  expected_decision?: string;
  note?: string;
}

export interface CaseRunResult {
  caseId: string;
  rubric: RubricItem[];
  rubricGenerated: boolean;
  judge: JudgeResult;
  elapsedMs: number;
  totalTokens: { input: number; output: number };
}

export function isDryRun(): boolean {
  // DRY_RUN defaults to TRUE — money only connects when explicitly set to "false".
  return process.env.DRY_RUN !== "false";
}

export function capsFromEnv(): SpendCaps {
  return {
    perBountyUsdc: Number(process.env.PER_BOUNTY_CAP_USDC ?? 50),
    // No release ledger yet in dry-run — full daily headroom. Phase 03 subtracts real spend.
    perDayRemainingUsdc: Number(process.env.PER_DAY_CAP_USDC ?? 150),
  };
}

/** Run one case end-to-end (rubric gen unless frozen rubric provided, then grade). */
export async function runCase(c: DryRunCase): Promise<CaseRunResult> {
  const t0 = Date.now();
  const tokens = { input: 0, output: 0 };

  let rubric: RubricItem[];
  let rubricGenerated = false;
  if (c.rubric && c.rubric.length > 0) {
    rubric = c.rubric;
  } else {
    const gen = await generateRubric(c.brief);
    rubric = gen.items;
    rubricGenerated = true;
    tokens.input += gen.usage.input_tokens;
    tokens.output += gen.usage.output_tokens;
  }

  const judge = await gradeSubmission({
    bountyId: `dryrun-${c.id}`,
    submissionId: `dryrun-${c.id}-sub`,
    brief: c.brief,
    rubric,
    deliverable: c.deliverable,
    amountUsdc: c.amount_usdc,
    caps: capsFromEnv(),
    now: new Date().toISOString(),
  });
  tokens.input += judge.usage.input_tokens;
  tokens.output += judge.usage.output_tokens;

  return { caseId: c.id, rubric, rubricGenerated, judge, elapsedMs: Date.now() - t0, totalTokens: tokens };
}

// ---------------------------------------------------------------------------
// GATE 2 — judge a real submission and settle it on Arc.
// ---------------------------------------------------------------------------

export interface SettleInput {
  bountyId: string; // uuid — hashed to bytes32 for the contract
  submissionId: string;
  brief: string;
  rubric: RubricItem[]; // frozen at poster approval — never regenerated at judge time
  deliverable: string; // content snapshot taken at submit time
  amountUsdc: number;
}

export interface SettleResult {
  judge: JudgeResult;
  dryRun: boolean;
  /** Present only when USDC actually moved. */
  release?: { txHash: string; worker: string; amountUsdc: number };
  /** Why an otherwise-releasable verdict did not pay out (cap, dry-run, or a failed send). */
  settlementNote?: string;
}

/**
 * Judge a submission, then release the escrow if — and only if — the verdict earned it.
 *
 * The money decision is NOT the model's: gradeSubmission returns a decision already computed
 * by tiers.ts from the score/confidence the model proposed, with the spend caps applied.
 * This function's only added authority is "carry out a RELEASE decision".
 */
export async function judgeAndSettle(input: SettleInput): Promise<SettleResult> {
  const dryRun = isDryRun();

  // Dry-run keeps the deterministic env caps (calibration must not depend on a live ledger);
  // the money path reads the real 24h ledger, which fails closed when it can't be read.
  const caps: SpendCaps = dryRun ? capsFromEnv() : await liveCaps();

  const judge = await gradeSubmission({
    bountyId: input.bountyId,
    submissionId: input.submissionId,
    brief: input.brief,
    rubric: input.rubric,
    deliverable: input.deliverable,
    amountUsdc: input.amountUsdc,
    caps,
    now: new Date().toISOString(),
  });

  if (dryRun) {
    return { judge, dryRun, settlementNote: "DRY_RUN — verdict only, no money moved" };
  }
  if (judge.verdict.decision !== "RELEASE") {
    // ESCALATE / FAIL / REFUSE are human-facing outcomes; Phase 04 flows own what happens next.
    return { judge, dryRun, settlementNote: `decision=${judge.verdict.decision} — no autonomous release` };
  }

  // Re-check the day cap immediately before spending. The judge call takes ~15-20s; another
  // release can land in that window, and the check that authorised this one is already stale.
  const fresh = await liveCaps();
  if (input.amountUsdc > fresh.perDayRemainingUsdc) {
    return {
      judge,
      dryRun,
      settlementNote:
        `day cap reached at settle time (${fresh.daySpend.spentUsdc}/${fresh.daySpend.capUsdc} USDC` +
        `${fresh.daySpend.degraded ? ", ledger unreadable — failing closed" : ""}) — escalate to poster instead`,
    };
  }

  const { releaseEscrow } = await import("../escrow");
  const release = await releaseEscrow(input.bountyId, judge.hash);
  return { judge, dryRun, release };
}
