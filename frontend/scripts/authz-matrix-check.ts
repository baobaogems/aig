// =============================================================================
// authz-matrix-check.ts — walk the authorization matrix against a RUNNING server.
//
//   npm run authz:check                      # against http://localhost:3000
//   BASE=https://myarbiter.xyz npm run authz:check
//
// This replays the exact attack chain that was open before Phase 05 of
// plans/260920-0835-arbiter-self-serve-two-roles:
//
//   POST /api/bounty {worker_id: attacker}  →  approve-rubric (server locks USDC)
//     →  /api/submission  →  /api/judge     →  auto-release       (up to 150 USDC/day)
//
// Every line below must be 401 (not signed in) or 403 (signed in as a stranger). A 200
// anywhere means the hole is back. Read-only: it never creates a bounty and never moves money.
//
// The signing key is Anvil's well-known test account #1 — public by design, worthless.
// =============================================================================

import { privateKeyToAccount } from "viem/accounts";
import { buildSiweMessage } from "../lib/auth/siwe-message";

const BASE = process.env.BASE ?? "http://localhost:3000";
const STRANGER = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
);

let failures = 0;

function check(label: string, actual: number, allowed: number[]) {
  const ok = allowed.includes(actual);
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label.padEnd(42)} ${actual} ${ok ? "" : `(mong đợi ${allowed.join(" hoặc ")})`}`);
}

async function signIn(): Promise<string> {
  const d = await (await fetch(`${BASE}/api/auth/nonce`)).json();
  const message = buildSiweMessage({
    domain: d.domain,
    address: STRANGER.address,
    chainId: d.chainId,
    nonce: d.nonce,
    issuedAt: d.issuedAt,
  });
  const signature = await STRANGER.signMessage({ message });
  const r = await fetch(`${BASE}/api/auth/siwe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: STRANGER.address, nonce: d.nonce, issuedAt: d.issuedAt, signature }),
  });
  if (!r.ok) throw new Error(`đăng nhập thất bại: ${r.status}`);
  return (r.headers.get("set-cookie") ?? "").split(";")[0];
}

function post(path: string, body: object, cookie?: string) {
  return fetch(BASE + path, {
    method: "POST",
    headers: cookie ? { "Content-Type": "application/json", cookie } : { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function main() {
  console.log(`\n── ma trận phân quyền — ${BASE} ──\n`);

  const list = await (await fetch(`${BASE}/api/bounty`)).json();
  const victim = list.bounties?.[0];
  if (!victim) {
    console.error("Không có bounty nào trong DB để kiểm. Tạo một cái rồi chạy lại.");
    process.exit(2);
  }
  const id = victim.id;
  const writes: [string, string, object][] = [
    ["POST /api/submission", "/api/submission", { bounty_id: id, content: "nội dung dài hơn mười ký tự" }],
    ["POST /api/judge", "/api/judge", { bounty_id: id }],
    ["POST /api/escalation", "/api/escalation", { bounty_id: id, verdict_id: "x", poster_action: "APPROVE" }],
    ["POST /api/refund", "/api/refund", { bounty_id: id }],
    ["POST /api/settlement/object", "/api/settlement/object", { bounty_id: id, note: "lý do đủ dài để qua kiểm" }],
  ];

  // /api/settlement/finalize is deliberately NOT in this matrix: it is open to any caller by
  // design, because a worker owed money must not depend on this platform being reachable.
  // It takes one argument and has one outcome, so "anyone may call it" is the feature.

  console.log("chưa đăng nhập — mọi thứ phải 401:");
  const create = await post("/api/bounty", {
    poster_id: STRANGER.address,
    worker_id: STRANGER.address,
    brief: "Viết một bài ngắn 250-400 từ bằng tiếng Việt giới thiệu CCTP.",
    amount_usdc: 50,
    deadline: new Date(Date.now() + 864e5).toISOString(),
  });
  check("POST /api/bounty (bước 1 chuỗi tấn công)", create.status, [401]);
  check("POST /api/bounty/:id/approve-rubric", (await post(`/api/bounty/${id}/approve-rubric`, {})).status, [401]);
  for (const [label, path, body] of writes) check(label, (await post(path, body)).status, [401]);

  console.log("\nđăng nhập bằng ví lạ — mọi thứ phải 403 (hoặc 404 nếu không được biết bounty tồn tại):");
  const cookie = await signIn();
  check("POST /api/bounty/:id/approve-rubric", (await post(`/api/bounty/${id}/approve-rubric`, {}, cookie)).status, [403, 404]);
  for (const [label, path, body] of writes) check(label, (await post(path, body, cookie)).status, [403, 404]);

  console.log("\nđọc công khai — hồ sơ mở, bài nộp thì không:");
  const pub = await (await fetch(`${BASE}/api/bounty?id=${id}`)).json();
  const leaked = (pub.submission?.content_snapshot ?? "").length > 0;
  if (leaked) failures++;
  console.log(`  ${leaked ? "✗" : "✓"} nội dung bài nộp với người ngoài   ${leaked ? "BỊ LỘ" : "đã ẩn"}`);

  console.log(`\n${failures === 0 ? "ĐẠT — không có lỗ nào" : `HỎNG — ${failures} chỗ sai`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("LỖI:", e?.message ?? e);
  process.exit(1);
});
