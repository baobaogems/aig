# AIG System Architecture (v2.0-rebuild)

Active path: **v2 — direct CCTPv2 from Ethereum Sepolia → Arc Network**.
Legacy v1 (BSC SwapRouter + PancakeSwap + CCTPv1/ADMIN_RELAY) preserved as a `BRIDGE_BACKEND=v1` rollback branch until Phase 06 full cleanup; tag [`v1.0`](../../../tree/v1.0) snapshots the pre-pivot codebase.

## High-level architecture (v2 active)

```
Customer wallet (Sepolia)
    ↓ Tx 1: USDC.approve(TokenMessengerV2, amount)
    ↓ Tx 2: TokenMessengerV2.depositForBurn(
              amount,
              destDomain=26 (Arc),
              mintRecipient=pad(merchantWallet),
              USDC,
              destCaller=bytes32(0),
              maxFee=amount/1000,
              minFinality=1000      // Fast Transfer
            )
    ↓ burnTx hash
Frontend (PaymentPageV2)
    ↓ POST /api/agent/execute
    ↓ { sessionId, swapTxHash, merchantWallet, targetUSDC }
SSE pipeline (anchored in ReadableStream.start(), maxDuration=60s)
    ├─ emit swap_executing
    ├─ updateSessionStatus → SWAP_EXECUTING
    ├─ emit bridging
    ├─ pollAttestationV2(burnTx, sourceDomain=0)
    │     → GET https://iris-api-sandbox.circle.com/v2/messages/0?transactionHash=...
    │     → typical resolution 30-90s (Fast Transfer at "confirmed" attestation level)
    │     → returns { message: bytes, attestation: bytes }
    ├─ receiveMessage(message, attestation) via admin wallet on Arc
    │     → MessageTransmitter.receiveMessage(message, attestation)
    │     → returns Arc txHash immediately (waitForTransactionReceipt fires detached)
    ├─ emit confirmed { txHash, bridgeMode: "CCTP", backend: "v2" }
    └─ awardPoints → controller.close()
Arc Network
    └─ USDC minted to merchant (net = amount − ~1bps protocol fee)
Merchant dashboard
    ├─ Supabase real-time → PaymentFeedTable refresh
    └─ GET /api/dashboard + /api/points
```

## Component breakdown

### 1. Client (`/pay/[id]/page.tsx`)

`PaymentPageWrapper` dispatches on `NEXT_PUBLIC_BRIDGE_BACKEND`:
- `v2` → `PaymentPageV2` (active) — uses `usePaymentFlowV2` from `lib/payment-flow-v2.ts`.
- `v1` → `PaymentPage` (legacy) — calls `/api/agent/quote` and signs `SwapRouter.swapAndBridge`.

`usePaymentFlowV2.handlePay()`:
1. `useSwitchChain → 11155111` (Sepolia)
2. `writeContract → USDC.approve(TokenMessenger, amountWei)` — `chainId` pinned + EIP-1559 fee pin (`maxFeePerGas=50 gwei`, `maxPriorityFeePerGas=2 gwei`) + `gas=100_000n`
3. `writeContract → TokenMessengerV2.depositForBurn(7 args)` — same chainId/fee pins + `gas=250_000n`
4. POST burn txHash to `/api/agent/execute`; read SSE stream → drive `PaymentProgressBar`

`maxFee = amountWei / 1000n || 1n` (0.1% ceiling — must be > 0 for Iris to classify as Fast Transfer; actual charge is ~1bps).
`minFinalityThreshold = 1000` (Fast — Iris attests at "confirmed" level in ~30-90s, vs ~13-19min for `=2000` Standard).

### 2. Server SSE route (`/api/agent/execute/route.ts`)

