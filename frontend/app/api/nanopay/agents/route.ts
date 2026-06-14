// =============================================================================
// GET /api/nanopay/agents?merchant=0x...
// v3.1: returns the aggregated nano_agents rows for a merchant (one rolling row
// per paying agent). Powers the dashboard "Agent Nanopayments" card. Read-only.
// =============================================================================

import { NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const merchant = req.nextUrl.searchParams.get("merchant");
  if (!merchant) {
    return Response.json({ error: "merchant query param required" }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseClient()
      .from("nano_agents")
      .select("buyer, call_count, total_usdc, points_awarded, last_at")
      .eq("merchant", merchant.toLowerCase())
      .order("total_usdc", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const agents = data ?? [];
    const totals = agents.reduce(
      (acc, a) => ({
        calls: acc.calls + Number(a.call_count ?? 0),
        usdc: acc.usdc + Number(a.total_usdc ?? 0),
      }),
      { calls: 0, usdc: 0 },
    );
    return Response.json({ agents, totals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
