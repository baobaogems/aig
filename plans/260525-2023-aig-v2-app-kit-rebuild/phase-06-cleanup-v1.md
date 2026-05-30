# Phase 06 — v1 cleanup

**Priority:** P0 (for v2 ship) · **Status:** PARTIAL DONE (30/05) — App Kit dead code shipped; v1 stack waits on Vercel flip · **Target day:** 01-03/06/2026

## Partial done — 30/05 (safe-now subset)

App Kit dead code (post-ADR) removed without waiting for the production gate, since none of it ran in v1 OR v2:

- ✅ DELETE `frontend/lib/appkit.server.ts`
- ✅ DELETE `frontend/app/api/dev/appkit-ping/route.ts` (+ empty `app/api/dev/`)
- ✅ Remove deps `@circle-fin/app-kit` + `@circle-fin/adapter-viem-v2` from `frontend/package.json` + lock
- ✅ Remove unused `V2_ETH_SEPOLIA_SOURCE` export from `frontend/lib/cctp.ts` (v2 uses `pollAttestationV2` now, no on-chain extract path)
- ✅ Drop `KIT_KEY` line + section header from `frontend/.env.local`
- ✅ Build green (`npm run build` 8 routes, no /api/dev/appkit-ping)

## Post-ADR plan corrections

Original plan assumed v2 = App Kit SDK. After ADR (drop SDK, use CCTPv2 contracts directly), several "DELETE" items are WRONG and must be kept:

- **KEEP `frontend/lib/cctp.ts`** entirely — v2 uses `pollAttestationV2` + `receiveMessage` from here. Only the v1-specific helpers (`extractMessageHash`, `extractRawMessage`, `extractMessageBytesFromReceipt`, v1 `pollAttestation`, `V1_BSC_SOURCE`, `SourceChainConfig`) can be deleted, AND only after the v1 branch in `execute/route.ts` is removed (which itself waits on Vercel flip).
- **KEEP env `CCTP_MESSAGE_TRANSMITTER_ARC`** — v2 admin relay mints on Arc through this contract. The plan's "drop" list was wrong on this var.

## Gate (for remaining v1-stack deletes — don't start until ALL true)

- [ ] v2 default on Vercel for **≥48h** with no rollback incidents
- [ ] At least 3 successful test payments via v2 on production (logged)
- [ ] Local e2e ✅ (Sepolia burn 0x9a620cf2 → Arc mint 0xc0b4cca9, 30/05)

## Files — DELETE

- `contracts/` (entire dir — Foundry, submodule, broadcast, cache, out, src, test, scripts)
- `frontend/lib/cctp.ts`
- `frontend/lib/mock-bridge.ts`
- `scripts/test-cctp-domain7.ts`
- `scripts/test-e2e-admin-relay.ts`
- `scripts/package.json`, `scripts/tsconfig.json` — only if no remaining non-CCTP scripts; otherwise keep
- `.gitmodules` entry for `contracts/lib/forge-std`

## Files — MODIFY

- `frontend/app/api/agent/quote/route.ts` — drop v1 branch + `BRIDGE_BACKEND` switch (only v2 remains)
- `frontend/app/api/agent/execute/route.ts` — same
- `frontend/app/pay/[id]/page.tsx` — drop v1 branch + `SWAP_ROUTER_ABI` constant
- `frontend/lib/agent.ts` — drop v1-specific helpers; CCTP imports
- `frontend/lib/chains.ts` — drop CCTP/SwapRouter refs (likely whole file can go if only those)
- `frontend/.env.local` — drop `BRIDGE_BACKEND`, `NEXT_PUBLIC_BRIDGE_BACKEND`, `SWAP_ROUTER_ADDRESS_BSC`, `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC`, `PANCAKESWAP_V3_QUOTER_BSC`, `CCTP_TOKEN_MESSENGER_BSC`, `CCTP_MESSAGE_TRANSMITTER_ARC`, `BRIDGE_MODE`, `AIG_REVENUE_POOL_ADDRESS`, `TEST_PRIVATE_KEY`
- `.gitignore` — drop `contracts/cache/`, `contracts/out/`, `contracts/broadcast/` lines
- `package.json` (root) — drop `test:cctp` script
- `README.md` — **add banner** at top: "v1 architecture (SwapRouter.sol, CCTP) preserved at tag [`v1.0`](../../tree/v1.0). `main` runs on Arc App Kit (v2)."

## Vercel — clean up v1 env vars (in dashboard)

Drop `SWAP_ROUTER_ADDRESS_BSC`, `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC`, `PANCAKESWAP_V3_QUOTER_BSC`, `CCTP_*`, `BRIDGE_MODE`, `BRIDGE_BACKEND`, `NEXT_PUBLIC_BRIDGE_BACKEND`.

## Smoke gate

- `find . -name "*.sol" -not -path "./node_modules/*"` returns nothing
- `grep -rln "cctp\|CCTP\|SwapRouter\|swapAndBridge\|BRIDGE_MODE\|BRIDGE_BACKEND" frontend/lib frontend/app frontend/components --include="*.ts" --include="*.tsx"` returns 0 hits
- `npm run build` exits 0
- Vercel deploy succeeds with v2 path only

## Todo

- [ ] Verify gate (48h v2 stable + 3 successful payments)
- [ ] Delete /contracts (handle submodule + .gitmodules)
- [ ] Delete cctp.ts, mock-bridge.ts, test-cctp-domain7.ts, test-e2e-admin-relay.ts
- [ ] Drop v1 branches from routes + page
- [ ] Drop v1 env vars from .env.local
- [ ] Drop Foundry build-dir lines from .gitignore
- [ ] Drop `test:cctp` from root package.json
- [ ] Add README v1.0-tag banner
- [ ] `npm run build` green
- [ ] User: drop v1 env vars from Vercel dashboard
- [ ] Commit `chore(v2): delete v1 bridge stack (phase 06)`

## Success criteria

- Repo on `main` has zero Solidity, zero CCTP code, zero `BRIDGE_BACKEND` flag
- Vercel still serves v2 successfully after env cleanup
- README banner directs forkers to `v1.0` tag for v1 architecture
- Day 6 X post still has a working `git checkout v1.0` retrieval path

## Risks

| Risk | Mitigation |
|---|---|
| Hidden v1 import slipped through | Smoke grep catches; CI lint if added |
| Vercel env removal breaks a forgotten reference | Test in Preview first |
| Submodule deletion leaves `.git/modules/contracts/lib/forge-std` | Manual cleanup step in todo |

## Next

→ Phase 7: docs sweep + Arc Testnet end-to-end smoke + tag `v2.0-alpha`.
