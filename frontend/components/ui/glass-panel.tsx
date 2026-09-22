// glass-panel.tsx — reskin design token: large-radius card, frosted-glass on dark,
// soft-shadow on light. Shared by the landing page and the reskinned /arbiter forms.

import type { HTMLAttributes, ReactNode } from "react";

export function GlassPanel({
  children,
  tone, // unused now
  interactive = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "light" | "dark" | "dark-raised";
  interactive?: boolean;
}) {
  return (
    <div
      className={`a-cut border ${className}`}
      style={{
        background: "var(--a-card-dark)",
        borderColor: "var(--a-border-dark)",
        color: "var(--a-text-dark-h1)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
