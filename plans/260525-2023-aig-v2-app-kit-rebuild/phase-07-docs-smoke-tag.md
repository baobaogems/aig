# Phase 07 — Docs sweep + Arc Testnet smoke + tag `v2.0-alpha`

**Priority:** P0 (gates challenge submission) · **Status:** pending · **Target day:** 04-07/06/2026

## Goal

Repo public surface (README, docs, brand) reflects v2 only. End-to-end smoke on Arc Testnet recorded. `v2.0-alpha` tag pushed.

## Files

- `README.md` — rewrite intro: "Built on Arc App Kit" + tagline + v1.0-tag banner (kept from Phase 6)
- `docs/system-architecture.md` — replace §1 Smart Contracts with App Kit architecture; new v2 payment-flow diagram (PRD §8)
- `docs/codebase-summary.md` — drop `/contracts` section; refresh `/frontend/lib` (no `cctp`, no `mock-bridge`; +`appkit.server`)
- `docs/project-changelog.md` — v2.0 entry: pivot rationale, removed modules, new dep
- `docs/development-roadmap.md` — close v1 phase, open v2 phases
- `docs/brand-guidelines.md` — replace "SwapRouter.sol on BSC Testnet" with App Kit framing
- `content/` — DO NOT rewrite published Day 3/4/6 drafts (historical); the PRD §12 #1 "Pivot announcement" post is the place to acknowledge v1→v2
- `assets/writing-styles/baobao-gems-x-style.md` — update example post (line 708) to remove v1 contract address, or note as historical

## Arc Testnet end-to-end smoke

Single happy-path payment, captured for the submission:

1. Faucet: get test USDC on a source chain App Kit supports
2. Connect wallet on `/pay/<session-id>`
3. App Kit Swap → Bridge → Send executes
4. Verify merchant USDC arrives on Arc Testnet (block explorer `testnet.arcscan.app`)
5. Verify Supabase session = `CONFIRMED`, points ledger += correct amount
6. Verify dashboard payment feed updates in <60s
7. Record tx hashes + screenshots → `docs/v2-smoke-evidence.md` (or similar)

## Tag + push

```bash
git tag v2.0-alpha
git push origin main --tags
```

## Todo

- [ ] README rewrite
- [ ] docs/*.md sweep (consistent v2 framing)
- [ ] Update brand-guidelines + writing-styles mentions
- [ ] Run end-to-end smoke on Arc Testnet; record evidence
- [ ] Add `npm run smoke:appkit` script (one-shot smoke test)
- [ ] Tag `v2.0-alpha`, push
- [ ] Append status_AIG.json final entry for v2 ship
- [ ] Append memory: [[v2-on-app-kit]] confirming v1.0 + v2.0-alpha tag semantics

## Success criteria

- `grep -rln "SwapRouter\|cctp\|CCTP\|Admin Relay\|PancakeSwap\|BRIDGE_MODE" docs README.md` returns 0 active references (changelog historical OK)
- One end-to-end Arc Testnet payment with tx hash recorded
- `v2.0-alpha` tag on origin
- Day 6 post still references a valid `git checkout v1.0` path

## Risks

| Risk | Mitigation |
|---|---|
| Hidden v1 mention in docs | Smoke grep above |
| Arc Testnet faucet rate-limited day-of | Pre-fund test wallet days before |
| Submission writeup needs Phase 06+07 artifacts | Keep evidence file growing across phases |

## Next (out of plan)

- F-101 StableFX (multi-currency EURC/QCAD) — separate plan
- F-102 Merchant SDK npm package — separate plan
- Challenge submission package (form fill + video demo) — separate plan after `v2.0-alpha` ships
