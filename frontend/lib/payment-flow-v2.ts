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
import { pad, parseUnits } from "viem";
import { ERC20_APPROVE_ABI, CCTP_TOKEN_MESSENGER_ABI } from "./cctp-abi";
import type { PaymentStep } from "@/components/payment-progress-bar";

// Same env reads bundled to client because NEXT_PUBLIC_ prefix. No secrets.
const SOURCE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_SOURCE_CHAIN_ID ?? 11155111);
const USDC = (process.env.NEXT_PUBLIC_USDC_ADDRESS_SOURCE ?? "") as `0x${string}`;
const TOKEN_MESSENGER = (process.env.NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_SOURCE ?? "") as `0x${string}`;
const ARC_DOMAIN = Number(process.env.NEXT_PUBLIC_ARC_CCTP_DOMAIN ?? 26);

// USDC has 6 decimals on every CCTP chain.
const USDC_DECIMALS = 6;

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

      // Step 1: approve TokenMessenger to spend the customer's USDC.
      setStep("swap_executing"); // reusing v1 step labels — progress bar already maps them
      await writeContractAsync({
        address: USDC,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [TOKEN_MESSENGER, amountWei],
      });

      // Step 2: burn USDC on source chain — emits MessageSent for Circle attestation.
      const burnTx = await writeContractAsync({
        address: TOKEN_MESSENGER,
        abi: CCTP_TOKEN_MESSENGER_ABI,
        functionName: "depositForBurn",
        args: [amountWei, ARC_DOMAIN, mintRecipient, USDC],
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
