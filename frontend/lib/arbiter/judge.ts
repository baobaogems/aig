// judge.ts — grade a deliverable against a frozen rubric, then ASSEMBLE the verdict.
// Division of trust: the model returns scores + evidence + confidence; OUR code computes the
// weighted total and the money decision (tiers.ts). Off-schema model output → REFUSE verdict.

import { z } from "zod";
import { callJson, MODEL, PROMPT_VERSION } from "./client";
import { GRADE_SYSTEM, gradeUser } from "./prompts/grade-v2";
import type { RubricItem } from "./rubric";
import { decideTier, applySpendCap, type SpendCaps } from "./tiers";
import { parseVerdict, verdictHash, type Verdict } from "./verdict-schema";

// Intermediate shape the MODEL produces (smaller than the full verdict — no decision/total here).
const gradeReplySchema = z.object({
  rubric_scores: z
    .array(
      z.object({
        item_id: z.string().min(1),
        criterion: z.string().min(1),
        weight: z.number().int().min(0).max(100),
        score: z.number().int().min(0).max(100),
        evidence: z.array(z.string()), // may be empty → we zero that item's contribution
        reasoning: z.string().min(1),
      }),
    )
    .min(1),
  confidence: z.number().int().min(0).max(100),
  confidence_reasoning: z.string().min(1),
  out_of_scope: z.boolean(),
  refusal_reason: z.string().nullable(),
});

export interface JudgeInput {
  bountyId: string;
  submissionId: string;
  brief: string;
  rubric: RubricItem[];
  deliverable: string;
  amountUsdc: number;
  caps: SpendCaps;
  now: string; // ISO8601 — injected (deterministic, testable)
}

export interface JudgeResult {
  verdict: Verdict;
  hash: `0x${string}`;
  usage: { input_tokens: number; output_tokens: number };
}

export async function gradeSubmission(input: JudgeInput): Promise<JudgeResult> {
  const { data, usage, parseError } = await callJson(
    GRADE_SYSTEM,
    gradeUser(input.brief, input.rubric, input.deliverable),
  );

  if (parseError) {
    // Unparseable reply is the same class of failure as an off-schema one: we do not know
    // what the model meant, so no money moves. Never throw — a throw leaves the bounty stuck
    // in SUBMITTED with no verdict row to show for the tokens spent.
    return finalize(input, refuseVerdict(input, "grade unparseable: " + parseError), usage);
  }

  const parsed = gradeReplySchema.safeParse(data);
  if (!parsed.success) {
    // Never guess the model's intent — a malformed grade is a REFUSE.
    return finalize(input, refuseVerdict(input, "grade off-schema: " + parsed.error.issues[0]?.message), usage);
  }
  const g = parsed.data;

  // Deterministic weighted total (0–100). Items with NO evidence contribute 0 (anti-vibes rule).
  const total = Math.round(
    g.rubric_scores.reduce((acc, s) => acc + (s.evidence.length > 0 ? s.score : 0) * s.weight, 0) / 100,
  );

  const capped = applySpendCap(
    decideTier({ totalScore: total, confidence: g.confidence, outOfScope: g.out_of_scope }),
    input.amountUsdc,
    input.caps,
  );

  const verdict: Verdict = {
    bounty_id: input.bountyId,
    submission_id: input.submissionId,
    rubric_scores: g.rubric_scores.map((s) => ({
      ...s,
      evidence: s.evidence.length > 0 ? s.evidence : ["(no evidence cited — scored 0)"],
      score: s.evidence.length > 0 ? s.score : 0,
    })),
    total_score: total,
    confidence: g.confidence,
    confidence_reasoning: g.confidence_reasoning,
    decision: capped.decision,
    refusal_reason: capped.decision === "REFUSE" ? (g.refusal_reason ?? "out of scope") : null,
    model: MODEL,
    prompt_version: PROMPT_VERSION,
    created_at: input.now,
  };

  return finalize(input, verdict, usage);
}

function finalize(input: JudgeInput, verdict: Verdict, usage: JudgeResult["usage"]): JudgeResult {
  // Belt-and-suspenders: the assembled verdict must itself pass the public schema.
  const check = parseVerdict(verdict);
  if (!check.ok) {
    // Hash the REFUSE we actually store, not a placeholder — verdict_hash goes on-chain and
    // into the DB, so "0x" would publish a hash that matches no verdict anyone can verify.
    const refusal = refuseVerdict(input, "assembled verdict invalid: " + check.error);
    return { verdict: refusal, hash: verdictHash(refusal), usage };
  }
  return { verdict, hash: verdictHash(verdict), usage };
}

function refuseVerdict(input: JudgeInput, reason: string): Verdict {
  return {
    bounty_id: input.bountyId,
    submission_id: input.submissionId,
    rubric_scores: [
      { item_id: "r0", criterion: "(refused)", weight: 100, score: 0, evidence: ["(refused)"], reasoning: reason },
    ],
    total_score: 0,
    confidence: 0,
    confidence_reasoning: reason,
    decision: "REFUSE",
    refusal_reason: reason,
    model: MODEL,
    prompt_version: PROMPT_VERSION,
    created_at: input.now,
  };
}
