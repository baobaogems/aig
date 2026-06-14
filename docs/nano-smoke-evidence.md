# v3 Nanopayment Smoke Evidence (Phase 1)

On-chain + Gateway proof that the AIG v3 agentic nanopayment flow works end-to-end on
Arc testnet: an autonomous agent pays a sub-cent USDC nanopayment to an AIG-served
x402 endpoint via Circle Gateway. Captured for the Stablecoins Commerce Stack Challenge /
Circle grant. Built ON TOP of frozen v2.2 (CCTP) — separate stack, see PRD_v3.

## Mechanism (NOT CCTP)
x402 (HTTP 402) + Circle Gateway batched settlement. SDK `@circle-fin/x402-batching` v3.0.4.
Off-chain signed authorization → batched on-chain settlement (gas-free, sub-cent). This is
why each nanopayment has a Gateway settlement reference (UUID), NOT an individual on-chain
tx hash — settlement is batched. The on-chain artifact at this phase is the Gateway deposit.

## Test wallets
| Role | Address |
|---|---|
| Buyer (agent funder) | `0xBF2DCFa2C09726DFF0DdD6b5273f6F4D91500B91` |
| Seller (receives USDC) | `0x0809a724862D6636874809775Ba3623080c5ceF8` (reused AIG admin wallet, demo) |

> Demo reuses the AIG admin wallet as the single Gateway seller. Production multi-merchant
> routing of nanopayments is unresolved (Circle Gateway is seller-account-centric) → v3.1.

## Endpoint
- `GET /api/nanopay/quote` — price **$0.001 USDC**, network Arc Testnet `eip155:5042002`.
- Unpaid → `HTTP 402` + `PAYMENT-REQUIRED` header. Paid → `200` + resource JSON + `PAYMENT-RESPONSE` header.

## Run — 2026-06-13, local Next dev (:3000)
| Step | Detail |
|---|---|
| Gateway deposit (on-chain Arc) | `0x52f78a885d3190aa6360573976a402ffbe7d98eb6f1be0fed6338517030e6d23` (0.1 USDC) |
| Nanopayment #1 | status `200` · `0.001` USDC · settle id `242f14ed-1736-4a42-8c83-e2cc5f9fbc3e` |
| Nanopayment #2 | status `200` · `0.001` USDC · settle id `016a43a8-57b3-4f77-b6f4-a41676caea39` |
| Resource returned | `{"quote":"AIG nanopayment OK — agent paid sub-cent USDC on Arc.", ...}` |
| Buyer balance | 20 USDC → wallet 19.897 / Gateway available 0.098 after deposit + 2 pays |

## Run — 2026-06-14, per-call demo (`--calls 3`)
Metered pay-per-use: 3 sequential nanopayments, each settled + recorded + points-awarded.
| # | Result |
|---|---|
| 1 | HTTP 200 · 0.001 USDC · settle `cf6bd506-0e25-4fb5-8268-705d87826c57` |
| 2 | HTTP 200 · 0.001 USDC · settle `baa5ef48-c0c2-4b86-8d77-13bcbab76a28` |
| 3 | HTTP 200 · 0.001 USDC · settle `9af5ec16-3d10-4bc2-91cc-b78c986bcf02` |
| total | 0.003 USDC · each row in `payment_sessions` (bridge_mode=NANOPAY) + `points_ledger` |

Command: `npx tsx scripts/nano-agent.mts --calls 3`

## Verify (any reviewer can reproduce)
```bash
# 402 challenge (no payment)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/nanopay/quote   # -> 402

# On-chain Gateway deposit on Arc testnet
curl -s -X POST https://rpc.testnet.arc.network -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["0x52f78a885d3190aa6360573976a402ffbe7d98eb6f1be0fed6338517030e6d23"]}'

# Full e2e (needs funded BUYER_PRIVATE_KEY in frontend/.env.local)
npx tsx scripts/nano-agent.mts
```

## v3.1 — aggregation + anti-spam (2026-06-14)
Per-call rows replaced by ONE rolling `nano_agents` row per (agent, merchant) via atomic
`nano_record()` (migration 005); points flushed to `points_ledger` only per $0.01 volume.
E2E `--calls 12`:
| Check | Result |
|---|---|
| `nano_agents` | 1 row: call_count=12, total_usdc=0.012, points_awarded=0.010 |
| `points_ledger` | 1 batched row (0.01) — NOT 12 |
| `payment_sessions` NANOPAY | 0 (per-call dropped) |
| `GET /api/nanopay/agents` | aggregate {12 calls, $0.012} |

Result: 12 sub-cent payments → 1 aggregate row + 1 points row. Spam can't farm points
(points track real USD, batched). Migrations 004+005 applied to live Supabase.

## Known wrinkles (non-blocking)
- **Deposit credit lag**: Gateway credits a deposit to `available` a few seconds AFTER the
  on-chain deposit confirms. First run pre-fix failed `settlement failed` (settle raced the
  credit). Fixed: `scripts/nano-agent.mts` now polls `getBalances()` until credited (≤90s)
  before paying. Subsequent pays (Gateway already funded) are instant.
- **Per-nanopayment hash**: none by design (batched). Use the deposit tx + settle UUID as proof.
- **Phase 1 scope**: receive + log only. No DB row, no points yet (P2/P3). v2.2 CCTP untouched.
