"use client";

// =============================================================================
// poster-lock-funds.tsx — the poster locks their OWN USDC, in two signatures.
//
// Before Phase 03 the server wallet paid on the poster's behalf, which made every bounty a
// withdrawal from one shared pot and made "the poster" on-chain a lie. Now the escrow's
// poster is the person who owns the money, and the server only watches.
//
// Two things this component refuses to do:
//   - hide which step failed. Signature 1 of 2 and 2 of 2 are named, each with its own tx link.
//   - report success on the client's say-so. Only /confirm-lock, which reads the chain,
//     decides the bounty is open.
// =============================================================================

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useConfig } from "wagmi";
import { keccak256, toBytes } from "viem";
import { PillButton } from "@/components/ui/pill-button";
import { arbiterEscrowAbi, erc20ApproveAbi } from "@/lib/escrow-abi";
import { escrowAddressClient, usdcAddressClient, usdcUnits } from "@/lib/arc-addresses-client";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

export interface LockParams {
  bountyId: string;
  worker: string | null;
  amountUsdc: number;
  deadlineUnix: number;
}

type Step = "idle" | "approving" | "creating" | "confirming" | "done";

/** keccak256 of the UUID — must match toBountyKey() on the server, or the client would sign
 *  a key the server never looks up. */
function bountyKey(id: string): `0x${string}` {
  return keccak256(toBytes(id));
}

export function PosterLockFunds({ lock, onDone }: { lock: LockParams; onDone: () => void }) {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<Step>("idle");
  const [approveTx, setApproveTx] = useState<string>();
  const [createTx, setCreateTx] = useState<string>();
  const [error, setError] = useState("");

  const amount = usdcUnits(lock.amountUsdc);

  const { data: allowance } = useReadContract({
    address: usdcAddressClient(),
    abi: erc20ApproveAbi,
    functionName: "allowance",
    args: address ? [address, escrowAddressClient()] : undefined,
    query: { enabled: Boolean(address) },
  });

  async function run() {
    setError("");
    try {
      // Step 1 — approve, but only if the existing allowance is short. Re-approving an
      // already-sufficient allowance costs gas and one more wallet prompt for nothing.
      if ((allowance as bigint | undefined ?? 0n) < amount) {
        setStep("approving");
        const tx = await writeContractAsync({
          address: usdcAddressClient(),
          abi: erc20ApproveAbi,
          functionName: "approve",
          args: [escrowAddressClient(), amount],
        });
        setApproveTx(tx);
        await waitForTransactionReceipt(config, { hash: tx });
      }

      // Step 2 — lock. worker=0x0 means "open to whoever claims it".
      setStep("creating");
      const tx2 = await writeContractAsync({
        address: escrowAddressClient(),
        abi: arbiterEscrowAbi,
        functionName: "createBounty",
        args: [
          bountyKey(lock.bountyId),
          (lock.worker ?? ZERO) as `0x${string}`,
          amount,
          BigInt(lock.deadlineUnix),
        ],
      });
      setCreateTx(tx2);
      await waitForTransactionReceipt(config, { hash: tx2 });

      // Step 3 — the server verifies against the chain. Our word is not enough.
      setStep("confirming");
      const res = await fetch(`/api/bounty/${lock.bountyId}/confirm-lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: tx2 }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Server failed to confirm.");

      setStep("done");
      onDone();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setError(
        /user rejected|denied/i.test(raw)
          ? "You rejected the signature. The bounty remains a draft; you can sign again at any time."
          : raw,
      );
      setStep("idle");
    }
  }

  const label: Record<Step, string> = {
    idle: `Lock ${lock.amountUsdc} USDC`,
    approving: "Signature 1 of 2 — approve escrow…",
    creating: "Signature 2 of 2 — lock funds…",
    confirming: "Confirming with chain…",
    done: "Locked",
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Said before the money is locked, not buried in terms afterwards. This is the single
          most surprising consequence of the rules, and a poster who learns it only once a
          deliverable has arrived will reasonably feel tricked. */}
      {step === "idle" && (
        <p className="text-xs leading-relaxed text-[#444444]">
          Before you lock: if nobody submits, you can reclaim all funds after the deadline. Once a valid submission arrives, you cannot withdraw the full amount — approving pays the worker in full; rejecting pays them partially based on the AI's score, and the rest returns to you.
        </p>
      )}
      <PillButton onClick={run} disabled={step !== "idle"} className="!bg-[#C41E3A] !text-white hover:!bg-[#A31830] !border-[#C41E3A]">
        {label[step]}
      </PillButton>

      {approveTx && <TxLine label="Approve" hash={approveTx} />}
      {createTx && <TxLine label="Lock funds" hash={createTx} />}

      {step === "confirming" && (
        <p className="text-xs text-[#444444]">
          The server is reading the escrow directly from the chain. The rubric is frozen only if the amount, deadline, and poster address all match.
        </p>
      )}
      {error && <p className="text-xs text-[#C41E3A]">{error}</p>}
      {error && createTx && (
        <PillButton variant="secondary" onClick={run} className="!text-[#1A1A1A] !border-[#E2E2E2] hover:!bg-[#F4F4F4]">
          I already signed — check again
        </PillButton>
      )}
    </div>
  );
}

function TxLine({ label, hash }: { label: string; hash: string }) {
  return (
    <p className="font-mono text-xs text-[#444444]">
      {label}: {hash.slice(0, 10)}…{hash.slice(-6)}
    </p>
  );
}
