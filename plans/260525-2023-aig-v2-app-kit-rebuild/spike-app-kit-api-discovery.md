# Spike — `@circle-fin/app-kit` API discovery (Phase 01 step 1)

**Date:** 2026-05-25 · **Source:** `node_modules/@circle-fin/{app-kit@1.6.1, adapter-viem-v2@1.11.1}/index.d.ts`

## AppKit class (real surface)

Location: `node_modules/@circle-fin/app-kit/index.d.ts:21162`. Methods (line numbers exact):

```ts
class AppKit {
  // L21248
  bridge(params: BridgeParams): Promise<BridgeResult>
  // L21286
  retryBridge(result: BridgeResult, retryContext: RetryContext): Promise<BridgeResult>
  // L21311
  estimateBridge(params: BridgeParams): Promise<EstimateResult>
  // L21364
  send(params: SendParams): Promise<BridgeStep>
  // L21401
  estimateSend(params: SendParams): Promise<EstimatedGas>
  // L21430
  swap(params: SwapParams): Promise<SwapResult>
  // L21460
  estimateSwap(params: SwapParams): Promise<SwapEstimate>
  // L21492
  getSupportedChains(operationType?: OperationType): ChainDefinition[]
  // L21530-21562 — overloaded
  on<K extends AppKitActionName>(action: K, handler: (payload: AppKitActions[K]) => void): void
  on(action: '*', handler: (payload: AppKitActions[keyof AppKitActions]) => void): void
  off<K extends AppKitActionName>(action: K, handler: (payload: AppKitActions[K]) => void): void
  off(action: '*', handler: (payload: AppKitActions[keyof AppKitActions]) => void): void
}
```

## Adapter factories (real names — PRD was wrong)

**NOT** `createViemAdapter`. Two factories:

```ts
// adapter-viem-v2/index.d.ts:5340 — server-side, needs raw key
createViemAdapterFromPrivateKey<TCapabilities>(
  params: CreateViemAdapterFromPrivateKeyParams<TCapabilities>
): ViemAdapter<...>

// adapter-viem-v2/index.d.ts:5429 — client-side, takes EIP1193 provider / walletClient
createViemAdapterFromProvider<TCapabilities>(
  params: CreateViemAdapterFromProviderParams<TCapabilities>
): Promise<ViemAdapter<...>>

// Shorter aliases:
createAdapterFromPrivateKey = createViemAdapterFromPrivateKey
createAdapterFromProvider   = createViemAdapterFromProvider
```

**Implication for `appkit.server.ts`:** The customer's connected wallet (wagmi → viem `walletClient` / EIP1193 provider) flows in via `createViemAdapterFromProvider`. Phase 01 plan code shape (`createViemAdapter({ walletClient })`) needs update.

## Top-level exports (app-kit v1.6.1)

**Values:** `AppKit`, `AppKitUnifiedBalance`, `EarnKit`, `Blockchain`, `BridgeChain`, `EarnChain`, `SwapChain`, `UnifiedBalanceChain`, `TransferSpeed`, `TOKEN_ALIASES`

**Errors:** `KitError` (base) + `BalanceError` `InputError` `NetworkError` `OnchainError` `RateLimitError` `RpcError` `ServiceError`

**Type guards:** `isBalanceError` `isFatalError` `isInputError` `isKitError` `isNetworkError` `isOnchainError` `isRateLimitError` `isRetryableError` `isRpcError` `isServiceError` `isUserCancellationError`

**Utils:** `getErrorCode`, `getErrorMessage`, `getTokenDecimals`, `isTokenAddress`, `isTokenAlias`, `setExternalPrefix`, `validateToken`

**Types (selection):** `AppKitConfig`, `AppKitContext`, `AppKitActionName`, `AppKitActions`, `BridgeParams`, `BridgeResult`, `BridgeStep`, `SendParams`, `SwapParams`, `SwapResult`, `SwapEstimate`, `EstimateResult`, `EstimatedGas`, `GetBalancesParams`, `GetBalancesResult`, `SpendParams`, `SpendResult`, `RetryContext`, `OperationType`, `ChainDefinition`

## `AppKitUnifiedBalance` — separate class

