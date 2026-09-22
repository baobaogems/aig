import { useCallback, useState } from "react";
import { useWriteContract, useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { keccak256, toBytes } from "viem";
import { arbiterEscrowAbi } from "@/lib/escrow-abi";
import { escrowAddressClient } from "@/lib/arc-addresses-client";

export function useSettlement(bountyId: string, onChanged: () => Promise<void> | void) {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const call = useCallback(
    async (path: string, body: object) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "không thực hiện được");
        await onChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [onChanged]
  );

  const finalize = useCallback(() => {
    return call("/api/settlement/finalize", { bounty_id: bountyId });
  }, [call, bountyId]);

  const approve = useCallback((verdictId: string) => {
    return call("/api/escalation", {
      bounty_id: bountyId, verdict_id: verdictId, poster_action: "APPROVE",
    });
  }, [call, bountyId]);

  const reject = useCallback((verdictId: string) => {
    return call("/api/escalation", {
      bounty_id: bountyId, verdict_id: verdictId, poster_action: "REJECT", note,
    });
  }, [call, bountyId, note]);

  const objectT1 = useCallback(() => {
    return call("/api/settlement/object", { bounty_id: bountyId, note });
  }, [call, bountyId, note]);

  const selfRelease = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const tx = await writeContractAsync({
        address: escrowAddressClient(),
        abi: arbiterEscrowAbi,
        functionName: "timeoutRelease",
        args: [keccak256(toBytes(bountyId))],
      });
      await waitForTransactionReceipt(config, { hash: tx });
      await fetch("/api/settlement/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bounty_id: bountyId }),
      });
      await onChanged();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setError(/user rejected|denied/i.test(raw) ? "Bạn đã từ chối ký." : raw);
    } finally {
      setBusy(false);
    }
  }, [writeContractAsync, config, bountyId, onChanged]);

  return {
    busy,
    note,
    setNote,
    error,
    call,
    finalize,
    approve,
    reject,
    objectT1,
    selfRelease,
  };
}
