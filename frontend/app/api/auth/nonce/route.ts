// /app/api/auth/nonce/route.ts — hand out a single-use SIWE challenge.
//
// GET → { nonce, domain, chainId, issuedAt }
// The client signs a message built from exactly these fields; the server rebuilds the same
// message on verify, so the client never gets to choose what it is signing.

import { NextRequest } from "next/server";
import { issueNonce } from "@/lib/auth/siwe-session";
import { expectedChainId, expectedDomain } from "@/lib/auth/siwe-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const nonce = await issueNonce();
    return Response.json({
      nonce,
      domain: expectedDomain(req),
      chainId: expectedChainId(),
      issuedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API /auth/nonce]:", err);
    return Response.json({ error: "không tạo được phiên ký" }, { status: 500 });
  }
}
