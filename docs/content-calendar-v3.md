# AIG Content Calendar v3 (truth-aligned)

> 🧊 **ĐÓNG BĂNG 18/08/2026** — file này không cập nhật nữa, giữ để tra cứu.
> Trạng thái hiện tại + lý do mọi thay đổi: [`docs/marketing-status.md`](./marketing-status.md).


> Rebuilds the old 30-day calendar against what the code ACTUALLY shipped. Docs-only;
> no code touched. Every technical claim verified against repo source (file:line) before listing.
> **Sources:** old calendar `plans/260526-1034-aig-v2-30day-content-calendar.md` (the only 30-day
> calendar in repo — it lives in `plans/`, not `docs/` or `content/`), PRD v2.2 §12
> (`PRD_v2_AIG_AppKit.md:234`), PRD v3 (`PRD_v3_AIG_Agentic.md`).

## Verified technical facts (cite these, nothing else)

| Claim | Truth | Source |
|---|---|---|
| v2 client hook size | **178 lines** (NOT "173") | `frontend/lib/payment-flow-v2.ts` (178) |
| Mint mechanism | server relay calls `MessageTransmitter.receiveMessage` on Arc | `frontend/lib/cctp.ts:65` |
| Attestation | poll **Circle Iris v2** by (domain, txHash) | `frontend/lib/cctp.ts:32` |
| CCTP dest domain | **26** (Arc) — not 7 | `frontend/lib/payment-flow-v2.ts:24` |
| Transfer type | CCTPv2 **Fast** (`minFinalityThreshold=1000`, 7-arg depositForBurn) | `frontend/lib/payment-flow-v2.ts:46,153` |
| User signatures | exactly 2 (approve + depositForBurn); mint by server | `frontend/lib/payment-flow-v2.ts:136,149` |
| Net received | 1 USDC burn → **0.996383** on Arc (~0.36% Circle fee) | `docs/v2-smoke-evidence.md:23` |
| e2e proof (CCTP) | burn `0x9a62…ffa16` → mint `0xc0b4…1eb61` | `docs/v2-smoke-evidence.md:19,22` |
| Swap | **removed** (no SwapRouter/PancakeSwap; `contracts/` deleted) | commit `72cada0`, no `contracts/` dir |
| "AI agent" | NONE — `/api/agent` is orchestration, no LLM dep | audit; `package.json` (no openai/langchain) |
| AIG service fee | NONE in v2 | no skim in repo |
| Agentic nanopay | x402 + Circle Gateway (`@circle-fin/x402-batching`) | `frontend/lib/nanopay.ts:17` |
| Nano multi-merchant | dynamic payTo verified to arbitrary address | `frontend/app/api/nanopay/m/[merchant]/route.ts`; `docs/nano-smoke-evidence.md` (v3.2) |
| Nano aggregation | `nano_agents` table + `nano_record()` fn | migrations `004`,`005`; `docs/nano-smoke-evidence.md` (v3.1) |
| Merchant SDK (npm) | **NOT built** — roadmap/vision only | — (do not claim shipped) |

## CUT rule applied
CUT = builds on v1-as-current or banned terms: SwapRouter.sol, exactOutputSingle, PancakeSwap,
App-Kit-as-foundation, CCTP Domain 7, "AI agent", AIG service fee.
Note: an App Kit **post-mortem** (why we dropped it) is KEEP/REWRITE, not CUT — it is honest history.

---

## Calendar audit + v3 backbone

Re-anchored from today (14/06/2026), ~every 2 days so the Challenge anchor lands by its 13/07 deadline.

