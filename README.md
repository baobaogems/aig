# ARC Invisible Gateway (AIG)

> Pay with anything. Receive USDC. Invisibly.

Cross-chain payment infrastructure: customers sign two transactions on Ethereum Sepolia (approve + CCTPv2 burn); the server's admin relay mints USDC to the merchant on Arc Network. Median end-to-end: ~60-90 seconds via CCTPv2 Fast Transfer.

> **History:** v1 (SwapRouter.sol on BSC Testnet + PancakeSwap + CCTPv1/ADMIN_RELAY) is preserved at git tag [`v1.0`](../../tree/v1.0). The current `main` runs v2 (CCTPv2 direct from Ethereum Sepolia to Arc — no Solidity contracts of our own). The v1 codepath remains in the source tree as a rollback-only `BRIDGE_BACKEND=v1` branch until the Phase 06 full cleanup.

## Quick start

```bash
bash scripts/setup.sh             # one-shot — installs deps + scaffolds .env
cd frontend && npm run dev        # http://localhost:3000
```

Set `NEXT_PUBLIC_BRIDGE_BACKEND=v2` in `frontend/.env.local` to use the active path. See "Env vars" below for the full v2 set.

## Monorepo

```
/aig_project
├── frontend/                          # Next.js 16 (App Router) + admin relay API
│   ├── app/
│   │   ├── page.tsx                   # redirect → /dashboard
│   │   ├── dashboard/page.tsx         # merchant dashboard (Pencil UI)
│   │   ├── pay/[id]/page.tsx          # customer payment page (PaymentPageV2 active)
│   │   └── api/
│   │       ├── agent/execute/route.ts # POST /api/agent/execute (SSE; ReadableStream-anchored)
│   │       ├── agent/quote/route.ts   # v1-only legacy (kept for rollback)
│   │       ├── dashboard/route.ts     # GET /api/dashboard
│   │       └── points/route.ts        # GET /api/points
│   ├── lib/
│   │   ├── payment-flow-v2.ts         # v2 client hook: approve + depositForBurn (CCTPv2, 7-arg Fast)
│   │   ├── cctp-abi.ts                # minimal ERC20 + TokenMessengerV2 ABIs
│   │   ├── cctp.ts                    # pollAttestationV2 (Iris v2) + receiveMessage on Arc + v1 helpers
│   │   ├── agent.ts                   # v1-only legacy quote helpers
│   │   ├── mock-bridge.ts             # v1-only admin-relay fallback
│   │   ├── chains.ts                  # Arc Testnet viem chain
│   │   ├── points.ts, merchant.ts     # shared (v1+v2)
│   └── supabase/migrations/           # 001–003 (sessions, points, merchants)
├── contracts/                         # v1 LEGACY — Foundry/SwapRouter.sol; scheduled deletion in Phase 06 full
├── scripts/                           # v1 smoke (CCTP domain 7 test) — legacy
├── docs/                              # source-of-truth markdown (see below)
└── plans/                             # phased plans + reports (260525 v2 rebuild)
```

## Active path (v2 CCTPv2 Sepolia → Arc)

1. Customer connects wallet on `/pay/<sessionId>?merchant=<arc-addr>&amount=<usdc>` — wagmi auto-switches to Sepolia.
2. **Tx 1:** `USDC.approve(TokenMessengerV2, amount)` on Sepolia.
3. **Tx 2:** `TokenMessengerV2.depositForBurn(amount, 26, mintRecipient, USDC, destCaller=0, maxFee, minFinality=1000)` on Sepolia — 7-arg Fast Transfer.
4. Client POSTs the burn tx hash to `/api/agent/execute`. Server streams SSE events (`swap_executing` → `bridging` → `confirmed`):
   - `pollAttestationV2(txHash, sourceDomain=0)` against Iris v2 (`/v2/messages/0?transactionHash=...`) — typically resolves in 30-90 seconds.
   - Admin wallet calls `MessageTransmitter.receiveMessage(message, attestation)` on Arc (non-blocking receipt: SSE confirms on submit, mint mines independently).
