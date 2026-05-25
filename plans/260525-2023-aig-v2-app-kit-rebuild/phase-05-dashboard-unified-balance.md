# Phase 05 — Dashboard + Unified Balance

**Priority:** P1 · **Status:** pending · **Target day:** 29-31/05/2026

## Goal

Merchant dashboard surfaces multi-chain USDC balance via `kit.unifiedBalance.getBalances`. Purely additive — existing analytics/feed/points unchanged.

## Files

**Modify**
- `frontend/app/dashboard/page.tsx` — add `<UnifiedBalanceCard />` at top
- (optional) `frontend/app/api/dashboard/route.ts` — proxy `getBalances` if client-side call hits rate limits

**Create**
- `frontend/components/unified-balance-card.tsx` (or inline if small)

## Smoke gate

- Dashboard loads <2s with the new card mounted
- Card shows total USDC + per-chain breakdown for the connected merchant wallet
- Existing analytics (revenue chart, payment feed, points ledger) unchanged

## Todo

- [ ] Add Unified Balance card (total + per-chain breakdown)
- [ ] Cache results 60s
- [ ] Existing dashboard features untouched
- [ ] Commit `feat(v2): unified balance on merchant dashboard (phase 05)`

## Success criteria

- Card renders for any merchant wallet with USDC across ≥1 chain
- Dashboard load `<2s`
- Zero changes to existing payment-feed/revenue-chart/points-ledger components

## Risk

`getBalances` may need merchant's signed-in wallet → client-side fetch only. If rate-limited under load, add server-side cached proxy.

## Next

→ Phase 6: delete v1 (ONLY AFTER v2 has been on Vercel production at least 48h without issue).
