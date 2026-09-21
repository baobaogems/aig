// a-button.tsx — nút của màn Arbiter. Chữ Orbitron, HOA, vát góc.
//
// HAI ĐIỀU KHÔNG HIỂN NHIÊN
//
// 1. Nhãn phải là tiếng Anh không dấu. Orbitron không có subset vietnamese
//    (xem app/layout.tsx), gõ "Nộp bài" vào đây là mất dấu.
//
// 2. Vòng focus vẽ bằng lớp BỌC NGOÀI, không phải outline của chính nút.
//    clip-path cắt luôn outline, nên một nút vát góc tự vẽ outline thì người
//    dùng bàn phím không thấy gì (catalog F1). .a-focus-host + :has() trong
//    arbiter-ui.css lo việc này.

import type { ReactNode } from "react";

type Variant = "solid" | "line" | "ghost" | "secondary";

const STYLE: Record<Variant, React.CSSProperties> = {
  // Nút đặc DUY NHẤT trên mỗi màn, dành cho hành động chuyển tiền (catalog E3).
  solid: {
    background: "var(--a-acc)",
    borderColor: "var(--a-acc)",
    color: "var(--a-on-acc)",
    boxShadow: "0 2px 10px -4px rgba(var(--a-acc-rgb),.6)",
  },
  line: { background: "rgba(255,255,255,.6)", borderColor: "var(--a-line-hard)", color: "var(--a-text)" },
  ghost: { background: "transparent", borderColor: "transparent", color: "var(--a-muted)" },
  secondary: { background: "var(--a-btn-submit-bg)", borderColor: "transparent", color: "var(--a-btn-submit-text)" },
};

export function AButton({
  variant = "line",
  size = "md",
  className = "",
  children,
  ...rest
}: {
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <span className="a-focus-host inline-flex">
      <button
        className={`a-cut-sm inline-flex items-center gap-2 whitespace-nowrap border
                    font-[family-name:var(--font-display)] font-extrabold uppercase
                    tracking-[0.11em] transition-colors
                    ${size === "sm" ? "px-3.5 py-1.5 text-[10px]" : "px-[18px] py-2.5 text-[11px]"}
                    ${className}`}
        style={STYLE[variant]}
        {...rest}
      >
        {children}
      </button>
    </span>
  );
}
