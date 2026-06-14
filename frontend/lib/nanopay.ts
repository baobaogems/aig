// =============================================================================
// nanopay.ts — AIG v3 Phase 1: x402 nanopayment receive (Circle Gateway).
//
// SEPARATE from the v2.2 CCTP flow. v2.2 (payment-flow-v2.ts / cctp.ts) is
// FROZEN and untouched — this is a second, independent payment source: an
// autonomous agent pays a sub-cent USDC nanopayment on Arc via the x402
// protocol + Circle Gateway batched settlement.
//
// Phase 1 = "minimal receive": verify + settle one agent payment and LOG it.
// NO Supabase write, NO points yet (those are Phase 2/3, gated).
//
// API per @circle-fin/x402-batching v3.0.4 (taken from SDK + starter kit
// github.com/circlefin/arc-nanopayments, not assumed).
// File <200 lines per project rule.
// =============================================================================

import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "./agent";
import { awardPoints } from "./points";

// Arc Testnet constants (match @circle-fin/x402-batching SDK + AIG env).
const ARC_TESTNET_NETWORK = "eip155:5042002"; // CAIP-2 (= ARC_CHAIN_ID 5042002)
const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";
// Gateway Wallet contract = EIP-712 verifyingContract for batched payments.
const ARC_TESTNET_GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

// Seller = AIG admin wallet (reused as Gateway seller for the demo, per plan).
const sellerAddress = process.env.NANOPAY_SELLER_ADDRESS as `0x${string}`;

// BatchFacilitatorClient defaults to MAINNET — pin testnet explicitly.
const facilitator = new BatchFacilitatorClient({
  url:
    process.env.CIRCLE_GATEWAY_FACILITATOR_URL ??
    "https://gateway-api-testnet.circle.com",
});

interface PaymentPayload {
  x402Version: number;
  resource?: { url: string; description: string; mimeType: string };
  accepted?: Record<string, unknown>;
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

// Build x402 payment requirements for a given dollar price.
function buildPaymentRequirements(price: string) {
  // dollars -> USDC atomic units (6 decimals)
  const amount = Math.round(parseFloat(price.replace("$", "")) * 1_000_000);
  return {
    scheme: "exact" as const,
    network: ARC_TESTNET_NETWORK,
    asset: ARC_TESTNET_USDC,
    amount: amount.toString(),
    payTo: sellerAddress,
    maxTimeoutSeconds: 345600,
    extra: {
      name: "GatewayWalletBatched",
      version: "1",
      verifyingContract: ARC_TESTNET_GATEWAY_WALLET,
    },
  };
}

// Wrap a Next.js App Router GET handler with Gateway x402 verification.
// Unpaid -> 402 + PAYMENT-REQUIRED. Paid -> verify + settle, then run handler.
export function withGateway(
  handler: (req: NextRequest) => Promise<NextResponse>,
  price: string,
  endpoint: string,
) {
  const requirements = buildPaymentRequirements(price);

  return async (req: NextRequest) => {
    if (!sellerAddress) {
      return NextResponse.json(
        { error: "NANOPAY_SELLER_ADDRESS not set" },
        { status: 500 },
      );
    }

    const paymentSignature = req.headers.get("payment-signature");

    // No payment -> 402 with batched payment requirements.
    if (!paymentSignature) {
      console.log(`[nanopay] 402 Payment Required: ${endpoint}`);
      const paymentRequired = {
        x402Version: 2,
        resource: {
          url: endpoint,
          description: `AIG paid resource (${price} USDC)`,
          mimeType: "application/json",
        },
        accepts: [requirements],
      };
      return new NextResponse(JSON.stringify({}), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "PAYMENT-REQUIRED": Buffer.from(
            JSON.stringify(paymentRequired),
          ).toString("base64"),
        },
      });
    }

    // Payment present -> verify + settle via Circle Gateway.
    try {
      const paymentPayload: PaymentPayload = JSON.parse(
        Buffer.from(paymentSignature, "base64").toString("utf-8"),
      );

      const verifyResult = await facilitator.verify(
        paymentPayload,
        requirements,
      );
      if (!verifyResult.isValid) {
        return NextResponse.json(
          { error: "verification failed", reason: verifyResult.invalidReason },
          { status: 402 },
        );
      }

      const settleResult = await facilitator.settle(
        paymentPayload,
        requirements,
      );
      if (!settleResult.success) {
        console.error(
          `[nanopay] settle failed ${endpoint}: ${settleResult.errorReason}`,
        );
        return NextResponse.json(
          { error: "settlement failed", reason: settleResult.errorReason },
          { status: 402 },
        );
      }

      const amountUsdc = (Number(requirements.amount) / 1e6).toString();
      const payer = settleResult.payer ?? verifyResult.payer ?? "unknown";
      console.log(
        `[nanopay] SETTLED ${endpoint} — ${amountUsdc} USDC from ${payer} | tx=${settleResult.transaction}`,
      );

      // v3.1: aggregate, do NOT write a per-call row. nano_record() atomically
      // upserts the (agent, merchant) rolling row (call_count++, total_usdc+=)
      // and flushes points only once unawarded volume reaches $0.01 — kills row
      // flooding and micro-spam point farming. Best-effort: a DB error must not
      // fail an already-settled on-chain payment.
      try {
        const sessionId = settleResult.transaction ?? `nano-${Date.now()}`;
        const { data, error } = await getSupabaseClient().rpc("nano_record", {
          p_buyer: payer.toLowerCase(),
          p_merchant: sellerAddress.toLowerCase(),
          p_amount: Number(amountUsdc),
        });
        if (error) throw error;

        // Flush batched points to the seller via the v2.2 points pipeline when
        // nano_record signals a positive delta (flat 1 point per $1 volume).
        const row = Array.isArray(data) ? data[0] : data;
        const pointsDelta = Number(row?.points_delta ?? 0);
        if (pointsDelta > 0) {
          await awardPoints(
            sellerAddress.toLowerCase(),
            sessionId,
            pointsDelta,
            "2020-01-01T00:00:00.000Z",
            false,
            false,
          );
        }
      } catch (dbErr) {
        console.error(
          `[nanopay] session record failed (payment OK): ${dbErr instanceof Error ? dbErr.message : dbErr}`,
        );
      }

      const response = await handler(req);
      response.headers.set(
        "PAYMENT-RESPONSE",
        Buffer.from(
          JSON.stringify({
            success: true,
            transaction: settleResult.transaction,
            network: requirements.network,
            payer,
          }),
        ).toString("base64"),
      );
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[nanopay] processing error: ${message}`);
      return NextResponse.json(
        { error: "payment processing error", message },
        { status: 500 },
      );
    }
  };
}