| Day | Date | Topic | Status | Verify-source / fix |
|---|---|---|---|---|
| 1 | Sat 14/06 | Open-source v1 repo ("fork before you debug CCTP") | **KEEP** | repo public; honest journey post |
| 2 | Mon 16/06 | App Kit pivot confession (VN): tried App Kit → dropped → direct CCTP | **REWRITE** | "173"→**178** (`payment-flow-v2.ts`); keep drop-narrative; "Domain 7→26" correct (`:24`) |
| 3 | Wed 18/06 | "Why we dropped @circle-fin/app-kit, went direct" (EN post-mortem) | **KEEP** | post-mortem = allowed; frame App Kit as dropped, not foundation |
| 4 | Fri 20/06 | "v2 shipped: client hook + Circle attestation, code walkthrough" | **REWRITE** | "173-line"→**178** (`payment-flow-v2.ts`); attestation = Iris v2 (`cctp.ts:32`) |
| 5 | Mon 23/06 | "CCTP Domain 26 not 7 — đừng copy docs cũ" (VN explainer) | **KEEP** | domain 26 verified (`payment-flow-v2.ts:24`) |
| 6 | ✅ DONE | Circle Dev Grant — **submitted (confirmed)** + "3-slide deck" recap | **KEEP** | Grant already submitted to Circle; write as announcement/recap, NOT future submission |
| 7 | Wed 25/06 | "CCTPv2 in TypeScript: reference integration" | **REWRITE** | point to real files (`cctp.ts`, `payment-flow-v2.ts`); 178-line hook + Iris v2 poll |
| 8 | Fri 27/06 | Video: pay $1 USDC Sepolia → lands on Arc (tx) | **REWRITE** | timing "45s"→**~60-120s e2e** (`v2-smoke-evidence.md:60`); shows net 0.996383 |
| 9 | Mon 30/06 | AMA: Arc / CCTP / build on testnet (VN community) | **KEEP** | community, no tech claim |
| 10 | Wed 02/07 | "Strangler-fig: BRIDGE_BACKEND=v1\|v2 flag, zero downtime" | **REWRITE** | frame as PAST ("used a flag during migration, then ripped v1 out"). ⚠️ flag dispatch actually removed in **`60ef983`** ("finalize v2-only"), NOT `72cada0` — at `72cada0` execute route still has `BRIDGE_BACKEND ?? "v1"` (`:30`). Real LOC: execute route **201→132**, pay page **337→117** (`60ef983` numstat). v1 preserved at git tag `v1.0`. Do NOT trust `72cada0`'s message ("~85 vs 200+" is wrong). |
| 11 | Fri 04/07 | "Live demo: cross-chain payment" | **REWRITE** | timing → ~60-120s (`v2-smoke-evidence.md:60`) |
| 12 | Mon 07/07 | "Things I got wrong on v1 that v2 fixed" (debrief) | **KEEP** | honest; e.g. wrong domain 7→26, swap removed |
| 13 | Wed 09/07 | "Stablecoins Commerce Stack Challenge là gì + sao VN nên nộp" | **KEEP** | external, no tech claim |
| 14 | Sun 13/07 | ⭐ SUBMIT Challenge (deadline) + "AIG entry" | **KEEP** | anchor — hard deadline 13/07 |
| 15 | Wed 16/07 | "Shipping a payment flow twice: v1 BSC → v2 Sepolia + CCTPv2" | **KEEP** | true (v1 BSC, v2 Sepolia domain 0 → Arc 26) |
| 16 | Fri 18/07 | "30 days building in public: numbers, mistakes, next" | **KEEP** | recap |
| 17 | Mon 21/07 | "VN devs trên Arc: vì sao Architects tier đáng săn" | **KEEP** | community |
| 18 | Wed 23/07 | "Open-source repo + 30-day journal: take what you need" | **KEEP** | closing |
| — | — | **§12 #2 "App Kit deep dive: replace 500 lines Solidity w/ 3 API calls"** | **CUT** | App Kit never used as foundation; misleading |
| — | — | **§12 #3 "Unified Balance explainer"** | **CUT** | App Kit feature, not built |
| — | — | **§12 #4 "StableFX / QCAD+EURC multi-currency"** | **CUT** | not built (USDC-only) |

## Appendix — backbone pool (no fixed dates; pull in as needed)

> Not on the main timeline — by the time Days 1-18 run, content direction may pivot. Treat as a
> ready-to-use idea pool (esp. the agentic angle, which is the strongest now that v3 is real).

| # | Topic | Status | Verify-source / guardrail |
|---|---|---|---|
| A1 | Comeback / own-the-silence ("vanished N days, was ripping v1 out → v2-only in prod") | **NEW** | matches `content/day-01-resume-260612-draft-vn.md`; v2 live on Vercel |
| A2 | CCTPv2 deep dive (Fast Transfer, 2 sigs, server relay mint, 7-arg burn) | **NEW** | `payment-flow-v2.ts:46,136,149`; `cctp.ts:65` |
| A3 | Merchant layer (QR + realtime SSE feed + dashboard + points) | **NEW** | `qr-code-generator.tsx`, `payment-feed-table.tsx`, `app/dashboard`, `points.ts` |
| A4 | Fee honesty: "1 USDC in → merchant nets 0.996383 (Circle ~0.36%); AIG takes 0" | **NEW** | `v2-smoke-evidence.md:23`; no AIG fee in repo |
| A5 | Agentic → REAL: an AI agent pays sub-cent USDC via x402+Gateway, multi-merchant | **NEW** | `nanopay.ts`; `nano-smoke-evidence.md`; **AIG = gateway, NOT an AI** |
| A6 | Merchant SDK ("accept USDC in N lines") | **NEW (roadmap)** | **NOT built** — write as vision/teaser, do NOT claim it exists |
| A7 | Video demo: human QR pay + agent nanopay, both settling to merchant on Arc | **NEW** | CCTP e2e + nano e2e both proven; show real tx/settle ids |

---

## Guardrails for whoever drafts these
- Never write "173 lines" (it's 178), "Domain 7" (it's 26), "45 seconds e2e" (it's ~60-120s), "AI agent" (AIG has no LLM), or any AIG service fee.
- App Kit only appears as "tried and dropped" (post-mortem), never as the stack.
- SDK + StableFX + Unified Balance are NOT built — only as roadmap/vision if at all.
- Nano per-payment has a Gateway **settlement UUID** (batched), not an individual on-chain hash; the on-chain artifact is the Gateway deposit.

## Decisions (resolved 14/06)
1. ✅ Re-anchored from 14/06/2026, ~every 2 days; Challenge anchor pinned to 13/07 deadline.
2. ✅ **Grant (Day 6) = submitted to Circle** — write as announcement/recap, not future. ⚠️ **Challenge (Day 14) submission status still unconfirmed** — only write "submitted" once it actually is.
3. ✅ New backbone kept as **Appendix** (idea pool), not on the main timeline — direction may pivot by then.

## Still open
- Challenge actually submitted yet? (confirm before publishing Day 14)
- Day 1 (open-source) overlaps the already-live Day 0 (21/05) post — may merge/skip to avoid repeating.
