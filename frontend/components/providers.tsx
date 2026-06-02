"use client";

// =============================================================================
// providers.tsx — Client-side providers (Wagmi + TanStack Query)
// Extracted from layout.tsx to keep root layout as a server component,
// preventing hydration mismatches with wagmi state.
// =============================================================================

import { type ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";

const sepoliaRpc =
  process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

export function Providers({ children }: { children: ReactNode }) {
  const [wagmiConfig] = useState(() =>
    createConfig({
      chains: [sepolia],
      connectors: [injected()],
      transports: {
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
