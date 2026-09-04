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
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-light)]">
          <p className="text-sm text-[var(--color-ink-muted)]">Loading payment…</p>
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
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-light)] p-4">
        <p className="text-sm text-[var(--color-ink-muted)]">Invalid payment link.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface-light)] p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-ink)]">
            Pay with USDC
          </h1>
          <p className="tnum mt-1 text-sm text-[var(--color-ink-muted)]">
            ${targetUSDC.toFixed(2)} USDC → merchant on Arc
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            via Ethereum Sepolia → CCTP → Arc
          </p>
        </div>

        {!isConnected && (
          <button
            onClick={() => connect({ connector: injected() })}
            className="w-full rounded-[var(--radius-pill)] bg-[var(--color-surface-dark)] px-4 py-3 font-semibold text-[var(--color-on-dark)] transition-transform hover:-translate-y-0.5"
          >
            Connect Wallet
          </button>
        )}

        {isConnected && (
          <p className="text-center font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-muted)]">
            Connected: {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
        )}

        {isConnected && step === "idle" && (
          <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-border-light)] bg-white p-5">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-ink-muted)]">You pay</span>
              <span className="tnum font-medium text-[var(--color-ink)]">
                {targetUSDC.toFixed(2)} USDC
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-ink-muted)]">Merchant receives</span>
              <span className="tnum font-medium text-[var(--color-ink)]">
                {targetUSDC.toFixed(2)} USDC
              </span>
            </div>
            <p className="pt-1 text-xs text-[var(--color-ink-muted)]">
              Two signatures: approve USDC + bridge to Arc. ~30–60s for attestation.
            </p>
            {/* The only red on this page: paying is the primary action. */}
            <button
              onClick={handlePay}
              className="w-full rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-accent-bright)]"
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
