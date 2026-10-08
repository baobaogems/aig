"use client";
// use-ensure-arc-chain.ts — put the wallet on Arc testnet before anything is signed.
// Reads the WALLET's chain (useAccount().chainId), not useChainId(): wagmi only updates
// useChainId for chains declared in the config, so a wallet on Arbitrum still reads as Arc
// there. switchChainAsync falls back to wallet_addEthereumChain on error 4902, built from
// arcChain() in lib/arc-chain-client.ts — first-time users get the network added, then switched.
import { useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { ARC_CHAIN_ID } from "@/lib/arc-chain-client";

export function useEnsureArcChain() {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  return useCallback(async () => {
    if (chainId !== ARC_CHAIN_ID) await switchChainAsync({ chainId: ARC_CHAIN_ID });
  }, [chainId, switchChainAsync]);
}
