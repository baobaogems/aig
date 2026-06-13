# Brainstorm — AIG v3 Agentic Nanopayments

> Date: 2026-06-13 · Branch: `feat/agentic` · Base: PRD_v3_AIG_Agentic.md (built on frozen v2.2)
> Status: design agreed, awaiting plan decision. No code written.

## Problem / scope
Add a SECOND payment source to AIG: autonomous agents paying a merchant per-use in sub-cent USDC on Arc, settling into the SAME gateway pipeline as v2.2 (session row → dashboard feed → points). Addition, not rebuild. Done = ONE agent nanopayment e2e on Arc testnet, shows in dashboard, points awarded, tx captured.

## Phase 0 spike — VERIFIED (real, not assumed)
Circle Nanopayments is real (launched 05/2026). It is **x402 + Circle Gateway**, NOT CCTP.

| Fact | Value |
|---|---|
| Protocol | x402 (HTTP `402 Payment Required`) |
| Settlement | Circle Gateway — off-chain signed auth batched into 1 on-chain settle; gas-free; min $0.000001 |
| SDK | `@circle-fin/x402-batching` → `GatewayClient` |
| Starter kit | `github.com/circlefin/arc-nanopayments`: Next.js **seller** (`/api/premium/*` 402 routes) + LangChain **buyer** (`agent.mts`) |
| Seller stack | Next.js App Router + Supabase (SAME as AIG) |
| Seller secrets | `SELLER_ADDRESS` + `SELLER_PRIVATE_KEY` (Gateway balance + withdraw) |
| Buyer | pre-deposits USDC into Gateway, pays autonomously; LLM optional (no key → mock scripted mode) |
| Network | Arc Testnet |

Implication: v2.2 `payment-flow-v2.ts` / `cctp.ts` are genuinely irrelevant to v3 (different mechanism) → frozen-file rule trivially satisfied. AIG is the **SELLER/gateway**; "agentic" is the BUYER side (Circle's). **AIG still has NO LLM** — do not claim AIG is an AI.

## Agreed architecture (4 decisions)
1. **Reuse level: cherry-pick** — add `@circle-fin/x402-batching` to existing AIG frontend, write NEW x402 route + lib, reuse v2.2 Supabase session/points/dashboard. No app merge.
2. **Seller model: single AIG admin wallet** as Gateway seller for demo. Multi-merchant routing deferred → v3.1 (see Risk 1).
3. **Session/points: one row per nanopayment** (`payment_sessions`, like v2.2) shown in existing feed. Flooding deferred (Risk 2).
4. **Demo buyer: simple script, mock mode** (no OpenAI). Matches PRD "script acting as an agent". Honest, fewer variables. LLM buyer optional later (P4).

## Component design
**New files only (per PRD guardrail):**
- `frontend/lib/nanopay.ts` — `GatewayClient` wrapper: build 402 requirements, verify incoming payment, settle, then record session + award points (reuse `points.ts`, `agent.ts` getSupabaseClient — read/call, not rewrite).
- `frontend/app/api/nanopay/[resource]/route.ts` — x402-protected endpoint(s); returns 402 unpaid, 200 + resource on verified payment.
- `scripts/nano-agent.mts` — buyer script (mock): deposit→pay one resource→print settlement tx.

**Reused (not frozen — only `payment-flow-v2.ts` + `cctp.ts` are off-limits):**
- `frontend/lib/points.ts` `awardPoints` · `frontend/lib/agent.ts` `getSupabaseClient` · `frontend/lib/merchant.ts` dashboard aggregation · `app/dashboard` feed.

**Flow:**
```
agent GET /api/nanopay/<res>  -> 402 + {amount, seller, network=Arc}
agent signs off-chain auth (GatewayClient), retries w/ X-PAYMENT header
AIG route verifies via @circle-fin/x402-batching -> settlement ref
  on OK: insert payment_sessions row (source='nanopay', CONFIRMED, amount, buyer addr, settle ref)
         awardPoints(...)  ; return 200 + resource
dashboard feed (reuse) shows the row
```

## Phase mapping (build order — one at a time, per user rule)
- **P0 Spike** ✅ done here (real API documented above). No code.
- **P1 Minimal receive** — `nanopay.ts` + `/api/nanopay` route accept ONE agent payment on Arc testnet, log success. No dashboard/points yet.
- **P2 Wire gateway** — record each nano as `payment_sessions` row in existing feed. *May need schema touch (see Open Q) → stop + confirm first per PRD.*
- **P3 Points** — `awardPoints` on nano confirm.
- **P4 Demo polish** — clean recordable buyer script + tx hash for content/grant.

## Risks (brutal honesty)
1. **Multi-tenant settlement gap** — Gateway nano is seller-account-centric (1 `SELLER_PRIVATE_KEY`). AIG-as-multi-merchant-gateway for nano is unproven on Circle's side. Demo single-seller OK; do NOT pitch "nano gateway for many merchants" until verified.
2. **Sub-cent flooding / points gaming** — nano = thousands/min. 1 row/tx floods `payment_sessions`+dashboard+`points_ledger`; `points = usdVolume×mult` invites spam-farm of tiny payments. Fine for demo; needs aggregation + anti-abuse before scale.
3. **DB precision** — `payment_sessions.target_usdc` must store sub-cent ($0.0003). If column is integer/2-dp, sub-cent truncates → must verify type (P2).
4. **Exact SDK surface** — function/middleware names of `@circle-fin/x402-batching` must be read from the installed package / repo at P1, not assumed.
5. **Smoke-test semantics** — see below.

## Verification / smoke strategy (resolves the rule mismatch)
- **Regression guard (every v3 task):** `tsc --noEmit` + `next build` green; v2.2 CCTP path untouched (frozen files unchanged). The "e2e Sepolia→Arc CCTP smoke" applies ONLY as this regression guard — v3 does not exercise it.
- **v3 feature test:** buyer script → `/api/nanopay` → Gateway settle on Arc → row recorded → (P3) points up. This is the real per-task test for v3.

## Open questions (confirm before the phase that hits them)
1. P2 schema: add `source` discriminator (`'cctp'|'nanopay'`) to `payment_sessions`, and confirm `target_usdc` precision for sub-cent? (PRD says stop+confirm before schema change.)
2. Seller wallet = reuse `AIG_ADMIN_WALLET_PRIVATE_KEY` as Gateway seller, or a separate `SELLER_PRIVATE_KEY`? (security/separation)
3. Does the buyer need its own funded Gateway balance on Arc testnet provisioned before demo? (likely yes — who funds it.)
4. Multi-merchant nano routing — park as v3.1 or must P-plan address now?
