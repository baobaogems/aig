// =============================================================================
// /app/api/agent/execute/route.ts — SSE execution endpoint (v2-only)
//
// POST /api/agent/execute
// Body: { sessionId, swapTxHash, merchantWallet, targetUSDC }
// Response: Server-Sent Events stream
//
// Customer's depositForBurn tx on Ethereum Sepolia → server polls Circle Iris
// v2 attestation → admin wallet calls receiveMessage on Arc MessageTransmitter.
//
// SSE events emitted: swap_executing → bridging → confirmed | error
// =============================================================================

import { NextRequest } from "next/server";
import { updateSessionStatus } from "@/lib/agent";
import { pollAttestationV2, receiveMessage } from "@/lib/cctp";
import { awardPoints } from "@/lib/points";

// Vercel route segment config: SSE stream stays open for ~Iris attestation
// (~30-90s Fast) + Arc mint submission. Default streaming timeout is too short
// (~3-5s observed); 60s is the Pro plan ceiling and ample for the fast path.
export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const SEPOLIA_DOMAIN = 0;

export async function POST(req: NextRequest) {
  const { sessionId, swapTxHash, merchantWallet, targetUSDC } = await req.json();

  if (!sessionId || typeof sessionId !== "string") {
    return Response.json({ error: "sessionId required" }, { status: 400 });
  }
  if (!TX_HASH_RE.test(swapTxHash)) {
    return Response.json({ error: "invalid swapTxHash format" }, { status: 400 });
  }
  if (!ADDR_RE.test(merchantWallet)) {
    return Response.json({ error: "invalid merchantWallet address" }, { status: 400 });
  }
  if (typeof targetUSDC !== "number" || targetUSDC <= 0) {
    return Response.json({ error: "targetUSDC must be positive number" }, { status: 400 });
  }

  // ReadableStream + start() keeps the pipeline running inside Vercel's
  // serverless function lifetime (tied to controller.close()). Fire-and-forget
  // after `return new Response()` gets killed by the runtime at ~2-3s.
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let closed = false;
      const emit = async (event: string, data: object) => {
        if (closed) return;
        try {
          controller.enqueue(
            enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };
      try {
        await runPipeline({ sessionId, swapTxHash, merchantWallet, targetUSDC, emit });
      } catch (err) {
        await emit("error", {
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (!closed) {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function runPipeline({
  sessionId,
  swapTxHash,
  merchantWallet,
  targetUSDC,
  emit,
}: {
  sessionId: string;
  swapTxHash: string;
  merchantWallet: string;
  targetUSDC: number;
  emit: (event: string, data: object) => Promise<void>;
}) {
  await updateSessionStatus(sessionId, "SWAP_EXECUTING", "CCTP");
  await emit("swap_executing", { txHash: swapTxHash, source: "eth-sepolia" });

  await updateSessionStatus(sessionId, "BRIDGING");
  await emit("bridging", { mode: "CCTP", source: "eth-sepolia" });

  // Iris v2 returns both raw message + attestation by (sourceDomain, txHash).
  // Fast Transfer attests at "confirmed" level (~30-90s); 180s gives headroom.
  const { message, attestation } = await pollAttestationV2(
    swapTxHash,
    SEPOLIA_DOMAIN,
    180_000,
  );
  const { txHash: arcTxHash } = await receiveMessage(message, attestation);

  await updateSessionStatus(sessionId, "CONFIRMED", "CCTP");
  await emit("confirmed", { txHash: arcTxHash, bridgeMode: "CCTP", backend: "v2" });

  // Award points after CONFIRMED
  // TODO: fetch merchantCreatedAt, isFirstChain, isReferred from DB in Phase 2
  await awardPoints(
    merchantWallet,
    sessionId,
    targetUSDC,
    new Date().toISOString(),
    false,
    false,
  );
}
