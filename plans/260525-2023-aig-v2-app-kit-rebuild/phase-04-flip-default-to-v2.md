# Phase 04 — Flip default to v2 on Vercel (REWRITTEN post-Phase 03)

**Priority:** P0 · **Status:** pending (user step) · **Target day:** 26-29/05/2026

> **Rewrite 26/05** — Phase 04 was originally drafted around the App Kit SDK and `KIT_KEY`. Phase 03 shipped a different design (standard CCTPv2 burn on Ethereum Sepolia, no SDK), so the env-var set changed. This file reflects what Phase 03 actually committed.

## Goal

Production demo (`aig-frontend-blond.vercel.app`) serves v2 by default. Rollback = flip two env vars + redeploy (~2 min).

## Pre-flight (do this BEFORE flipping)

You need a working v2 path end-to-end. **Local smoke from Phase 03 must pass first.** If you haven't run it yet:

```bash
# 1. In frontend/.env.local, flip NEXT_PUBLIC_BRIDGE_BACKEND=v1 → v2
# 2. Start dev: cd frontend && npm run dev
# 3. Fund a Sepolia wallet:
#    - Sepolia ETH gas: faucets.chain.link or sepolia-faucet.pk910.de
#    - USDC on Sepolia: https://faucet.circle.com (pick "Ethereum Sepolia")
# 4. Visit a test URL: /pay/test-session-001?merchant=<your-arc-addr>&amount=1.00
# 5. Connect MetaMask on Sepolia, click Pay, sign 2 txs, wait ~30-60s
# 6. Verify USDC arrived on testnet.arcscan.app for the merchant address
```

If local smoke fails, debug there — DO NOT flip Vercel until local works.

## What changes (Vercel dashboard — Production env)

### ADD these env vars

| Env var | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_BRIDGE_BACKEND` | `v2` | Production + Preview |
| `BRIDGE_BACKEND` | `v2` | Production + Preview (server-side mirror; `/api/agent/execute` reads this) |
| `NEXT_PUBLIC_SOURCE_CHAIN_ID` | `11155111` | Production + Preview |
| `NEXT_PUBLIC_USDC_ADDRESS_SOURCE` | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | Production + Preview |
| `NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_SOURCE` | `0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa` | Production + Preview |
| `NEXT_PUBLIC_ARC_CCTP_DOMAIN` | `26` | Production + Preview |
| `ETHEREUM_SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` | Production + Preview (server-side; better to use a private RPC like Alchemy/Infura under real load) |
| `CCTP_MESSAGE_TRANSMITTER_ARC` | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | Production + Preview — **verify; may already be missing in production** |

### KEEP unchanged (rollback path)

| Env var | Why keep |
|---|---|
| `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC`, `SWAP_ROUTER_ADDRESS_BSC` | Rollback flips `*BRIDGE_BACKEND=v1`, v1 page+route read these |
| `BSC_TESTNET_RPC_URL`, `USDC_ADDRESS_BSC_TESTNET`, `ARC_CHAIN_ID`, `ARC_TESTNET_RPC_URL`, `USDC_ADDRESS_ARC_TESTNET` | Cross-cut, used by both v1 and v2 server code |
| `CIRCLE_ATTESTATION_API`, `AIG_ADMIN_WALLET_PRIVATE_KEY`, `AIG_ADMIN_WALLET_ADDRESS` | Server-side; v2 server uses them via cctp.ts (pollAttestation + receiveMessage) |
| `BRIDGE_MODE` | v1 dispatch field; only consulted when `BRIDGE_BACKEND=v1`. Unused under v2 but harmless. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Merchant layer — untouched |

### DROP from plan (was in original Phase 04, no longer needed)

| Env var | Why dropped |
|---|---|
| `KIT_KEY` | App Kit SDK dropped per ADR. Unused. (If currently set on Vercel, leave it — harmless. Phase 06 cleanup removes it.) |
| `ARC_CCTP_DOMAIN_ID` | v1 had this as `7` (Polygon's domain — bug). v2 hardcodes `26` in `NEXT_PUBLIC_ARC_CCTP_DOMAIN`. The old var is unused. |

## Redeploy

After saving env vars in Vercel:
1. Vercel dashboard → Deployments → latest production → **Redeploy** (no need to push a commit; env changes alone don't auto-redeploy).
2. Wait for build to complete (~2 min).

## Smoke gate (production)

Run on `https://aig-frontend-blond.vercel.app`:

1. **Page renders v2 UI** — open `/pay/test-session-prod-001?merchant=0x0809a724862D6636874809775Ba3623080c5ceF8&amount=1.00` (using AIG admin as test merchant). Header should read "Pay with USDC" + "via Ethereum Sepolia → CCTP → Arc". If header reads "Pay with BNB", flag isn't propagated → check Vercel env.
2. **End-to-end payment** — connect Sepolia wallet with USDC, click Pay $1.00, sign approve + depositForBurn, watch progress bar through `swap_executing → bridging → confirmed`. Median time <60s.
3. **Arc confirmation** — `testnet.arcscan.app/address/0x0809a724862D6636874809775Ba3623080c5ceF8` shows incoming 1.00 USDC tx.
4. **Merchant dashboard** — open `/dashboard?wallet=0x0809a724862D6636874809775Ba3623080c5ceF8` (or appropriate dashboard path), confirm payment feed shows the new tx.

Rollback if any of 1-4 fails:
- Vercel env: `NEXT_PUBLIC_BRIDGE_BACKEND=v1` + `BRIDGE_BACKEND=v1`. Redeploy. ~2 min recovery.
- Investigate failure locally before re-flip.

## Todo

- [ ] **PRE:** Local v2 smoke passes (Phase 03 manual test)
- [ ] Vercel dashboard: add 8 env vars (listed above)
- [ ] Vercel dashboard: Redeploy production
- [ ] Run 4 production smoke checks
- [ ] If green: append `status_AIG.json` ops entry "v2 live in production at <commit>"
- [ ] If red: rollback both BACKEND vars to v1, redeploy, debug

## Success criteria

- 4/4 production smoke checks green
- Real Arc Testnet tx hash recorded in evidence (paste into status entry)
- Rollback procedure verified at least once in Preview env (flip back, smoke v1, flip forward)

## Risks

| Risk | Mitigation |
|---|---|
| `ETHEREUM_SEPOLIA_RPC_URL` public RPC rate-limited under real load | Swap to Alchemy/Infura key in Vercel env if seeing 429s |
| `CCTP_MESSAGE_TRANSMITTER_ARC` missing in production (was missing in local) | Verify BEFORE flipping; v1 must have been throwing on the CCTP code path silently — but ADMIN_RELAY mode skipped that path |
| `AIG_ADMIN_WALLET_PRIVATE_KEY` wallet out of Arc gas | Top up the wallet at `0x0809a724862D6636874809775Ba3623080c5ceF8` on Arc Testnet before flip; `receiveMessage` needs it |
| Day 6 X post users hit v2 page expecting BNB → see "Pay with USDC" — confusion | Add a one-line FAQ in self-reply on the Day 6 post, or update the post with a "v2 update: now USDC via Sepolia" note |

## Out of scope for this phase

- Mainnet — Arc is testnet-only; mainnet pivot is a separate plan
- Multi-source-chain support (e.g., let customer pay from Base or Avalanche too) — v2.1 enhancement
- EIP-2612 permit to collapse 2 sigs → 1 — v2.1 enhancement

## Next

→ Phase 05 — likely deferred. SDK was the unified-balance path; without SDK, alternative is bridge contract event scanning or Circle REST API. Not blocking for the Challenge submission.
