// glass-panel.tsx — reskin design token: large-radius card, frosted-glass on dark,
// soft-shadow on light. Shared by the landing page and the reskinned /arbiter forms.

import type { HTMLAttributes, ReactNode } from "react";

export function GlassPanel({
  children,
  tone = "light",
  interactive = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** `dark-raised` là nền tối NHƯNG đặc hơn hẳn nền section (--color-surface-dark-2
   *  trên --color-surface-dark), cho card cần tách bạch rõ chứ không chỉ gợi ý. */
  tone?: "light" | "dark" | "dark-raised";
  /** Rê chuột thì card phản hồi. Mặc định false — /arbiter dùng chung
   *  component này và phải giữ nguyên hình. */
  interactive?: boolean;
}) {
  const isDark = tone === "dark" || tone === "dark-raised";
  const toneClasses =
    tone === "dark-raised"
      ? "bg-[var(--color-surface-dark-2)] border border-white/10 text-[var(--color-on-dark)]"
      : tone === "dark"
        ? "bg-white/[0.04] border border-white/10 backdrop-blur-xl text-[var(--color-on-dark)]"
        : "bg-white/70 border border-black/5 shadow-[0_8px_30px_rgba(10,21,18,0.06)] backdrop-blur-md text-[var(--color-ink)]";
  // Nền sáng dùng bóng đổ, nền tối dùng viền sáng — hai cơ chế khác nhau.
  const liftClass = interactive ? (isDark ? "card-lift-dark" : "card-lift") : "";

  return (
    <div
      className={`rounded-[var(--radius-card)] ${toneClasses} ${liftClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
