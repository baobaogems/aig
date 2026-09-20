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
      if (!res.ok) throw new Error(j.error ?? "máy chủ không xác nhận được");

      setStep("done");
      onDone();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setError(
        /user rejected|denied/i.test(raw)
          ? "Bạn đã từ chối ký. Bounty vẫn ở trạng thái nháp, ký lại lúc nào cũng được."
          : raw,
      );
      setStep("idle");
    }
  }

  const label: Record<Step, string> = {
    idle: `Khoá ${lock.amountUsdc} USDC`,
    approving: "Chữ ký 1/2 — cho phép escrow…",
    creating: "Chữ ký 2/2 — khoá tiền…",
    confirming: "Đang đối chiếu với chain…",
    done: "Đã khoá",
  };

  return (
    <div className="flex flex-col gap-2">
      <PillButton onClick={run} disabled={step !== "idle"}>
        {label[step]}
      </PillButton>

      {approveTx && <TxLine label="Cho phép" hash={approveTx} />}
      {createTx && <TxLine label="Khoá tiền" hash={createTx} />}

      {step === "confirming" && (
        <p className="text-xs text-[var(--color-ink-muted)]">
          Máy chủ đang đọc escrow trực tiếp từ chain. Rubric chỉ đóng băng khi số tiền, hạn chót
          và địa chỉ người đăng đều khớp.
        </p>
      )}
      {error && <p className="text-xs text-[var(--color-accent)]">{error}</p>}
      {error && createTx && (
        <PillButton variant="secondary" onClick={run}>
          Tôi đã ký rồi — kiểm tra lại
        </PillButton>
      )}
    </div>
  );
}

function TxLine({ label, hash }: { label: string; hash: string }) {
  return (
    <p className="font-mono text-xs text-[var(--color-ink-muted)]">
      {label}: {hash.slice(0, 10)}…{hash.slice(-6)}
    </p>
  );
}
