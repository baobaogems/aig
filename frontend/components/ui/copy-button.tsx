"use client";

// copy-button.tsx — hand a long opaque string to whoever needs it without printing it.
//
// The ledger has to carry bounty ids: an operator pastes one into the submit form. But a
// 36-character uuid under every row is noise for the far larger group of people who only
// came to read the record. This keeps the id one click away instead of permanently on
// screen.

import { useEffect, useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard is blocked outside a secure context and in some embedded webviews.
      // Say so rather than showing a success state that did not happen.
      setCopied(false);
      window.prompt("Copy manually:", value);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={label}
      aria-label={label}
      className="shrink-0 rounded-full px-2 py-1 text-xs text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]"
    >
      {copied ? "copied" : "copy id"}
    </button>
  );
}
