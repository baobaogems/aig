// escrow-v2-inventory.ts — READ ONLY. What is still locked in the v2 contract.
//
// Run this BEFORE deploying v3 and again AFTER. The two lists must be identical: that is the
// proof the upgrade touched nobody's money. If a row moves between the two runs, stop and
// find out why before going further.
//
//   npx tsx scripts/escrow-v2-inventory.ts
//
// It writes nothing, signs nothing and sends no transaction. There is deliberately no
// counterpart that moves funds between contracts — v2 bounties finish on v2, and the safest
// way to handle someone else's locked escrow is to leave it alone.

import { createPublicClient, http, keccak256, toBytes } from "viem";
import { createClient } from "@supabase/supabase-js";
import { getArcChain } from "../lib/chains";
import { arbiterEscrowV2Abi } from "../lib/escrow-abi-v2";

const V2 = process.env.ARBITER_ESCROW_ADDRESS_V2 ?? process.env.ARBITER_ESCROW_ADDRESS;

async function main() {
  if (!V2) throw new Error("ARBITER_ESCROW_ADDRESS_V2 (or ARBITER_ESCROW_ADDRESS) not set");

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const pub = createPublicClient({ chain: getArcChain(), transport: http(process.env.ARC_TESTNET_RPC_URL) });

  const { data, error } = await db
    .from("bounties")
    .select("id, status, amount_usdc, deadline, poster_id, worker_id, escrow_version")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []).filter((b) => (b.escrow_version ?? 2) === 2);
  console.log(`v2 contract : ${V2}`);
  console.log(`bounties on v2 (database): ${rows.length}\n`);

  let stillHolding = 0;
  let total = 0;
  for (const b of rows) {
    const onChain = (await pub.readContract({
      address: V2 as `0x${string}`,
      abi: arbiterEscrowV2Abi,
      functionName: "getBounty",
      args: [keccak256(toBytes(b.id))],
    })) as { poster: string; amount: bigint; released: boolean; refunded: boolean };

    const exists = onChain.poster !== "0x0000000000000000000000000000000000000000";
    const open = exists && !onChain.released && !onChain.refunded;
    if (open) {
      stillHolding++;
      total += Number(onChain.amount) / 1e6;
    }
    console.log(
      `${b.id}  db=${b.status.padEnd(9)} chain=${
        !exists ? "never-created" : onChain.released ? "released" : onChain.refunded ? "refunded" : "HOLDING"
      }  ${Number(onChain.amount) / 1e6} USDC  hạn ${b.deadline}`,
    );
  }

  console.log(`\nCÒN GIỮ TIỀN: ${stillHolding} bounty, ${total} USDC`);
  console.log("Danh sách này phải giống hệt sau khi deploy v3. Khác một dòng là dừng lại.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
