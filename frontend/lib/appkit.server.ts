// =============================================================================
// appkit.server.ts — Server-only wrapper around @circle-fin/app-kit.
//
// Phase 01 of AIG v2 (App Kit pivot). Pure pass-through; no business logic, no
// fee math. Phase 02 routes (/api/agent/*) compose params + handle SSE; this
// module just types the SDK surface and isolates KIT_KEY to the server bundle.
//
// SDK surface verified against node_modules/@circle-fin/app-kit/index.d.ts
// (v1.6.1). See plans/260525-2023-aig-v2-app-kit-rebuild/spike-app-kit-api-discovery.md
// =============================================================================
import "server-only"; // throws at build if imported from a client component

import {
  AppKit,
  type BridgeParams,
  type SwapParams,
  type SendParams,
  type GetBalancesParams,
} from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { EIP1193Provider } from "viem";

/**
 * Read KIT_KEY from server env. Throws with a pointer if missing so callers
 * see a clear error instead of an opaque SDK 401 later. Callers (Phase 02
 * routes) pass it via `params.config.kitKey` on each swap/bridge/send call.
 */
export function kitKey(): string {
  const k = process.env.KIT_KEY;
  if (!k) {
    throw new Error(
      "KIT_KEY missing — set in frontend/.env.local (and Vercel for prod). " +
        "Provision at https://console.circle.com.",
    );
  }
  return k;
}

/**
 * Build a fresh AppKit instance per call. NOT a singleton: AppKit's `on/off`
 * event listeners are instance-scoped, so sharing across concurrent /api
 * requests would cross-wire payment streams. Construction is cheap.
 */
export function getKit(): AppKit {
  return new AppKit();
}

/**
 * Wrap the customer's EIP-1193 wallet provider as an App Kit adapter.
 * Returns a Promise — Provider factory resolves async to fetch chain context.
 *
 * Phase 02 conversion notes (wagmi → EIP1193Provider):
 *   - From a viem WalletClient: `walletClient.transport as EIP1193Provider`
 *   - From wagmi v2: `await getConnectorClient(config)` then `.transport`
 *   - From window.ethereum: pass directly
 */
export function adapterFor(provider: EIP1193Provider) {
  return createViemAdapterFromProvider({ provider });
}

// -----------------------------------------------------------------------------
// Thin typed pass-through wrappers. Each is one line; SDK types flow through
// unmodified so any signature drift surfaces at the call site, not here.
// -----------------------------------------------------------------------------
export const quoteSwap = (p: SwapParams) => getKit().estimateSwap(p);
export const executeSwap = (p: SwapParams) => getKit().swap(p);

export const quoteBridge = (p: BridgeParams) => getKit().estimateBridge(p);
export const executeBridge = (p: BridgeParams) => getKit().bridge(p);

export const quoteSend = (p: SendParams) => getKit().estimateSend(p);
export const executeSend = (p: SendParams) => getKit().send(p);

export const getUnifiedBalance = (p: GetBalancesParams) =>
  getKit().unifiedBalance.getBalances(p);
