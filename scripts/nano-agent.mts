// =============================================================================
// nano-agent.mts — AIG v3 Phase 1 demo BUYER (mock agent, no LLM).
//
// A script acting as an autonomous agent that pays ONE x402 nanopayment to the
// AIG seller endpoint on Arc testnet via Circle Gateway. Proves Phase 1
// acceptance: one successful nanopayment tx on testnet, logged.
//
// Two-step UX (single file):
//   1st run (no BUYER key)  -> generate buyer wallet, write to frontend/.env.local,
//                              print address + Circle faucet instructions, exit.
//   2nd run (after funding) -> deposit into Gateway + pay /api/nanopay/quote once.
//
// Run from repo root:  npx tsx scripts/nano-agent.mts
// API per @circle-fin/x402-batching v3.0.4 (verified from SDK types).
// =============================================================================

import { GatewayClient } from "@circle-fin/x402-batching/client";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import fs from "node:fs";
import path from "node:path";

const ENV_PATH = path.resolve(import.meta.dirname, "../frontend/.env.local");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/nanopay/quote`;
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT ?? "0.1";
// --calls N : how many per-use nanopayments to make (default 1). Demonstrates
// the metered, pay-per-call nature of agentic nanopayments.
const CALLS = (() => {
  const i = process.argv.indexOf("--calls");
  const n = i >= 0 ? parseInt(process.argv[i + 1], 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
})();

// Read a key from frontend/.env.local (script doesn't depend on run flags).
function readEnvLocal(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  if (!fs.existsSync(ENV_PATH)) return undefined;
  const m = fs
    .readFileSync(ENV_PATH, "utf-8")
    .match(new RegExp(`^${key}=(.*)$`, "m"));
  return m?.[1]?.trim();
}

function appendEnvLocal(lines: Record<string, string>) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : "";
  for (const [k, v] of Object.entries(lines)) {
    const re = new RegExp(`^${k}=.*$`, "m");
    const line = `${k}=${v}`;
    content = re.test(content) ? content.replace(re, line) : content.trimEnd() + "\n" + line;
  }
  fs.writeFileSync(ENV_PATH, content.trimEnd() + "\n");
}

async function main() {
  const buyerKey = readEnvLocal("BUYER_PRIVATE_KEY") as `0x${string}` | undefined;

  // --- First run: no buyer wallet yet -> generate + instruct funding ---
  if (!buyerKey || !buyerKey.startsWith("0x") || buyerKey.length !== 66) {
    const pk = generatePrivateKey();
    const addr = privateKeyToAccount(pk).address;
    appendEnvLocal({ BUYER_ADDRESS: addr, BUYER_PRIVATE_KEY: pk });
    console.log("\n=== Buyer wallet generated (written to frontend/.env.local) ===");
    console.log(`  Address: ${addr}`);
    console.log("\nNEXT: fund this address with Arc Testnet USDC, then re-run.");
    console.log("  Faucet: https://faucet.circle.com/  (select Arc Testnet)");
    console.log("  Then:   npx tsx scripts/nano-agent.mts\n");
    return;
  }

  // --- Second run: pay one nanopayment ---
  const gateway = new GatewayClient({ chain: "arcTestnet", privateKey: buyerKey });
  console.log(`Buyer: ${gateway.address}`);

  const before = await gateway.getBalances();
  console.log(
    `Wallet USDC: ${before.wallet.formatted} | Gateway available: ${before.gateway.formattedAvailable}`,
  );

  // Deposit into Gateway if available balance can't cover the $0.001 call.
  if (before.gateway.available < 1_000n) {
    if (before.wallet.balance === 0n) {
      console.error(
        "\nBuyer wallet has 0 USDC. Fund it via https://faucet.circle.com/ (Arc Testnet), then re-run.",
      );
      process.exit(1);
    }
    console.log(`Depositing ${DEPOSIT_AMOUNT} USDC into Gateway...`);
    const dep = await gateway.deposit(DEPOSIT_AMOUNT);
    console.log(`  deposit tx: ${dep.depositTxHash}`);

    // Gateway credits the deposit to "available" with a few seconds of indexing
    // lag after the on-chain tx confirms. Poll until the balance can cover the
    // $0.001 call, else the first settle races the credit and fails.
    const NEEDED = 1_000n; // $0.001 in USDC atomic units (6 decimals)
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      const b = await gateway.getBalances();
      if (b.gateway.available >= NEEDED) {
        console.log(`  credited — available: ${b.gateway.formattedAvailable}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 3_000));
    }
  }

  console.log(`\nAgent paying ${CALLS} nanopayment(s) -> ${ENDPOINT}\n`);
  const settled: string[] = [];
  let total = 0;
  for (let i = 1; i <= CALLS; i++) {
    const res = await gateway.pay(ENDPOINT, { method: "GET" });
    total += parseFloat(res.formattedAmount);
    settled.push(res.transaction);
    console.log(
      `  #${i}  HTTP ${res.status}  paid ${res.formattedAmount} USDC  settle=${res.transaction}`,
    );
  }

  const seller = readEnvLocal("NANOPAY_SELLER_ADDRESS") ?? "(unset)";
  console.log("\n=== DEMO SUMMARY ===");
  console.log(`  buyer (agent): ${gateway.address}`);
  console.log(`  seller:        ${seller}`);
  console.log(`  payments:      ${CALLS}  ·  total ${total.toFixed(6)} USDC`);
  console.log(`  settle ids:    ${settled.join(", ")}`);
  console.log(`  dashboard:     ${BASE_URL}/dashboard  (connect seller wallet -> feed + points)`);
}

main().catch((e) => {
  console.error("nano-agent failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
