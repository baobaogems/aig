// cut-surface.tsx — bề mặt góc vát, hình khối chữ ký của hệ Arbiter.
//
// Góc CẮT chứ không phải góc TRÒN, nên dùng clip-path chứ không border-radius.
// Tương phản giữa thẻ vát góc và chip bo tròn hẳn là thứ tạo phân cấp hình khối
// — hệ cũ để mọi thứ ở 24px nên mắt không có gì bám vào.

import type { ElementType, ReactNode } from "react";

export function CutSurface({
  as: Tag = "div",
  size = "md",
  className = "",
  children,
  ...rest
}: {
  as?: ElementType;
  /** "sm" cho nút và chip vuông nhỏ; "md" cho thẻ và panel. */
  size?: "sm" | "md";
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <Tag className={`${size === "sm" ? "a-cut-sm" : "a-cut"} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
