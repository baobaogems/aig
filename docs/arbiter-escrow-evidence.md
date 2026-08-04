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

Known gap (Phase 04 work, recorded honestly): the gate2 CLI does not yet persist the verdict row
to Supabase — the canonical verdict JSON for THIS run lives in the run log, and the per-day spend
ledger therefore does not count this 1 USDC (it reads `verdicts.release_tx` from the DB). The
`POST /api/judge` route owns persistence; until it lands, autonomous releases are CLI-only and
under-counted by the ledger — conservative in the wrong direction, fix is first task of Phase 04.

`DRY_RUN` was flipped back to `true` in the same shell command that ran the cycle (auto-restore
on exit) — money stays off by default until the pilot.
