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
      if (!res.ok) throw new Error("máy chủ không cấp được phiên ký");
      const { nonce, domain, chainId: expectedChain, issuedAt } = await res.json();

      const message = [
        `${domain} muốn bạn đăng nhập bằng ví Ethereum:`,
        address,
        "",
        "Ký để đăng nhập Arbiter. Thao tác này miễn phí và không chuyển bất kỳ khoản tiền nào.",
        "",
        `URI: https://${domain}`,
        "Version: 1",
        `Chain ID: ${expectedChain}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
      ].join("\n");

      const signature = await signMessageAsync({ message });

      const verify = await fetch("/api/auth/siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, nonce, issuedAt, signature }),
      });
      const j = await verify.json();
      if (!verify.ok) throw new Error(j.error ?? "đăng nhập thất bại");
      publish(j.address);
    } catch (err) {
      // A user clicking "reject" in their wallet is not an error worth shouting about.
      const msg = err instanceof Error ? err.message : "đăng nhập thất bại";
      setError(/user rejected|denied/i.test(msg) ? "Bạn đã từ chối ký." : msg);
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
            {connecting ? "Đang kết nối…" : "Kết nối ví"}
          </PillButton>
        )}

        {wrongChain && (
          <PillButton
            variant="secondary"
            onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
            disabled={switching}
          >
            {switching ? "Đang đổi mạng…" : "Chuyển sang Arc testnet"}
          </PillButton>
        )}

        {isConnected && !wrongChain && !session && (
          <PillButton onClick={signIn} disabled={busy}>
            {busy ? "Chờ chữ ký…" : "Đăng nhập bằng ví"}
          </PillButton>
        )}

        {session && (
          <>
            <span className="font-mono text-xs text-[var(--color-ink-muted)]">{shortAddress(session)}</span>
            <PillButton variant="secondary" onClick={signOut}>
              Thoát
            </PillButton>
          </>
        )}
      </div>

      {wrongChain && (
        <p className="text-xs text-[var(--color-ink-muted)]">
          Ví đang ở mạng khác. Arbiter chỉ chạy trên Arc testnet.
        </p>
      )}
      {error && <p className="text-xs text-[var(--color-accent)]">{error}</p>}
    </div>
  );
}
