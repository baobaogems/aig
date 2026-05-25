# Brainstorm Report — AIG v2 App Kit rebuild, strangler-fig pivot

**Date:** 2026-05-25 · **Session:** brainstorm skill stress-test of `plans/260525-2023-aig-v2-app-kit-rebuild/`

## Problem statement

AIG v1 = self-built SwapRouter.sol + CCTP + Admin Relay. Arc shipped App Kit (`@circle-fin/app-kit`) which natively does swap + bridge + send + unified balance. PRD v2 (25/05) wants the v1 bridge stack removed and the merchant layer (QR, dashboard, sessions, points) rebuilt on App Kit. Submission deadline 13/07/2026.

Initial plan (6 phases) ordered: **demolish v1 → build v2** — clean-slate pattern. Brainstorm session asked: is that ordering safe for a deployed system with a published Day 6 X post pointing at `main`?

## Constraints

- v1.0 tag (`c435a15`) preserved → forkable v1 always retrievable
- Vercel demo URL (`aig-frontend-blond.vercel.app`) live, referenced in Day 6 post
- Day 6 post links to `contracts/src/SwapRouter.sol` on `main`
- PRD timeline: 25/05 start → 13/07 submission (~7 weeks, slack thin)
- `@arc-network/app-kit` in PRD doesn't exist on npm; real package is `@circle-fin/app-kit` (verified, installed)
- Merchant layer (Supabase points, QR, dashboard, SSE sessions) must not regress

## Approaches evaluated

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **A: Big-bang (original 6-phase)** | Cleanest history; fewer code paths | `main` dead 3+ days; Vercel demo dies; Day 6 URL serves stubbed routes during gap | ❌ Rejected — schedule + public-facing risk |
| **B: Feature branch `v2/app-kit-rebuild`** | Isolated, clean merge, no env-flag plumbing | No preview deploys; big-merge risk grows; one all-or-nothing landing | ❌ Rejected — high integration-cliff risk |
| **C: Strangler-fig + env flag (RECOMMENDED)** | `main` always works; rollback = 1 env var; Vercel demo never dies; partial commits all green | +10% code temporarily (both paths live); env flag is plumbing | ✅ **Chosen** |

## Recommended solution (Approach C)

8 phases, each commit leaves `main` green:

```
Phase 0  install @circle-fin/app-kit + adapter (DONE earlier this session)
Phase 1  frontend/lib/appkit.server.ts (new file; v1 untouched)
Phase 2  /api/agent/* — add v2 path behind BRIDGE_BACKEND=v1|v2 env (default v1)
Phase 3  pay/[id]/page.tsx — same env-flag switching for writeContract block
Phase 4  Flip default to v2 on Vercel + production; rollback path = flip back
Phase 5  Dashboard + Unified Balance (additive)
Phase 6  Cleanup — ONLY AFTER v2 proven: delete /contracts, cctp.ts, mock-bridge.ts, scripts/test-cctp-*, scripts/test-e2e-admin-relay.ts; drop v1 branch from env flag
Phase 7  Docs sweep + Arc Testnet smoke + tag v2.0-alpha
```

## Cross-cutting hardenings (user-confirmed)

1. **Server-only App Kit** — file named `appkit.server.ts`; ESLint rule rejects client-component imports. Prevents `KIT_KEY` leaking into client bundle via accidental `NEXT_PUBLIC_*` prefix.
2. **Per-phase smoke gates** — each runtime phase ends with a concrete observable check (curl /api/agent/quote returns expected JSON; /pay/test-session renders SSE events; dashboard Unified Balance card mounts). Shift-left integration bugs.
3. **Explicit SSE/listener spike** — Phase 1 budgets 2-4h to verify `kit.on(...)` works with `ReadableStream` controller; client-poll fallback documented as plan B if listener API is too messy.

## Implementation considerations

- **`getKit()` is per-request, not singleton.** Singleton risks leaking listeners across concurrent payments. Construction is cheap.
- **Type discovery is lazy** (user skipped the type-audit gate). Wrappers may leak `any` until SDK types prove themselves. If pain, add Zod at boundaries later — don't pre-build it.
- **Wagmi stays.** Provides wallet-connect UX; App Kit consumes its `walletClient` via the viem adapter. Drop decision deferred to Phase 7.
- **KIT_KEY only lives server-side.** Set in Vercel as `KIT_KEY` (no `NEXT_PUBLIC_` prefix). API routes read it; client never sees it.

## Key risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `kit.on(...)` API doesn't fit `ReadableStream` controller | M | Client-poll fallback queued; Phase 1 spike decides path |
| SDK types too loose → runtime errors only | M | Smoke gate per phase catches early; add Zod retroactively if hot |
| Vercel env-flag misconfig flips both paths off | L | Phase 4 verifies before merging; rollback = 1 env var |
| Day 6 readers land on `main` post-cleanup, see no `/contracts/` | L | Phase 6 adds README banner pointing to `v1.0` tag |
| Circle Console KIT_KEY not available when Phase 1 starts | M | Phase 1 can use mocked kit for unit tests; blocks Phase 2 smoke |

## Success metrics

- `main` stays green every commit (CI check)
- Vercel demo never returns 5xx during transition
- Per-phase smoke gate passes before next phase starts
- Final: end-to-end payment confirmed on Arc Testnet block explorer
- Tag `v2.0-alpha` on origin

## Open questions (carry-over)

1. Does user have a Circle Console `KIT_KEY`? Blocks Phase 1 smoke gate.
2. Vercel env: when to add `BRIDGE_BACKEND=v1` baseline (start of Phase 2 or Phase 4)?
3. Should the v1 `BRIDGE_MODE`, `SWAP_ROUTER_ADDRESS_BSC`, etc. env vars stay on Vercel through Phase 5 in case rollback needed? (Recommendation: yes — they're harmless when v2 is the default; cleanup at Phase 6.)

## Next step

Revise `plans/260525-2023-aig-v2-app-kit-rebuild/plan.md` + replace phase files (01-06 → 00-07). Phase 0 already complete from earlier in this session.
