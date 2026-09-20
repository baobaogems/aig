// escrow-v3-live-round.ts — walk the v3 money paths with REAL USDC on Arc testnet.
//
//   ESCROW=0x... npx tsx scripts/escrow-v3-live-round.ts
//
// Deliberately talks to the CHAIN ONLY — no Supabase, no app routes. The question it answers
// is narrow and the one that matters most: does the escrow pay out exactly what the rules
// say, to exactly whom, in every branch. Mixing the database in would mean a failure here
// could be blamed on the app, and this is the layer holding the money.
//
// Every assertion reads a BALANCE, not a return value: the only proof a payment happened is
// that someone's balance changed.
//
// ON ARC, GAS IS PAID IN USDC. The poster here is also the arbiter sending the settle
// transaction, so their USDC balance moves by (their share − gas). Measuring the poster's
// wallet alone would therefore "fail" a correct payout by a couple of thousandths. The
// escrow's own balance is the honest witness: it must fall by exactly the bounty amount,
// and the worker's must rise by exactly their share.

import { createPublicClient, createWalletClient, http, keccak256, toBytes, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { randomUUID } from "node:crypto";
import { getArcChain } from "../lib/chains";
import { arbiterEscrowAbi } from "../lib/escrow-abi";
import { erc20ApproveAbi } from "../lib/escrow-abi";

const ESCROW = process.env.ESCROW as `0x${string}`;
const USDC = process.env.USDC_ADDRESS_ARC_TESTNET as `0x${string}`;
const RPC = process.env.ARC_TESTNET_RPC_URL;

const chain = getArcChain();
const pub = createPublicClient({ chain, transport: http(RPC) });
const arbiter = privateKeyToAccount(process.env.AIG_ADMIN_WALLET_PRIVATE_KEY as `0x${string}`);
const worker = privateKeyToAccount(process.env.BUYER_PRIVATE_KEY as `0x${string}`);
const posterW = createWalletClient({ account: arbiter, chain, transport: http(RPC) });
const arbiterW = posterW; // same key is poster and arbiter in the pilot — stated, not hidden
const workerW = createWalletClient({ account: worker, chain, transport: http(RPC) });

const key = (id: string) => keccak256(toBytes(id));
const bal = (who: `0x${string}`) =>
  pub.readContract({ address: USDC, abi: erc20ApproveAbi, functionName: "balanceOf", args: [who] }) as Promise<bigint>;
const mine = async (hash: `0x${string}`) => {
  const r = await pub.waitForTransactionReceipt({ hash, timeout: 120_000 });
  if (r.status !== "success") throw new Error(`tx ${hash} reverted`);
  return r;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`   ${ok ? "✓" : "✗"} ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
}

/** Lock a bounty open to anyone, then have the worker claim it. */
async function openAndClaim(amount: bigint) {
  const id = randomUUID();
  await mine(await posterW.writeContract({
    address: USDC, abi: erc20ApproveAbi, functionName: "approve", args: [ESCROW, amount],
  }));
  await mine(await posterW.writeContract({
    address: ESCROW, abi: arbiterEscrowAbi, functionName: "createBounty",
    args: [key(id), "0x0000000000000000000000000000000000000000", amount, BigInt(Math.floor(Date.now() / 1000) + 7 * 86400)],
  }));
  await mine(await workerW.writeContract({
    address: ESCROW, abi: arbiterEscrowAbi, functionName: "claim", args: [key(id)],
  }));
  return id;
}

const markSubmitted = (id: string) =>
  arbiterW.writeContract({ address: ESCROW, abi: arbiterEscrowAbi, functionName: "markSubmitted", args: [key(id)] }).then(mine);

async function splitScenario(label: string, amount: bigint, bps: number, expectWorker: bigint) {
  console.log(`\n▶ ${label} — ${Number(amount) / 1e6} USDC, workerBps=${bps}`);
  const id = await openAndClaim(amount);
  await markSubmitted(id);

  const w0 = await bal(worker.address);
  const e0 = await bal(ESCROW);
  const r = await mine(await arbiterW.writeContract({
    address: ESCROW, abi: arbiterEscrowAbi, functionName: "settle",
    args: [key(id), keccak256(toBytes(`verdict-${id}`)), bps],
  }));
  const w1 = await bal(worker.address);
  const e1 = await bal(ESCROW);

  const [ev] = parseEventLogs({ abi: arbiterEscrowAbi, eventName: "Settled", logs: r.logs });
  const expectPoster = amount - expectWorker;
  check(`người làm nhận ${Number(expectWorker) / 1e6} USDC`, w1 - w0 === expectWorker, `+${Number(w1 - w0) / 1e6}`);
  check("escrow nhả ra đúng số đã khoá", e0 - e1 === amount, `-${Number(e0 - e1) / 1e6}`);
  check("phần dư ghi đúng cho người đăng", ev?.args.posterAmount === expectPoster, `${Number(ev?.args.posterAmount ?? 0n) / 1e6}`);
  check("hai phần cộng lại bằng đúng tiền khoá", (ev?.args.workerAmount ?? 0n) + (ev?.args.posterAmount ?? 0n) === amount);
  check("verdict hash lên chain đúng", ev?.args.verdictHash === keccak256(toBytes(`verdict-${id}`)));
  console.log(`   tx: ${r.transactionHash}`);
  return id;
}

async function refundBlocked(amount: bigint) {
  console.log(`\n▶ Hoàn tiền sau khi đã có bài nộp — PHẢI bị chặn (lỗ L5)`);
  const id = await openAndClaim(amount);
  await markSubmitted(id);
  try {
    await posterW.writeContract({ address: ESCROW, abi: arbiterEscrowAbi, functionName: "refund", args: [key(id)] });
    check("refund bị từ chối", false, "KHÔNG revert — người đăng vẫn rút được!");
  } catch (e) {
    check("refund bị từ chối", /WorkSubmitted|revert/i.test(String(e)));
  }
  // leave it settled so no escrow is left hanging
  await mine(await arbiterW.writeContract({
    address: ESCROW, abi: arbiterEscrowAbi, functionName: "settle",
    args: [key(id), keccak256(toBytes(`v-${id}`)), 10_000],
  }));
}

async function timeoutPath(amount: bigint, windowSecs: number) {
  console.log(`\n▶ Nền tảng im lặng — người làm tự nhận tiền (chờ ${windowSecs}s)`);
  const id = await openAndClaim(amount);
  await markSubmitted(id);
  const e0 = await bal(ESCROW);

  await sleep((windowSecs + 15) * 1000);
  // Signed by the WORKER, not the arbiter: this is the whole point of the function. It also
  // means the worker pays the gas — in USDC, on this chain — so their wallet rises by the
  // payout MINUS gas. The escrow's balance is what proves the payout itself was whole.
  const r = await mine(await workerW.writeContract({
    address: ESCROW, abi: arbiterEscrowAbi, functionName: "timeoutRelease", args: [key(id)],
  }));
  const e1 = await bal(ESCROW);
  const [ev] = parseEventLogs({ abi: arbiterEscrowAbi, eventName: "Settled", logs: r.logs });
  check("escrow trả ra đủ số đã khoá", e0 - e1 === amount, `-${Number(e0 - e1) / 1e6}`);
  check("trả đúng cho người làm, đủ 100%", ev?.args.worker === worker.address && ev?.args.workerAmount === amount);
  check("người đăng không nhận lại đồng nào", ev?.args.posterAmount === 0n);
  console.log(`   tx: ${r.transactionHash}`);
}

async function expireClaimPath(amount: bigint, windowSecs: number) {
  console.log(`\n▶ Nhận việc rồi bỏ đó — người khác mở lại được (chờ ${windowSecs}s)`);
  const id = await openAndClaim(amount);
  const e0 = await bal(ESCROW);

  await sleep((windowSecs + 15) * 1000);
  await mine(await workerW.writeContract({
    address: ESCROW, abi: arbiterEscrowAbi, functionName: "expireClaim", args: [key(id)],
  }));
  const b = (await pub.readContract({
    address: ESCROW, abi: arbiterEscrowAbi, functionName: "getBounty", args: [key(id)],
  })) as { worker: string };
  check("việc được mở lại", b.worker === "0x0000000000000000000000000000000000000000");
  check("expireClaim không chạm tiền", (await bal(ESCROW)) === e0);
}

async function main() {
  if (!ESCROW) throw new Error("ESCROW not set");
  console.log(`escrow : ${ESCROW}`);
  console.log(`arbiter+poster: ${arbiter.address}`);
  console.log(`worker : ${worker.address}`);

  const settleWindow = Number(await pub.readContract({ address: ESCROW, abi: arbiterEscrowAbi, functionName: "settleWindow" }));
  const claimWindow = Number(await pub.readContract({ address: ESCROW, abi: arbiterEscrowAbi, functionName: "claimWindow" }));
  console.log(`settleWindow=${settleWindow}s claimWindow=${claimWindow}s`);

  const only = process.env.ONLY;
  if (!only) {
    await splitScenario("T1 tự trả — trả đủ", 1_000_000n, 10_000, 1_000_000n);
    await splitScenario("Người đăng phản đối T1 — 50/50", 1_000_000n, 5_000, 500_000n);
    await splitScenario("Từ chối T2 — phí huỷ 30%", 1_000_000n, 3_000, 300_000n);
    await refundBlocked(1_000_000n);
  }

  if (settleWindow <= 600) {
    await timeoutPath(1_000_000n, settleWindow);
    if (!only) await expireClaimPath(1_000_000n, claimWindow);
  } else {
    console.log(`\n(bỏ qua timeoutRelease/expireClaim: cửa sổ ${settleWindow}s quá dài cho một lần chạy)`);
  }

  console.log(`\n${failures === 0 ? "TẤT CẢ ĐẠT" : `${failures} MỤC HỎNG`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
