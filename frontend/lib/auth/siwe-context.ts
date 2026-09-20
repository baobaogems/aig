// siwe-context.ts — what the server considers "this site" and "this chain".
//
// Split out of siwe-session.ts because both the nonce route and the verify route need it,
// and neither should re-derive it differently. A mismatch between the two would either
// reject every honest login or accept a signature meant for another site.

import "server-only";
import type { NextRequest } from "next/server";

/**
 * The host the user is actually on. Vercel terminates TLS at the edge, so `x-forwarded-host`
 * is the truthful one; `host` is the fallback for local dev.
 * Port is kept (localhost:3000 must sign as localhost:3000) but any scheme is stripped.
 */
export function expectedDomain(req: NextRequest): string {
  const raw = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return raw.replace(/^https?:\/\//, "").trim();
}

/** Arc testnet. `||` not `??` so an env var set to "" falls through instead of yielding NaN. */
export function expectedChainId(): number {
  const raw = process.env.NEXT_PUBLIC_ARC_CHAIN_ID || process.env.ARC_CHAIN_ID || "";
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("ARC_CHAIN_ID / NEXT_PUBLIC_ARC_CHAIN_ID not set");
  }
  return id;
}
