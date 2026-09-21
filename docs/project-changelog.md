# AIG Project Changelog

All significant changes, features, and fixes documented here.

## [v5.0 — The default now favours the person who already handed something over] — 2026-09-21

### The hole this closes

v2's escrow knew "locked" and "released" and nothing else. It had no idea whether anyone had
handed work in, and that single blind spot was the product's worst behaviour: a poster could
take delivery of the deliverable, say nothing until the deadline, refund, and keep both the
work and the money. Silence was the cheapest available strategy and it won. A submission made
near the deadline could also lose a race to that refund, however good it was.

### Added

- **ArbiterEscrow v3** `0xA4BB0B0448277B433A2c01b6F828771e9C5920B1` (Arc testnet, block 63109048),
  adding one concept — `submittedAt` — from which everything else follows.
- **Partial settlement.** `settle(id, verdictHash, workerBps)` splits the escrow and returns the
  remainder to the poster in the same transaction. "This is partly usable" was previously
  unrepresentable, so a poster who found work half-good had to choose between paying everything
  and paying nothing.
- **A price on refusal, taken from the arbiter's own score**: nothing below the fail line, up to
  30% across the middle band, 50% for overriding a verdict that had asked to pay in full. There
  is no court here to tell an honest rejection from a theft, so every rejection carries a price
  instead of some of them carrying a punishment.
- **`timeoutRelease`, permissionless.** The worker's first on-chain right that does not depend on
  this platform answering: after the window, anyone can complete the payment, so the money
  arrives even if we disappear.
- **`expireClaim`, permissionless.** A claimed-and-abandoned bounty stops blocking the board.
- **Route-handler tests.** 83 tests were green while `POST /api/bounty` returned 400 to every
  caller for half a day, because no test ever called a handler. Now every money branch has one.

### Changed

- **Judging no longer moves money.** A plausible verdict starts a clock; paying is a separate act
  through one of three doors, all of which go through a single settlement module so there is one
  payout rule rather than three that drift apart.
- **Silence now pays the worker.** A poster who does nothing within the window ends up paying in
  full, which is the exact reverse of before.
- **The poster can no longer refund alone once work exists** — the deadline race is closed on-chain.
- Deciding whether to pay is behind `isPoster`. The old verdict card rendered "Approve — pay the
  worker" to whoever was looking and merely made it a no-op for everyone else.
- The decision sits *below* the verdict, not above it. Asking someone to decide before showing
  them the evidence, then hiding the buttons behind a scroll, teaches people the feature is missing.

### Migration

Bounties opened on v2 finish on v2; no money moves between contracts and no script exists that
could. The last one holding funds was settled on 21/09 (5 USDC, tx `0x5b98780b`), leaving zero.

### Limits, stated rather than hidden

Without a stake there is no sanction on the platform itself — the ceiling of a court-free design
is *auditable*, not *punishable*. And a determined poster can still buy a 70-point deliverable at
half price. Pricing refusal discourages the abuse; it does not end it.

## [v4.2 — A board you can read] — 2026-09-20

### Added

- **`/arbiter/bounty/[id]`** — a shareable page per bounty: amount, deadline, state, the full brief, the frozen rubric with weights, and the decision thresholds. Renders for a stranger with no wallet and no account.
- **Scoring criteria are public.** Other boards hide the task behind a connect button; being able to read the rubric *before* committing a weekend to the work is the point, and the page states that the criteria froze when the money was locked and cannot be moved by anyone, poster included.
- **Card state and a live countdown.** `Chưa ai nhận` / `Đang làm` / `Đã nộp · chờ chấm`, a quotable short code (`AIG-3F9C2A`), and a countdown driven by one interval for the whole list.

### Changed

- The board no longer hides claimed bounties. It looked emptiest exactly when the community was busiest, removing the only signal that the thing is used. Claimability is now derived per card rather than filtered out of the query.
- The countdown was computed once at render, so a tab open for twenty minutes showed the most important number on the screen twenty minutes wrong.
- `RubricTable` extracted and shared with the poster's preview; the redaction rule moved to `lib/arbiter/bounty-view.ts` and is used by both the API route and the page.
- Opened from a bounty's own page, the submit form no longer asks for a pasted UUID.

### Not changed, deliberately

