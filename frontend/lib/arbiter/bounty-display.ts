// =============================================================================
// bounty-display.ts — the three derivations the board and the detail page share.
//
// Pure on purpose. These decide what a visitor believes about a bounty — how long they have,
// whether it is still theirs to take, which bounty they are even looking at — and every one
// of them is wrong in a way that is invisible until someone acts on it. So they live here,
// away from JSX, where they can be tested.
//
// `now` is passed in rather than read from Date.now() inside: a countdown that re-reads the
// clock per call cannot be tested, and the board needs every row ticking off ONE clock
// anyway (see use-countdown.ts).
// =============================================================================

/** What a visitor can actually do with this bounty right now. */
export type BountyState = "unclaimed" | "in-progress" | "submitted" | "expired" | "closed";

/**
 * Derive the state from the two fields that carry it. Deliberately takes the raw pair rather
 * than a pre-computed flag, so there is exactly one place that knows the mapping.
 */
export function bountyState(
  workerId: string | null | undefined,
  status: string,
  deadline: string,
  now: number,
): BountyState {
  // Terminal states win over everything: a released bounty is not "expired" just because
  // time has since passed.
  if (status === "RELEASED" || status === "REFUNDED" || status === "REFUSED" || status === "JUDGED") {
    return "closed";
  }
  if (status === "SUBMITTED") return "submitted";
  if (new Date(deadline).getTime() <= now) return "expired";
  return workerId ? "in-progress" : "unclaimed";
}

/** Only an unclaimed, in-time bounty can be taken. */
export function isClaimable(state: BountyState): boolean {
  return state === "unclaimed";
}

export const STATE_LABEL: Record<BountyState, string> = {
  unclaimed: "Chưa ai nhận",
  "in-progress": "Đang làm",
  submitted: "Đã nộp · chờ chấm",
  expired: "Đã quá hạn",
  closed: "Đã xong",
};

/**
 * Time remaining, at a precision that matches how much is left. Days when there are days;
 * seconds when the last minute is running out and the seconds are the only thing that matters.
 */
export function timeLeft(deadline: string, now: number): string {
  const ms = new Date(deadline).getTime() - now;
  if (!Number.isFinite(ms)) return "không rõ hạn";
  if (ms <= 0) return "đã quá hạn";

  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `còn ${totalSeconds} giây`;

  const mins = Math.floor(totalSeconds / 60);
  if (mins < 60) return `còn ${mins} phút`;

  const hours = Math.floor(mins / 60);
  // Under two days, hours are still the useful unit — "còn 1 ngày" hides that it is 47 hours.
  if (hours < 48) return `còn ${hours} giờ`;

  return `còn ${Math.floor(hours / 24)} ngày`;
}

/**
 * What the status strip should say.
 *
 * A countdown on a finished bounty produces a card that contradicts itself — the chip saying
 * "Đã xong" above a strip saying "đã quá hạn", which are both true and together say nothing.
 * Once a bounty is settled the useful fact is the OUTCOME, so the strip switches to it.
 */
export function stripLabel(state: BountyState, status: string, deadline: string, now: number): string {
  if (state !== "closed") return timeLeft(deadline, now);

  switch (status) {
    case "RELEASED":
      return "đã trả tiền cho người làm";
    case "REFUNDED":
      return "đã hoàn tiền cho người đăng";
    case "REFUSED":
      return "trọng tài từ chối chấm";
    case "JUDGED":
      return "đã chấm — chờ người đăng quyết";
    default:
      return "đã kết thúc";
  }
}

/** True while the deadline is close enough that the countdown should feel urgent. */
export function isUrgent(deadline: string, now: number): boolean {
  const ms = new Date(deadline).getTime() - now;
  return ms > 0 && ms < 6 * 60 * 60 * 1000;
}

/**
 * A human-quotable id. A UUID is unreadable aloud and unusable in a chat message; this is
 * what goes on the card, in the page title, and in "anh làm con AIG-3F9C2A nhé".
 *
 * Not a hash — just the first block of the UUID, so it can always be traced back by eye.
 * Collisions are possible in principle and irrelevant in practice at this scale; the full id
 * stays the key everywhere that matters.
 */
export function shortCode(id: string): string {
  const head = id.replace(/-/g, "").slice(0, 6);
  return `AIG-${head.toUpperCase()}`;
}
