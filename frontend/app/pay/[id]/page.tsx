"use client";

// =============================================================================
// /app/pay/[id]/page.tsx — Customer Payment Page (Mobile-First)
// PRD F-020: fee breakdown, wallet connect, swap, SSE progress, receipt
//
// Flow:
//   1. Load session params (merchant wallet + target USDC) from URL / Supabase
//   2. POST /api/agent/quote → show FeeBreakdownCard
//   3. Customer connects wallet + clicks Pay
//   4. writeContract SwapRouter.swapAndBridge()
//   5. POST /api/agent/execute → read SSE stream → update PaymentProgressBar
//   6. On "confirmed" → show receipt
// =============================================================================

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAccount, useConnect, useWriteContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { FeeBreakdownCard } from "@/components/fee-breakdown-card";
import { PaymentProgressBar, type PaymentStep } from "@/components/payment-progress-bar";
import { usePaymentFlowV2 } from "@/lib/payment-flow-v2";

// Strangler-fig: v1 keeps the SwapRouter writeContract path; v2 burns CCTP
// directly on Ethereum Sepolia (see frontend/lib/payment-flow-v2.ts + ADR
// plans/reports/adr-260525-2333-drop-app-kit-sdk-use-bridge-contract-directly.md).
const BRIDGE_BACKEND = process.env.NEXT_PUBLIC_BRIDGE_BACKEND ?? "v1";

// Minimal SwapRouter ABI — swapAndBridge only
const SWAP_ROUTER_ABI = [
  {
    name: "swapAndBridge",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "grossUSDCRequired", type: "uint256" },
      { name: "aigServiceFee", type: "uint256" },
      { name: "amountInMaximum", type: "uint256" },
      { name: "poolFee", type: "uint24" },
      { name: "merchantWallet", type: "bytes32" },
      { name: "merchantWalletAddr", type: "address" },
    ],
    outputs: [],
  },
] as const;

interface QuoteResponse {
  amountInMaximumWei: string;
  grossUSDCRequired: string;
  aigServiceFee: string;
  netUSDCToMerchant: string;
  poolFee: number;
  spotPriceUSDCPerBNB: number;
}

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading payment...</p>
      </main>
    }>
      {BRIDGE_BACKEND === "v2" ? <PaymentPageV2 /> : <PaymentPage />}
    </Suspense>
  );
}

function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;

  // Merchant info from QR query params (fallback: parse from URL)
  const merchantWallet = searchParams.get("merchant") ?? "";
  const targetUSDC = parseFloat(searchParams.get("amount") ?? "0");

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { writeContractAsync } = useWriteContract();

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [step, setStep] = useState<PaymentStep>("idle");
  const [swapTxHash, setSwapTxHash] = useState<string | undefined>();
  const [receipt, setReceipt] = useState<{ txHash: string; bridgeMode: string } | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Fetch quote on load
  useEffect(() => {
    if (!sessionId || !targetUSDC || !merchantWallet) return;

    fetch("/api/agent/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        merchantWallet,
        targetUSDC,
        customerWallet: address ?? "",
        sourceChain: "bsc-testnet",
        sourceToken: "BNB",
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setQuoteError(data.error);
        else setQuote(data);
      })
      .catch((e) => setQuoteError(e.message));
  }, [sessionId, targetUSDC, merchantWallet, address]);

  // Read SSE stream from POST /api/agent/execute
  const readExecuteStream = useCallback(
    async (txHash: string) => {
      const response = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, swapTxHash: txHash, merchantWallet, targetUSDC }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const eventLine = chunk.match(/event: (\w+)/);
          const dataLine = chunk.match(/data: (.+)/);
          if (!eventLine || !dataLine) continue;

          const event = eventLine[1] as PaymentStep;
          const data = JSON.parse(dataLine[1]);

          setStep(event);
          if (event === "confirmed") setReceipt(data);
          if (event === "error") setErrorMessage(data.message);
        }
      }
    },
    [sessionId, merchantWallet, targetUSDC]
  );

  const handlePay = useCallback(async () => {
    if (!quote || !merchantWallet) return;
    setStep("swap_executing");

    try {
      // Encode sessionId as bytes32 (hex-pad the string)
      const sessionIdBytes32 = `0x${sessionId.padStart(64, "0")}` as `0x${string}`;
      // Encode merchantWallet as bytes32 (left-pad address)
      const merchantBytes32 =
        `0x${"0".repeat(24)}${merchantWallet.slice(2)}` as `0x${string}`;

      const txHash = await writeContractAsync({
        address: process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC as `0x${string}`,
        abi: SWAP_ROUTER_ABI,
        functionName: "swapAndBridge",
        args: [
          sessionIdBytes32,
          BigInt(quote.grossUSDCRequired),
          BigInt(quote.aigServiceFee),
          BigInt(quote.amountInMaximumWei),
          quote.poolFee,
          merchantBytes32,
          merchantWallet as `0x${string}`,
        ],
        value: BigInt(quote.amountInMaximumWei), // send BNB — contract wraps to WBNB
      });

      setSwapTxHash(txHash);
      await readExecuteStream(txHash);
    } catch (e) {
      setStep("error");
      setErrorMessage(e instanceof Error ? e.message : "Transaction failed");
    }
  }, [quote, merchantWallet, sessionId, writeContractAsync, readExecuteStream]);

  // Missing params guard
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
          <h1 className="text-2xl font-bold text-gray-900">Pay with BNB</h1>
          <p className="text-gray-500 text-sm mt-1">
            ${targetUSDC.toFixed(2)} USDC to merchant
          </p>
        </div>

        {/* Wallet connect */}
        {!isConnected && (
          <button
            onClick={() => connect({ connector: injected() })}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Connect Wallet
          </button>
        )}

        {/* BSC Testnet add button */}
        {isConnected && (
          <p className="text-xs text-center text-gray-400">
            Connected: {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
        )}

        {/* Quote / fee breakdown */}
        {quoteError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{quoteError}</p>
        )}

        {quote && step === "idle" && isConnected && (
          <FeeBreakdownCard
            grossUSDCRequired={quote.grossUSDCRequired}
            aigServiceFee={quote.aigServiceFee}
            netUSDCToMerchant={quote.netUSDCToMerchant}
            amountInMaximumWei={quote.amountInMaximumWei}
            spotPriceUSDCPerBNB={quote.spotPriceUSDCPerBNB}
            targetUSDC={targetUSDC}
            onPay={handlePay}
            isPaying={false}
          />
        )}

        {/* Progress / receipt */}
        {step !== "idle" && (
          <PaymentProgressBar
            step={step}
            receipt={receipt}
            errorMessage={errorMessage}
            swapTxHash={swapTxHash}
          />
        )}
      </div>
    </main>
  );
}

// ===========================================================================
// v2 payment page — Customer pays USDC on Ethereum Sepolia (no swap, no
// SwapRouter). Two signatures: approve + depositForBurn. Server polls Circle
// attestation + mints on Arc (same /api/agent/execute, BRIDGE_BACKEND=v2 path).
// ===========================================================================
function PaymentPageV2() {
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
          <p className="text-gray-400 text-xs mt-1">via Ethereum Sepolia → CCTP → Arc</p>
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
              <span className="font-medium text-gray-900">{targetUSDC.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Merchant receives</span>
              <span className="font-medium text-gray-900">{targetUSDC.toFixed(2)} USDC</span>
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
