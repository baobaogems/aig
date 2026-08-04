// =============================================================================
// points.ts — Points DB helpers (Supabase off-chain, Phase 1)
//
// PRD F-030: Points tracked off-chain in Supabase.
// No soulbound smart contract in Phase 1.
// Migration to on-chain token is a Phase 2 task.
// =============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Multiplier reasons (match PRD F-030)
type MultiplierReason = "early_bird" | "new_chain" | "referral";

// Tier thresholds (PRD F-032)
const TIER_THRESHOLDS = {
  Builder: 0,
  Architect: 500,
  Sovereign: 5000,
} as const;

type Tier = keyof typeof TIER_THRESHOLDS;

// -------------------------------------------------------------------------
// awardPoints
//
// Called from /api/agent/route.ts after session reaches CONFIRMED state.
// Multipliers are additive (not compounding). Max effective: 3.7x.
// -------------------------------------------------------------------------
export async function awardPoints(
  wallet: string,
  sessionId: string,
  usdVolume: number, // raw USD amount of the payment
  merchantCreatedAt: string, // ISO timestamp — determines early_bird eligibility
  isFirstChain: boolean, // first payment from this source chain for merchant
  isReferred: boolean, // merchant was referred within 90-day window
  referralCreatedAt?: string // when referral was established
): Promise<void> {
  const supabase = getSupabaseClient();

  // Calculate effective multiplier (additive, PRD F-030)
  let multiplier = 1.0;
  const reasons: MultiplierReason[] = [];

  // 2x for merchant's first 30 days
  const daysSinceCreation =
    (Date.now() - new Date(merchantCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation <= 30) {
    multiplier += 1.0; // +1.0 → total 2.0x
    reasons.push("early_bird");
  }

  // 1.5x for first payment from a new source chain
  if (isFirstChain) {
    multiplier += 0.5; // +0.5
    reasons.push("new_chain");
  }

  // 1.2x for referred merchant within 90-day window
  if (isReferred && referralCreatedAt) {
    const daysSinceReferral =
      (Date.now() - new Date(referralCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReferral <= 90) {
      multiplier += 0.2; // +0.2
      reasons.push("referral");
    }
  }

  const pointsEarned = usdVolume * multiplier;

  await supabase.from("points_ledger").insert({
    wallet,
    session_id: sessionId,
    usd_volume: usdVolume,
    points_earned: pointsEarned,
    multiplier,
    multiplier_reason: reasons.join(","),
  });
}

// -------------------------------------------------------------------------
// awardBountyPoints — AIG v4 (PRD F5): worker completed an arbiter-judged bounty.
//
// Reuses points_ledger with multiplier_reason='bounty_completed' (no schema change,
// per migration 006 header). session_id carries the bounty id so every award is
// traceable to one bounty. Flat rate: 50 points per escrowed USDC — kept simple and
// documented rather than tuned (YAGNI until the pilot says otherwise).
// Callers only invoke this AFTER a real on-chain release (release_tx present);
// dry-run verdicts never award points.
// -------------------------------------------------------------------------
const BOUNTY_POINTS_PER_USDC = 50;

export async function awardBountyPoints(
  wallet: string,
  bountyId: string,
  amountUsdc: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("points_ledger").insert({
    wallet,
    session_id: bountyId,
    usd_volume: amountUsdc,
    points_earned: amountUsdc * BOUNTY_POINTS_PER_USDC,
    multiplier: BOUNTY_POINTS_PER_USDC,
    multiplier_reason: "bounty_completed",
  });
  if (error) throw new Error(`awardBountyPoints failed: ${error.message}`);
}

// -------------------------------------------------------------------------
// getPointsBalance
//
// Returns total points and current tier for a wallet.
// Reads from points_balance materialized view (PRD F-030 schema).
// -------------------------------------------------------------------------
export async function getPointsBalance(
  wallet: string
): Promise<{ totalPoints: number; tier: Tier; lastActivity: string | null }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("points_balance")
    .select("total_points, tier, last_activity")
    .eq("wallet", wallet)
    .single();

  if (error || !data) {
    return { totalPoints: 0, tier: "Builder", lastActivity: null };
  }

  return {
    totalPoints: data.total_points,
    tier: data.tier as Tier,
    lastActivity: data.last_activity,
  };
}

// -------------------------------------------------------------------------
// computeTier — pure utility, no DB call
// -------------------------------------------------------------------------
export function computeTier(totalPoints: number): Tier {
  if (totalPoints >= TIER_THRESHOLDS.Sovereign) return "Sovereign";
  if (totalPoints >= TIER_THRESHOLDS.Architect) return "Architect";
  return "Builder";
}

// Singleton Supabase client
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars not set");
    _supabase = createClient(url, key);
  }
  return _supabase;
}
