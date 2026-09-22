export type PosterLane = "needs_decision" | "in_progress" | "settled";
export type WorkerLane = "needs_submission" | "waiting" | "results";

export function getPosterLane(status: string): PosterLane | null {
  if (status === "JUDGED") return "needs_decision";
  if (status === "OPEN" || status === "SUBMITTED") return "in_progress";
  if (status === "RELEASED" || status === "REFUNDED" || status === "REFUSED") return "settled";
  return null;
}

export function getWorkerLane(status: string, hasWorkerId: boolean): WorkerLane | null {
  if (status === "OPEN") return hasWorkerId ? "needs_submission" : null;
  if (status === "SUBMITTED" || status === "JUDGED") return "waiting";
  if (status === "RELEASED" || status === "REFUNDED" || status === "REFUSED") return "results";
  return null;
}
