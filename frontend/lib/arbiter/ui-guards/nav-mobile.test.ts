// nav-mobile.test.ts — giữ đường vào Dashboard trên điện thoại.
//
// Lỗi này đã thật sự xảy ra ở bản mockup: `.navlinks { display: none }` dưới
// 820px. Trên desktop trông gọn gàng, trên điện thoại thì mất hẳn lối vào màn
// hình quan trọng nhất — nơi người đăng bấm nút trả tiền. Không ai phát hiện vì
// không ai mở lại bản mobile sau khi "dọn cho gọn".

import { describe, expect, it } from "vitest";
import { read } from "./helpers";

const NAV = read("components", "arbiter", "arbiter-nav.tsx");

describe("nav không được biến mất ở màn hẹp", () => {
  it("không ẩn cụm link bằng hidden không kèm điểm dừng bật lại", () => {
    // `hidden md:flex` là hợp lệ (ẩn ở hẹp, hiện ở rộng) — đó là Docs.
    // `hidden` trơ trọi, hoặc `md:hidden`, thì ẩn đúng ở chỗ cần nhất.
    const bad = [...NAV.matchAll(/className=\{?[`"'][^`"']*\bmd:hidden\b[^`"']*[`"']/g)];
    expect(bad.map((m) => m[0]), "md:hidden ẩn mất mục ở màn hẹp").toEqual([]);
  });

  it("Market và Dashboard đều có mặt không điều kiện", () => {
    expect(NAV).toMatch(/"\/arbiter",\s*"market"/);
    expect(NAV).toMatch(/"\/arbiter\/dashboard",\s*"dashboard"/);
  });

  it("cụm link xuống hàng riêng ở hẹp thay vì bị ẩn", () => {
    // order-3 + w-full là cách nó rơi xuống hàng dưới; md: trả về hàng ngang.
    expect(NAV).toMatch(/order-3/);
    expect(NAV).toMatch(/w-full/);
    expect(NAV).toMatch(/flex-wrap/);
  });
});

describe("huy hiệu chỉ hiện khi thật sự có việc chờ", () => {
  it("null (chưa đăng nhập) và 0 đều không hiện huy hiệu", () => {
    expect(NAV).toMatch(/typeof pendingDecisions === "number" && pendingDecisions > 0/);
  });
});

describe("nhãn nav là tiếng Anh vì dùng Orbitron", () => {
  it("không có dấu tiếng Việt trong nhãn điều hướng", () => {
    const labels = [...NAV.matchAll(/item\("[^"]+",\s*"\w+",\s*"([^"]+)"\)/g)].map((m) => m[1]);
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) {
      expect(l, `"${l}" có dấu — Orbitron không hỗ trợ`).not.toMatch(
        /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i,
      );
    }
  });
});
