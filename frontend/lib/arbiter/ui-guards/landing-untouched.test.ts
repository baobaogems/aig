// =============================================================================
// landing-untouched.test.ts — hàng rào cho ràng buộc lớn nhất của đợt redesign.
//
// Arbiter đang đổi sang một hệ trình bày mới. Landing page thì KHÔNG.
// Hai bên dùng chung `PillButton`, `GlassPanel`, và toàn bộ token trong :root —
// nên một thay đổi "chỉ cho arbiter" rất dễ rò sang trang chủ mà không ai thấy,
// vì không ai mở lại trang chủ trong lúc sửa trang khác.
//
// Vân tay được ghi lúc 21/09/2026, trước khi chạm vào bất cứ thứ gì.
// Test này đỏ nghĩa là một trong hai điều:
//   1. Đã sửa nhầm file dùng chung  → hoàn tác, làm bản riêng trong components/arbiter/ui/
//   2. Cố ý đổi landing            → cập nhật vân tay TRONG CÙNG commit, kèm lý do
// Không bao giờ cập nhật vân tay chỉ để test xanh trở lại.
// =============================================================================

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cssBlock, fingerprint, read } from "./helpers";

/** Ảnh chụp sha256 (16 ký tự đầu) tại thời điểm bắt đầu đợt redesign. */
const BASELINE: Record<string, string> = {
  "components/landing/landing-flow.tsx": "f1529a501e97859d",
  "components/landing/landing-footer.tsx": "c1007d2211ac06e3",
  "components/landing/landing-hero.tsx": "421f89d76ed90e62",
  "components/landing/landing-nav.tsx": "724a605c9d7efbda",
  "components/landing/landing-pilot-metrics.tsx": "0371cac77b9cf7e0",
  "components/landing/landing-problem.tsx": "a638a9d74d9557bb",
  "components/landing/landing-safety.tsx": "4e3b51a9289dd831",
  // Dùng chung giữa landing và arbiter — đây là hai file dễ bị sửa nhầm nhất.
  "components/ui/pill-button.tsx": "3cfc82aa34919df2",
  "components/ui/glass-panel.tsx": "01541fa20a2f3e2b",
};

describe("landing page không được đổi trong đợt redesign arbiter", () => {
  for (const [file, expected] of Object.entries(BASELINE)) {
    it(`${file} nguyên vẹn`, () => {
      expect(fingerprint(file), `${file} đã đổi — xem phần đầu file test này`).toBe(expected);
    });
  }
});

describe("token toàn cục :root không được đụng", () => {
  // Hệ mới của arbiter sống dưới .arbiter-ui. Nếu một token --a-* xuất hiện trong
  // :root nghĩa là phạm vi đã rò ra toàn site.
  const root = () => cssBlock(read("app", "globals.css"), ":root");

  it("khối :root giữ nguyên nội dung", () => {
    const hash = createHash("sha256").update(root().replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
    expect(hash, "app/globals.css :root đã đổi — token toàn cục phục vụ cả landing").toBe(
      "56d8f391b41414ec",
    );
  });

  it("không có token --a-* nào rò vào :root", () => {
    expect(root()).not.toMatch(/--a-[\w-]+\s*:/);
  });
});

describe("cssBlock cắt đúng khối, không phải regex hớ hênh", () => {
  // Bản nháp đầu dùng /:root\{.*?\n\}/ — trượt vì globals.css viết ":root {" có
  // khoảng trắng, và khối chứa comment có dấu } bên trong. Regex trượt thì test
  // xanh giả, còn tệ hơn không có test. Đây là tripwire cho chính helper.
  it("chấp nhận khoảng trắng sau selector", () => {
    expect(cssBlock("x{}\n:root   {\n--a: 1;\n}", ":root")).toContain("--a: 1");
  });

  it("đếm ngoặc lồng nhau, không dừng ở } đầu tiên", () => {
    const src = ":root {\n  --a: 1;\n  @media (x) { --b: 2; }\n  --c: 3;\n}";
    const out = cssBlock(src, ":root");
    expect(out).toContain("--c: 3");
  });

  it("ném lỗi rõ ràng khi không tìm thấy", () => {
    expect(() => cssBlock("body{}", ":root")).toThrow(/không tìm thấy/);
  });
});
