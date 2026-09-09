// override-rate.ts — what "the poster overruled the arbiter" actually means.
//
// The agent_stats view counts every REJECT as an override, over every recorded poster
// action. Its own comment admits the shortcut: "MVP simplification: count REJECT actions as
// reversals". That inflates the most load-bearing number on the site.
//
// All three poster actions on record were taken on ESCALATE verdicts. ESCALATE is the
// arbiter saying it is not confident enough to decide — it states no position. Answering a
// question is not overruling anyone, so counting those as overrides advertised a
// disagreement that never happened, on a page whose whole claim is accountability.
//
// So an override needs the arbiter to have taken a side first:
//   RELEASE + poster REJECT  → overturned (it would have paid; the poster stopped it)
//   FAIL    + poster APPROVE → overturned (it said this missed; the poster paid anyway)
// and the denominator is only the verdicts where it took a side AND a poster answered.
// ESCALATE and REFUSE sit outside both: in one the arbiter declined to decide, in the other
// it declined to judge at all. Both are the system working as designed, not a correction.
//
// Kept as a pure function, separate from the query, because this number appears on the
// landing page and on /arbiter and must not drift.

/** A verdict the arbiter reached, paired with the poster's action if one was taken. */
export interface VerdictAction {
  decision: string;
  /** null when no poster has acted on it yet. */
  posterAction: "APPROVE" | "REJECT" | null;
}

export interface OverrideStats {
  /** Verdicts the arbiter escalated — the ones it handed to a person. */
  escalatedToHuman: number;
  /** Of the decisive verdicts a poster answered, how many went against the arbiter. */
  overturned: number;
  /** Decisive verdicts (RELEASE or FAIL) that a poster actually answered. */
  decisiveReviewed: number;
}

const DECISIVE = new Set(["RELEASE", "FAIL"]);

export function computeOverrideStats(rows: VerdictAction[]): OverrideStats {
  let escalatedToHuman = 0;
  let overturned = 0;
  let decisiveReviewed = 0;

  for (const r of rows) {
    // Counts verdicts handed to a person, NOT button presses. The view counted rows in
    // `escalations`, so an escalated verdict nobody had answered yet went uncounted.
    if (r.decision === "ESCALATE") escalatedToHuman++;

    if (!DECISIVE.has(r.decision) || r.posterAction === null) continue;
    decisiveReviewed++;
    const contradicts =
      (r.decision === "RELEASE" && r.posterAction === "REJECT") ||
      (r.decision === "FAIL" && r.posterAction === "APPROVE");
    if (contradicts) overturned++;
  }

  return { escalatedToHuman, overturned, decisiveReviewed };
}

/**
 * Reads as a fraction, never a percentage: over a handful of cases "100%" overstates what
 * one disagreement means. With no decisive verdict answered yet there is nothing to express
 * as a ratio, so say that instead of printing a hollow "0 of 0".
 */
export function formatOverrideRate(stats: OverrideStats): string {
  if (stats.decisiveReviewed === 0) return "none yet";
  return `${stats.overturned} of ${stats.decisiveReviewed}`;
}
