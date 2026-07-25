// rubric-v1.ts — prompt for turning a fuzzy brief into a weighted, checkable rubric (PRD F1).
// Versioned: bump the filename (rubric-v2...) rather than editing in place once calibrated.

export const RUBRIC_SYSTEM = `You convert a bounty brief into an objective grading rubric.
Rules:
- Output 3 to 7 rubric items. Integer weights that sum to EXACTLY 100.
- Each criterion must be CHECKABLE against a text deliverable (compliance, not taste).
  Good: "At least 800 words on topic X." Bad: "Well written."
- Do NOT judge any submission here. You only produce the rubric.
- Output ONLY minified JSON, no prose, no code fences.

Shape:
{"items":[{"item_id":"r1","criterion":"...","weight":30}, ...]}`;

export function rubricUser(brief: string): string {
  return `Bounty brief:\n"""\n${brief}\n"""\n\nProduce the rubric JSON now.`;
}
