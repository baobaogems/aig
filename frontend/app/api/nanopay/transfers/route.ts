// =============================================================================
// GET /api/nanopay/transfers?merchant=0x...
// v3.x: per-call nanopayment list (read-only) for the dashboard card.
//
// Per-call records are NOT in AIG's DB by design — v3.1 stores only the
// aggregate (nano_agents). The individual transfers live in Circle Gateway, so
// we read them via GatewayClient.searchTransfers({ to: merchant }). No schema change.
//
// Note: GatewayClient is constructed with the AIG admin key (server-only). The
// Gateway transfer query returns calls where the seller is the recipient — works
// for the AIG seller wallet; per-merchant lists for other merchants would use
// that merchant's own key (out of scope here).
// =============================================================================

import { NextRequest } from "next/server";
import { GatewayClient } from "@circle-fin/x402-batching/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADDR = /^0x[0-9a-fA-F]{40}$/;

export async function GET(req: NextRequest) {
  const merchant = req.nextUrl.searchParams.get("merchant");
  if (!merchant || !ADDR.test(merchant)) {
    return Response.json({ error: "valid merchant query param required" }, { status: 400 });
  }
  const pk = process.env.AIG_ADMIN_WALLET_PRIVATE_KEY;
  if (!pk) {
    return Response.json({ error: "admin key not configured" }, { status: 500 });
  }

  try {
    const gateway = new GatewayClient({ chain: "arcTestnet", privateKey: pk as `0x${string}` });
    const res = await gateway.searchTransfers({
      to: merchant as `0x${string}`,
      pageSize: 50,
    });
    // Map to a compact per-call shape (amount is USDC atomic units, 6 decimals).
    const transfers = (res.transfers ?? []).map((t) => ({
      id: t.id,
      from: t.fromAddress,
      usdc: Number(t.amount) / 1e6,
      status: t.status,
      at: t.createdAt,
    }));
    return Response.json({ transfers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
