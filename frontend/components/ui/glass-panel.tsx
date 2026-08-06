// glass-panel.tsx — reskin design token: large-radius card, frosted-glass on dark,
// soft-shadow on light. Shared by the landing page and the reskinned /arbiter forms.

import type { HTMLAttributes, ReactNode } from "react";

export function GlassPanel({
  children,
  tone = "light",
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; tone?: "light" | "dark" }) {
  const toneClasses =
    tone === "dark"
      ? "bg-white/[0.04] border border-white/10 backdrop-blur-xl text-[var(--color-on-dark)]"
      : "bg-white/70 border border-black/5 shadow-[0_8px_30px_rgba(10,21,18,0.06)] backdrop-blur-md text-[var(--color-ink)]";

  return (
    <div className={`rounded-[var(--radius-card)] ${toneClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
