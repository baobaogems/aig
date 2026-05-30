# AIG Project Changelog

All significant changes, features, and fixes documented here.

## [v2.0-alpha — Direct CCTPv2 rebuild] — 2026-05-30

### Architecture pivot

**v1 → v2:** dropped BSC SwapRouter + PancakeSwap V3 + CCTPv1/ADMIN_RELAY in favor of **direct CCTPv2 from Ethereum Sepolia → Arc**. Customer signs 2 txs on Sepolia (USDC approve + TokenMessengerV2 7-arg depositForBurn Fast Transfer); server admin wallet calls `receiveMessage` on Arc to mint USDC to merchant. Median end-to-end ~60-120s. v1 codebase preserved at git tag `v1.0` and as a `BRIDGE_BACKEND=v1` rollback branch in tree until Phase 06 full.

ADR (25/05): `@circle-fin/app-kit` SDK was probed during Phase 02 spike — found incompatible with BYO-wallet flows (SDK requires both customer wallet AND server `KIT_KEY` in single call, dual-trust-domain conflict). Pivoted to direct CCTPv2 contract calls via viem; App Kit wrapper + ping route became dead code, removed in Phase 06 partial.

### Files added (v2 active path)

- `frontend/lib/payment-flow-v2.ts` — `usePaymentFlowV2` client hook (approve + 7-arg depositForBurn)
- `frontend/lib/cctp-abi.ts` — ERC20 approve + TokenMessengerV2 ABIs (V2 is 7 args, not v1's 4)
- `frontend/lib/cctp.ts::pollAttestationV2` — queries Iris v2 endpoint (`/v2/messages/{srcDomain}?transactionHash`), returns `{ message, attestation }` in one shot
- `PaymentPageV2` component inline in `app/pay/[id]/page.tsx`
- `docs/v2-smoke-evidence.md` — on-chain proof of e2e

### Files modified

- `frontend/app/api/agent/execute/route.ts`:
  - SSE pipeline refactored to `ReadableStream.start()` callback (was fire-and-forget after Response return; Vercel killed at ~2-3s).
  - Route segment config added: `maxDuration=60`, `runtime="nodejs"`, `dynamic="force-dynamic"`.
  - Headers: `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`.
  - Branches on `BRIDGE_BACKEND` env (v2 → `pollAttestationV2 + receiveMessage`; v1 → unchanged legacy path).
- `frontend/lib/cctp.ts::receiveMessage` — `waitForTransactionReceipt` now fires detached; returns Arc txHash immediately so SSE can close inside Vercel function window. `confirmed` event now means "tx submitted to mempool", not "tx mined".
- `frontend/components/providers.tsx` — added `sepolia` chain to wagmi config (v2 needs `useSwitchChain({ chainId: 11155111 })`).
- `frontend/.env.local` — added 8 v2 env vars (`NEXT_PUBLIC_BRIDGE_BACKEND=v2`, `BRIDGE_BACKEND=v2`, `NEXT_PUBLIC_SOURCE_CHAIN_ID`, `NEXT_PUBLIC_USDC_ADDRESS_SOURCE`, `NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_SOURCE`, `NEXT_PUBLIC_ARC_CCTP_DOMAIN=26`, `ETHEREUM_SEPOLIA_RPC_URL`, `CCTP_MESSAGE_TRANSMITTER_ARC=0xE737e5cE...CE275`).

### Files removed (Phase 06 partial — commits 836b584 + 09f1b42)

- `frontend/lib/appkit.server.ts` (App Kit SDK wrapper — dead code after ADR)
- `frontend/app/api/dev/appkit-ping/route.ts` (+ empty `app/api/dev/`)
- `@circle-fin/app-kit` and `@circle-fin/adapter-viem-v2` deps from `frontend/package.json`
- `V2_ETH_SEPOLIA_SOURCE` export + `sepolia` import from `frontend/lib/cctp.ts` (v2 uses `pollAttestationV2`, no on-chain extraction)
- `KIT_KEY` entry from `frontend/.env.local` (was placeholder; gitignored)

### Critical bug fixes (this release)

| Commit | Fix | Why |
|---|---|---|
| `f1b10c9` | Pin `chainId` on v2 `writeContract` | wagmi v3 was estimating against first chain in `chains[]` (bscTestnet), producing bogus "insufficient funds" errors when connector was on Sepolia |
| `7b3f335` | Explicit gas override (approve=100k, burn=250k) | Public Sepolia RPC gas estimation returned absurd values for proxy contracts |
| `6267fe5` | Pin EIP-1559 fees (50/2 gwei) + correct depositForBurn ABI to **7 args** for TokenMessengerV2 | (a) MetaMask Sepolia gas oracle (Infura) returned absurd `maxFeePerGas`; (b) using v1's 4-arg signature against V2 contract caused silent revert (OKX showed "Third-party contract execution error") |
| `a61911d` | Enable Fast Transfer (`maxFee = amountWei/1000n`, was `0`) | `maxFee=0` forced Iris to treat burn as Standard (waits Sepolia finality ~13-19 min) — server's 120s/180s poll timed out |
| `2d5ded0` | New `pollAttestationV2` against Iris v2 endpoint + SSE close guard | v1's `pollAttestation` polled `{base}/{messageHash}` which 404s for v2 messages (Iris v2 is keyed by `(srcDomain, txHash)`) — silent timeout |
| `e46fe15` | `maxDuration=60` route config + receiveMessage non-blocking | Vercel default streaming timeout was killing pipeline mid-flight |
| `013f43f` | Refactor SSE to `ReadableStream.start()` | Vercel serverless ends function when handler returns — fire-and-forget pipeline got killed at ~2-3s |

### Phase milestones

| Phase | Status | Date |
|---|---|---|
| 03 — Payment page dual-path (CCTPv2 Sepolia→Arc code) | ✅ done | 26-30/05 |
| 04 — Flip default to v2 on Vercel | ✅ done | 30/05 |
| 06 partial — App Kit dead code purge | ✅ done | 30/05 |
| 06 full — v1 stack deletes | gated on 48h prod smoke | (clock from 2026-05-30 12:00 +07:00) |
| 07 — Docs sweep + tag `v2.0-alpha` | in progress | 30/05 |

### On-chain proof

| | Tx hash |
|---|---|
| Sepolia burn (Fast, maxFee=1000) | `0x9a620cf2ff42df5882a8b424094f4d26dd51bbfdd87d3a2070b34aae4edffa16` |
| Arc mint (local server, 30/05) | `0xc0b4cca98ca37963c92d43afaada02c65e093567e6f374d04e667acdf641eb61` |
| Sepolia burn (prod test) | `0x061ad3cafdb7844482e59e1ded5855aa9819620abaac05fc6601fb8e1e4e399a` |
| Arc mint (Vercel prod, 30/05) | `0x240d90f701c5733dda1369459db2d80bccac1146f852f466220df0f968e49545` |

Full prod-debug narrative: see `status_AIG.json` entries 2026-05-25 through 2026-05-30 (logs #44-#53).

### Known limitations carried forward

- Testnet only (Arc + Sepolia testnets; Iris **sandbox** API).
- Merchant receives `amount − ~1bps fee` under Fast Transfer (slightly diverges from "exact USDC" tagline — gross-up is a v2.1 refinement).
- `BRIDGE_BACKEND=v1` rollback still present in code; Phase 06 full removes after 48h prod smoke.

---

## [Phase 1 MVP - Analytics Update] — 2026-03-15

### New Features

**Merchant Analytics**
- New Supabase migration: `003_create_merchants_table.sql` — creates merchants table (id, wallet_address, business_name, created_at)
- Added `customer_wallet` column to payment_sessions for transaction tracking
- New API endpoint: `GET /api/dashboard?wallet=0x...` — returns merchant profile + analytics stats
  - merchantProfile: wallet, businessName, createdAt
  - analyticsStats: totalRevenue, transactionCount, successRate, recentVolume
- New library: `frontend/lib/merchant.ts`
  - `upsertMerchant()` — creates/updates merchant profile
  - `getMerchantStats()` — calculates real-time analytics from payment_sessions
- New component: `frontend/components/dashboard-stat-cards.tsx` — displays 4 analytics stat cards
- Enhanced dashboard page to show merchant profile + real analytics data

---

## [Phase 1 MVP] — 2026-03-13

### Implementation Complete

**Phase 1 Foundation** ✓
- Smoke test implementation: `scripts/test-cctp-domain7.ts` — 7-step CCTP validation flow
- `fetchSpotPrice()` — PancakeSwap V3 QuoterV2 integration for real-time spot price quotes
- `updateSessionStatus()` — Supabase atomic upsert with swap params caching (JSONB)
- Route refactor: split `/api/agent/route.ts` → `/api/agent/quote/route.ts` + `/api/agent/execute/route.ts`
- Payment sessions table schema created with idempotency guard via `session_id` unique constraint
- TypeScript config: ES2020 target, strict mode, path aliases

**Phase 2 ADMIN_RELAY Path** ✓
- `pollSwapCompleted()` — viem receipt parsing for SwapCompleted event on BSC Testnet
- `adminRelay()` — atomic idempotency: checks Supabase `status === 'PENDING'` before transfer on Arc Testnet
- `verifyAdminWalletBalance()` — warns (non-blocking) when balance < 50 USDC
- `getArcChain()` helper — custom viem chain definition for Arc Testnet (ID: 212)
- SSE stream implementation: swap_executing → bridging → confirmed flow

**Phase 3 CCTP Path** ✓
- `extractMessageHash()` — parses MessageSent(bytes) event log from BSC receipt, returns keccak256 hash
- `receiveMessage()` — viem walletClient.writeContract on Arc Testnet (MessageTransmitter)
- `extractRawMessage()` — exports raw message bytes from same receipt fetch
- `pollAttestation()` — Circle API integration (already implemented, 120s timeout)
- Full CCTP pipeline: BSC burn → attestation → Arc mint → confirmed

**Phase 4 UI Components** ✓
- Landing page: `/frontend/app/page.tsx`
- Payment page: `/frontend/app/pay/[id]/page.tsx` — mobile-first, fee breakdown, SSE progress bar
- Merchant dashboard: `/frontend/app/dashboard/page.tsx` — QR generator (60s refresh), payment feed, points balance
- Components created:
  - `fee-breakdown-card.tsx` — quote display with line items
  - `payment-progress-bar.tsx` — SSE-driven 3-step progress (Swap → Bridge → Confirmed)
  - `qr-code-generator.tsx` — QR encode + auto-refresh logic
  - `payment-feed-table.tsx` — real-time payment feed with timestamps
- wagmi provider setup in layout.tsx (v2 compatible)
- Points balance API: `/frontend/app/api/points/route.ts`

**Phase 5 Contract Deployment** ✓
- `Deploy.s.sol` — Foundry script with BRIDGE_MODE branch logic
- Constructor args read from env vars (no hardcoding): WBNB, USDC, PancakeRouter, CCTP messenger (or 0x0 for ADMIN_RELAY), revenue pool
- Deployment flow: dry-run → broadcast → save address to `.env.local` + `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC`

### Dependencies Installed
- Frontend: `viem`, `@supabase/supabase-js`, `wagmi`, `@tanstack/react-query`, `qrcode.react`
- Scripts: `viem`, Circle CCTP integration tested

### Configuration
- `.env.example` updated with all Phase 1 vars: RPC URLs, contract addresses, BRIDGE_MODE, auth keys
- TypeScript strict mode, ES2020 target
- Tailwind 4 CSS framework

### Security Fixes
- Atomic idempotency in `adminRelay()`: `status === 'PENDING'` check + `.eq("status", "PENDING")` atomic update prevents race conditions
- Private key validation: only from env vars, never hardcoded
- Input validation: sessionId, walletAddress, amountUSDC all validated in API routes
- Service role key (Supabase) never exposed client-side

### Known Limitations (Phase 1 PoC)
- ADMIN_RELAY mode disabled on mainnet (fallback only for testnet)
- No authentication on dashboard (wallet-based identity sufficient for PoC)
- QR payload includes expiry (60s window) — no persistent storage of generated sessions
- Points system placeholder — awaiting Phase 2 reward distribution logic

---

## Legend

- ✓ = Complete
- ⚠ = In Progress / Pending
- ✗ = Blocked / Deferred
