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

## Not yet proven (GATE 2 remainder)

The full pipeline cycle — lock → **AI verdict** → verdict-driven release — is wired
(`lib/arbiter/run.ts` → `judgeAndSettle`) and runnable via `npm run arbiter:gate2 -- --run`,
but has not been executed live. It needs: migration `006_create_arbiter_tables.sql` applied
(the per-day spend ledger fails closed without it), `DRY_RUN=false`, and a worker address.
