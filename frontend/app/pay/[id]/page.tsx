"use client";

// =============================================================================
// /pay/[id]/page.tsx — Customer payment page (v2-only).
//
// Renders PaymentPageV2: customer signs USDC.approve + TokenMessengerV2
// .depositForBurn on Ethereum Sepolia; server polls Circle Iris v2 attestation
// and mints USDC to merchant on Arc via admin wallet (see /api/agent/execute).
// =============================================================================

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { usePaymentFlowV2 } from "@/lib/payment-flow-v2";
import { PaymentProgressBar } from "@/components/payment-progress-bar";

export default function PaymentPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading payment...</p>
        </main>
      }
    >
      <PaymentPage />
    </Suspense>
  );
}

function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const merchantWallet = (searchParams.get("merchant") ?? "") as `0x${string}` | "";
  const targetUSDC = parseFloat(searchParams.get("amount") ?? "0");

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { step, burnTxHash, receipt, errorMessage, handlePay } =
    usePaymentFlowV2({ sessionId, merchantWallet, targetUSDC });

  if (!merchantWallet || !targetUSDC) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500 text-sm">Invalid payment link.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Pay with USDC</h1>
          <p className="text-gray-500 text-sm mt-1">
            ${targetUSDC.toFixed(2)} USDC → merchant on Arc
          </p>
          <p className="text-gray-400 text-xs mt-1">
            via Ethereum Sepolia → CCTP → Arc
          </p>
        </div>

        {!isConnected && (
          <button
            onClick={() => connect({ connector: injected() })}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Connect Wallet
          </button>
        )}

        {isConnected && (
          <p className="text-xs text-center text-gray-400">
            Connected: {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
        )}

        {isConnected && step === "idle" && (
          <div className="bg-white rounded-xl p-4 space-y-3 border border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">You pay</span>
              <span className="font-medium text-gray-900">
                {targetUSDC.toFixed(2)} USDC
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Merchant receives</span>
              <span className="font-medium text-gray-900">
                {targetUSDC.toFixed(2)} USDC
              </span>
            </div>
            <p className="text-xs text-gray-400 pt-1">
              Two signatures: approve USDC + bridge to Arc. ~30–60s for attestation.
            </p>
            <button
              onClick={handlePay}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Pay ${targetUSDC.toFixed(2)}
            </button>
          </div>
        )}

        {step !== "idle" && (
          <PaymentProgressBar
            step={step}
            receipt={receipt}
            errorMessage={errorMessage}
            swapTxHash={burnTxHash}
          />
        )}
      </div>
    </main>
  );
}
