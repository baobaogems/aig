"use client";

// =============================================================================
// providers.tsx — Client-side providers (Wagmi + TanStack Query)
// Extracted from layout.tsx to keep root layout as a server component,
// preventing hydration mismatches with wagmi state.
// =============================================================================

import { type ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bscTestnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";

// Public RPC fallbacks — overridable via NEXT_PUBLIC_*_RPC_URL env if needed.
// bscTestnet supports the v1 SwapRouter path; sepolia supports the v2 CCTP burn path.
const bscRpc = process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545";
const sepoliaRpc = process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

export function Providers({ children }: { children: ReactNode }) {
  const [wagmiConfig] = useState(() =>
    createConfig({
      chains: [bscTestnet, sepolia],
      connectors: [injected()],
      transports: {
        [bscTestnet.id]: http(bscRpc),
        [sepolia.id]: http(sepoliaRpc),
      },
      ssr: true,
    })
  );
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
