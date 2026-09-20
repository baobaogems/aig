// =============================================================================
// submission-window.ts — may this worker hand in (another) attempt right now?
//
// The product promise is that a worker learns exactly what was wrong and fixes it. That is
// only true if a failing verdict is the START of a loop, not the end of the road — before
// this, a FAIL left the bounty in JUDGED and /api/submission refused anything but OPEN, so
// the feedback had nowhere to go.
//
// Pure, and shared by the API route and the panel on purpose: a rule about who may act,
// written twice, becomes two rules that disagree — the UI offering a form the server then
// rejects, or worse, hiding one the server would have accepted.
// =============================================================================

/** The decisions that end the bounty for the worker. */
const PAID_OR_CLOSED = new Set(["RELEASED", "REFUNDED"]);

/** Verdicts that leave the door open for a better attempt. */
const RETRYABLE_DECISIONS = new Set(["FAIL", "REFUSE"]);

export interface SubmissionWindow {
  /** Whether a submission is accepted right now. */
  allowed: boolean;
  /** True when this would be a second (or later) attempt — the UI says so. */
  isRetry: boolean;
  /** Why not, in the language the user reads. Empty when allowed. */
  reason: string;
}

export function submissionWindow(input: {
  status: string;
  /** Decision on the most recent submission, if it has been judged. */
  lastDecision?: string | null;
  deadline: string;
  now: number;
}): SubmissionWindow {
  const { status, lastDecision, deadline, now } = input;

  if (PAID_OR_CLOSED.has(status)) {
    return { allowed: false, isRetry: false, reason: "Việc này đã kết thúc." };
  }

  if (new Date(deadline).getTime() <= now) {
    // Checked before the retry rules: past the deadline nothing is accepted, however the last
    // attempt went. The contract takes the same view — it refuses a claim past the deadline.
    return { allowed: false, isRetry: false, reason: "Đã quá hạn nộp bài." };
  }

  // First attempt: the bounty is open and nobody has handed anything in.
  if (status === "OPEN") {
    return { allowed: true, isRetry: false, reason: "" };
  }

  if (status === "SUBMITTED") {
    return {
      allowed: false,
      isRetry: true,
      reason: "Bài vừa nộp đang được chấm. Chờ kết quả rồi sửa nếu cần.",
    };
  }

  // Judged. Whether another attempt is allowed depends on WHAT the arbiter decided.
  if (lastDecision && RETRYABLE_DECISIONS.has(lastDecision)) {
    return { allowed: true, isRetry: true, reason: "" };
  }

  if (lastDecision === "ESCALATE") {
    // The arbiter handed the call to the poster. A new submission here would land mid-decision
    // and invalidate the verdict the poster is looking at, so it waits.
    return {
      allowed: false,
      isRetry: true,
      reason: "Người đăng đang xem xét bài này. Chờ họ quyết rồi mới nộp lại được.",
    };
  }

  return { allowed: false, isRetry: true, reason: "Việc này không nhận thêm bài nộp." };
}
