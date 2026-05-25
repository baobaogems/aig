# Phase 04 — Flip default to v2 on Vercel

**Priority:** P0 · **Status:** pending · **Target day:** 28-29/05/2026

## Goal

Production demo (Vercel) starts serving v2 by default. Rollback is one env-var change.

## What changes (Vercel dashboard — not code)

| Env var | Action | Notes |
|---|---|---|
| `KIT_KEY` | **ADD** (Production + Preview) | Real value from Circle Console |
| `BRIDGE_BACKEND` | **ADD** = `v2` | Server-side default for `/api/agent/*` |
| `NEXT_PUBLIC_BRIDGE_BACKEND` | **ADD** = `v2` | Client-side default for `pay/[id]/page.tsx` |
| `SWAP_ROUTER_ADDRESS_BSC` | **KEEP** | Rollback path: flip both BACKEND vars to `v1`, v1 code reads this |
| `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC` | **KEEP** | Same reason |
| `PANCAKESWAP_V3_QUOTER_BSC`, `CCTP_*`, `BRIDGE_MODE` | **KEEP** | Cleanup in Phase 6 after v2 proven |

## Smoke gate (end of phase)

Production smoke on the actual Vercel URL `aig-frontend-blond.vercel.app`:

1. `curl https://aig-frontend-blond.vercel.app/api/agent/quote -X POST -d @scripts/fixtures/sample-quote.json` — expect v2 response shape
2. Open `/pay/<test-session-id>` in browser → see App Kit-driven UI; complete a small testnet payment end-to-end
3. Confirm payment landed on Arc Testnet block explorer
4. Merchant dashboard shows the payment in feed

If ANY check fails: flip `BRIDGE_BACKEND=v1` + `NEXT_PUBLIC_BRIDGE_BACKEND=v1` on Vercel, redeploy — back to v1 in ~2 min.

## Todo

- [ ] User: get `KIT_KEY` from https://console.circle.com → paste into Vercel Production + Preview env
- [ ] User: set `BRIDGE_BACKEND=v2` + `NEXT_PUBLIC_BRIDGE_BACKEND=v2` on Vercel
- [ ] Trigger Vercel redeploy (or push trivial commit)
- [ ] Run 4 smoke checks above
- [ ] If green: append status_AIG.json `ops` entry "v2 live in production"
- [ ] If red: rollback + open issue

## Success criteria

- 4/4 smoke checks green on production URL
- Arc Testnet explorer shows a real v2 payment hash
- Rollback procedure tested at least once (flip back then forward) in Preview environment

## Risks

| Risk | Mitigation |
|---|---|
| `KIT_KEY` rate limits hit under real load | Circle Console quota check; cache where possible |
| Vercel cold-start adds App Kit init overhead | Per-request `getKit()` is cheap; measure first |
| App Kit fails on Arc Testnet RPC issues unrelated to AIG | Status page check; defer flip if Arc Testnet flaky |

## Next

→ Phase 5: dashboard adds Unified Balance widget.
