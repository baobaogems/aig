"use client";

// =============================================================================
// payment-progress-bar.tsx — SSE-driven 3-step payment progress display
// Steps: Swap → Bridge → Confirmed
// PRD F-020: real-time status feedback
// =============================================================================

export type PaymentStep =
  | "idle"
  | "swap_executing"
  | "bridging"
  | "confirmed"
  | "bridge_delayed"
  | "error";

interface ReceiptData {
  txHash: string;
  bridgeMode: string;
}

interface PaymentProgressBarProps {
  step: PaymentStep;
  receipt?: ReceiptData;
  errorMessage?: string;
  swapTxHash?: string;
}

const STEPS = [
  { key: "swap_executing", label: "Swap" },
  { key: "bridging", label: "Bridge" },
  { key: "confirmed", label: "Confirmed" },
] as const;

function stepIndex(step: PaymentStep): number {
  if (step === "swap_executing") return 0;
  if (step === "bridging") return 1;
  if (step === "confirmed") return 2;
  return -1;
}

export function PaymentProgressBar({
  step,
  receipt,
  errorMessage,
  swapTxHash,
}: PaymentProgressBarProps) {
  const current = stepIndex(step);

  if (step === "idle") return null;

  return (
    <div className="w-full max-w-sm mx-auto mt-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((s, i) => {
          const done = current > i;
          const active = current === i;
          return (
            // `relative` matters: the connector line below is absolutely positioned and
            // previously had no positioned ancestor here, so it resolved against the page
            // and drew a full-width rule across the viewport instead of joining two steps.
            <div key={s.key} className="relative flex flex-1 flex-col items-center">
              <div
                // z-10 keeps the circle above the connector line. The pulse on the active
                // step stays: it is live feedback that a signature or a bridge is still in
                // flight, not decoration.
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  active ? "animate-pulse" : ""
                }`}
                style={
                  done
                    ? { backgroundColor: "var(--color-ink-success)", color: "#fff" }
                    : active
                    ? { backgroundColor: "var(--color-accent)", color: "#fff" }
                    : { backgroundColor: "var(--color-chip-neutral)", color: "var(--color-ink-muted)" }
                }
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 text-xs ${done || active ? "font-medium" : ""}`}
                style={{ color: done || active ? "var(--color-ink)" : "var(--color-ink-muted)" }}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className="absolute left-1/2 top-4 z-0 h-0.5 w-full"
                  style={{
                    backgroundColor: done
                      ? "var(--color-ink-success)"
                      : "var(--color-border-light)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Status message */}
      {step === "bridge_delayed" && (
        <p
          className="rounded-lg p-3 text-center text-sm"
          style={{
            color: "var(--color-ink-warn)",
            backgroundColor: "var(--color-chip-warn)",
            border: "1px solid var(--color-chip-warn-border)",
          }}
        >
          Taking longer than expected… Bridge confirmation may take a few minutes.
        </p>
      )}

      {step === "error" && errorMessage && (
        <p
          className="rounded-lg p-3 text-center text-sm"
          style={{ color: "var(--color-ink-danger)", backgroundColor: "var(--color-chip-danger)" }}
        >
          {errorMessage}
        </p>
      )}

      {/* Receipt */}
      {step === "confirmed" && receipt && (
        <div
          className="mt-4 space-y-2 rounded-[var(--radius-card)] p-4 text-sm"
          style={{
            backgroundColor: "var(--color-chip-success)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          <p className="text-center font-semibold" style={{ color: "var(--color-ink-success)" }}>
            Payment Confirmed ✓
          </p>
          <div className="flex justify-between text-[var(--color-ink-muted)]">
            <span>Bridge</span>
            <span className="font-medium text-[var(--color-ink)]">{receipt.bridgeMode}</span>
          </div>
          <div className="text-[var(--color-ink-muted)]">
            <span>Tx: </span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs break-all text-[var(--color-ink)]">
              {receipt.txHash}
            </span>
          </div>
          {swapTxHash && (
            <div className="text-[var(--color-ink-muted)]">
              <span>Swap: </span>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs break-all text-[var(--color-ink)]">
                {swapTxHash}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
