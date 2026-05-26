# ADR — Drop `@circle-fin/app-kit` SDK, call Arc's bridge contract directly

**Date:** 2026-05-25 (session boundary) · **Status:** Accepted · **Supersedes:** Phase 01-05 of `plans/260525-2023-aig-v2-app-kit-rebuild/` (architecture portion)

## Context

PRD v2 framed v2 as "rebuild on Arc App Kit". This session installed `@circle-fin/app-kit` v1.6.1 + `@circle-fin/adapter-viem-v2` v1.11.1 and discovered three structural problems for customer-facing payment flows:

| # | Finding | Probe |
|---|---|---|
| 1 | `kit.estimateSwap/estimateBridge` require `from.adapter` — customer wallet, client-only | `KitError: from.adapter: Required` |
| 2 | `config.kitKey` is REQUIRED at runtime (Zod schema misleading marked it optional) | `KitError: Kit key is required. Expected format: KIT_KEY:<keyId>:<keySecret>` |
| 3 | Kit key format encodes a SECRET (`KIT_KEY:keyId:keySecret`) — cannot ship to client bundles | Verbatim from `Get your free Kit Key at: developers.circle.com/w3s/keys#kit-keys` |

The SDK is therefore structurally incompatible with our model:
- **Adapter** must be on the client (customer wallet)
- **Kit key** must be on the server (secret credential)
- Single SDK call must have both → impossible to satisfy

`@circle-fin/app-kit` is designed for **dev-owned wallets** (treasury, admin relay, hosted Modular Wallets) — not BYO-wallet payment flows.

## Decision

**Drop `@circle-fin/app-kit` from the customer-facing payment path.** Customer calls Arc's `kitContracts.bridge` contract directly via viem `writeContract`. Server polls Circle's free attestation API (no kit key required). Same architectural pattern as v1's SwapRouter, but pointed at a Circle-maintained contract instead of our custom 198-line Solidity.

Arc Testnet bridge contract: `0xC5567a5E3370d4DBfB0540025078e283e36A363d`
Arc Testnet CCTP v2 domain: `26`
Arc Testnet CCTP messageTransmitter: `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`

## Consequences

### Code
- `frontend/lib/appkit.server.ts` (committed e382aa2) becomes **dead code**. Keep until Phase 06 cleanup; mark TODO. No live import.
- `frontend/app/api/dev/appkit-ping/route.ts` becomes **dead code**. Same disposition.
- `@circle-fin/app-kit` + `@circle-fin/adapter-viem-v2` deps stay installed (may be useful for future Earn/Modular Wallets work). Remove only if Phase 06 cleanup needs to.
- `KIT_KEY` env var becomes unused. Leave in `.env.local` placeholder; remove from Vercel plan in Phase 04.

### Phase plan revisions
- **Phase 03:** redesign — customer signs `writeContract` against Arc bridge contract; server reuses existing `frontend/lib/cctp.ts` attestation poll loop (already in v1 code), retargeted at Arc's `messageTransmitter` (domain 26, not v1's wrong 7). Strangler-fig flag `NEXT_PUBLIC_BRIDGE_BACKEND=v1|v2` still applies (v1 = our SwapRouter, v2 = Arc bridge).
- **Phase 04:** flip default to v2 on Vercel — drop `KIT_KEY` from the env set; add `NEXT_PUBLIC_ARC_BRIDGE_CONTRACT_ADDRESS=0xC5567a5E…363d` + `NEXT_PUBLIC_BRIDGE_BACKEND=v2`.
- **Phase 05:** Unified Balance — was `kit.unifiedBalance.getBalances`. Without SDK: query bridge contract events per chain, OR call Circle's REST API directly. May defer to v3.
- **Phase 06:** cleanup — same scope (delete `/contracts`, `cctp.ts`'s v1-specific wrappers, mock-bridge, admin-relay scripts). Bonus: also delete the now-dead `appkit.server.ts` + `appkit-ping` route + `@circle-fin/*` deps if confirmed unused.

### Schedule
Net delivery time likely shortens — the new architecture is closer to v1, reuses existing code, and avoids the SDK's auth-model fight.

### Docs
- PRD `/Users/baobao/Downloads/PRD_v2_AIG_AppKit.md` needs significant revision: tagline ("Built on Arc App Kit") becomes misleading since we're not using the SDK. More honest: "Built on Arc's Bridge contracts + USDC native settlement". §4 architecture diagram must drop `@arc-network/app-kit` boxes and add direct contract call boxes.
- Day 6 content post still talks about v1's CCTP integration story — that narrative remains accurate (just stops at v1.0 tag).

## Alternatives considered

**B. Server-side App Kit + EIP-2612 permit delegation.** Customer signs permit client-side; AIG runs `kit.bridge()` server-side with its own adapter + KIT_KEY. Rejected: custodial-with-permit adds significant security review surface (permit replay, allowance scope, key rotation) for marginal benefit over Option A. Could revisit if we ever need App Kit's multi-chain routing for non-Arc destinations.

**C. Circle Modular Wallets.** Different SDK product; Circle hosts customer wallets. Rejected: changes BYO-wallet UX, much heavier integration, not what AIG's merchants/customers expect.

**D. Pause v2, write ADR-first.** Rejected as standalone option but effectively done via this ADR.

## Reversibility

High. Option A is implementable using code patterns we already have (v1's writeContract + cctp.ts attestation polling). If a future Circle product fixes the dual-trust-domain problem, we can revisit App Kit SDK adoption without losing the bridge-contract integration (the kitContracts.bridge address is what the SDK calls under the hood anyway).

## Open questions

1. Does Arc's `kitContracts.bridge` contract take the same parameters as Circle's `TokenMessenger.depositForBurn`, or is its ABI different? Need Phase 03 step 0 to fetch ABI from explorer or `@circle-fin/bridge-kit` package.
2. Are there any hidden Arc-specific behaviors (gas in USDC, fee burns) that direct contract calls bypass but the SDK handles? Worth a quick check before Phase 03 implementation.
3. PRD revision: scope of edits + does the user want to keep the "App Kit" branding for marketing while internally using direct contracts?