Location: `index.d.ts:20795`. Methods at lines 20834 (`on`), 20851 (`off`), 21048 (`getSupportedChains(token, options)`). Other methods (`deposit`, `spend`, `getBalances`, etc.) need a follow-up grep. Access pattern (kit.unifiedBalance vs `new AppKitUnifiedBalance()`) not yet confirmed.

## Arc Testnet chain config (verified)

From `node_modules/@circle-fin/adapter-viem-v2/index.d.ts:108-158`:

```ts
ArcTestnet = {
  type: "evm",
  chain: Blockchain.Arc_Testnet,
  chainId: 5042002,
  isTestnet: true,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },   // 18 not 6 — note for any amount math
  rpcEndpoints: ["https://rpc.testnet.arc.network/"],
  explorerUrl: "https://testnet.arcscan.app/tx/{hash}",
  usdcAddress: "0x3600000000000000000000000000000000000000",
  eurcAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cctp: {
    domain: 26,                                                     // ⚠️ NOT 7 (v1 was wrong; 7 = Polygon)
    contracts: { v2: { type: "split",
      tokenMessenger:     "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      confirmations: 1, fastConfirmations: 1,
    }},
  },
  kitContracts: {
    bridge:  "0xC5567a5E3370d4DBfB0540025078e283e36A363d",
    adapter: "0xBBD70b01a1CAbc96d5b7b129Ae1AAabdf50dd40b",
  },
  gateway: { domain: 26, contracts: { v1: { wallet: "0x0077777d…", minter: "0x0022222ABE…" } } },
}
```

### v1 bug retro (informational)

`contracts/src/SwapRouter.sol` (v1, now at tag `v1.0`) had `uint32 public constant ARC_DOMAIN = 7;`. Real Arc CCTP v2 domain is **26**. 7 is Polygon's CCTP domain. v1 still worked because every deployed run used `BRIDGE_MODE=ADMIN_RELAY` (cctp=address(0)) which short-circuits the CCTP call — the wrong constant was dead code. Academic for v2 (App Kit owns this entirely), but the v1.0 tag carries the bug for posterity. Don't surface in pivot-announcement post unless asked — diminishes v1 narrative.

## Phase 01 plan corrections

1. **Adapter call shape** — update phase-01 implementation sketch:
   ```diff
   - import { createViemAdapter } from "@circle-fin/adapter-viem-v2";
   - export function adapterFor(walletClient: WalletClient) { return createViemAdapter({ walletClient }); }
   + import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
   + export async function adapterFor(walletClient: WalletClient) {
   +   // returns Promise<ViemAdapter> — call site must await
   +   return createViemAdapterFromProvider({ walletClient });
   + }
   ```
2. **`appkit.server.ts` wrappers must be `async`** for adapter resolution (was already async for kit calls — confirm `adapterFor` is awaited inside each wrapper).
3. **Capabilities generic** — adapter factories take a `<TCapabilities>` generic. Most wrappers can ignore (default `{}`), but Phase 3 may need it for typed `OperationContext` (user-controlled vs developer-controlled address).
4. **Error handling** — wrap each kit call with `isKitError`/`isRetryableError` check; surface `getErrorMessage(err)` to SSE. Concrete plan addition for Phase 2.

## Still to spike (next session)

- `AppKitUnifiedBalance` access pattern: property on AppKit, or separate `new` (affects Phase 5 dashboard wiring)
- `kit.on(action, handler)` actual event names — full grep of `AppKitActionName` enum (need to read around line 21520 or grep `AppKitActions`)
- `BridgeParams` / `SwapParams` / `SendParams` exact field shapes (params for the wrappers)
- Whether `kit.send` takes destination chain explicitly or infers from context
- Try-instantiate `new AppKit()` with no args — does it work, or does it require `AppKitConfig`?

## Files

- `node_modules/@circle-fin/app-kit/index.d.ts` (5449 lines, 761 KB) — main type source
- `node_modules/@circle-fin/adapter-viem-v2/index.d.ts` (2058 lines) — adapter + chain definitions
- `node_modules/@circle-fin/app-kit/chains.d.ts` — chain definitions only (re-export)
