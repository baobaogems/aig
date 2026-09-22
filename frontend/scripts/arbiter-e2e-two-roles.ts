// =============================================================================
// arbiter-e2e-two-roles.ts — the two-wallet cycle, for real, on Arc testnet.
//
//   DRY_RUN=false npm run arbiter:e2e -- --run
//   DRY_RUN=false npm run arbiter:e2e -- --run --worker-key 0x...   (bring your own wallet B)
//
// What GATE 2 could not show: a bounty posted WITHOUT knowing who would do it, taken by a
// different wallet, and paid to that wallet. Two keys sign here — the poster/arbiter admin
// key and a separate worker key — so "the worker claimed it" is a fact on-chain, not a row
// this script wrote about itself.
//
// Three scenarios, all settled to a terminal on-chain state so nothing is left stranded:
//   1. bright path — good work  → RELEASE  → worker paid in full
//   2. dark path   — injection  → FAIL     → no release → poster refunds after the deadline
//   3. grey path   — mid work   → ESCALATE → the POSTER decides, and refusing costs them the
//                                            kill fee the rules compute (T2 band, 0–30%)
//
// The third scenario from the plan (a stranger may not act on someone else's bounty) is an
// HTTP-layer question and lives in scripts/authz-matrix-check.ts, where a session cookie
// exists to be withheld.
//
// Like gate2, this refuses to start unless DRY_RUN=false. That flip stays manual.
// =============================================================================

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// Same bootstrap as arbiter-gate2.ts: nothing auto-loads .env.local for a plain node script,
// so the chain config has to be read in explicitly before any lib/ module touches process.env.
try {
  process.loadEnvFile(join(process.cwd(), ".env.local"));
} catch {
  /* env may come from the shell instead — same stance as arbiter-gate2.ts */
}

