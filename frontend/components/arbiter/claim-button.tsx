"use client";

// =============================================================================
// claim-button.tsx — the worker takes an open bounty by signing claim() themselves.
//
// Why on-chain and not a row in the database: the address that claims is the address that
// gets paid. Letting the server write it would mean the payout target came from a request
// body, which is exactly the class of bug Phase 05 closed everywhere else.
//
// Losing the race is not an error state. Two people can want the same job; the one who
// signed first has it, and the other should be told plainly, not shown a red failure.
// =============================================================================

import { useState } from "react";
import { useWriteContract, useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { keccak256, toBytes } from "viem";
import { PillButton } from "@/components/ui/pill-button";
import { arbiterEscrowAbi } from "@/lib/escrow-abi";
import { escrowAddressClient } from "@/lib/arc-addresses-client";

type State = "idle" | "signing" | "confirming" | "taken";

export function ClaimButton({ bountyId, onClaimed }: { bountyId: string; onClaimed: () => void }) {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<State>("idle");
  const [note, setNote] = useState("");

  async function claim() {
    setNote("");
    try {
      setState("signing");
      const tx = await writeContractAsync({
        address: escrowAddressClient(),
        abi: arbiterEscrowAbi,
        functionName: "claim",
        args: [keccak256(toBytes(bountyId))],
      });
      await waitForTransactionReceipt(config, { hash: tx });

      setState("confirming");
      const res = await fetch(`/api/bounty/${bountyId}/confirm-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: tx }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "không xác nhận được");

      setState("taken");
      onClaimed();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      if (/AlreadyClaimed|đã nhận việc/i.test(raw)) {
        // Somebody signed first. Say so, and stop offering the button.
        setState("taken");
        setNote("Có người nhận việc này trước bạn.");
        onClaimed();
      } else if (/user rejected|denied/i.test(raw)) {
        setState("idle");
        setNote("Bạn đã từ chối ký.");
      } else if (/DeadlinePassed/i.test(raw)) {
        setState("taken");
        setNote("Việc này đã quá hạn — không nhận được nữa.");
      } else {
        setState("idle");
        setNote(raw);
      }
    }
  }

  const label: Record<State, string> = {
    idle: "Nhận việc này",
    signing: "Chờ chữ ký…",
    confirming: "Đang đối chiếu chain…",
    taken: "Đã có người nhận",
  };

  return (
    <div className="flex flex-col gap-1">
      <PillButton onClick={claim} disabled={state !== "idle"}>
        {label[state]}
      </PillButton>
      {note && <p className="text-xs text-[var(--color-ink-muted)]">{note}</p>}
    </div>
  );
}
