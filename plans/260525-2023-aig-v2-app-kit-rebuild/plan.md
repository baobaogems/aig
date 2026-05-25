# AIG v2 — App Kit Rebuild (strangler-fig pivot)

> **Source PRD:** `/Users/baobao/Downloads/PRD_v2_AIG_AppKit.md` (rev 2.0, 25/05/2026)
> **Brainstorm report:** [`../reports/brainstorm-260525-2023-aig-v2-strangler-fig-plan.md`](../reports/brainstorm-260525-2023-aig-v2-strangler-fig-plan.md)
> **Branch:** `main` (v1.0 tagged at `c435a15`, forkable v1 snapshot preserved)
> **Submission target:** Stablecoins Commerce Stack Challenge — 13/07/2026
> **Pattern:** Strangler-fig + `BRIDGE_BACKEND=v1|v2` env flag — `main` stays green every commit.

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
| 00 | [phase-00-foundation-deps.md](phase-00-foundation-deps.md) | ✅ DONE | 25/05 | Installed `@circle-fin/app-kit` + `adapter-viem-v2`; verified v1.0 tag remote |
| 01 | [phase-01-appkit-server-client.md](phase-01-appkit-server-client.md) | pending | 26/05 | Build `frontend/lib/appkit.server.ts` (per-request `getKit()`, typed wrappers, SSE spike, ESLint guard) |
| 02 | [phase-02-api-routes-dual-path.md](phase-02-api-routes-dual-path.md) | pending | 26-27/05 | Add v2 path to `/api/agent/quote` + `execute` behind `BRIDGE_BACKEND=v1\|v2`. v1 default. Smoke: curl both. |
| 03 | [phase-03-payment-page-dual-path.md](phase-03-payment-page-dual-path.md) | pending | 27-28/05 | Same env-flag switch in `pay/[id]/page.tsx`. Smoke: open both flows locally. |
| 04 | [phase-04-flip-default-to-v2.md](phase-04-flip-default-to-v2.md) | pending | 28-29/05 | Set `KIT_KEY` + `BRIDGE_BACKEND=v2` on Vercel; production smoke; rollback path documented |
| 05 | [phase-05-dashboard-unified-balance.md](phase-05-dashboard-unified-balance.md) | pending | 29-31/05 | Add `kit.unifiedBalance.getBalances` widget to merchant dashboard (additive) |
| 06 | [phase-06-cleanup-v1.md](phase-06-cleanup-v1.md) | pending | 01-03/06 | **ONLY AFTER v2 proven**: delete `/contracts`, `cctp.ts`, `mock-bridge.ts`, admin-relay scripts; drop v1 branch from env flag; README banner re: v1.0 tag |
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
