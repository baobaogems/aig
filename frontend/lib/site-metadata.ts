// site-metadata.ts — the words a link preview shows (Telegram, X, Slack, search results).
//
// This copy describes the v3 settlement flow (lib/arbiter/run.ts → settle-bounty.ts) and
// must stay true to it: a verdict moves NO money. A plausible verdict only starts a clock;
// payment happens when the poster approves, rejects at a price, or lets the window run out.
// Never write "automatically" here. And no live numbers — a preview is cached for weeks.

export const SITE_NAME = "AIG Arbiter";

/** Canonical origin for absolute og:image URLs. Override per deployment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://myarbiter.xyz";

export const SITE_TITLE = "AIG Arbiter — AI-judged USDC bounties on Arc";

export const SITE_DESCRIPTION =
  "USDC bounties escrowed on Arc testnet. An AI arbiter grades work against a frozen rubric; " +
  "the poster then approves, rejects at a price, or lets the window close and the worker is paid.";

export const ARBITER_TITLE = "Bounty market — AIG Arbiter";

export const ARBITER_DESCRIPTION =
  "Post a USDC bounty or submit work on Arc testnet. Each submission is graded against a frozen " +
  "rubric; the poster has a fixed window to approve or reject at a price before the worker is paid.";

/** Shared alt text for the generated preview image (app/opengraph-image.tsx). */
export const OG_IMAGE_ALT = "AIG Arbiter — AI-judged USDC escrow on Arc testnet";