Route segment config: `maxDuration = 60`, `runtime = "nodejs"`, `dynamic = "force-dynamic"`.
Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`.

The pipeline runs **inside `ReadableStream.start()`** so Vercel's serverless function lifetime is tied to `controller.close()`. The earlier fire-and-forget pattern (return Response, run pipeline in background) was killed by Vercel at ~2-3s.

Branches on `BRIDGE_BACKEND` env (server-side mirror of `NEXT_PUBLIC_BRIDGE_BACKEND`):
- `v2`: `pollAttestationV2 → receiveMessage on Arc` (current active path)
- `v1`: `pollSwapCompleted` (BSC) → `extractMessageHash` + `pollAttestation` (CCTPv1 API) + `receiveMessage`, or `adminRelay` fallback (legacy)

Errors during the pipeline surface as `event: error` with `{ message }`; the catch in `start()` calls `controller.close()` cleanly.

### 3. CCTPv2 helpers (`lib/cctp.ts` and `lib/cctp-abi.ts`)

| Export | Used by |
|---|---|
| `pollAttestationV2(txHash, sourceDomain, timeoutMs)` | v2 execute route |
| `receiveMessage(message, attestation)` | both v1 + v2 — admin wallet `writeContract` to Arc MessageTransmitter; returns Arc txHash immediately, `waitForTransactionReceipt` runs detached |
| `extractMessageHash`, `extractRawMessage`, `extractMessageBytesFromReceipt`, `pollAttestation`, `V1_BSC_SOURCE`, `SourceChainConfig` | v1 only — kept for rollback |
| `IRIS_V2_BASE` | constant, default `https://iris-api-sandbox.circle.com/v2`; override via `CIRCLE_IRIS_API_V2` env |

`cctp-abi.ts` exports `ERC20_APPROVE_ABI` and the 7-arg `CCTP_TOKEN_MESSENGER_ABI` (TokenMessengerV2 depositForBurn).

### 4. Database (Supabase)

Tables unchanged from Phase 1:
- `payment_sessions` — `(session_id unique, status, bridge_mode, merchant_wallet, customer_wallet, target_usdc, swap_params jsonb, created_at, updated_at)`
- `merchants` — `(wallet_address unique, business_name, created_at)`
- `points_ledger` — `(merchant_wallet, txn_type, points_awarded, session_id)`
- `points_balance` — `(merchant_wallet pk, total_points, current_tier)`

Migrations: `001_create_payment_sessions.sql`, `002_create_points_tables.sql`, `003_create_merchants_table.sql`.

### 5. Dashboard (`/dashboard/page.tsx`)

Pencil UI; unchanged from Phase 1. Wagmi connect → upsertMerchant → `/api/dashboard` for `merchantProfile` + `analyticsStats` → Supabase real-time subscription to `payment_sessions` → `/api/points` for tier.

## Bridge modes

### v2 CCTPv2 Fast Transfer (PRIMARY, active)