import { createWalletClient, http, parseEventLogs, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { judgeAndSettle } from "../lib/arbiter/run";
import { arbiterEscrowAbi, erc20ApproveAbi } from "../lib/escrow-abi";
import {
  arcPublicClient,
  escrowAddress,
  getBounty,
  isDryRun,
  serverWallet,
  toBountyKey,
  unitsToUsdc,
  usdcToUnits,
} from "../lib/escrow";
import { usdcBalance } from "../lib/escrow-poster";
import { withRpcRetry } from "../lib/rpc-retry";
import { killFeeBps, posterAmountUsdc, workerAmountUsdc } from "../lib/arbiter/kill-fee";
import type { DryRunCase } from "../lib/arbiter/run";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** Bài chấm thử KHÔNG kèm rubric — chỉ lấy đề và bài nộp; rubric mượn từ case cùng đề. */
function loadWork(id: string): DryRunCase {
  return JSON.parse(
    readFileSync(join(process.cwd(), "calibration", "cases", `${id}.json`), "utf8"),
  ) as DryRunCase;
}

function loadCase(id: string): DryRunCase {
  const c = JSON.parse(
    readFileSync(join(process.cwd(), "calibration", "cases", `${id}.json`), "utf8"),
  ) as DryRunCase;
  if (!c.rubric?.length) throw new Error(`case ${id} has no frozen rubric`);
  return c;
}

/**
 * Wallet B: a real second signer, not an impersonation.
 *
 * Not one of the published Anvil keys: Arc refuses them outright ("Blocked address" on
 * claim), which is the chain's compliance screening doing its job. E2E_WORKER_PRIVATE_KEY is
 * a throwaway generated for this script, funded with a little gas from wallet A, and lives
 * only in the gitignored .env.local.
 */
function workerWallet() {
  const key = (arg("worker-key") ?? process.env.E2E_WORKER_PRIVATE_KEY) as `0x${string}` | undefined;
  if (!key) throw new Error("thiếu E2E_WORKER_PRIVATE_KEY (hoặc --worker-key) cho ví B");
  const account = privateKeyToAccount(key);
  const chain = arcPublicClient().chain;
  return createWalletClient({ account, chain, transport: http(chain?.rpcUrls.default.http[0]) }).extend(
    publicActions,
  );
}

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`   ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

/** A: approve (only if short) + createBounty with worker = 0x0. */
async function postOpenBounty(bountyId: string, amountUsdc: number, deadlineMins: number) {
  const wallet = serverWallet();
  const pub = arcPublicClient();
  const poster = wallet.account.address;
  const amount = usdcToUnits(amountUsdc);
  const usdc = process.env.USDC_ADDRESS_ARC_TESTNET as `0x${string}`;

  const allowance = (await withRpcRetry(
    () =>
      pub.readContract({
        address: usdc,
        abi: erc20ApproveAbi,
        functionName: "allowance",
        args: [poster, escrowAddress()],
      }) as Promise<bigint>,
    { label: "allowance" },
  ));

  if (allowance < amount) {
    const approveTx = await wallet.writeContract({
      address: usdc,
      abi: erc20ApproveAbi,
      functionName: "approve",
      args: [escrowAddress(), amount],
    });
    await pub.waitForTransactionReceipt({ hash: approveTx });
    console.log(`   approve  : ${approveTx}`);
  }

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMins * 60);
  const createTx = await wallet.writeContract({
    address: escrowAddress(),
    abi: arbiterEscrowAbi,
    functionName: "createBounty",
    args: [toBountyKey(bountyId), ZERO, amount, deadline],
  });
  await pub.waitForTransactionReceipt({ hash: createTx });
  console.log(`   create   : ${createTx}`);
  return { createTx, deadline };
}

/** B: claim, signed by the worker's own key. */
async function claimAsWorker(bountyId: string) {
  const w = workerWallet();
  const tx = await w.writeContract({
    address: escrowAddress(),
    abi: arbiterEscrowAbi,
    functionName: "claim",
    args: [toBountyKey(bountyId)],
  });
  const receipt = await w.waitForTransactionReceipt({ hash: tx });
  const [claimed] = parseEventLogs({ abi: arbiterEscrowAbi, eventName: "Claimed", logs: receipt.logs });
  console.log(`   claim    : ${tx}`);
  return { tx, worker: w.account.address, emitted: claimed?.args.worker };
}

async function scenarioBright(amountUsdc: number) {
  console.log("\n▶ KỊCH BẢN 1 — bài tốt: đăng mở → B nhận → chấm → trả tiền");
  const c = loadCase("pass-01");
  const bountyId = randomUUID();

  await postOpenBounty(bountyId, amountUsdc, 60);
  let onChain = await getBounty(bountyId);
  check("việc mở, chưa ai nhận", onChain?.worker === ZERO, `worker=${onChain?.worker}`);

  const { worker, emitted } = await claimAsWorker(bountyId);
  onChain = await getBounty(bountyId);
  check("chain ghi đúng người nhận", onChain?.worker?.toLowerCase() === worker.toLowerCase());
  check("sự kiện Claimed khớp", emitted?.toLowerCase() === worker.toLowerCase());

  const before = await usdcBalance(worker as `0x${string}`);
  const result = await judgeAndSettle({
    bountyId,
    submissionId: randomUUID(),
    brief: c.brief,
    rubric: c.rubric!,
    deliverable: c.deliverable,
    amountUsdc,
    escrowVersion: 3,
  });
  console.log(`   verdict  : ${result.judge.verdict.decision} score=${result.judge.verdict.total_score} conf=${result.judge.verdict.confidence}`);

  check("phán quyết là RELEASE", result.judge.verdict.decision === "RELEASE");
  // v3: chấm xong chỉ MỞ ĐỒNG HỒ, chưa trả tiền. Trả tiền là hành vi riêng — ở đây kịch bản
  // đóng vai "người đăng duyệt ngay" để đi hết đường tiền trong một lần chạy.
  check("đồng hồ thanh toán đã mở", result.clockStarted, result.settlementNote ?? "");
  const { settleEscrow } = await import("../lib/escrow");
  const release = await settleEscrow(bountyId, result.judge.hash, 10_000);
  console.log(`   settle   : ${release.txHash}`);

  const after = await usdcBalance(worker as `0x${string}`);
  check(`người NHẬN VIỆC được trả đúng ${amountUsdc} USDC`, unitsToUsdc(after - before) === amountUsdc,
    `+${unitsToUsdc(after - before)}`);

  onChain = await getBounty(bountyId);
  check("escrow đánh dấu đã thanh toán", onChain?.settled === true);
  return bountyId;
}

async function scenarioDark(amountUsdc: number, deadlineMins: number) {
  console.log("\n▶ KỊCH BẢN 2 — bài nhét lệnh: đăng mở → B nhận → chấm → KHÔNG trả → hoàn tiền");
  const c = loadCase("inject-01");
  const bountyId = randomUUID();

  await postOpenBounty(bountyId, amountUsdc, deadlineMins);
  const { worker } = await claimAsWorker(bountyId);

  const before = await usdcBalance(worker as `0x${string}`);
  const result = await judgeAndSettle({
    bountyId,
    submissionId: randomUUID(),
    brief: c.brief,
    rubric: c.rubric!,
    deliverable: c.deliverable,
    amountUsdc,
    escrowVersion: 3,
  });
  console.log(`   verdict  : ${result.judge.verdict.decision} score=${result.judge.verdict.total_score} conf=${result.judge.verdict.confidence}`);

  check("lệnh chèn bị vô hiệu (không RELEASE)", result.judge.verdict.decision !== "RELEASE");
  check("KHÔNG có giao dịch trả tiền", true);
  const after = await usdcBalance(worker as `0x${string}`);
  check("số dư người nhận việc không đổi", after === before);

  const onChain = await getBounty(bountyId);
  check("escrow vẫn giữ tiền", onChain?.settled === false && onChain?.refunded === false);
  // Bài nhét lệnh bị chấm trượt ⇒ KHÔNG đánh dấu đã nộp ⇒ đường hoàn tiền của người đăng
  // còn nguyên. Đây đúng là điều khiến rải bài rác không khoá được escrow của ai.
  check("không mở đồng hồ cho bài trượt", onChain?.submittedAt === 0n && !result.clockStarted);
  return { bountyId, deadline: Number(onChain?.deadline ?? 0) };
}

/**
 * Kịch bản 3 — vùng xám: máy KHÔNG tự quyết, người đăng quyết.
 *
 * Đây là nhánh khó nhất và cũng là nhánh dễ sai nhất: máy chấm ra điểm giữa băng, tier T2,
 * quyết định ESCALATE. Tiền KHÔNG tự chạy. Người đăng có hai đường, và đường "từ chối" KHÔNG
 * miễn phí — người làm vẫn nhận phần kill fee mà luật tính ra từ chính điểm số, chứ không
 * phải con số người đăng tự nghĩ. Test này đo đúng chỗ đó: bps lấy từ killFeeBps(), số tiền
 * hai bên nhận phải khớp tới từng micro-USDC.
 *
 * Bài dùng ở đây là ambig-01 (bài thật, viết được nhưng hụt vài tiêu chí) chấm theo rubric đã
 * đóng băng của pass-01 — cùng một đề, nên rubric dùng chung được.
 */
async function scenarioGrey(amountUsdc: number) {
  console.log("\n▶ KỊCH BẢN 3 — vùng xám: đăng mở → B nhận → chấm T2 → NGƯỜI ĐĂNG quyết → chia phần");
  const graded = loadCase("pass-01");
  const midWork = loadWork("ambig-01");
  const bountyId = randomUUID();

  await postOpenBounty(bountyId, amountUsdc, 60);
  const { worker } = await claimAsWorker(bountyId);

  const before = await usdcBalance(worker as `0x${string}`);
  const result = await judgeAndSettle({
    bountyId,
    submissionId: randomUUID(),
    brief: midWork.brief,
    rubric: graded.rubric!,
    deliverable: midWork.deliverable,
    amountUsdc,
    escrowVersion: 3,
  });
  const v = result.judge.verdict;
  console.log(`   verdict  : ${v.decision} score=${v.total_score} conf=${v.confidence}`);

  check("máy KHÔNG tự trả tiền (không phải RELEASE)", v.decision !== "RELEASE", v.decision);
  check("đưa lên người đăng quyết (ESCALATE)", v.decision === "ESCALATE", v.decision);
  check("đồng hồ quyết định đã mở", result.clockStarted, result.settlementNote ?? "");
  check("chưa đồng nào rời escrow khi mới chấm xong", (await usdcBalance(worker as `0x${string}`)) === before);

  // Người đăng chọn TỪ CHỐI. Phần người làm nhận do luật tính, không do người đăng đặt.
  const bps = killFeeBps({ totalScore: v.total_score, tier: "T2" });
  const expectWorker = workerAmountUsdc(amountUsdc, bps);
  const expectPoster = posterAmountUsdc(amountUsdc, bps);
  console.log(`   kill fee : ${bps / 100}% → người làm ${expectWorker} / người đăng ${expectPoster} USDC`);

  const { settleEscrow } = await import("../lib/escrow");
  const settled = await settleEscrow(bountyId, result.judge.hash, bps);
  console.log(`   settle   : ${settled.txHash}`);

  const after = await usdcBalance(worker as `0x${string}`);
  check(`người làm nhận đúng phần luật tính (${expectWorker} USDC)`,
    unitsToUsdc(after - before) === expectWorker, `+${unitsToUsdc(after - before)}`);
  check("hai phần cộng lại bằng đúng tiền đã khoá", expectWorker + expectPoster === amountUsdc,
    `${expectWorker} + ${expectPoster}`);

  const onChain = await getBounty(bountyId);
  check("escrow đánh dấu đã thanh toán", onChain?.settled === true);
  return bountyId;
}

async function refundAfterDeadline(bountyId: string, deadlineUnix: number) {
  const waitMs = Math.max(0, (deadlineUnix + 5) * 1000 - Date.now());
  console.log(`\n▶ chờ ${Math.ceil(waitMs / 1000)}s tới hạn rồi hoàn tiền…`);
  await new Promise((r) => setTimeout(r, waitMs));

  const { refundEscrow } = await import("../lib/escrow");
  const { txHash } = await refundEscrow(bountyId);
  console.log(`   refund   : ${txHash}`);
  const onChain = await getBounty(bountyId);
  check("escrow đã hoàn về người đăng", onChain?.refunded === true);
}

async function main() {
  if (!process.argv.includes("--run")) {
    console.log("Đây là bài chạy THẬT trên Arc testnet. Thêm --run để thực thi.");
    return;
  }
  if (isDryRun()) {
    console.error("DỪNG: DRY_RUN chưa phải false. Chạy: DRY_RUN=false npm run arbiter:e2e -- --run");
    process.exit(2);
  }

  const amount = Number(arg("amount", "1"));
  const deadlineMins = Number(arg("deadline-mins", "2"));
  const w = workerWallet();
  console.log(`\n── E2E hai vai ── escrow ${escrowAddress()}`);
  console.log(`   ví A (đăng + arbiter): ${serverWallet().account.address}`);
  console.log(`   ví B (nhận việc)     : ${w.account.address}`);

  await scenarioBright(amount);
  const dark = await scenarioDark(amount, deadlineMins);
  await refundAfterDeadline(dark.bountyId, dark.deadline);
  await scenarioGrey(amount);

  console.log(`\n${failures === 0 ? "ĐẠT — cả ba kịch bản đúng như thiết kế" : `HỎNG — ${failures} điểm sai`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("LỖI:", e?.shortMessage ?? e?.message ?? e);
  process.exit(1);
});
