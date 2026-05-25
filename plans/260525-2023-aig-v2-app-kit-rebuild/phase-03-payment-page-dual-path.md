# Phase 03 — Payment page dual-path

**Priority:** P0 · **Status:** pending · **Target day:** 27-28/05/2026

## Goal

`frontend/app/pay/[id]/page.tsx` supports both v1 (direct `writeContract` to SwapRouter.sol) and v2 (App Kit flow via `/api/agent/execute`) code paths. Branch selected client-side via `NEXT_PUBLIC_BRIDGE_BACKEND=v1|v2` env (mirrors server-side flag, but exposed to client since the page needs to know).

## Files

**Modify**
- `frontend/app/pay/[id]/page.tsx` — branch on `process.env.NEXT_PUBLIC_BRIDGE_BACKEND ?? "v1"`:
  - `v1`: existing `writeContractAsync({ address: NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC, abi: SWAP_ROUTER_ABI, ... })`
  - `v2`: consume `/api/agent/execute` SSE; App Kit handles wallet signature via adapter; no direct `writeContract` for swap/bridge
- `frontend/.env.local` — add `NEXT_PUBLIC_BRIDGE_BACKEND=v1`

**Untouched**
- `SWAP_ROUTER_ABI` constant stays in the file (still used by v1 branch)
- Wallet-connect UI (wagmi) unchanged — both branches use it for `walletClient`

## Smoke gate (end of phase)

- Local dev with `NEXT_PUBLIC_BRIDGE_BACKEND=v1` → existing v1 demo works end-to-end (visual progress bar, payment confirmed)
- Restart with `NEXT_PUBLIC_BRIDGE_BACKEND=v2` → page renders, SSE events arrive, progress bar updates, payment confirms (requires `KIT_KEY` real value; mock if blocked)
- 3-tap UX preserved on v2 (connect wallet → approve → done)

## Todo

- [ ] Read current `pay/[id]/page.tsx` for SSE consumer + UI patterns
- [ ] Add branch wrapper; isolate v1 `writeContract` block under `if (backend === "v1")`
- [ ] v2 branch: open SSE to `/api/agent/execute`, drive progress bar from events
- [ ] Add `NEXT_PUBLIC_BRIDGE_BACKEND=v1` to `.env.local`
- [ ] Mobile-first responsive check both branches
- [ ] Smoke: dual local run
- [ ] Commit `feat(v2): payment page dual-path (phase 03)`

## Success criteria

- Both env values render + complete a payment on Arc Testnet (or BSC for v1)
- v1 behavior 100% unchanged when flag is `v1`
- No SwapRouter ABI reference inside v2 branch
- Page size doesn't balloon (>2× original = refactor)

## Risks

| Risk | Mitigation |
|---|---|
| Two code paths in one file → readability decay | If >300 lines, extract `PaymentFlowV1.tsx` + `PaymentFlowV2.tsx` and pick at render time |
| `NEXT_PUBLIC_*` flag visible to attackers — none, this is just a UX switch | N/A |
| App Kit may force its own modal/UI for swap signing — UX hand-off looks wrong | Check SDK for headless mode in Phase 1 spike; theme if not headless |

## Next

→ Phase 4: flip default to v2 on Vercel.