"Number of people who submitted" is not shown, because it cannot exceed one: `claim()` assigns a worker permanently on-chain. Showing a competition count would require a contract v3 (multiple submissions, a winner-picking rule) — a different product, planned separately if ever.

### Tests

73 (was 52). Thresholds on the page are read from `tiers.ts`, and a test fails if any is hard-coded into the JSX.

## [v4.1 — Two roles, two wallets] — 2026-09-20

The arbiter stopped being one person's control panel and became something two strangers can use.

### Added

- **Sign-In With Ethereum for both roles.** The wallet is the account: one connect serves poster and worker, and the address that signs in is the address that gets paid. `lib/auth/siwe-session.ts`, four `/api/auth/*` routes, migration `007_create_auth_nonces.sql`.
- **`ArbiterEscrow` v2** at `0xD4f53A1bD89a05Ac568601b4c30655A678C5f9f1` (block 63019118): `createBounty` accepts `worker == address(0)`, new `claim()` assigns the first caller permanently, `release()` refuses an unassigned bounty. 32/32 forge tests; deployed bytecode verified byte-identical to source. v1 `0x6F4f…6FF5` stays deployed and unpaused for the August pilot record.
- **Posters fund their own escrow.** `approve` + `createBounty` are signed in the poster's wallet; `/api/bounty/[id]/confirm-lock` reads `getBounty()` off the chain and only freezes the rubric when poster, amount and deadline all match.
- **A public job board.** Funded, unclaimed, in-time bounties are listed; workers sign `claim()` and `/api/bounty/[id]/confirm-claim` copies the on-chain winner into the DB. Migration `009_open_bounties.sql`.
- **Links are judged, not just stored.** `lib/arbiter/fetch-deliverable.ts` fetches a public URL, extracts the text and freezes it as the snapshot.
- **`npm run authz:check`** — replays the pre-fix attack chain against a running server. **`npm run arbiter:e2e`** — the two-wallet cycle for real on Arc.

### Fixed — security

- **Every write route was unauthenticated.** `poster_id` arrived in the request body, so anyone could act as anyone; with `DRY_RUN=false` that drained the server wallet up to the daily cap (`POST /api/bounty` with an attacker's `worker_id` → `approve-rubric` locked server USDC → submit → judge → auto-release). The caller now comes from a signed session cookie and is checked against that bounty's poster/worker. Unauthenticated writes 401, a stranger's wallet 403.
- **Deliverables were readable by anyone.** `GET /api/bounty?id=` now strips `content_snapshot` for non-parties.
- **SSRF in the link fetcher, caught by its own test.** The IPv4-mapped IPv6 check matched only the dotted spelling, but Node normalises `::ffff:10.0.0.1` to `::ffff:a00:1`, so `http://[::ffff:10.0.0.1]/` passed the guard and the server really did dial `10.0.0.1`. Mapped addresses are now parsed into octets instead of string-matched.
- **Rate limits** on the two routes that spend Anthropic tokens per call (10/hour create, 20/hour judge), keyed by wallet. Fail-open by design; the money paths keep their own fail-closed caps.

### Changed

- `bounties.worker_id` is nullable and is only ever written from an on-chain read. The three release paths that award points now handle null explicitly instead of assuming.
- `vitest` resolves with the `react-server` condition rather than stubbing `server-only`, so tests load the module the server actually loads. 52 tests.
- README's scoreboard was months out of date (calibration "in progress", pilot "opens Aug" — both finished in August). Rewritten against what is actually true.

### Not built, deliberately

File upload for deliverables. A public link already covers Gist, GitHub, published Docs and Notion; a storage bucket would add an attack surface and a backup obligation for convenience rather than capability. Reasoning kept in the plan's phase-06 file.

### Operational notes

- Production runs `DRY_RUN=true`. The flip is manual and separate, as before.
- Vercel marks Production env vars *sensitive* by default and sensitive values cannot be read back — writing `DRY_RUN` that way stored an **empty string**, not `"false"`. `isDryRun()` reads `!== "false"`, so empty failed closed. Flags and public addresses are now written with `--no-sensitive` so they can be verified.
- Arc rejects the published Anvil keys with **"Blocked address"**; test wallets must be freshly generated.
- `myarbiter.xyz` is aliased on Vercel but its DNS is still `NXDOMAIN` — the working link is `arbiter-gateway.vercel.app`.

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
