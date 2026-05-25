# Phase 02 — API routes dual-path (env-flag switch)

**Priority:** P0 · **Status:** pending · **Target day:** 26-27/05/2026

## Goal

`/api/agent/quote` + `/api/agent/execute` support both v1 (CCTP/Admin Relay) and v2 (App Kit) code paths. Switch via `BRIDGE_BACKEND=v1|v2`. Default `v1` until Phase 4 flips it. v1 remains the safe path during the entire transition.

## Files

**Modify**
- `frontend/app/api/agent/quote/route.ts` — top-of-handler: branch on `process.env.BRIDGE_BACKEND ?? "v1"`; v1 branch = current PancakeSwap quoter code; v2 branch = call `quoteSwap + quoteBridge + quoteSend` from `appkit.server.ts`, return same response shape
- `frontend/app/api/agent/execute/route.ts` — same env-flag branching; v2 branch streams SSE events from App Kit (per-Phase-1-spike outcome: `kit.on(...)` or client-poll)
- `frontend/lib/agent.ts` — extract any shared session-state code into pure helpers; bridge-specific code stays branch-local
- `frontend/.env.local` — `BRIDGE_BACKEND=v1` (explicit baseline)

**Untouched**
- `cctp.ts`, `mock-bridge.ts`, `chains.ts` (v1 still uses them)
- `appkit.server.ts` (just consumed)
- `merchant.ts`, `points.ts`, dashboard route (merchant layer)

## Response shape contract (must match v1)

`POST /api/agent/quote` returns:
```json
{ "targetUSDC": "...", "fees": { "swap": "...", "bridge": "...", "send": "...", "total": "..." }, "requiredTokenIn": "..." }
```
Frontend must not need to know which backend served the request.

`POST /api/agent/execute` SSE stream — event names per PRD §8:
```
swap_executing → swap_done → bridging → bridge_done → sending → confirmed
```
v2 may collapse send into bridge if App Kit auto-routes; emit equivalent terminal event.

## Smoke gate (end of phase)

Two curls, same payload, both succeed:
```
BRIDGE_BACKEND=v1 npm run dev   # in one terminal
curl -X POST http://localhost:3000/api/agent/quote -d @scripts/fixtures/sample-quote.json
# expect v1 PancakeSwap-quoter response

# stop, restart with BRIDGE_BACKEND=v2
curl -X POST http://localhost:3000/api/agent/quote -d @scripts/fixtures/sample-quote.json
# expect v2 App-Kit response, SAME shape
```

Plus: `/api/agent/execute` SSE stream — open with `curl -N`, both flags must terminate on `confirmed` event.

## Todo

- [ ] Read existing `quote/route.ts` + `execute/route.ts` for session/SSE patterns to preserve
- [ ] Extract shared helpers from `agent.ts`; gate bridge-specific code per branch
- [ ] v1 branch: no behavior change
- [ ] v2 branch: wire `appkit.server.ts` calls + SSE per Phase 1 spike outcome
- [ ] Create `scripts/fixtures/sample-quote.json` for repeatable smoke
- [ ] Both branches return identical response shape (contract test)
- [ ] Add `BRIDGE_BACKEND=v1` to `.env.local`
- [ ] Smoke: dual curl run
- [ ] Commit `feat(v2): api routes dual-path behind BRIDGE_BACKEND (phase 02)`

## Success criteria

- `BRIDGE_BACKEND=v1` → identical behavior to pre-Phase-2 `main`
- `BRIDGE_BACKEND=v2` → returns valid quote / streams to `confirmed`
- Response shape contract preserved (frontend unchanged)
- `main` green after commit; Vercel still serves v1 (no env var changes there yet)

## Risks

| Risk | Mitigation |
|---|---|
| Shape drift between v1 and v2 responses → frontend bugs | Contract test in smoke gate compares JSON keys |
| SSE event order differs between backends | Document any divergence in commit msg; frontend handles unknown events gracefully |
| Phase 1 spike said "use client-poll" → no SSE on v2 | Add `/api/agent/status/[sessionId]` route alongside; flag in execute response |

## Next

→ Phase 3: same env-flag switch in customer payment page.
