"use client";

// dashboard-header.tsx — page title plus the Generate QR / Export / Disconnect row.
// Extracted verbatim from app/dashboard/page.tsx; no behaviour change.

interface DashboardHeaderProps {
  address?: string;
  onGenerateQr: () => void;
  onDisconnect: () => void;
}

export function DashboardHeader({ address, onGenerateQr, onDisconnect }: DashboardHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-[28px] font-semibold text-[var(--color-ink)] tracking-[-1px] leading-none">
          Dashboard
        </h1>
        <p className="font-[family-name:var(--font-geist-sans)] text-sm text-[var(--color-ink-muted)]">
          Welcome back. Here&apos;s your payment overview.
        </p>
      </div>

      <div className="flex flex-row items-center gap-3">
        {/* Generate QR button — scrolls to QR card and regenerates */}
        <button
          onClick={onGenerateQr}
          className="bg-[var(--color-accent)] rounded-full h-10 px-4 font-[family-name:var(--font-jetbrains-mono)] text-sm font-medium text-[var(--color-ink)] hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Generate QR
        </button>
        {/* Export button */}
        <button className="bg-[var(--color-surface-light)] border border-[var(--color-border-light)] shadow-sm rounded-full h-10 px-4 font-[family-name:var(--font-jetbrains-mono)] text-sm font-medium text-[var(--color-ink)] hover:bg-white transition-colors whitespace-nowrap">
          Export
        </button>
        {/* Disconnect (small secondary) */}
        <button
          onClick={onDisconnect}
          className="font-[family-name:var(--font-geist-sans)] text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors ml-2"
        >
          {address?.slice(0, 6)}&hellip;{address?.slice(-4)} &middot; Disconnect
        </button>
      </div>
    </div>
  );
}
