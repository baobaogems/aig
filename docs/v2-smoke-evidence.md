# v2 End-to-End Smoke Evidence

On-chain proof that the v2 CCTPv2 Sepolia → Arc payment flow works end-to-end. Captured for the Stablecoins Commerce Stack Challenge submission.

## Test wallet

| Role | Address |
|---|---|
| Customer (sender) | `0x0809a724862D6636874809775Ba3623080c5ceF8` |
| Merchant (receiver) | `0x0809a724862D6636874809775Ba3623080c5ceF8` (same address for testing) |
| AIG admin (Arc mint relayer) | `0x0809a724862D6636874809775Ba3623080c5ceF8` (same address for testing) |

> All three roles use the same test wallet in this PoC. In production each role is a distinct address: customer ≠ merchant ≠ admin relay.

## Payment 1 — Local server, 2026-05-30 ~10:30 +07:00

| Step | Detail |
|---|---|
| Burn (Sepolia) | [`0x9a620cf2ff42df5882a8b424094f4d26dd51bbfdd87d3a2070b34aae4edffa16`](https://sepolia.etherscan.io/tx/0x9a620cf2ff42df5882a8b424094f4d26dd51bbfdd87d3a2070b34aae4edffa16) |
| Burn args | `amount=1_000_000` (1 USDC), `destDomain=26` (Arc), `mintRecipient=pad(0x0809a724...)`, `burnToken=0x1c7D4B19...` (USDC Sepolia), `destCaller=bytes32(0)`, `maxFee=1000` (0.001 USDC ceiling), `minFinality=1000` (Fast) |
| Iris v2 attestation | status `complete` (CCTP version 2) — `GET https://iris-api-sandbox.circle.com/v2/messages/0?transactionHash=0x9a620cf2...` |
| Arc mint | [`0xc0b4cca98ca37963c92d43afaada02c65e093567e6f374d04e667acdf641eb61`](https://testnet.arcscan.app/tx/0xc0b4cca98ca37963c92d43afaada02c65e093567e6f374d04e667acdf641eb61) — block 44698950, gas 175,814, status `success` |
| Merchant balance change | +0.996383 USDC on Arc (1 USDC burn − ~3617-unit protocol fee, i.e. ~0.36% net) |
| Server | local Next dev (`npm run dev`) |

## Payment 2 — Vercel production, 2026-05-30 ~12:00 +07:00

| Step | Detail |
|---|---|
| Burn (Sepolia) | [`0x061ad3cafdb7844482e59e1ded5855aa9819620abaac05fc6601fb8e1e4e399a`](https://sepolia.etherscan.io/tx/0x061ad3cafdb7844482e59e1ded5855aa9819620abaac05fc6601fb8e1e4e399a) |
| Burn args | identical to Payment 1 (1 USDC, Fast Transfer to Arc domain 26) |
| Iris v2 attestation | status `complete` (CCTP version 2) |
| Arc mint | [`0x240d90f701c5733dda1369459db2d80bccac1146f852f466220df0f968e49545`](https://testnet.arcscan.app/tx/0x240d90f701c5733dda1369459db2d80bccac1146f852f466220df0f968e49545) — block 44710519, gas 175,797, status `success` |
| Merchant balance change | +0.996383 USDC on Arc (same net delta) |
| Server | Vercel production (`https://aig-frontend-blond.vercel.app`), v2 backend live after Phase 04 env flip |

## Verification (any reviewer can reproduce)

```bash
# Verify burn tx on Sepolia
curl -s -X POST https://ethereum-sepolia-rpc.publicnode.com -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionByHash","params":["0x9a620cf2ff42df5882a8b424094f4d26dd51bbfdd87d3a2070b34aae4edffa16"]}'

# Verify Circle attestation
curl -s "https://iris-api-sandbox.circle.com/v2/messages/0?transactionHash=0x9a620cf2ff42df5882a8b424094f4d26dd51bbfdd87d3a2070b34aae4edffa16"

# Verify Arc mint
curl -s -X POST https://rpc.testnet.arc.network -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["0xc0b4cca98ca37963c92d43afaada02c65e093567e6f374d04e667acdf641eb61"]}'

# Verify merchant USDC balance on Arc (USDC contract 0x3600000000000000000000000000000000000000)
curl -s -X POST https://rpc.testnet.arc.network -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x3600000000000000000000000000000000000000","data":"0x70a082310000000000000000000000000809a724862d6636874809775ba3623080c5cef8"},"latest"]}'
```

## Timing observed

- Burn → Iris attestation complete: ~30-90 seconds (Fast Transfer at "confirmed" level)
- Arc mint receipt: ~5-10 seconds (Arc ~2-3s block time + 1-2 confirmations)
- Full e2e (customer click Pay → "confirmed" SSE event): ~60-120 seconds end-to-end

## Open items (non-blocking)

- ~0.36% effective fee observed vs Iris-reported 1bps minimum: needs investigation before mainnet (Circle protocol fee schedule may have additional per-route cost, or the testnet sandbox uses a different rate).
- Merchant receives `amount − fee` (not exactly `amount`) — gross-up (burn `amount + fee` so merchant nets `amount`) is a v2.1 refinement to honour the "exact USDC" tagline.
- Single source chain (Sepolia) only; multi-chain expansion is Phase 2.
