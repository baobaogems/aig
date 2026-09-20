// =============================================================================
// settlement-clock.ts — how long each party has, and what happens when they run out.
//
// Pure, `now` injected. Same reason submission-window.ts is pure and shared: a rule about
// who may act, written twice, becomes two rules that disagree — the UI offering a button the
// server rejects, or hiding one the server would have accepted. The API and the UI both read
// THIS file. Nothing recomputes a deadline of its own.
//
// THE RULE THESE CLOCKS ENCODE
// ----------------------------
// Before a submission exists the default favours the poster: no work, deadline passes, money
// goes home. Once a submission exists the default flips to the worker, because the worker has
// handed over something they cannot take back. Silence from the poster is no longer a way to
// keep both the work and the money — it is the slow path to paying in full.
// =============================================================================

/** T1: the arbiter already decided to pay. The poster gets this long to object at a price. */
export const OBJECTION_WINDOW_MS = 48 * 60 * 60 * 1000;

/** T2: the arbiter was unsure and handed the call over. Longer, because a person must think. */
export const T2_DECISION_WINDOW_MS = 72 * 60 * 60 * 1000;

/**
 * How long a claimed bounty stays locked to its claimant before anyone may reopen it.
 *
 * NOTE: this only bites while the bounty's own deadline is further away than the window —
 * past the deadline nothing can be claimed anyway. The create form must therefore refuse a
 * deadline shorter than this, or a claim-and-abandon silently wastes the whole bounty.
 */
export const CLAIM_WINDOW_MS = 72 * 60 * 60 * 1000;

export type SettlementPhase =
  /** T1 verdict, money is going to the worker unless the poster pays to stop it. */
  | "objection"
  /** T2 verdict, waiting on the poster to approve or reject. */
  | "awaiting-poster"
  /** The window ran out. Anyone may now finish this: the worker gets paid in full. */
  | "auto-release-due"
  /** Already settled, refunded, or never started. Nothing is ticking. */
  | "closed";

export interface SettlementState {
  phase: SettlementPhase;
  /** When the current window ends, ms epoch. 0 when nothing is ticking. */
  deadlineMs: number;
  /** Never negative — a countdown that goes negative is a bug someone will render. */
  secondsLeft: number;
  /** True when the poster can still change the outcome (at a price, if T1). */
  posterCanAct: boolean;
}

export interface SettlementClockInput {
  tier: "T1" | "T2" | "T3" | null;
  /** When the arbiter recorded the submission. null = nothing handed in yet. */
  submittedAtMs: number | null;
  /** True once the bounty is settled/refunded on-chain, or the poster already acted. */
  resolved: boolean;
  nowMs: number;
}

export function settlementState(input: SettlementClockInput): SettlementState {
  const { tier, submittedAtMs, resolved, nowMs } = input;
  const closed: SettlementState = { phase: "closed", deadlineMs: 0, secondsLeft: 0, posterCanAct: false };

  if (resolved || submittedAtMs == null) return closed;
  // T3 never starts a clock: the arbiter judged the work not plausible, so the escrow stays
  // on the poster's refund path rather than counting down towards paying for it.
  if (tier !== "T1" && tier !== "T2") return closed;

  const window = tier === "T1" ? OBJECTION_WINDOW_MS : T2_DECISION_WINDOW_MS;
  const deadlineMs = submittedAtMs + window;

  if (nowMs > deadlineMs) {
    return { phase: "auto-release-due", deadlineMs, secondsLeft: 0, posterCanAct: false };
  }
  return {
    phase: tier === "T1" ? "objection" : "awaiting-poster",
    deadlineMs,
    secondsLeft: Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000)),
    posterCanAct: true,
  };
}

/** The shortest deadline a new bounty may carry, so `expireClaim` can ever help it. */
export function minimumDeadlineMs(nowMs: number): number {
  return nowMs + CLAIM_WINDOW_MS;
}
