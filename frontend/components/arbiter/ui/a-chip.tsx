// a-chip.tsx — nhãn trạng thái nhỏ, bo tròn hẳn.
//
// Bo tròn hẳn (100px) là cố ý: nó tương phản với thẻ góc vát, và chính cặp
// hình khối đó tạo phân cấp. Đo từ prizee.xyz: nền mờ + viền CÙNG TÔNG ở alpha
// cao hơn — không phải viền xám trung tính.

import type { ReactNode } from "react";

export type ChipTone = "neutral" | "acc" | "ok" | "warn" | "bad" | "info";

/** Kênh RGB của từng tông. Nền và viền dẫn xuất từ cùng một màu nên chip luôn "một khối". */
const RGB: Record<Exclude<ChipTone, "neutral" | "acc">, string> = {
  ok: "10,122,51",
  warn: "138,90,0",
  bad: "181,24,92",
  info: "11,109,143",
};

const VAR: Record<Exclude<ChipTone, "neutral" | "acc">, string> = {
  ok: "--a-ok",
  warn: "--a-warn",
  bad: "--a-bad",
  info: "--a-info",
};

export function AChip({ tone = "neutral", children }: { tone?: ChipTone; children: ReactNode }) {
  const style =
    tone === "neutral"
      ? { borderColor: "rgba(17,17,17,.13)", background: "rgba(17,17,17,.045)", color: "var(--a-muted)" }
      : tone === "acc"
        ? {
            borderColor: "rgba(var(--a-acc-rgb),.34)",
            background: "rgba(var(--a-acc-rgb),.07)",
            color: "var(--a-acc)",
          }
        : {
            borderColor: `rgba(${RGB[tone]},.30)`,
            background: `rgba(${RGB[tone]},.09)`,
            color: `var(${VAR[tone]})`,
          };

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--a-pill)] border
                 px-2.5 py-[3px] font-[family-name:var(--font-jetbrains-mono)] text-[9.5px]
                 font-bold uppercase tracking-[0.09em]"
      style={style}
    >
      {children}
    </span>
  );
}
