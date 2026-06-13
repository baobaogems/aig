// =============================================================================
// /app/api/nanopay/quote/route.ts — AIG v3 Phase 1 x402-protected endpoint.
//
// An agent must pay $0.001 USDC (Circle Gateway nanopayment on Arc) to GET the
// resource. Unpaid -> 402; paid -> verified+settled, then the JSON below.
// Single static resource for P1 (minimal receive); generalize to [resource]
// later if needed. v2.2 CCTP flow is untouched.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withGateway } from "@/lib/nanopay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = async (_req: NextRequest) => {
  return NextResponse.json({
    quote: "AIG nanopayment OK — agent paid sub-cent USDC on Arc.",
    paidAt: new Date().toISOString(),
  });
};

export const GET = withGateway(handler, "$0.001", "/api/nanopay/quote");
