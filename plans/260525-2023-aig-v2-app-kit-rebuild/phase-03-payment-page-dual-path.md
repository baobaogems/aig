# Phase 03 — Payment page v2 via Arc bridge contract (REDESIGNED post-ADR)

**Priority:** P0 · **Status:** pending · **Target day:** 26-28/05/2026 · **ADR:** [drop-app-kit-sdk-use-bridge-contract-directly](../reports/adr-260525-2333-drop-app-kit-sdk-use-bridge-contract-directly.md)

> **Scope rewrite 25/05 (ADR):** App Kit SDK is structurally incompatible with BYO-wallet payments (needs both customer wallet + server secret in one call). v2 now uses direct `writeContract` against Arc's `kitContracts.bridge` (`0xC5567a5E3370d4DBfB0540025078e283e36A363d`), with server-side attestation polling reusing existing v1 `cctp.ts` logic. Same strangler-fig pattern, different mechanic — much closer to v1 than the SDK approach would have been.

## Goal

`frontend/app/pay/[id]/page.tsx` supports both v1 (writeContract to our `SwapRouter.sol`) and v2 (writeContract to Arc's bridge contract) code paths. Server-side `/api/agent/execute` reuses existing CCTP polling, branched on `BRIDGE_BACKEND` env to point at v1's BSC contracts OR v2's Arc bridge + messageTransmitter. Client switch via `NEXT_PUBLIC_BRIDGE_BACKEND=v1|v2` (default v1).

## Arc Testnet config (from spike notes)

```
chainId:              5042002
USDC (Arc):           0x3600000000000000000000000000000000000000  (18 decimals, native gas)
kitContracts.bridge:  0xC5567a5E3370d4DBfB0540025078e283e36A363d
kitContracts.adapter: 0xBBD70b01a1CAbc96d5b7b129Ae1AAabdf50dd40b
CCTP v2 domain:       26  (NOT 7 — v1 bug retroactive)
CCTP tokenMessenger:  0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA
CCTP messageTransmitter: 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275
RPC:                  https://rpc.testnet.arc.network/
Explorer:             https://testnet.arcscan.app
```

## Step 0 — research (deferred from Phase 01)

Before writing any v2 code, must answer:

1. **Arc bridge contract ABI.** Pull from `@circle-fin/bridge-kit` package source, or fetch verified ABI from `testnet.arcscan.app/address/0xC5567a5E…363d`. Identify the function customer calls (likely `bridge(amount, destinationDomain, mintRecipient)` or similar — exact signature TBD).
2. **Bridge vs raw CCTP.** Is Arc's bridge contract a thin wrapper around standard CCTP `TokenMessenger.depositForBurn`, or does it do extra (fee burn, gas in USDC, etc.)? Affects whether v2 server-side polling logic differs from v1.
3. **Source-chain support.** Does customer pay FROM Arc (intra-Arc transfer), or from another chain (e.g., Ethereum Sepolia → Arc)? PRD model = customer pays from any chain → merchant receives USDC on Arc. The bridge contract address `0xC5567a5E…363d` is consistent across all chains in the spike data, so each source chain has its own deployment.
4. **`/api/agent/execute` server polling.** Does existing `cctp.ts` (extractMessageHash + pollAttestation + receiveMessage) work unmodified if pointed at Arc's messageTransmitter? Likely yes — Circle's attestation API is chain-agnostic.

Budget: 2-3h spike. Outputs: bridge ABI file (or imported constant), confirmed flow diagram, decision on env var set.

## Files

**Create**
- `frontend/lib/arc-bridge-abi.ts` — Arc bridge contract ABI constant (extracted from @circle-fin/bridge-kit or explorer)
- (maybe) `frontend/lib/arc-bridge.ts` — small helper module wrapping bridge call params formatting

**Modify**
- `frontend/app/pay/[id]/page.tsx` — branch on `process.env.NEXT_PUBLIC_BRIDGE_BACKEND ?? "v1"`:
  - v1: existing `writeContract` to `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS_BSC` (untouched)
  - v2: `writeContract` to `NEXT_PUBLIC_ARC_BRIDGE_CONTRACT_ADDRESS` with appropriate bridge params
- `frontend/app/api/agent/execute/route.ts` — extend existing `BRIDGE_MODE` switch to recognize `BRIDGE_BACKEND=v2`; v2 path uses Arc's messageTransmitter address + domain 26 in the attestation flow
- `frontend/lib/cctp.ts` — parameterize chain endpoints (currently hardcoded for BSC→Arc with wrong domain). Inject domain + messageTransmitter from env.
- `frontend/lib/agent.ts` — minor: add `calculateBridgeParams` for v2 (target USDC + merchant address → bridge call args)
- `frontend/.env.local` — add `NEXT_PUBLIC_BRIDGE_BACKEND=v1` (default), `NEXT_PUBLIC_ARC_BRIDGE_CONTRACT_ADDRESS=0xC5567a5E…363d`

**Untouched in this phase**
- `frontend/lib/appkit.server.ts` (dead code, deleted in Phase 06)
- `frontend/app/api/dev/appkit-ping/route.ts` (dead code, deleted in Phase 06)
- `frontend/lib/mock-bridge.ts` (v1 admin relay, deleted in Phase 06)
- v1 server routes when BRIDGE_BACKEND=v1

## Smoke gate (end of phase)

- Local dev with `NEXT_PUBLIC_BRIDGE_BACKEND=v1` → existing v1 flow works end-to-end (no change in behavior)
- Local dev with `NEXT_PUBLIC_BRIDGE_BACKEND=v2` → customer connects wallet, signs single bridge tx, server polls Arc messageTransmitter attestation, merchant USDC arrives on Arc, session = CONFIRMED, points awarded
- Both render same `FeeBreakdownCard` + `PaymentProgressBar` (UI components unchanged)
- 3-tap UX preserved (connect → approve → done)

## Todo

- [ ] Step 0: Arc bridge ABI + flow (research)
- [ ] Add NEXT_PUBLIC_BRIDGE_BACKEND + NEXT_PUBLIC_ARC_BRIDGE_CONTRACT_ADDRESS to `.env.local`
- [ ] Create `frontend/lib/arc-bridge-abi.ts`
- [ ] Add v2 branch in `pay/[id]/page.tsx`
- [ ] Parameterize `cctp.ts` (domain, messageTransmitter) instead of hardcoded
- [ ] Add v2 branch in `/api/agent/execute/route.ts`
- [ ] Dual smoke (v1 + v2) locally
- [ ] Commit `feat(v2): payment via arc bridge contract (phase 03)`

## Success criteria

- `BRIDGE_BACKEND=v1` → v1 behavior 100% unchanged
- `BRIDGE_BACKEND=v2` → real Arc Testnet tx confirmed on `testnet.arcscan.app`, merchant USDC balance increased by exact `targetUSDC` amount
- Page file <200 lines (extract `PaymentFlowV1.tsx` + `PaymentFlowV2.tsx` if it grows)
- No `@circle-fin/app-kit` import in any live code path

## Risks

| Risk | Mitigation |
|---|---|
| Arc bridge contract ABI differs from Circle's standard CCTP `depositForBurn` | Step 0 confirms before code; ABI extraction from `@circle-fin/bridge-kit` package source as fallback |
| `cctp.ts` hardcoded BSC values too entangled to parameterize cleanly | Extract a `ChainBridgeConfig` type and inject; if too messy, fork to `cctp-v1.ts` + `cctp-v2.ts` (delete v1 in Phase 06) |
| Customer pays from chain X != Arc; bridge contract deployments on each source chain may have different ABIs | Check spike output for cross-chain ABI consistency |
| Existing v1 page is 245 lines; v2 branch pushes past 200-line guideline | Extract `PaymentFlowV1.tsx` + `PaymentFlowV2.tsx` components, page becomes thin dispatcher |

## Next

→ Phase 04 (Vercel env flip to v2 default)
