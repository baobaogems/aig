# AIG Codebase Summary (v2.0-rebuild)

Module-by-module map of files and responsibilities. Active path is v2; v1 files remain in tree as rollback until Phase 06 full cleanup.

## Directory tree

```
aig_project/
├── frontend/                          # Next.js 16 App Router (React 19, TS strict)
│   ├── app/
│   │   ├── page.tsx                   # redirect → /dashboard
│   │   ├── layout.tsx                 # WagmiProvider, QueryClientProvider
│   │   ├── pay/[id]/page.tsx          # PaymentPageWrapper → PaymentPageV2 (active) | PaymentPage (v1 legacy)
│   │   ├── dashboard/page.tsx         # Merchant dashboard (Pencil UI)
│   │   └── api/
│   │       ├── agent/
│   │       │   ├── quote/route.ts     # v1 only (legacy) — returns 500 if called by v2 client
│   │       │   └── execute/route.ts   # ACTIVE — SSE, ReadableStream-anchored, branches on BRIDGE_BACKEND
│   │       ├── dashboard/route.ts     # GET /api/dashboard
│   │       └── points/route.ts        # GET /api/points
│   ├── components/
│   │   ├── providers.tsx              # WagmiConfig: bscTestnet + sepolia chains, injected connector
│   │   ├── payment-progress-bar.tsx   # SSE-driven step indicator (used by both v1 and v2)
│   │   ├── fee-breakdown-card.tsx     # v1 only — quote display
│   │   ├── qr-code-generator.tsx      # dashboard
│   │   ├── payment-feed-table.tsx     # dashboard
│   │   └── dashboard-stat-cards.tsx   # dashboard
│   ├── lib/
│   │   ├── payment-flow-v2.ts         # ACTIVE — usePaymentFlowV2 hook (approve + 7-arg depositForBurn Fast)
│   │   ├── cctp-abi.ts                # ACTIVE — ERC20 approve + TokenMessengerV2 ABI
│   │   ├── cctp.ts                    # v2: pollAttestationV2, receiveMessage. v1: extract* + pollAttestation
│   │   ├── chains.ts                  # getArcChain() viem Arc Testnet
│   │   ├── points.ts                  # awardPoints, getPointsBalance
│   │   ├── merchant.ts                # upsertMerchant, getMerchantStats
│   │   ├── agent.ts                   # v1 only — fetchSpotPrice, calculateSwapParams, updateSessionStatus
│   │   └── mock-bridge.ts             # v1 only — pollSwapCompleted, adminRelay
│   ├── supabase/migrations/           # 001-003 SQL migrations
│   ├── package.json                   # next, react 19, viem, wagmi, supabase, qrcode.react, react-query
│   └── .env.local                     # gitignored — local secrets
│
├── contracts/                         # v1 LEGACY (Foundry) — Phase 06 full deletes this dir
│   ├── src/SwapRouter.sol             # BSC SwapRouter
│   ├── src/interfaces/                # IERC20, IWBNB, IPancakeV3Router, ICCTPTokenMessenger
│   ├── scripts/Deploy.s.sol           # BRIDGE_MODE-aware Foundry script
│   └── test/SwapRouter.t.sol          # Foundry tests
│
├── scripts/                           # v1 LEGACY — Phase 06 full deletes
│   ├── test-cctp-domain7.ts           # 7-step CCTPv1 smoke test
│   └── package.json, tsconfig.json
│
├── plans/                             # Phased plans + reports
│   ├── 260312-1301-aig-phase1-implementation/   # v1 Phase 1
│   └── 260525-2023-aig-v2-app-kit-rebuild/      # v2 rebuild plans (00-07)
│
├── docs/                              # Source-of-truth markdown
│   ├── system-architecture.md         # narrative architecture
│   ├── codebase-summary.md            # this file
│   ├── project-changelog.md           # entry-level history
│   ├── development-roadmap.md         # phase status + timeline
│   ├── brand-guidelines.md            # voice + visual
│   ├── v2-smoke-evidence.md           # on-chain proof of v2 e2e
│   └── arc-*.md                       # Arc Network reference notes
│
├── README.md                          # public-facing intro + quick start
├── CLAUDE.md                          # Claude Code project rules
├── CONTRIBUTING.md                    # anchor JSON conventions
├── AGENTS.md                          # cross-platform agent guidance
├── architecture_AIG.json              # cross-AI canon — system map (v2.0-rebuild)
├── roadmap_AIG.json                   # cross-AI canon — phase status
├── status_AIG.json                    # cross-AI canon — append-only journal
└── .env.example                       # all env vars documented (root level)
```

