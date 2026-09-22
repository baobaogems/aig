"use client";

// =============================================================================
// wallet-connect-button.tsx — the front door. The wallet IS the account.
//
// Three states, in order: not connected → connected but not signed in → signed in.
// The middle state matters: a connected wallet proves nothing to the server until it has
// signed the challenge, so the UI must not pretend the user is logged in yet.
//
// Wrong-chain is handled here rather than at every call site, because every write this app
// performs (createBounty, claim) is on Arc and fails confusingly from the wrong network.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { PillButton } from "@/components/ui/pill-button";
import { ARC_CHAIN_ID } from "@/lib/arc-chain-client";
import { buildSiweMessage } from "@/lib/auth/siwe-message";

export function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function WalletConnectButton({ onSession }: { onSession?: (address: string | null) => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const publish = useCallback(
    (a: string | null) => {
      setSession(a);
      onSession?.(a);
    },
    [onSession],
  );

  // Ask the server who it thinks we are. The server's answer wins over anything the wallet
  // says — the cookie is what every write route will actually check.
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && publish(j?.address ?? null))
      .catch(() => alive && publish(null));
    return () => {
      alive = false;
    };
  }, [publish]);

  // A session belonging to a different address than the one now selected in the wallet is
  // stale — the user switched accounts. Drop it rather than acting as the wrong person.
  useEffect(() => {
    if (session && address && session.toLowerCase() !== address.toLowerCase()) {
      void fetch("/api/auth/logout", { method: "POST" }).then(() => publish(null));
    }
  }, [session, address, publish]);

  const wrongChain = isConnected && chainId !== ARC_CHAIN_ID;

  async function signIn() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/nonce");
      if (!res.ok) throw new Error("server failed to issue signing session");
      const { nonce, domain, chainId: expectedChain, issuedAt } = await res.json();

      const message = buildSiweMessage({
        domain,
        address: address as string,
        chainId: expectedChain,
        nonce,
        issuedAt,
      });

      const signature = await signMessageAsync({ message });

      const verify = await fetch("/api/auth/siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, nonce, issuedAt, signature }),
      });
      const j = await verify.json();
      if (!verify.ok) throw new Error(j.error ?? "login failed");
      publish(j.address);
    } catch (err) {
      // A user clicking "reject" in their wallet is not an error worth shouting about.
      const msg = err instanceof Error ? err.message : "login failed";
      setError(/user rejected|denied/i.test(msg) ? "You rejected the signature." : msg);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    publish(null);
    disconnect();
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {!isConnected && (
          <PillButton onClick={() => connect({ connector: injected() })} disabled={connecting}>
            {connecting ? "Connecting..." : "Connect wallet"}
          </PillButton>
        )}

        {wrongChain && (
          <PillButton
            variant="secondary"
            onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
            disabled={switching}
          >
            {switching ? "Switching network..." : "Switch to Arc testnet"}
          </PillButton>
        )}

        {isConnected && !wrongChain && !session && (
          <PillButton onClick={signIn} disabled={busy}>
            {busy ? "Waiting for signature..." : "Sign in with wallet"}
          </PillButton>
        )}

        {session && (
          <>
            <span className="font-mono text-xs text-[var(--a-muted)]">{shortAddress(session)}</span>
            <PillButton variant="secondary" onClick={signOut}>
              Log out
            </PillButton>
          </>
        )}
      </div>

      {wrongChain && (
        <p className="text-xs text-[var(--a-muted)]">
          Ví đang ở mạng khác. Arbiter chỉ chạy trên Arc testnet.
        </p>
      )}
      {error && <p className="text-xs text-[var(--a-bad)]">{error}</p>}
    </div>
  );
}