| Field | Value |
|---|---|
| Source chain | Ethereum Sepolia (chain id 11155111, CCTP domain 0) |
| Destination chain | Arc Testnet (CCTP domain 26 — **not 7**, which is Polygon's domain; the `=7` value in `ARC_CCTP_DOMAIN_ID` env was a v1 bug, fixed in Phase 03) |
| TokenMessenger (Sepolia) | `0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa` (TokenMessengerV2) |
| MessageTransmitter (Arc) | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` |
| USDC (Sepolia) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| USDC (Arc) | `0x3600000000000000000000000000000000000000` |
| Attestation API | `https://iris-api-sandbox.circle.com/v2/messages/{srcDomain}?transactionHash=...` |
| Attestation timeout | 180s (Fast Transfer typically resolves in 30-90s) |
| Protocol fee | ~1bps deducted at mint (actual; the `maxFee` argument is a ceiling, not the charge) |

### v1 CCTPv1 (BSC, LEGACY rollback)

`BSC SwapCompleted → extract MessageSent log → keccak256 → poll CCTPv1 API → Arc receiveMessage`. The CCTPv1 API endpoint is keyed by `messageHash`, not by `(srcDomain, txHash)` — incompatible with v2 burns.

### v1 ADMIN_RELAY (BSC, LEGACY fallback)

`BSC SwapCompleted poll (30s) → Supabase atomic guard (status=PENDING) → admin wallet USDC.transfer on Arc`. Testnet-only; disabled on mainnet.

## Data flow — v2 payment

1. Merchant generates `/pay/<sessionId>?merchant=<arc-addr>&amount=<usdc>` URL (QR or share link).
2. Customer opens URL → wagmi → connect injected wallet → switchChain to Sepolia.
3. Customer clicks Pay → 2 signatures (approve + depositForBurn) via wallet popup.
4. Client POSTs burn txHash to `/api/agent/execute`.
5. Server SSE: `swap_executing` → `bridging` → `confirmed`. Total wall time ~60-120s (attestation dominates).
6. Admin wallet mint tx is submitted on Arc. `confirmed` event carries the Arc txHash; the receipt mines independently within ~5-10s on Arc.
7. `awardPoints` runs after `confirmed`. Dashboard's Supabase subscription picks up the new row.

## Key design decisions

| Decision | Why |
|---|---|
| **Strangler-fig `NEXT_PUBLIC_BRIDGE_BACKEND`** | Toggle v1↔v2 without a redeploy of code; rollback = flip 2 env vars on Vercel + redeploy (~2 min) |
| **SSE pipeline in `ReadableStream.start()`** | Vercel serverless function ends when handler returns; anchoring the pipeline in `start()` ties it to `controller.close()`. Local Next dev did not enforce this lifetime, masking the bug until prod smoke 30/05 |
| **Non-blocking Arc receipt in `receiveMessage`** | `writeContract` returns the Arc txHash as soon as the tx is in the mempool; `waitForTransactionReceipt` fires detached. SSE response closes in ~2-3s, well under any serverless timeout. Tradeoff: the `confirmed` SSE event means "tx submitted", not "tx mined" — merchant should reconcile via dashboard polling for finality. |
| **CCTPv2 Fast Transfer (`maxFee > 0`)** | `maxFee = amountWei / 1000n` ensures Iris classifies as Fast (attestation ~30-90s) vs Standard (~13-19min finalized — would time out the 180s poll) |
| **Iris v2 endpoint over v1** | v2 returns both raw message + attestation in one shot keyed by (srcDomain, txHash); v1's `/{messageHash}` pattern does not match v2 burns at all (silent 404 / never matches) |
| **EIP-1559 fee pin on Sepolia writes** | MetaMask's default Sepolia gas oracle (Infura) sometimes returns absurd `maxFeePerGas`, triggering false "insufficient funds for network fees" in the popup; pinning `50 gwei` ceiling bypasses MM's oracle. (OKX wallet does not have this bug.) |
| **chainId pinned on `writeContract`** | wagmi v3 otherwise estimates against the first chain in `chains[]`, producing bogus errors when the connector is on a different chain |
| **Atomic idempotency in v1 admin relay** | Supabase `.eq("status","PENDING")` atomic update prevents duplicate transfers on retry (v1 only) |
| **Client-side-only payment + dashboard pages** | wagmi needs browser env; pages are `"use client"` |

## Security

| Surface | Control |
|---|---|
| Auth | Wallet-based identity (PoC); no auth system |
| Admin private key | `AIG_ADMIN_WALLET_PRIVATE_KEY` env-only, server-side only; required for `receiveMessage` on Arc |
| Input validation | `/api/agent/execute` validates `sessionId` (string), `swapTxHash` (`/^0x[0-9a-fA-F]{64}$/`), `merchantWallet` (`/^0x[0-9a-fA-F]{40}$/`), `targetUSDC` (positive number) |
| Tx finality | `confirmed` SSE event = mempool submission; merchant should re-check Supabase session row or Arc explorer for mining |
| Timeouts | `pollAttestationV2 = 180s`; v1 `pollAttestation = 120s`; v1 `pollSwapCompleted = 30s`; `receiveMessage` receipt wait = 60s (detached, best-effort) |
| Route config | `/api/agent/execute`: `maxDuration=60`, `runtime=nodejs`, `dynamic=force-dynamic`, `X-Accel-Buffering: no` |

## Performance

- `pollAttestationV2`: 5s polling interval, attestation usually ready on first poll (~200ms response from Iris cache once Sepolia hits "confirmed" level — typically 30-90s after burn).
- Arc mint receipt: typically mines within 5-10s on Arc Testnet (~2-3s block time).
- Supabase queries: <200ms (indexed on `session_id`).
- SSE total wall time per payment: 60-120s (attestation dominates).

## Known limitations

- Testnet only (Arc + Sepolia testnets; CCTP V2 sandbox API).
- Merchant receives `amount − ~1bps fee` under v2 Fast Transfer — slightly diverges from the "exact USDC" tagline; gross-up (burn `amount + fee` so merchant gets `amount` net) is a v2.1 refinement.
- Phase 06 full (v1 stack deletes) gated on 48h prod smoke clock.
- No multi-source-chain support yet (Base/Avalanche/Linea etc. would need additional `payment-flow-vN` hooks + chain registration in wagmi config).

## See also

- `architecture_AIG.json` — JSON canon (machine-readable; cross-AI primary)
- `codebase-summary.md` — module-by-module file responsibilities
- `project-changelog.md` — entry-level change history
- `development-roadmap.md` — phase status + timeline
- `plans/260525-2023-aig-v2-app-kit-rebuild/` — phase plans + reports