## Active modules (v2)

### `frontend/lib/payment-flow-v2.ts`

Client React hook `usePaymentFlowV2({ sessionId, merchantWallet, targetUSDC })`:
- `useSwitchChain` → Sepolia (11155111)
- `writeContractAsync` USDC.approve(TokenMessengerV2, amountWei) — pinned `chainId`, `gas=100_000n`, `maxFeePerGas=50 gwei`, `maxPriorityFeePerGas=2 gwei`
- `writeContractAsync` TokenMessengerV2.depositForBurn(7 args: amount, destDomain=26, mintRecipient, USDC, destCaller=bytes32(0), maxFee=amountWei/1000n, minFinality=1000) — same pins + `gas=250_000n`
- POST burn tx hash to `/api/agent/execute`; read SSE → set `step` state
- Returns `{ step, burnTxHash, errorMessage, handlePay }` for the page

### `frontend/lib/cctp-abi.ts`

Minimal ABIs: `ERC20_APPROVE_ABI` (approve only), `CCTP_TOKEN_MESSENGER_ABI` (TokenMessengerV2 depositForBurn — 7 args including `destinationCaller`, `maxFee`, `minFinalityThreshold`).

### `frontend/lib/cctp.ts`

- `pollAttestationV2(txHash, sourceDomain, timeoutMs=180_000)` → fetches Iris v2 `/v2/messages/{sourceDomain}?transactionHash=...` every 5s until `status === "complete"`, returns `{ message, attestation }`.
- `receiveMessage(message, attestation)` → admin wallet (`AIG_ADMIN_WALLET_PRIVATE_KEY`) calls Arc MessageTransmitter `receiveMessage`. Returns Arc txHash as soon as `writeContract` resolves; `waitForTransactionReceipt` fires detached (non-blocking).
- `extractMessageHash`, `extractRawMessage`, `extractMessageBytesFromReceipt`, `pollAttestation`, `V1_BSC_SOURCE`, `SourceChainConfig` → v1 only, kept for `BRIDGE_BACKEND=v1` rollback.

### `frontend/app/api/agent/execute/route.ts`

Route segment config: `maxDuration = 60`, `runtime = "nodejs"`, `dynamic = "force-dynamic"`.

POST handler validates input then returns `new Response(new ReadableStream({ async start(controller) { ... } }))`. Pipeline lives inside the `start` callback so Vercel's serverless function lifetime extends until `controller.close()` runs.

`runPipeline` branches on `BRIDGE_BACKEND`:
- `v2` → `pollAttestationV2(swapTxHash, 0, 180_000)` → `receiveMessage(message, attestation)` → emit `confirmed`
- `v1` CCTP → `extractMessageHash + extractRawMessage + pollAttestation` → `receiveMessage`
- `v1` ADMIN_RELAY → `pollSwapCompleted + adminRelay`

Both paths emit SSE events: `swap_executing → bridging → confirmed` (or `bridge_delayed` on v1 timeout).

### `frontend/app/pay/[id]/page.tsx`

`PaymentPageWrapper` (Suspense boundary) dispatches:
- `BRIDGE_BACKEND === "v2"` → `<PaymentPageV2 />` (active)
- else → `<PaymentPage />` (v1 legacy, deleted in Phase 06 full)

`PaymentPageV2` reads `merchant` + `amount` from query params, calls `usePaymentFlowV2`, renders connect button + Pay button + `PaymentProgressBar`.

### `frontend/app/dashboard/page.tsx`

Unchanged from Phase 1: wagmi connect → upsertMerchant → GET `/api/dashboard` (profile + `analyticsStats`) → Supabase real-time subscription on `payment_sessions` → GET `/api/points`. Pencil UI components, QR generator, payment feed table, stat cards.

## v1 legacy modules (rollback only)

| File | Purpose | Deleted in |
|---|---|---|
| `contracts/` (entire dir) | SwapRouter.sol + Foundry stack | Phase 06 full |
| `frontend/lib/mock-bridge.ts` | pollSwapCompleted, adminRelay | Phase 06 full |
| `frontend/lib/agent.ts` | fetchSpotPrice (PancakeSwap Quoter), calculateSwapParams | Phase 06 full |
| `frontend/app/api/agent/quote/route.ts` | v1 quote endpoint (returns 500 if called — viem checksum on hardcoded Quoter fallback) | Phase 06 full |
| `cctp.ts` v1 helpers (extract*, pollAttestation, V1_BSC_SOURCE, SourceChainConfig) | v1 BSC source path | Phase 06 full (partial trim of `cctp.ts`, not full delete) |
| `scripts/test-cctp-domain7.ts` | v1 CCTP smoke | Phase 06 full |
| v1 PaymentPage component in `pay/[id]/page.tsx` | v1 UI branch | Phase 06 full |

