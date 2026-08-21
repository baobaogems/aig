"use client";

// dashboard-qr-card.tsx — payment QR card: amount picker (free entry + presets)
// and the generated code. Extracted verbatim from app/dashboard/page.tsx;
// no behaviour change. The ref stays owned by the page so the header's
// "Generate QR" button can still scroll this card into view.

import type { RefObject } from "react";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { cardClass } from "./dashboard-card-style";

const PRESET_AMOUNTS = [1, 5, 10, 20, 50, 100];

interface DashboardQrCardProps {
  cardRef: RefObject<HTMLDivElement | null>;
  qrKey: number;
  address?: string;
  targetUSDC: number;
  onAmountChange: (usdc: number) => void;
}

export function DashboardQrCard({
  cardRef,
  qrKey,
  address,
  targetUSDC,
  onAmountChange,
}: DashboardQrCardProps) {
  return (
    <div ref={cardRef} className={cardClass}>
      {/* QR card header */}
      <div className="flex flex-col gap-1 px-6 py-4 border-b border-[var(--color-border-light)]">
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--color-ink)]">
          Payment QR Code
        </span>
        <span className="font-[family-name:var(--font-geist-sans)] text-xs text-[var(--color-ink-muted)]">
          Share with customers to receive payments
        </span>
      </div>
      {/* QR card body */}
      <div className="px-6 py-6 flex flex-col items-center">
        {/* Amount picker — retail clerk sets price per customer */}
        <div className="w-full mb-5">
          <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-2 font-[family-name:var(--font-jetbrains-mono)]">
            Amount (USDC)
          </label>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-lg font-medium pointer-events-none">
              $
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={targetUSDC}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onAmountChange(Number.isFinite(v) && v > 0 ? v : 0.01);
              }}
              className="w-full pl-8 pr-3 py-2.5 text-2xl font-semibold text-[var(--color-ink)] bg-white border border-[var(--color-border-light)] rounded-md focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_AMOUNTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onAmountChange(v)}
                className={`flex-1 min-w-[42px] px-2 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  targetUSDC === v
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : "bg-white text-[var(--color-ink)] border-[var(--color-border-light)] hover:bg-[var(--color-surface-light)]"
                }`}
              >
                ${v}
              </button>
            ))}
          </div>
        </div>
        {address && (
          <QRCodeGenerator key={qrKey} merchantWallet={address} targetUSDC={targetUSDC} />
        )}
      </div>
    </div>
  );
}
