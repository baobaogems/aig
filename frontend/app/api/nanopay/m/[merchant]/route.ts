// =============================================================================
// /app/api/nanopay/m/[merchant]/route.ts — v3.2 multi-merchant x402 endpoint.
//
// payTo is the [merchant] wallet in the URL (not a fixed env seller), so one AIG
// gateway can route nanopayments to many merchants. Each merchant's USDC accrues
// to its own Circle Gateway balance (address-keyed; withdraw with their own key).
// Aggregation (nano_agents) already keys by (buyer, merchant).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withGateway } from "@/lib/nanopay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = async (_req: NextRequest) =>
  NextResponse.json({
    quote: "AIG multi-merchant nanopayment OK — paid the merchant directly on Arc.",
    paidAt: new Date().toISOString(),
  });

export const GET = withGateway(handler, "$0.001", "/api/nanopay/m", {
  resolveSeller: async (_req, ctx) => (await ctx?.params)?.merchant,
});
