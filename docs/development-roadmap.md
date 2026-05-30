# AIG Development Roadmap

Living document tracking project phases, milestones, and progress. Cross-AI canon in `roadmap_AIG.json`.

## Current state (2026-05-30)

- **Active backend:** v2 (CCTPv2 direct Sepolia → Arc) — live on Vercel production
- **Branch:** `main`
- **Latest tag:** `v2.0-alpha` (this release)
- **Previous tag:** `v1.0` (BSC SwapRouter + PancakeSwap + CCTPv1/ADMIN_RELAY)
- **Growth blocker:** no traction yet — need first merchant + GTM motion (tech path unblocked)

---

## v1 — Phase 1 MVP — Core Payment Infrastructure

**Status:** ✅ COMPLETE — 2026-03-13 (preserved at tag `v1.0`)

| Sub-phase | Status |
|---|---|
| Foundation (smoke test, quote endpoint, session management) | ✅ |
| ADMIN_RELAY fallback path | ✅ |
| CCTP primary path | ✅ |
| UI (payment page + dashboard) | ✅ |
| Contract deployment (SwapRouter.sol → BSC Testnet) | ✅ |
| Security hardening | ✅ |

Post-Phase-1 dashboard + Vercel stabilization + brand identity v1 also complete (Mar–May 2026).

---

## v2 — Arc CCTPv2 rebuild (strangler-fig pivot)

**Status:** 🟡 in progress — Phase 03 + 04 + 06-partial done; Phase 06 full + 07 pending

Plan dir: `plans/260525-2023-aig-v2-app-kit-rebuild/`

| Sub | Name | Status | Notes |
|---|---|---|---|
| 00 | Foundation deps | ✅ | installed @circle-fin/app-kit (later dropped per ADR) |
| 01 | App Kit server/client wrapper | ✅ (dead code) | shipped at commit e382aa2; removed Phase 06 partial |
| 02 | API routes dual-path | ✗ COLLAPSED | App Kit is fully client-side; logic absorbed into Phase 03 |
| 03 | Payment page dual-path + CCTPv2 e2e | ✅ | first e2e success 30/05 (Arc mint 0xc0b4cca9); all critical fixes shipped |
| 04 | Flip default to v2 on Vercel | ✅ | DONE 30/05 — first prod e2e mint Arc tx 0x240d90f7 |
| 05 | Dashboard unified balance | ⏸ deferred | SDK was the path; without SDK → alternatives (event scan, REST API) deferred to v3 |
| 06 | Cleanup v1 dead code | 🟡 partial | App Kit dead code removed 30/05. v1 stack deletes gated on 48h prod smoke |
| 07 | Docs sweep + smoke + tag v2.0-alpha | 🟡 in progress | this release |

### v2 rebuild key fixes (chronological)

| Commit | Fix |
|---|---|
| `2c6dae3` | Add Sepolia to wagmi chain config |
| `f1b10c9` | Pin chainId on writeContract calls |
| `7b3f335` | Explicit gas override on approve+depositForBurn |
| `6267fe5` | Pin EIP-1559 fees + correct CCTPv2 depositForBurn ABI (4 → 7 args) |
| `a61911d` | Enable CCTPv2 Fast Transfer (maxFee > 0) |
| `2d5ded0` | pollAttestationV2 against Iris v2 endpoint + SSE close guard |
| `836b584` | Delete App Kit dead code (Phase 06 partial) |
| `e46fe15` | Vercel route config (maxDuration=60) + non-blocking Arc receipt |
| `013f43f` | Anchor SSE pipeline in ReadableStream.start() (Vercel-safe) |
| `737f72e` | Phase 04 DONE — anchors sync |

---

## Phase 2 — Scaling & Optimization (planned)

Tentative scope:
- Multi-source-chain support (Base, Avalanche, Linea — additional `payment-flow-vN` hooks + chain registration)
- F-101 StableFX (multi-currency EURC/QCAD) — separate plan
- F-102 Merchant SDK npm package — separate plan
- Mainnet readiness audit (mainnet Iris API, gas budgets, admin wallet security)
- Webhook notifications for merchants
- Points distribution mechanism (currently placeholder)
- Dashboard improvements (filters, exports, time-range stats)

Estimated: Q3 2026.

---

## Phase 3 — Production Hardening (planned)

- External security review of the v2 path (SSE, admin key handling, idempotency)
- Mainnet deployment (Iris production endpoint, mainnet TokenMessengerV2/MessageTransmitter addresses)
- Rate limiting + abuse prevention on `/api/agent/execute`
- KYC/AML integration (jurisdiction-dependent)
- Settlement & reconciliation workflows for merchants
- Monitoring & alerting (mint failures, admin wallet balance)
- Gross-up fee handling so merchant receives exactly the requested amount

Estimated: Q4 2026.

---

## Mainnet Launch (target)

Tentative: 2026-Q4.

Pre-reqs:
- v2 stable on testnet ≥ 30 days
- Audit complete
- Admin wallet key rotation policy documented
- Iris production allowance secured
- Multi-chain support (at least Base + Arbitrum as additional source chains)

---

## Success metrics (v2 alpha)

- ✅ Sepolia burn → Arc mint end-to-end on local
- ✅ Same flow end-to-end on Vercel production
- ✅ Vercel env flip done (Phase 04 DONE)
- ✅ Phase 06 partial cleanup (App Kit dead code)
- ⏳ 48h prod smoke without rollback (clock from 2026-05-30 12:00 +07:00)
- ⏳ `git tag v2.0-alpha` pushed (this Phase 07)
- ⏳ README + docs/* purged of stale v1-only framing (this Phase 07)

---

## Dependencies & blockers

**Tech path: unblocked.** Both v1 and v2 paths functional; v2 is primary on prod.

**Open items (non-blocking):**
- Admin private key was exposed in a Claude session via IDE selection share — rotate after Phase 04 stable (testnet, low urgency).
- ~0.36% net loss observed on testnet vs Iris-reported 1bps minimum fee — investigate Circle protocol fee schedule before mainnet.
- Vercel auto-deploy on `git push` working correctly; no GitHub Actions or branch protection in the way.

---

## Timeline

| | |
|---|---|
| v1 Phase 1 start | 2026-03-12 |
| v1 Phase 1 done | 2026-03-13 |
| v2 rebuild start | 2026-05-25 (ADR) |
| v2 Phase 03 + 04 + 06-partial done | 2026-05-30 |
| v2.0-alpha tag | 2026-05-30 (this Phase 07) |
| v2 Phase 06 full | after 48h prod smoke (≥ 2026-06-01) |
| Phase 2 target | Q3 2026 |
| Phase 3 target | Q4 2026 |
| Mainnet target | Q4 2026 |

---

## Notes

The v2 rebuild taught several Vercel-specific lessons that are now documented as design decisions (`docs/system-architecture.md` → Key Design Decisions): SSE must anchor in `ReadableStream.start()`, `receiveMessage` should not block on receipt, and `maxDuration` route segment config is required for streaming routes. These traps don't appear under local `next dev` and only manifested on prod smoke — surfacing them in docs prevents future regression.
