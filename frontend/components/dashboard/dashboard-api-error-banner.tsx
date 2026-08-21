"use client";

// dashboard-api-error-banner.tsx — warn strip shown when /api/dashboard fails.
// Extracted verbatim from app/dashboard/page.tsx; no behaviour change.

export function DashboardApiErrorBanner() {
  return (
    <div className="bg-[var(--color-chip-warn)] border border-[var(--color-chip-warn-border)] rounded px-4 py-3 flex items-center justify-between">
      <span className="font-[family-name:var(--font-geist-sans)] text-sm text-[var(--color-ink-warn)]">
        Unable to load dashboard data. Services may be initializing.
      </span>
      <button
        onClick={() => window.location.reload()}
        className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-warn)] hover:underline ml-4 whitespace-nowrap"
      >
        Retry
      </button>
    </div>
  );
}
