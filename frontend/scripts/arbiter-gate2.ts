// arbiter-gate2.ts — GATE 2 runner: one full bounty cycle with real USDC on Arc testnet.
//   lock escrow → judge the deliverable → verdict-driven release → Released(verdictHash) on-chain
//
// Usage:
//   npm run arbiter:gate2                                   # read-only preflight, safe anytime
//   npm run arbiter:gate2 -- --run --worker 0x... [--amount 1] [--case pass-01] [--deadline-mins 60]
//
// --run refuses to start unless DRY_RUN=false in frontend/.env.local. That flip is the ONLY
// thing standing between the judging pipeline and real money, and it is deliberately manual.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { parseEventLogs } from "viem";
import { judgeAndSettle } from "../lib/arbiter/run";
import { getDaySpend } from "../lib/arbiter/spend-ledger";
import { arbiterEscrowAbi } from "../lib/escrow-abi";
import { arcPublicClient, escrowAddress, getBounty, isDryRun, serverWallet, toBountyKey, unitsToUsdc } from "../lib/escrow";
import { createSeedBounty, usdcBalance } from "../lib/escrow-poster";
import { withRpcRetry } from "../lib/rpc-retry";
import type { DryRunCase } from "../lib/arbiter/run";

try {
  process.loadEnvFile(join(process.cwd(), ".env.local"));
} catch {
  /* env may come from the shell */
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

/** Read-only wiring check. Every line here is a thing that silently breaks a live demo. */
async function preflight() {
  const pub = arcPublicClient();
  const wallet = serverWallet();
  const me = wallet.account.address;
  const escrow = escrowAddress();

  // Sequential + retried: the Arc public RPC drops ~1 request in 4 with "request limit reached",
  // and a preflight that fails on RPC flakiness tells you nothing about your wiring.
  const read = <T,>(fn: "arbiter" | "paused" | "MAX_BOUNTY") =>
    withRpcRetry(() => pub.readContract({ address: escrow, abi: arbiterEscrowAbi, functionName: fn }) as Promise<T>, {
      label: fn,
    });

  const onChainArbiter = await read<`0x${string}`>("arbiter");
  const paused = await read<boolean>("paused");
  const maxBounty = await read<bigint>("MAX_BOUNTY");
  const balance = await usdcBalance(me);
  const gas = await withRpcRetry(() => pub.getBalance({ address: me }), { label: "getBalance" });
  const day = await getDaySpend();

  const arbiterOk = onChainArbiter.toLowerCase() === me.toLowerCase();
  console.log("── GATE 2 preflight ──");
  console.log(`  chain id        : ${await pub.getChainId()}`);
  console.log(`  escrow          : ${escrow}`);
  console.log(`  server wallet   : ${me}`);
  console.log(`  contract arbiter: ${onChainArbiter} ${arbiterOk ? "✓ matches" : "✗ MISMATCH — release() will revert"}`);
  console.log(`  paused          : ${paused ? "YES ✗ (release blocked)" : "no ✓"}`);
  console.log(`  MAX_BOUNTY      : ${unitsToUsdc(maxBounty)} USDC`);
  console.log(`  wallet USDC     : ${unitsToUsdc(balance)}`);
  console.log(`  wallet gas      : ${gas} wei ${gas === 0n ? "✗ cannot send tx" : "✓"}`);
  console.log(`  day cap         : ${day.spentUsdc}/${day.capUsdc} spent, ${day.remainingUsdc} left` +
    `${day.degraded ? " ✗ LEDGER UNREADABLE — fails closed, no auto-release" : " ✓"}`);
  console.log(`  DRY_RUN         : ${isDryRun() ? "true (money disconnected)" : "FALSE — money is live"}`);

  return arbiterOk && !paused && gas > 0n && !day.degraded;
}

async function runCycle() {
  if (isDryRun()) {
    console.error("\nABORT: DRY_RUN is not false. Set DRY_RUN=false in frontend/.env.local to connect money.");
    process.exit(2);
  }
  const worker = arg("worker");
  if (!worker?.startsWith("0x") || worker.length !== 42) {
    console.error("ABORT: --worker 0x<address> is required (the wallet that gets paid).");
    process.exit(2);
  }
  const amountUsdc = Number(arg("amount", "1"));
  const deadlineMins = Number(arg("deadline-mins", "60"));
  const caseId = arg("case", "pass-01")!;

  // Reuse a calibration fixture as the deliverable — same content the dry-run gate already judged,
  // so a surprise here is a MONEY-path bug, not a judging one.
  const c = JSON.parse(
    readFileSync(join(process.cwd(), "calibration", "cases", `${caseId}.json`), "utf8"),
  ) as DryRunCase;
  if (!c.rubric?.length) {
    console.error(`ABORT: case ${caseId} has no frozen rubric — GATE 2 must judge against an approved rubric.`);
    process.exit(2);
  }

  const bountyId = randomUUID();
  const deadline = Math.floor(Date.now() / 1000) + deadlineMins * 60;
  const pub = arcPublicClient();

  console.log(`\n▶ 1/3 lock escrow — bounty ${bountyId} (${amountUsdc} USDC → ${worker})`);
  const created = await createSeedBounty(bountyId, worker as `0x${string}`, amountUsdc, deadline);
  if (created.approveTxHash) console.log(`   approve tx : ${created.approveTxHash}`);
  console.log(`   create tx  : ${created.createTxHash}`);
  console.log(`   bountyKey  : ${created.bountyKey}`);

  const workerBefore = await usdcBalance(worker as `0x${string}`);

  console.log(`\n▶ 2/3 judge — case ${caseId}, frozen rubric (${c.rubric.length} items)`);
  const result = await judgeAndSettle({
    bountyId,
    submissionId: randomUUID(),
    brief: c.brief,
    rubric: c.rubric,
    deliverable: c.deliverable,
    amountUsdc,
  });
  const v = result.judge.verdict;
  console.log(`   decision   : ${v.decision} (score=${v.total_score} conf=${v.confidence})`);
  console.log(`   verdictHash: ${result.judge.hash}`);
  console.log(`   confidence : ${v.confidence_reasoning.slice(0, 160)}`);

  console.log(`\n▶ 3/3 settle`);
  if (!result.release) {
    console.log(`   NO RELEASE — ${result.settlementNote}`);
    console.log(`   escrow still holds the funds; poster can refund after the deadline.`);
    console.log(`\nGATE 2: not met on this run (verdict did not authorise an autonomous release).`);
    process.exit(1);
  }
  console.log(`   release tx : ${result.release.txHash}`);

  // Verify against the chain, not against our own return value.
  const onChain = await getBounty(bountyId);
  const workerAfter = await usdcBalance(worker as `0x${string}`);
  // Decode the release receipt's own logs — no block-range query, so this works on any RPC.
  const receipt = await withRpcRetry(
    () => pub.getTransactionReceipt({ hash: result.release!.txHash as `0x${string}` }),
    { label: "release receipt" },
  );
  const [released] = parseEventLogs({ abi: arbiterEscrowAbi, eventName: "Released", logs: receipt.logs });
  const emittedHash = released?.args.verdictHash;
  const emittedKeyOk = released?.args.bountyId === toBountyKey(bountyId);

  const paidDelta = unitsToUsdc(workerAfter - workerBefore);
  const hashOk = emittedHash === result.judge.hash && emittedKeyOk;
  console.log(`   released   : ${onChain?.released ? "true ✓" : "false ✗"}`);
  console.log(`   worker +   : ${paidDelta} USDC ${paidDelta === amountUsdc ? "✓" : "✗"}`);
  console.log(`   on-chain verdictHash: ${emittedHash ?? "(no Released log found)"} ${hashOk ? "✓ matches verdict" : "✗"}`);

  const pass = Boolean(onChain?.released) && paidDelta === amountUsdc && hashOk;
  console.log(`\nGATE 2: ${pass ? "PASSED — escrow locked, verdict judged, USDC released, hash on-chain" : "FAILED — see ✗ above"}`);
  process.exit(pass ? 0 : 1);
}

async function main() {
  const ok = await preflight();
  if (!process.argv.includes("--run")) {
    console.log(`\npreflight: ${ok ? "READY" : "NOT READY (fix ✗ above)"} — add --run --worker 0x... to execute a live cycle`);
    process.exit(ok ? 0 : 1);
  }
  if (!ok) {
    console.error("\nABORT: preflight failed — refusing to move money on a broken setup.");
    process.exit(2);
  }
  await runCycle();
}

main().catch((err) => {
  console.error(`\nFATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