Phase 06 partial (done 30/05, commit `836b584`) already removed: `lib/appkit.server.ts`, `app/api/dev/appkit-ping/route.ts`, `@circle-fin/app-kit` + `@circle-fin/adapter-viem-v2` deps, unused `V2_ETH_SEPOLIA_SOURCE` export, `KIT_KEY` env entry.

## Database schema

Unchanged from Phase 1 — see `frontend/supabase/migrations/`. Tables: `payment_sessions`, `merchants`, `points_ledger`, `points_balance`.

## Dependencies

| Layer | Key deps |
|---|---|
| Frontend runtime | next@16.1.6, react@19, viem, wagmi@3, @supabase/supabase-js, @tanstack/react-query, qrcode.react |
| Frontend build | typescript@5, tailwindcss@4, eslint-config-next |
| v1 contracts | Foundry (forge, cast) — legacy |

Removed in Phase 06 partial: `@circle-fin/app-kit`, `@circle-fin/adapter-viem-v2`.

## Configuration

| File | Purpose |
|---|---|
| `frontend/tsconfig.json` | ES2020, strict, path alias `@/` |
| `frontend/next.config.ts` | minimal — Next 16 defaults |
| `frontend/vercel.json` | `installCommand`, `buildCommand`, `framework: nextjs` |
| `vercel.json` (root) | (none — Vercel project rooted in frontend/) |
| `.env.example` | reference for all env vars |

## Code standards

- File names: kebab-case with descriptive names (`payment-flow-v2.ts`, `cctp-abi.ts`)
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/interfaces: PascalCase
- TypeScript strict mode
- File size: <200 lines preferred — split larger files (`pay/[id]/page.tsx` currently 348 lines; strangler-fig transition exception, cleaned in Phase 06 full)

### Xác minh bằng đo đạc: luôn có mẫu đối chứng

Trước khi kết luận "thứ X không tồn tại / không chạy / không được biên dịch ra", phải
đo kèm một **mẫu đối chứng đã biết chắc là có**. Nếu mẫu đối chứng cũng vắng mặt thì
lỗi nằm ở công cụ đo, không nằm ở thứ đang xét.

Đối chứng chỉ hợp lệ khi nó được **thêm vào cùng lúc** với thứ đang nghi. Một class đã
tồn tại từ commit trước không phân biệt được bản build mới với bản build cũ — cả hai
đều chứa nó.

Đợt reskin landing (21/08/2026) mắc cùng một dạng sai ba lần, mỗi lần trên một trục
khác nhau, và cả ba lần "không đo thấy" đều trông y hệt "không tồn tại":

| # | Đo cái gì | Bỏ sót | Hậu quả |
|---|---|---|---|
| 1 | hover CTA | thiếu **thuộc tính** — chỉ đọc `transform`, trong khi Tailwind v4 dịch `-translate-y-*` ra thuộc tính `translate` | báo nhầm "hover không hoạt động" |
| 2 | hover card | thiếu **loại phần tử** — chỉ rê lên `a`/`button`, card là `div` | glow chạy vẫn báo là không |
| 3 | luật CSS tự viết | đọc **output đã chết** của dev server không còn biên dịch | kết luận sai "Tailwind v4 nuốt class tên `hover-*`" — **quy tắc này SAI**, đã thực nghiệm bác bỏ: `.hover-lift` biên dịch ra bình thường |

Danh sách thuộc tính / phần tử / nguồn dữ liệu cố định sẽ **im lặng** bỏ sót thứ nó
không biết. Không có thông báo lỗi nào cho trường hợp này — chỉ có mẫu đối chứng.

## Known limitations

- Testnet only (Arc + Sepolia testnets; Circle CCTP V2 sandbox API).
- Merchant receives `amount − ~1bps` under v2 Fast Transfer (gross-up is a v2.1 refinement).
- Single source chain (Sepolia); multi-chain support (Base/Avalanche/Linea) would need additional `payment-flow-vN` hooks + chain registration in `components/providers.tsx`.
- Phase 06 full pending 48h prod smoke gate.

## Deployment

- Vercel auto-deploys on `git push origin main`.
- `/api/agent/execute` requires `maxDuration ≥ ~30s`; current config sets 60 (Pro plan default cap).
- After env changes on Vercel, manual `Redeploy` (uncheck Build Cache) — env updates do not trigger auto-build.
