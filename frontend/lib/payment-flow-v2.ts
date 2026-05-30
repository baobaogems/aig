"use client";

// =============================================================================
// payment-flow-v2.ts — Client-side v2 payment flow hook.
//
// Phase 03 of AIG v2 (App Kit pivot, after ADR). Customer pays USDC on
// Ethereum Sepolia → CCTP burn → server polls attestation + mints on Arc.
// Two on-chain signatures (approve + depositForBurn) then a POST to the
// existing /api/agent/execute route which reuses cctp.ts polling logic.
//
// File ≤200 lines per project rule. Keeps page.tsx thin via a single hook.
// =============================================================================

import { useCallback, useState } from "react";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { pad, parseGwei, parseUnits } from "viem";
import { ERC20_APPROVE_ABI, CCTP_TOKEN_MESSENGER_ABI } from "./cctp-abi";
import type { PaymentStep } from "@/components/payment-progress-bar";

// Same env reads bundled to client because NEXT_PUBLIC_ prefix. No secrets.
const SOURCE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_SOURCE_CHAIN_ID ?? 11155111);
const USDC = (process.env.NEXT_PUBLIC_USDC_ADDRESS_SOURCE ?? "") as `0x${string}`;
const TOKEN_MESSENGER = (process.env.NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_SOURCE ?? "") as `0x${string}`;
const ARC_DOMAIN = Number(process.env.NEXT_PUBLIC_ARC_CCTP_DOMAIN ?? 26);

// USDC has 6 decimals on every CCTP chain.
const USDC_DECIMALS = 6;

// EIP-1559 fee overrides — MetaMask's Sepolia gas oracle (Infura) occasionally
// returns absurdly high `maxFeePerGas` during low-activity windows, which makes
// MM flash "Insufficient funds for network fees" even when the wallet has
// plenty of ETH. Pinning fee fields forces MM to use these values directly.
// Sepolia base fee is typically 1-3 gwei; 50 gwei ceiling = ~100x headroom but
// still ~0.005 ETH worst-case per tx. Priority fee 2 gwei = standard tip.
const MAX_FEE_PER_GAS = parseGwei("50");
const MAX_PRIORITY_FEE_PER_GAS = parseGwei("2");

// CCTPv2 depositForBurn extra args (vs v1's 4):
// - destinationCaller = bytes32(0): anyone (our admin relay) can call receiveMessage on Arc
// - minFinalityThreshold = 1000: Fast Transfer — Circle attests at the "confirmed" level
//   (~30-90s) instead of waiting ~15min for Sepolia hard finality (2000 = Standard).
// - maxFee (per-tx, derived from amount in handlePay): MUST be > 0 to qualify as Fast,
//   else Circle downgrades to Standard. Circle's actual Sepolia->Arc rate is ~1bps; this
//   is the ceiling we're willing to pay, not the charged amount.
const DESTINATION_CALLER_ANY = `0x${"00".repeat(32)}` as `0x${string}`;
const MIN_FINALITY_THRESHOLD = 1000;

export interface PaymentFlowV2Args {
  sessionId: string;
  merchantWallet: `0x${string}` | "";
  targetUSDC: number;
}

export interface PaymentFlowV2State {
  step: PaymentStep;
  burnTxHash?: string;
  receipt?: { txHash: string; bridgeMode: string };
  errorMessage?: string;
  handlePay: () => Promise<void>;
}

export function usePaymentFlowV2(args: PaymentFlowV2Args): PaymentFlowV2State {
  const { sessionId, merchantWallet, targetUSDC } = args;
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<PaymentStep>("idle");
  const [burnTxHash, setBurnTxHash] = useState<string | undefined>();
  const [receipt, setReceipt] = useState<{ txHash: string; bridgeMode: string } | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const readExecuteStream = useCallback(
    async (txHash: string) => {
      const response = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          swapTxHash: txHash, // execute route reuses this field name across v1/v2
          merchantWallet,
          targetUSDC,
        }),
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
    [sessionId, merchantWallet, targetUSDC],
  );

  const handlePay = useCallback(async () => {
    if (!merchantWallet || !targetUSDC) return;

    try {
      // Pre-flight: ensure customer is on source chain (Sepolia)
      if (chain?.id !== SOURCE_CHAIN_ID) {
        await switchChainAsync({ chainId: SOURCE_CHAIN_ID });
      }

      const amountWei = parseUnits(targetUSDC.toFixed(USDC_DECIMALS), USDC_DECIMALS);
      const mintRecipient = pad(merchantWallet, { size: 32 }) as `0x${string}`;
      // Fast Transfer fee ceiling: 0.1% of amount (actual charge ~0.01%/1bps). Must be
      // > 0 or Circle downgrades to Standard (~15min finality). Floor 1 unit for dust.
      const maxFee = amountWei / 1000n || 1n;

      // Step 1: approve TokenMessenger to spend the customer's USDC.
      // chainId pinned so wagmi estimates against the right chain.
      // gas + fee overrides bypass MetaMask's Sepolia gas oracle, which
      // returns absurd estimates and triggers a misleading "Insufficient
      // funds for network fees" UI even with a fully funded wallet.
      // Real on-chain cost: approve ≈ 50k gas, depositForBurn ≈ 150k.
      setStep("swap_executing"); // reusing v1 step labels — progress bar already maps them
      await writeContractAsync({
        chainId: SOURCE_CHAIN_ID,
        address: USDC,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [TOKEN_MESSENGER, amountWei],
        gas: 100_000n,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
      });

      // Step 2: burn USDC on source chain — emits MessageSent for Circle attestation.
      // CCTPv2 signature is 7 args (see CCTP_TOKEN_MESSENGER_ABI comment).
      const burnTx = await writeContractAsync({
        chainId: SOURCE_CHAIN_ID,
        address: TOKEN_MESSENGER,
        abi: CCTP_TOKEN_MESSENGER_ABI,
        functionName: "depositForBurn",
        args: [
          amountWei,
          ARC_DOMAIN,
          mintRecipient,
          USDC,
          DESTINATION_CALLER_ANY,
          maxFee,
          MIN_FINALITY_THRESHOLD,
        ],
        gas: 250_000n,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
      });
      setBurnTxHash(burnTx);

      // Step 3: server takes over — polls attestation + mints on Arc.
      await readExecuteStream(burnTx);
    } catch (e) {
      setStep("error");
      setErrorMessage(e instanceof Error ? e.message : "Transaction failed");
    }
  }, [chain, switchChainAsync, writeContractAsync, merchantWallet, targetUSDC, readExecuteStream]);

  return { step, burnTxHash, receipt, errorMessage, handlePay };
}
