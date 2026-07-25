// verdict-schema.ts — the contract between the AI layer and the money layer (PRD §6).
// The server accepts ONLY output that matches this schema; anything else = REFUSE.
// verdictHash = keccak256(canonical verdict JSON) is the artifact written on-chain at release.

import { z } from "zod";
import { keccak256, toBytes } from "viem";

// ---- Rubric item score (one row per rubric criterion) ----
export const rubricScoreSchema = z.object({
  item_id: z.string().min(1),
  criterion: z.string().min(1),
  weight: z.number().int().min(0).max(100),
  score: z.number().int().min(0).max(100),
  // Evidence is MANDATORY: at least one verbatim quote from the deliverable.
  // This is what stops "quality vibes" grading — every score must be anchored.
  evidence: z.array(z.string().min(1)).min(1),
  reasoning: z.string().min(1),
});

export const decisionEnum = z.enum(["RELEASE", "ESCALATE", "FAIL", "REFUSE"]);
export type Decision = z.infer<typeof decisionEnum>;

// ---- Full verdict (PRD §6) ----
export const verdictSchema = z
  .object({
    bounty_id: z.string().min(1),
    submission_id: z.string().min(1),
    rubric_scores: z.array(rubricScoreSchema).min(1),
    total_score: z.number().int().min(0).max(100),
    confidence: z.number().int().min(0).max(100),
    confidence_reasoning: z.string().min(1),
    decision: decisionEnum,
    refusal_reason: z.string().nullable(),
    model: z.string().min(1),
    prompt_version: z.string().min(1),
    created_at: z.string().min(1), // ISO8601
  })
  .strict(); // reject unknown keys — no silent extra fields from the model

export type Verdict = z.infer<typeof verdictSchema>;
export type RubricScore = z.infer<typeof rubricScoreSchema>;

export type ParseResult =
  | { ok: true; verdict: Verdict }
  | { ok: false; error: string };

/** Validate raw model output. Off-schema → caller treats as REFUSE (never guess intent). */
export function parseVerdict(raw: unknown): ParseResult {
  const r = verdictSchema.safeParse(raw);
  if (!r.success) {
    return { ok: false, error: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  return { ok: true, verdict: r.data };
}

/**
 * Deterministic canonical JSON: keys sorted recursively, no insignificant whitespace.
 * Two semantically-identical verdicts MUST serialize identically so the hash is stable
 * across machines and re-runs — this hash is what lands on-chain.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortDeep((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

/** keccak256 of the canonical verdict JSON — the on-chain proof artifact. */
export function verdictHash(verdict: Verdict): `0x${string}` {
  return keccak256(toBytes(canonicalize(verdict)));
}
