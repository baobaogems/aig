// =============================================================================
// agent.ts — Supabase session helpers (v2-only)
//
// Imported by: /app/api/agent/execute/route.ts
// =============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------
export type BridgeMode = "CCTP" | "ADMIN_RELAY";

export type SessionStatus =
  | "PENDING"
  | "SWAP_EXECUTING"
  | "BRIDGING"
  | "CONFIRMED"
  | "EXPIRED"
  | "REFUNDED"
  | "BRIDGE_DELAYED";

// -------------------------------------------------------------------------
// Update payment session status in Supabase
// -------------------------------------------------------------------------
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  bridgeMode?: BridgeMode,
): Promise<void> {
  const supabase = getSupabaseClient();
  const update: Record<string, unknown> = { status };
  if (bridgeMode) update.bridge_mode = bridgeMode;

  const { error } = await supabase
    .from("payment_sessions")
    .upsert({ session_id: sessionId, ...update }, { onConflict: "session_id" });

  if (error) throw new Error(`updateSessionStatus failed: ${error.message}`);
}

// -------------------------------------------------------------------------
// Internal Supabase client (singleton)
// -------------------------------------------------------------------------
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars not set");
    _supabase = createClient(url, key);
  }
  return _supabase;
}
