# AIG v2 — Arc Bridge Rebuild (strangler-fig pivot)

> **Source PRD:** `/Users/baobao/Downloads/PRD_v2_AIG_AppKit.md` (rev 2.0, 25/05/2026 — needs revision per ADR)
> **Architecture decision record:** [`../reports/adr-260525-2333-drop-app-kit-sdk-use-bridge-contract-directly.md`](../reports/adr-260525-2333-drop-app-kit-sdk-use-bridge-contract-directly.md)
> **Brainstorm report:** [`../reports/brainstorm-260525-2023-aig-v2-strangler-fig-plan.md`](../reports/brainstorm-260525-2023-aig-v2-strangler-fig-plan.md)
> **Branch:** `main` (v1.0 tagged at `c435a15`, forkable v1 snapshot preserved)
> **Submission target:** Stablecoins Commerce Stack Challenge — 13/07/2026
> **Pattern:** Strangler-fig + `NEXT_PUBLIC_BRIDGE_BACKEND=v1|v2` flag — `main` stays green every commit.

## 🚩 Architecture pivot (25/05)

**Dropped `@circle-fin/app-kit` SDK** after probing found dual-trust-domain incompatibility: SDK needs both customer wallet (client-only) AND kit key (server secret) in a single call — impossible for BYO-wallet payment flows. See ADR linked above. v2 now uses **direct viem `writeContract` to Arc's `kitContracts.bridge`** (`0xC5567a5E…363d`, Circle-maintained), with existing v1 server-side `cctp.ts` attestation polling reused (retargeted to Arc CCTP v2 domain 26). Phase 01 SDK wrapper becomes dead code, scheduled for deletion in Phase 06.

## PRD correction

PRD says `@arc-network/app-kit` — does not exist on npm. Real package: **`@circle-fin/app-kit`** + adapter **`@circle-fin/adapter-viem-v2`**. Both installed Phase 0.

## App Kit surface (verified — docs.arc.io/app-kit)

```ts
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapter } from "@circle-fin/adapter-viem-v2";
const kit = new AppKit();
kit.swap / bridge / send / estimateSwap / estimateBridge / estimateSend / getSupportedChains
kit.on/off(action, handler) | kit.retryBridge(result, ctx)
kit.unifiedBalance.{ deposit, spend, getBalances, addDelegate, estimateSpend, getSupportedChains }
```

## Cross-cutting hardenings (locked)

1. **Server-only `appkit.server.ts`** — ESLint rule blocks client imports (`KIT_KEY` leak guard)
2. **Per-phase smoke gates** — each runtime phase ends with observable check
3. **Explicit SSE spike in Phase 1** — verify `kit.on(...)` + `ReadableStream`; client-poll fallback

## Phases

| # | File | Status | Day | Summary |
|---|---|---|---|---|
| 00 | [phase-00-foundation-deps.md](phase-00-foundation-deps.md) | ✅ DONE | 25/05 | Installed `@circle-fin/app-kit` + `adapter-viem-v2`; verified v1.0 tag remote (folded into commit `e382aa2`) |
| 01 | [phase-01-appkit-server-client.md](phase-01-appkit-server-client.md) | ✅ DONE | 25/05 | `frontend/lib/appkit.server.ts` (75 lines) + `/api/dev/appkit-ping` smoke + spike notes. Commit `e382aa2`, pushed to origin/main. SDK API discovery surfaced 3 PRD corrections (real package, real adapter factory, Arc CCTP domain). |
| 02 | [phase-02-api-routes-dual-path.md](phase-02-api-routes-dual-path.md) | ✗ COLLAPSED | 25/05 | Spike found `kit.estimateSwap`/`estimateBridge` require `from.adapter` (customer wallet) — server-side quote impossible. v2 is fully client-side. Logic absorbed into Phase 03. |
| 03 | [phase-03-payment-page-dual-path.md](phase-03-payment-page-dual-path.md) | pending | 26-28/05 | REDESIGNED (post-ADR): `pay/[id]/page.tsx` v2 branch signs `writeContract` against Arc bridge contract `0xC5567a5E…363d`; existing server `cctp.ts` attestation poll loop reused for v2 (retargeted to Arc CCTP v2 domain 26). v1 server routes untouched. Switch via `NEXT_PUBLIC_BRIDGE_BACKEND=v1\|v2`. |
| 04 | [phase-04-flip-default-to-v2.md](phase-04-flip-default-to-v2.md) | pending | 28-29/05 | REDESIGNED: set `NEXT_PUBLIC_BRIDGE_BACKEND=v2` + `NEXT_PUBLIC_ARC_BRIDGE_CONTRACT_ADDRESS=0xC5567a5E…363d` on Vercel. Drop `KIT_KEY` from plan (unused after SDK drop). Production smoke. |
| 05 | [phase-05-dashboard-unified-balance.md](phase-05-dashboard-unified-balance.md) | pending or deferred | 29-31/05 | REDESIGNED (post-ADR): unified balance via SDK is impossible (kit key constraint); alternative paths: bridge contract event scanning per chain, OR Circle REST API call, OR defer to v3. Likely defer. |
| 06 | [phase-06-cleanup-v1.md](phase-06-cleanup-v1.md) | pending | 01-03/06 | **ONLY AFTER v2 proven**: delete `/contracts`, `cctp.ts` v1-specific wrappers, `mock-bridge.ts`, admin-relay scripts. **BONUS:** also delete dead `appkit.server.ts` + `appkit-ping` route + `@circle-fin/*` deps. README banner re: v1.0 tag. |
| 07 | [phase-07-docs-smoke-tag.md](phase-07-docs-smoke-tag.md) | pending | 04-07/06 | Docs sweep (`system-architecture`, `codebase-summary`, README, brand), Arc Testnet end-to-end smoke, tag `v2.0-alpha` |

## Dependencies

- **External:** Circle Console `KIT_KEY` (blocks Phase 1 smoke gate runtime; mockable for unit tests)
- **Internal:** v1.0 tag preserved → Phase 6 cleanup safe
- **Vercel:** env updates land in Phase 4 (not auto-propagated by code)

## Out of scope here

- F-101 StableFX (PRD §6 P1) — separate plan after v2 ships
- F-102 Merchant SDK npm package — separate plan
- Next.js 14 → 16 upgrade — only if App Kit forces it

## Open questions (carry-over to Phase 1)

1. KIT_KEY available now, or stub for unit tests until Phase 4?
2. Vercel: add `BRIDGE_BACKEND=v1` baseline at start of Phase 2 (safe) or Phase 4 (just-in-time)?
3. Keep v1 env vars (`SWAP_ROUTER_*`, `BRIDGE_MODE`, etc.) on Vercel through Phase 5 for rollback? Recommendation: yes.
