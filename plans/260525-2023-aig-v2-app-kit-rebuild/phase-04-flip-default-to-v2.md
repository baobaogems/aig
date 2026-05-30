# Phase 04 — Flip default to v2 on Vercel (REWRITTEN post-Phase 03)

**Priority:** P0 · **Status:** pre-flight ✅ DONE 30/05; Vercel flip pending (user step) · **Target day:** 26-30/05/2026

> **Rewrite 26/05** — Phase 04 was originally drafted around the App Kit SDK and `KIT_KEY`. Phase 03 shipped a different design (standard CCTPv2 burn on Ethereum Sepolia, no SDK), so the env-var set changed. This file reflects what Phase 03 actually committed.
> **Refresh 30/05** — Pre-flight check complete (see below). Paste-ready Vercel env block added.

## Goal

Production demo (`aig-frontend-blond.vercel.app`) serves v2 by default. Rollback = flip two env vars + redeploy (~2 min).

## Pre-flight ✅ DONE 30/05

Local v2 end-to-end smoke is **green** — Sepolia burn → Iris v2 attestation → Arc mint succeeded:

| Step | Tx / value |
|---|---|
| Sepolia burn (Fast Transfer, `maxFee=1000`) | `0x9a620cf2ff42df5882a8b424094f4d26dd51bbfdd87d3a2070b34aae4edffa16` |
| Iris v2 attestation | status `complete` (cctpVersion=2, destDomain=26) |
| Arc mint via AIG admin wallet | `0xc0b4cca98ca37963c92d43afaada02c65e093567e6f374d04e667acdf641eb61` (status success, block 44698950, gas 175814) |
| Merchant USDC balance on Arc | +0.996383 USDC (1 USDC burn minus ~0.36% protocol fee) |

Full evidence: `status_AIG.json` log entry 2026-05-30T10:35:00+07:00. **Ready to flip Vercel.**

## What changes (Vercel dashboard — Production env)

### Paste-ready block (8 vars, no secrets)

Vercel "Environment Variables" supports bulk paste — copy this block, set scope = **Production + Preview** for all:

```
NEXT_PUBLIC_BRIDGE_BACKEND=v2
BRIDGE_BACKEND=v2
NEXT_PUBLIC_SOURCE_CHAIN_ID=11155111
NEXT_PUBLIC_USDC_ADDRESS_SOURCE=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_SOURCE=0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa
NEXT_PUBLIC_ARC_CCTP_DOMAIN=26
ETHEREUM_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CCTP_MESSAGE_TRANSMITTER_ARC=0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275
```

Per-var detail (in case Vercel UI requires one-by-one):

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
| `AIG_ADMIN_WALLET_PRIVATE_KEY`, `AIG_ADMIN_WALLET_ADDRESS` | Server-side; v2 admin relay mints on Arc via `receiveMessage` in cctp.ts. Wallet `0x0809a724...` gas-funded on Arc (proven by mint tx 0xc0b4cca9). |
| `CIRCLE_ATTESTATION_API` | v1 rollback path only — v2 uses `pollAttestationV2` with hardcoded base `https://iris-api-sandbox.circle.com/v2`. Optional override: add `CIRCLE_IRIS_API_V2` env if you want to point v2 at a different Iris instance. |
| `BRIDGE_MODE` | v1 dispatch field; only consulted when `BRIDGE_BACKEND=v1`. Unused under v2 but harmless. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Merchant layer — untouched |

### DROP from plan (was in original Phase 04, no longer needed)

| Env var | Why dropped |
|---|---|
| `KIT_KEY` | App Kit SDK dropped per ADR. Already removed from local `.env.local` in Phase 06 partial (30/05). If still on Vercel, can be deleted — harmless either way. |
| `ARC_CCTP_DOMAIN_ID` | v1 had this as `7` (Polygon's domain — bug). v2 hardcodes `26` in `NEXT_PUBLIC_ARC_CCTP_DOMAIN`. The old var is unused. |

## Redeploy

After saving env vars in Vercel:
1. Vercel dashboard → Deployments → latest production → **Redeploy** (no need to push a commit; env changes alone don't auto-redeploy).
2. Wait for build to complete (~2 min).

## Smoke gate (production)

Run on `https://aig-frontend-blond.vercel.app`:

1. **Page renders v2 UI** — open `/pay/test-session-prod-001?merchant=0x0809a724862D6636874809775Ba3623080c5ceF8&amount=1.00` (using AIG admin as test merchant). Header should mention **Ethereum Sepolia + USDC** (NOT BNB/PancakeSwap). If you see v1 wording, the flag isn't propagated → check Vercel env. (Note: exact header text may have drifted; the key signal is "Sepolia" vs "BSC".)
2. **End-to-end payment** — connect Sepolia wallet with USDC, click Pay $1.00, sign approve + depositForBurn, watch progress bar through `swap_executing → bridging → confirmed`. Median time <60s.
3. **Arc confirmation** — `testnet.arcscan.app/address/0x0809a724862D6636874809775Ba3623080c5ceF8` shows incoming 1.00 USDC tx.
4. **Merchant dashboard** — open `/dashboard?wallet=0x0809a724862D6636874809775Ba3623080c5ceF8` (or appropriate dashboard path), confirm payment feed shows the new tx.

Rollback if any of 1-4 fails:
- Vercel env: `NEXT_PUBLIC_BRIDGE_BACKEND=v1` + `BRIDGE_BACKEND=v1`. Redeploy. ~2 min recovery.
- Investigate failure locally before re-flip.

## Todo

- [x] **PRE:** Local v2 smoke passes (Phase 03 manual test) — ✅ 30/05, Arc mint `0xc0b4cca9`
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
| `AIG_ADMIN_WALLET_PRIVATE_KEY` wallet out of Arc gas | Wallet `0x0809a724862D6636874809775Ba3623080c5ceF8` had gas at 30/05 (mint tx 0xc0b4cca9 used 175k gas). Monitor balance and top up as needed; `receiveMessage` will revert if it ever runs dry. |
| Day 6 X post users hit v2 page expecting BNB → see "Pay with USDC" — confusion | Add a one-line FAQ in self-reply on the Day 6 post, or update the post with a "v2 update: now USDC via Sepolia" note |

## Out of scope for this phase

- Mainnet — Arc is testnet-only; mainnet pivot is a separate plan
- Multi-source-chain support (e.g., let customer pay from Base or Avalanche too) — v2.1 enhancement
- EIP-2612 permit to collapse 2 sigs → 1 — v2.1 enhancement

## Next

→ Phase 05 — likely deferred. SDK was the unified-balance path; without SDK, alternative is bridge contract event scanning or Circle REST API. Not blocking for the Challenge submission.
