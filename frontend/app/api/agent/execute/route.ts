// =============================================================================
// /app/api/agent/execute/route.ts — SSE execution endpoint
//
// POST /api/agent/execute
// Body: { sessionId, swapTxHash, merchantWallet, targetUSDC }
// Response: Server-Sent Events stream
//
// Accepts customer's on-chain swap tx hash, then orchestrates the bridge
// path (CCTP or ADMIN_RELAY) and streams real-time status events.
//
// SSE events emitted: swap_executing → bridging → confirmed | bridge_delayed | error
// =============================================================================

import { NextRequest } from "next/server";
import { updateSessionStatus, type BridgeMode } from "@/lib/agent";
import {
  extractMessageHash,
  extractRawMessage,
  pollAttestation,
  pollAttestationV2,
  receiveMessage,
  V1_BSC_SOURCE,
} from "@/lib/cctp";
import { pollSwapCompleted, adminRelay } from "@/lib/mock-bridge";
import { awardPoints } from "@/lib/points";

// Strangler-fig switch (server-side mirror of NEXT_PUBLIC_BRIDGE_BACKEND).
// v1 = SwapRouter → BSC CCTP/ADMIN_RELAY (legacy). v2 = customer signs CCTP burn
// on Ethereum Sepolia directly; server polls Circle attestation + mints on Arc.
const BRIDGE_BACKEND = process.env.BRIDGE_BACKEND ?? "v1";
const BRIDGE_MODE = (process.env.BRIDGE_MODE as BridgeMode) ?? "CCTP";

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

export async function POST(req: NextRequest) {
  const { sessionId, swapTxHash, merchantWallet, targetUSDC } = await req.json();

  // Input validation — these flow into blockchain calls and DB queries
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

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const emit = async (event: string, data: object) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    // Guard: client may have disconnected (SSE closed) mid-pipeline. Writing to a
    // closed WritableStream throws ERR_INVALID_STATE and crashes the route — swallow it.
    try {
      await writer.write(encoder.encode(payload));
    } catch {
      /* stream already closed by client — stop emitting */
    }
  };

  runPipeline({ sessionId, swapTxHash, merchantWallet, targetUSDC, emit, writer }).catch(
    async (err) => {
      await emit("error", { message: err instanceof Error ? err.message : String(err) });
      try {
        await writer.close();
      } catch {
        /* already closed */
      }
    }
  );

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function runPipeline({
  sessionId,
  swapTxHash,
  merchantWallet,
  targetUSDC,
  emit,
  writer,
}: {
  sessionId: string;
  swapTxHash: string;
  merchantWallet: string;
  targetUSDC: number;
  emit: (event: string, data: object) => Promise<void>;
  writer: WritableStreamDefaultWriter;
}) {
  try {
    // v2 (strangler-fig): customer burned CCTP directly on Ethereum Sepolia.
    // Server polls + mints on Arc, same pattern as v1 CCTP path but Eth Sepolia source.
    if (BRIDGE_BACKEND === "v2") {
      await updateSessionStatus(sessionId, "SWAP_EXECUTING", "CCTP");
      await emit("swap_executing", { txHash: swapTxHash, source: "eth-sepolia" });

      await updateSessionStatus(sessionId, "BRIDGING");
      await emit("bridging", { mode: "CCTP", source: "eth-sepolia" });

      // CCTPv2: Iris v2 returns BOTH raw message + attestation by (sourceDomain, txHash)
      // lookup, so we skip the v1 extractMessage* path entirely. Sepolia source = domain 0.
      // Fast Transfer attests at "confirmed" level (~30-90s); 180s gives headroom.
      const SEPOLIA_DOMAIN = 0;
      const { message: rawMessage, attestation } = await pollAttestationV2(
        swapTxHash,
        SEPOLIA_DOMAIN,
        180_000,
      );
      const { txHash: arcTxHash } = await receiveMessage(rawMessage, attestation);

      await updateSessionStatus(sessionId, "CONFIRMED", "CCTP");
      await emit("confirmed", { txHash: arcTxHash, bridgeMode: "CCTP", backend: "v2" });

      // Fall through to points award (shared with v1 path below)
    } else {

    await updateSessionStatus(sessionId, "SWAP_EXECUTING", BRIDGE_MODE);
    await emit("swap_executing", { txHash: swapTxHash });

    await updateSessionStatus(sessionId, "BRIDGING");
    await emit("bridging", { mode: BRIDGE_MODE });

    if (BRIDGE_MODE === "CCTP") {
      // PRIMARY PATH: BSC burn → Circle attestation → Arc mint (default v1 BSC source)
      const [messageHash, rawMessage] = await Promise.all([
        extractMessageHash(swapTxHash, V1_BSC_SOURCE),
        extractRawMessage(swapTxHash, V1_BSC_SOURCE),
      ]);

      const attestation = await pollAttestation(messageHash, 120_000);
      const { txHash: arcTxHash } = await receiveMessage(rawMessage, attestation);

      await updateSessionStatus(sessionId, "CONFIRMED", "CCTP");
      await emit("confirmed", { txHash: arcTxHash, bridgeMode: "CCTP" });
    } else {
      // FALLBACK PATH: poll BSC SwapCompleted event → admin wallet relay on Arc
      const swapEvent = await pollSwapCompleted(sessionId, swapTxHash);

      if (!swapEvent) {
        await updateSessionStatus(sessionId, "BRIDGE_DELAYED");
        await emit("bridge_delayed", { reason: "SwapCompleted event not found within 30s" });
        return;
      }

      const { txHash: relayTxHash } = await adminRelay(
        merchantWallet,
        swapEvent.netUSDCAmount,
        sessionId
      );

      if (!relayTxHash) {
        // Idempotency guard fired — session already processed
        return;
      }

      await updateSessionStatus(sessionId, "CONFIRMED", "ADMIN_RELAY");
      await emit("confirmed", { txHash: relayTxHash, bridgeMode: "ADMIN_RELAY" });
    }

    } // end v1 branch

    // Award points after CONFIRMED
    // TODO: fetch merchantCreatedAt, isFirstChain, isReferred from DB in Phase 2
    await awardPoints(
      merchantWallet,
      sessionId,
      targetUSDC,
      new Date().toISOString(),
      false,
      false
    );
  } finally {
    await writer.close();
  }
}
