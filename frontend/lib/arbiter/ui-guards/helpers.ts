// =============================================================================
// ui-guards/helpers.ts — công cụ chung cho các cổng kiểm tra giao diện.
//
// Vì sao đọc source thay vì render: repo không có jsdom/testing-library, và
// vitest.config.ts đặt environment: "node". Đây là cùng cách mà
// board-render-safety.test.ts đã làm, với cùng lý do nó tự ghi: thêm jsdom cho
// vài assertion nặng hơn thứ nó bảo vệ.
//
// Lưu ý quan trọng về vitest.config.ts: include chỉ có lib/**, scripts/**, app/**.
// Test đặt trong components/ sẽ bị BỎ QUA IM LẶNG. Vì thế mọi cổng UI sống ở đây.
// =============================================================================

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Đọc một file trong frontend/, đường dẫn tính từ process.cwd(). */
export function read(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

/** Vân tay ổn định của một file. Dùng để khoá "không được đổi". */
export function fingerprint(...parts: string[]): string {
  // Chuẩn hoá xuống dòng: đổi CRLF/LF không phải là đổi thiết kế.
  const src = read(...parts).replace(/\r\n/g, "\n");
  return createHash("sha256").update(src).digest("hex").slice(0, 16);
}

/**
 * Cắt một khối CSS theo selector, đếm ngoặc để lấy đúng khối lồng nhau.
 *
 * Không dùng regex `:root\{.*?\n\}` như bản nháp đầu: globals.css viết `:root {`
 * có khoảng trắng, và khối chứa comment có dấu `}` bên trong. Regex trượt →
 * test xanh giả. Đếm ngoặc là cách duy nhất đúng.
 */
export function cssBlock(src: string, selector: string): string {
  const head = new RegExp(`(^|\\n)\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`);
  const m = head.exec(src);
  if (!m) throw new Error(`không tìm thấy khối CSS "${selector}"`);

  const open = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open, i + 1);
  }
  throw new Error(`khối CSS "${selector}" không đóng ngoặc`);
}

/** Mọi khai báo custom property trong một đoạn CSS, dạng { "--ten": "gia tri" }. */
export function cssVars(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Bỏ comment trước, nếu không `/* --a-x: ... */` sẽ bị tính là khai báo thật.
  const clean = block.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, name, value] of clean.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

// ─── Tương phản WCAG ─────────────────────────────────────────────────────────

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** #rgb | #rrggbb | rgb(r,g,b) → [r,g,b]. Ném lỗi nếu không nhận dạng được. */
export function parseColor(input: string): [number, number, number] {
  const s = input.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (rgb) {
    const n = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (n.length >= 3 && n.slice(0, 3).every(Number.isFinite)) {
      return [n[0], n[1], n[2]] as [number, number, number];
    }
  }
  throw new Error(`không đọc được màu: "${input}"`);
}

export function relativeLuminance(color: string): number {
  const [r, g, b] = parseColor(color);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Tỉ lệ tương phản WCAG 2.1, làm tròn 2 chữ số. Ngưỡng AA cho chữ thường là 4.5. */
export function contrastRatio(fg: string, bg: string): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Ngưỡng AA cho chữ thường. Chữ lớn (≥18.66px bold / 24px) là 3.0, không dùng ở đây. */
export const AA_NORMAL_TEXT = 4.5;
