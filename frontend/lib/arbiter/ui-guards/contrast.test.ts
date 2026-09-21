// contrast.test.ts — đo tương phản bằng máy, không bằng mắt.
//
// Lý do tồn tại rất cụ thể: bản mockup của đợt này dùng --a-subtle:#8a8a8a cho
// hạn chót, footer và phụ đề thẻ. Nhìn thì "xám nhạt cho dịu"; đo ra 3.2, dưới
// ngưỡng AA 4.5. Không ai phát hiện bằng mắt — phải tính.
//
// Test này tính lại tỉ lệ từ chính giá trị trong arbiter-ui.css mỗi lần chạy,
// nên hạ độ đậm của bất kỳ token chữ nào cũng đỏ ngay.

import { describe, expect, it } from "vitest";
import { AA_NORMAL_TEXT, contrastRatio, cssBlock, cssVars, read } from "./helpers";

const VARS = cssVars(cssBlock(read("app", "arbiter-ui.css"), ".arbiter-ui"));

/** Nền sáng nhạt nhất mà chữ có thể nằm trên. --a-bg trỏ tới token gốc nên phân giải tay. */
const SURFACE = "#f4f6f6";

describe("chữ trên nền sáng đạt WCAG AA (4.5)", () => {
  for (const token of ["--a-text", "--a-muted", "--a-subtle"]) {
    it(`${token} đủ tương phản`, () => {
      const value = VARS[token];
      expect(value, `${token} chưa khai báo trong .arbiter-ui`).toBeTruthy();
      const ratio = contrastRatio(value.startsWith("var(") ? "#111111" : value, SURFACE);
      expect(ratio, `${token} = ${value} → ${ratio}:1, cần ≥ ${AA_NORMAL_TEXT}`).toBeGreaterThanOrEqual(
        AA_NORMAL_TEXT,
      );
    });
  }

  it("--a-subtle không được sáng hơn #6b6b6b", () => {
    // Chốt chặn thứ hai, nói thẳng con số: #8a8a8a từng lọt vào mockup.
    expect(contrastRatio(VARS["--a-subtle"], SURFACE)).toBeGreaterThanOrEqual(
      contrastRatio("#6b6b6b", SURFACE),
    );
  });
});

describe("màu trạng thái là bản ĐẬM, không phải bản neon", () => {
  // Neon (#00e05a, #ffc400) chỉ đọc được trên nền tối. Trên nền sáng chúng biến mất.
  for (const token of ["--a-ok", "--a-warn", "--a-info", "--a-bad"]) {
    it(`${token} đọc được trên nền sáng`, () => {
      const ratio = contrastRatio(VARS[token], SURFACE);
      expect(ratio, `${token} = ${VARS[token]} → ${ratio}:1`).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });
  }
});

describe("chữ trắng trên nền accent đặc", () => {
  it("--a-on-acc trên --a-acc đạt AA", () => {
    expect(contrastRatio(VARS["--a-on-acc"], "#de1e14")).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});