5. Dashboard reflects the new payment via Supabase real-time subscription; `awardPoints` updates the merchant balance.

Merchant receives `amount` minus a ~1bps protocol fee (CCTPv2 Fast Transfer; charged at mint).

## API endpoints

| Method | Path | State |
|---|---|---|
| `POST` | `/api/agent/execute` | Active — branches on `BRIDGE_BACKEND` env (v2 → CCTPv2 path; v1 → BSC path). SSE pipeline anchored in `ReadableStream.start()` for Vercel serverless lifetime safety. `maxDuration=60` route segment config. |
| `POST` | `/api/agent/quote` | **v1 ONLY** — `PaymentPageV2` does not call this. Returns 500 if invoked (viem checksum on hardcoded Quoter fallback). Removed in Phase 06 full. |
| `GET`  | `/api/dashboard` | Merchant profile + analytics (total revenue, txn count, success rate, recent volume) |
| `GET`  | `/api/points` | `{ totalPoints, tier }` |

## Env vars

| Group | Vars |
|---|---|
| **v2 active** | `NEXT_PUBLIC_BRIDGE_BACKEND=v2`, `BRIDGE_BACKEND=v2`, `NEXT_PUBLIC_SOURCE_CHAIN_ID=11155111`, `NEXT_PUBLIC_USDC_ADDRESS_SOURCE`, `NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_SOURCE`, `NEXT_PUBLIC_ARC_CCTP_DOMAIN=26`, `ETHEREUM_SEPOLIA_RPC_URL`, `CCTP_MESSAGE_TRANSMITTER_ARC=0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`, `AIG_ADMIN_WALLET_PRIVATE_KEY`, `AIG_ADMIN_WALLET_ADDRESS`, `ARC_TESTNET_RPC_URL` |
| **v2 optional** | `CIRCLE_IRIS_API_V2` (override default `https://iris-api-sandbox.circle.com/v2`) |
| **v1 rollback only** | `BSC_TESTNET_RPC_URL`, `USDC_ADDRESS_BSC_TESTNET`, `PANCAKESWAP_V3_ROUTER_BSC`, `PANCAKESWAP_V3_QUOTER_BSC`, `WBNB_ADDRESS_BSC`, `CCTP_TOKEN_MESSENGER_BSC`, `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC`, `SWAP_ROUTER_ADDRESS_BSC`, `BRIDGE_MODE`, `CIRCLE_ATTESTATION_API` |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

See `.env.example` for the full reference. Removed in Phase 06 partial: `KIT_KEY` (App Kit dropped per ADR), `ARC_CCTP_DOMAIN_ID=7` (was Polygon's domain — v2 bug fix).

## Architecture

- **`architecture_AIG.json`** (repo root, JSON) — machine-readable current-state map; cross-AI canon (read first per [CONTRIBUTING.md](./CONTRIBUTING.md)).
- **`docs/system-architecture.md`** — narrative architecture with diagrams.
- **`docs/codebase-summary.md`** — module-by-module file responsibilities.

## Smoke evidence

End-to-end Sepolia → Arc payments captured for the submission: see [`docs/v2-smoke-evidence.md`](./docs/v2-smoke-evidence.md).

## Status snapshot

- Phase 03 (v2 payment page) ✅ done
- Phase 04 (Vercel env flip) ✅ done
- Phase 06 partial (App Kit dead code) ✅ done
- Phase 06 full (v1 stack deletes) ⏳ gated on 48h prod smoke clock (start 2026-05-30 12:00 +07:00)
- Phase 07 (docs sweep + tag) ⏳ in progress

Tracked in [`roadmap_AIG.json`](./roadmap_AIG.json) → `v2-cctp-rebuild`.
