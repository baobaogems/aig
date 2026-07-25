// run.ts — DRY_RUN orchestrator: brief → rubric gen → grade → verdict → decision.
// This is the money-independent heart (GATE 1). When DRY_RUN=true (default) it STOPS after
// the decision — no escrow, no transfers. Phase 03 adds the release() call behind DRY_RUN=false.

import { generateRubric, type RubricItem } from "./rubric";
import { gradeSubmission, type JudgeResult } from "./judge";
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
