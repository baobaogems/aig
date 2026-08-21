"use client";

// dashboard-connect-gate.tsx — the screen shown before a wallet is connected.
// Extracted verbatim from app/dashboard/page.tsx; no behaviour change.

export function DashboardConnectGate({ onConnect }: { onConnect: () => void }) {
  return (
    <main className="min-h-screen bg-[var(--color-surface-light)] flex flex-col items-center justify-center p-4">
      <div className="text-center flex flex-col items-center gap-4 max-w-sm w-full">
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-[28px] font-semibold text-[var(--color-ink)] tracking-[-1px]">
          Dashboard
        </h1>
        <p className="font-[family-name:var(--font-geist-sans)] text-sm text-[var(--color-ink-muted)]">
          Connect your wallet to access your merchant dashboard.
        </p>
        <button
          onClick={onConnect}
          className="bg-[var(--color-accent)] rounded-full h-10 px-6 font-[family-name:var(--font-jetbrains-mono)] text-sm font-medium text-[var(--color-ink)] hover:opacity-90 transition-opacity"
        >
          Connect Wallet
        </button>
      </div>
    </main>
  );
}
