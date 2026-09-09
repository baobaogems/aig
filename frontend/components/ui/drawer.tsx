"use client";

// drawer.tsx — a right-hand sheet for actions that must not compete with the page.
// /arbiter is an evidence display first; creating a bounty and submitting work are things
// an operator does, not things a first-time viewer should have to read past. They live
// here instead of on the main surface.
//
// Deliberately hand-rolled: no dialog library for one sheet. Native <dialog> was the other
// candidate, but its backdrop and scroll-locking fight the page's own gradient surface.

import { useEffect, useRef } from "react";

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc closes. Body scroll is locked while open so the sheet does not scroll the page
  // behind it on a phone.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Scrim. Clicking it closes — the cheapest way out of a sheet opened by mistake. */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--color-surface-dark)]/40 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-[var(--color-surface-light)] shadow-[0_0_60px_rgba(10,21,18,0.25)] outline-none"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--color-ink)]/10 bg-[var(--color-surface-light)]/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 shrink-0 rounded-full px-3 py-1 text-xl leading-none text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
