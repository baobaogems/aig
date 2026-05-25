# Phase 02 — ✗ COLLAPSED (absorbed into Phase 03)

**Status:** ✗ COLLAPSED · **Date collapsed:** 25/05/2026 · **Reason:** architectural finding during spike

## What changed

The original Phase 02 planned a server-side dual-path `/api/agent/quote` + `/api/agent/execute` switched by a `BRIDGE_BACKEND=v1|v2` env var, with the v2 branch calling `kit.estimateSwap + estimateBridge + estimateSend` server-side.

**That's impossible.** Phase 01 spike + a runtime probe (`frontend/` node REPL) confirmed every App Kit operation — including the read-only `estimate*` variants — requires `from.adapter` in its params, and that adapter must be wired to the **customer's wallet** (EIP-1193 provider). The server has no customer wallet. The PRD §8 server-side quote flow was modeled on v1's PancakeSwap quoter (public RPC reads, no wallet needed) and doesn't carry over to App Kit.

### Probe results (2026-05-25)

```js
// frontend/ node REPL with KIT_KEY set
await kit.estimateSwap({ from: { chain: 'Arc_Testnet' }, tokenIn: 'USDC', tokenOut: 'EURC', amountIn: '1.00', config: { kitKey } })
// → KitError: Invalid swap parameters: from.adapter: Required

await kit.estimateBridge({ from: { chain: 'Ethereum_Sepolia' }, to: { chain: 'Arc_Testnet' }, amount: '1.00', token: 'USDC' })
// → KitError: Invalid parameters: from.adapter: Required; to: Invalid input
```

There IS a theoretical workaround (developer-controlled adapter via `createViemAdapterFromPrivateKey(AIG_KEY)` + `address: customerAddr`), but it would reflect AIG's wallet state for balances/gas/nonces — wrong by design for a customer quote.

## Where Phase 02 scope went

- **Quote (estimate)** → Phase 03, client-side. Page calls `kit.estimateSwap/estimateBridge/estimateSend` after wallet connects, displays fee breakdown.
- **Execute (bridge)** → Phase 03, client-side. Page calls `kit.bridge`/`kit.send`, listens to `kit.on('*')` events for progress UI, PATCHes session status to the server.
- **Server status endpoint** → Phase 03 adds `PATCH /api/sessions/[id]/status` (replaces the would-be `/api/agent/execute` v2 branch).
- **`BRIDGE_BACKEND` env switch** → becomes `NEXT_PUBLIC_BRIDGE_BACKEND=v1|v2` only (client read), no server-side flag needed.

## v1 server routes — untouched until Phase 06

`/api/agent/quote` and `/api/agent/execute` keep their v1 PancakeSwap + CCTP/Admin-Relay logic. They simply stop being called when the client uses v2 mode. Phase 06 cleanup deletes them along with the rest of v1.

## Plan-level downstream effects

- **Phase 04** shrinks: just set `KIT_KEY` + `NEXT_PUBLIC_BRIDGE_BACKEND=v2` on Vercel (no server env changes).
- **Phase 06** unchanged in scope but the "delete v1 server-side branches" sub-task becomes "delete v1 server routes entirely" (no dual-path to unwind).
- Total phase count drops from 8 → 7 effective.

## Lessons captured

1. PRD §8 architecture diagram assumed v1's server-side quote pattern. Update the PRD doc to mark the quote/execute boxes as client-side for v2.
2. Strangler-fig pattern still works — it just runs in the client layer (page) instead of the server layer (routes). Same env-flag idea, different layer.
3. Spike-before-implement saved a week of wrong-direction work.
