# Phase 01 — `appkit.server.ts` client wrapper

**Priority:** P0 · **Status:** pending · **Target day:** 26/05/2026

## Goal

Single server-only module wrapping `@circle-fin/app-kit`. Typed thin wrappers, no business logic, no fee math. v1 code paths remain — this file is purely additive.

## Architecture

```
[client: pay/[id]/page.tsx] ──fetch──▶ /api/agent/* (server)
                                              │
                                              ▼
                              [frontend/lib/appkit.server.ts] (THIS PHASE)
                                              │
                                              ▼
                              @circle-fin/app-kit + adapter-viem-v2
```

## Files

**Create**
- `frontend/lib/appkit.server.ts` (≤200 lines; split if needed)
- `frontend/lib/appkit.server.test.ts` (mock-based unit tests)
- `frontend/.eslintrc.cjs` or equivalent — rule blocking `.server.ts` imports from `app/**/page.tsx` / `components/**`

**Modify**
- `frontend/.env.local` — **add** `KIT_KEY=` placeholder. Do NOT remove v1 vars yet.

**Untouched**
- All v1 code: `cctp.ts`, `mock-bridge.ts`, `agent.ts`, routes, page, `/contracts`, etc.

## Implementation shape

```ts
// frontend/lib/appkit.server.ts
import "server-only"; // throws at build if imported from client
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapter } from "@circle-fin/adapter-viem-v2";
import type { WalletClient } from "viem";

const kitKey = () => {
  const k = process.env.KIT_KEY;
  if (!k) throw new Error("KIT_KEY missing — set in Vercel + .env.local");
  return k;
};

// per-request, NOT singleton (avoid listener leak across concurrent payments)
export function getKit(): AppKit { return new AppKit(); }
export function adapterFor(walletClient: WalletClient) { return createViemAdapter({ walletClient }); }

export async function quoteSwap(p: { ... }) { return getKit().estimateSwap({ ... config: { kitKey: kitKey() } }); }
// + executeSwap, quoteBridge, executeBridge, quoteSend, executeSend, getUnifiedBalance
```

## SSE/listener spike (sub-task, budget 2-4h)

- Inspect installed `node_modules/@circle-fin/app-kit/dist/*.d.ts` for `on/off` action names + handler signatures
- Prototype: small Node script that calls `kit.bridge(...)` and registers `kit.on(...)` listeners; log every emitted event
- Decision gate at end of spike:
  - ✅ Listeners fire predictably → wire into `ReadableStream` controller in Phase 2
  - ❌ Listeners flaky / signature unstable → fall back to client polling `/api/agent/status/[sessionId]` in Phase 2 (document the pivot)

## Smoke gate (end of phase)

- `frontend/lib/appkit.server.ts` imported from a temp scratch route `/api/_dev/appkit-ping` returns `{ ok: true, supportedChains: [...] }` via `kit.getSupportedChains()`
- ESLint catches a deliberate `import './appkit.server'` from a client component (build fails)
- Unit tests pass: `npm test --workspace=frontend`

## Todo

- [ ] Read `.d.ts` types for AppKit class + adapter + key params
- [ ] Implement `appkit.server.ts` (per-request `getKit`, typed wrappers)
- [ ] Add `import "server-only"` line + ESLint guard
- [ ] Run SSE spike → record decision in `plans/.../spike-sse-notes.md`
- [ ] Mock-based unit tests
- [ ] Smoke ping via scratch route
- [ ] Add `KIT_KEY=` to `.env.local` (placeholder OK; real value blocked on Circle Console)
- [ ] Commit `feat(v2): app kit server client + sse spike (phase 01)` — folds Phase 0 deps

## Success criteria

- `appkit.server.ts` ≤200 lines, exports `getKit`, `adapterFor`, 7 wrappers
- Server-only enforced (build fails on client import)
- Unit tests + smoke ping green
- v1 code paths untouched (`/contracts`, routes, page all unchanged)
- Commit pushed; `main` green

## Risks

| Risk | Mitigation |
|---|---|
| SDK types loose / `any`-heavy | Lazy: don't pre-validate; let smoke gate surface pain |
| `kit.on(...)` unsuitable for ReadableStream | Spike answers; fallback = client poll in Phase 2 |
| `KIT_KEY` not yet provisioned | Wrappers throw clear error; unit tests mock; real value lands in Phase 4 Vercel update |

## Next

→ Phase 2: add v2 branch behind `BRIDGE_BACKEND` env flag in `/api/agent/quote` + `execute`.
