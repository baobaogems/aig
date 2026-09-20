// =============================================================================
// bounty-view.ts — who is allowed to read what on a bounty.
//
// The record is public: anyone may audit what the arbiter decided, on what criteria, and
// whether the poster overruled it. The DELIVERABLE is not: it is one person's work, and the
// two parties are the only ones with a claim on reading it.
//
// This rule lives here, alone, because it is enforced in two places — the API route and the
// detail page — and a rule written twice is a rule that will eventually be enforced once.
// =============================================================================

import "server-only";
import { sameAddress } from "../auth/require-role";
import type { BountyDetail } from "./store";

export interface ViewerScopedDetail {
  detail: BountyDetail;
  /** True when the viewer is the poster or the worker on this bounty. */
  isParty: boolean;
}

/**
 * Return the detail as `viewer` is entitled to see it. Non-parties get the full public record
 * with the deliverable blanked — not removed, so the UI can still say "there is a submission
 * you cannot read" rather than "there is no submission".
 */
export function scopeDetailToViewer(
  detail: BountyDetail,
  viewer: string | null,
): ViewerScopedDetail {
  const isParty =
    sameAddress(detail.bounty.poster_id, viewer) || sameAddress(detail.bounty.worker_id, viewer);

  if (isParty || !detail.submission) return { detail, isParty };

  return {
    detail: { ...detail, submission: { ...detail.submission, content_snapshot: "" } },
    isParty,
  };
}
