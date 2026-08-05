# v4 Arbiter Escrow — On-Chain Evidence (Phase 03)

Proof that `ArbiterEscrow` is deployed and behaves as specified on Arc testnet: USDC locks,
only the arbiter wallet can release, the release carries a verdict hash on-chain, and the
contract refuses to pay twice. Testnet only — no real money.

## Deployment — 2026-08-03

| Item | Value |
|---|---|
| Contract | `0x6F4f038d30Cfc3Dd88c9ed1Ce55D44f89cc96FF5` |
| Deploy tx | `0x768a739c3df1b2a8218afc21b3022e4798e369927e17f7230c77fef9b29794f1` (block 55073417, gas 842,974) |
| Chain | Arc testnet `eip155:5042002` |
| USDC | `0x3600000000000000000000000000000000000000` (Arc's native gas token, ERC-20 predeploy) |
| Arbiter (only caller of `release`) | `0x0809a724862D6636874809775Ba3623080c5ceF8` |
| Owner (pause switch) | `0x0809a724862D6636874809775Ba3623080c5ceF8` |
| `MAX_BOUNTY` | 50 USDC — contract-level hard cap, not raisable |
| Compiler | solc 0.8.24, optimizer 200 runs, OZ v5.1.0 |

## Contract smoke run — 2026-08-03, 1 USDC cycle

Self-directed bounty (poster == worker == admin wallet) so the cycle proves the mechanism
without stranding testnet USDC. `bountyId = keccak256("gate2-smoke-260803")` =
`0xdec30bd8…b407e`; `verdictHash = keccak256("verdict-smoke-260803")` = `0xe8a347c3…3991`.

| Step | Tx / result |
|---|---|
| `approve(escrow, 1e6)` | `0x6dcedef214fe2bde6c44222867fd0f171052b7376169420c610aefac0a834bd9` ✅ |
| `createBounty(id, worker, 1e6, deadline)` | `0x5ec27f423795ad046205b8a21e9773fa2291efe4b71471adcfe0a8ab5e9130be` ✅ |
| Escrow balance after lock | `1000000` (1 USDC held by the contract) |
| `release(id, verdictHash)` | `0xeefa3e1e8f4764b34fc4910a0bfb8e7e490315a6222a988ea0dae8cddad38cc7` ✅ block 55073491 |
| `Released` event data | verdictHash `0xe8a347c3…3991` + amount `0xf4240` (1 USDC), worker indexed |
| Escrow balance after release | `0` — fully drained to the worker |
| `getBounty(id)` | `released=true, refunded=false` |

### Negative cases, verified against the live contract (`eth_call`)

| Attempt | Revert |
|---|---|
| Second `release` on the same bounty | `0x560ff900` = `AlreadySettled()` ✅ |
| `release` from a non-arbiter address | `0xccb665a6` = `NotArbiter()` ✅ |

## Source ↔ chain verification

`cast code <escrow>` compared against a local `forge build` of `src/ArbiterEscrow.sol`:
byte-identical once the 6 immutable slots (`usdc`, `arbiter`) are masked — those are the only
positions that differ, and they hold exactly the constructor addresses listed above. The
trailing solc metadata hash matches too, so the repo source is the deployed source.

## Local test suite

`cd contracts && forge test` — **19/19 pass**, covering: cap rejection, duplicate bountyId,
past deadline, arbiter-only release, double-release, empty verdict hash, unknown bounty,
release-after-refund, refund-after-deadline, refund-before-deadline, non-poster refund,
refund-after-release, pause blocking create+release, refund still working while paused,
owner-only pause, unpause, and a fuzz run asserting the worker is paid exactly the locked
amount for any legal amount (256 runs).

## Known operational hazard

`rpc.testnet.arc.network` intermittently answers HTTP 200 with `request limit reached`
(measured ~1 call in 4, independent of call spacing). viem does not retry this — no 429, no
error code — so every chain call in the money path goes through `lib/rpc-retry.ts` with
exponential backoff. Retrying writes is safe here precisely because the contract is
idempotent-guarded: a duplicate `createBounty` reverts `BountyExists`, a duplicate `release`
reverts `AlreadySettled`.

## GATE 2 — first verdict-driven release (LIVE, 2026-08-04)

Preconditions met that morning: migration 006 applied (per-day ledger live, `0/150` non-degraded),
calibration passed (10/10 tier-exact on grade-v2, commit `ac3913c`). Run:
`npm run arbiter:gate2 -- --run --worker 0xF478…e321 --amount 1 --case pass-01` with the fixture's
**frozen 5-item rubric** (the first attempt ABORTED by design: GATE 2 refuses to judge without a
frozen rubric — rubric generation at judge time would violate F1's freeze rule).

| Step | Tx | Block |
|---|---|---|
| USDC `approve` | [`0xc7265ba91b792d39aabc4c65044e30e0084030ad9a2ca43a66d77aa3bf3d7395`](https://testnet.arcscan.app/tx/0xc7265ba91b792d39aabc4c65044e30e0084030ad9a2ca43a66d77aa3bf3d7395) | 55276300 |
| `createBounty` (lock 1 USDC) | [`0x82511d582464db29c1771d277c3a898a2877b5600e9ad3ca40c3762b07523a7b`](https://testnet.arcscan.app/tx/0x82511d582464db29c1771d277c3a898a2877b5600e9ad3ca40c3762b07523a7b) | 55276304 |
| `release` (verdict-driven) | [`0x65dbbc871f13d510ae8f421021deeee9b4226bb0c47239cb5aa57c1478aecdff`](https://testnet.arcscan.app/tx/0x65dbbc871f13d510ae8f421021deeee9b4226bb0c47239cb5aa57c1478aecdff) | 55276342 |

All three receipts `status=0x1`. Bounty `17fdcb50-6f4e-407f-bbde-78b943b10375`
(bountyKey `0x792f67b07767bd4945b252c591de9ed2611e77365ddb0f0117bfbc8f5ba9bb5d`),
1 USDC → worker `0xF4784bb0AcD3d315894Ebf522Ae411445288e321`, confirmed received.

**Verdict** (model `claude-opus-4-8`, prompt `v2.0`): decision `RELEASE`, total_score **92**,
confidence **88** — reasoning: all items evidence-backed, word-count estimate ~370 within range,
no item ≤20 so the split-profile cap did not apply. `verdictHash`
`0xbb728e339e2589d588bce36f22e6d91d1d3c3d8a8c31948c0d533b6e9e6546b9` — the `Released` event's
on-chain hash **matches the computed hash exactly** (the AI's reasoning is now anchored on Arc).

Known gap (recorded honestly at run time): the gate2 CLI does not persist the verdict row to
Supabase — the canonical verdict JSON for THIS run lives in the run log, and the per-day spend
ledger does not count this 1 USDC (it reads `verdicts.release_tx` from the DB).
**CLOSED same day (Phase 04, commit 42a9303):** `POST /api/judge` now persists every verdict —
with `release_tx` when money moved — in the same request that produced it; all pilot releases go
through the API path and are ledger-counted. The GATE 2 CLI run above stays as-is: a historical
record of the one release that predates persistence.

`DRY_RUN` was flipped back to `true` in the same shell command that ran the cycle (auto-restore
on exit) — money stays off by default until the pilot.

## Pilot — 2 real bounties through the production app (2026-08-05)

Unlike GATE 2 (a CLI run), both pilot bounties went through the deployed app end-to-end:
poster form → rubric freeze → on-chain lock → worker submission snapshot → `POST /api/judge`
(SSE) → settlement. `DRY_RUN=false` on the production deploy only; every verdict persisted with
its `release_tx` in the same request (ledger-counted).

### Bounty A — clean autonomous release (5 USDC)

Brief: 400–500-word Vietnamese introduction to the ARC network (4 required points);
6-item rubric generated, reviewed, and **frozen before the deliverable existed**.
Bounty `b69ec496-6019-406e-aae5-c56a10e12887`
(bountyKey `0xeb7ebd87fc58e473cc2dc79c9426f26071ecd73ab8068a3dc6f1d9c55276fac9`).

| Step | Tx | Block |
|---|---|---|
| `createBounty` (lock 5 USDC) | [`0x43783049e517ed4f47bd36227333b91067003afa3a6678828f16d5a19288e6f7`](https://testnet.arcscan.app/tx/0x43783049e517ed4f47bd36227333b91067003afa3a6678828f16d5a19288e6f7) | 55365180 |
| `release` (verdict-driven) | [`0x3ac63896ed94d300ea3f57a3b155dc077a40892e31bbee1f7ad843cd37ac1d83`](https://testnet.arcscan.app/tx/0x3ac63896ed94d300ea3f57a3b155dc077a40892e31bbee1f7ad843cd37ac1d83) | 55376912 |

**Verdict** (model `claude-opus-4-8`, prompt `v2.0`): `RELEASE`, total_score **94**, confidence
**85**, every rubric item evidence-cited. `verdictHash`
`0x40dd03b7b71903efb16564677fe1d499ab7a6367870bd41c22b4525889aa163e` — the `Released` event
carries this exact hash plus amount `0x4c4b40` (5 USDC), worker
`0x78D6506A2bB8BfF5D551F1120979c9dAf0C5ADf8` indexed. Receipt `status=0x1`;
`getBounty` now reads `released=true`.

**Fail-closed incident, recorded honestly:** the first judge attempt on this bounty errored out
because the production deploy briefly carried a misconfigured `ARBITER_ESCROW_ADDRESS` (an EOA,
not the contract). The pre-flight `getBounty` read returned no data and the pipeline **aborted
before grading — no verdict written, no money moved**. Env corrected, redeployed, re-ran
cleanly. The money path's first real-world failure mode was a refusal, which is the design.

### Bounty B — deliberate borderline → escalation → human override (2.22 USDC)

Brief: short Vietnamese end-user introduction to ARC; 5-item rubric frozen (length window
300–800 words, weight 15). Bounty `c7d2502e-f547-4b5a-86ca-be726cc79757`
(bountyKey `0xa6a1bb8b878d8e25c42e8c1ad0467ff71bd4090101780915aa76af18c502c5a2`).
Lock tx: [`0xc20db06b0d2808b04a619c3b8869399fbd3ecc010c0518f54ceca75536a47114`](https://testnet.arcscan.app/tx/0xc20db06b0d2808b04a619c3b8869399fbd3ecc010c0518f54ceca75536a47114) (block 55386946, `status=0x1`).

The submitted deliverable was ~150 words — on-topic and accurate, but far under the frozen
length floor.

**Verdict:** `ESCALATE`, total_score **63**, confidence **72**, `release_tx: null` — no
autonomous payment. Item scores split hard: r1 (what ARC is) = 80 vs r4 (length) = 10. The
**split-profile confidence cap** — added to prompt v2.0 after calibration round 1 leaked a
mixed-profile case into auto-release — fired on its first real case. The model's own
confidence reasoning: the length shortfall "is the poster's judgment call", so it capped
confidence and deferred. `verdictHash`
`0x5f9d72312f2e3d140d80bc63df1b079ee9dd13e718cb7d9458ab9bbe902a79a7` (persisted; committed
on-chain only if a release ever happens).

**Human override:** the poster reviewed the evidence in the UI and clicked **REJECT**
(escalation `223494db`, 2026-08-05 12:14 ICT). The bounty stays `JUDGED`, the 2.22 USDC stays
locked in the contract, and the poster refunds on-chain after the deadline (2026-08-06 12:00
ICT) — refund tx will be appended here when executed.

### Pilot metrics (from `agent_stats`, backed by the rows above)

| Metric | Value |
|---|---|
| Verdicts | 2 |
| T1 autonomous releases | 1 (Bounty A, 5 USDC settled on-chain) |
| REFUSE | 0 |
| Escalated to human (T2) | 1 |
| Human overrides | 1 (REJECT) |
| Override rate | 1/1 escalations |
| USDC settled by verdict | 5 |
| USDC held pending refund | 2.22 |

Two-bounty pilot, stated as exactly that. The pair demonstrates both halves of the safety
story on real transactions: autonomous settlement when the evidence supports it, and a
confidence-capped handoff to a human when the profile splits — with the human's decision
(and its rate) recorded publicly.

**Pilot trust model, stated plainly:** the pilot app is auth-less and custodial — the server's
admin wallet signs as both poster (seed bounties) and arbiter, and the UI's poster actions are
not wallet-gated. Acceptable for a supervised 2-bounty pilot; wallet-gated poster auth is the
first post-pilot item.
