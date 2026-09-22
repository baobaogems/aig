// arbiter-ui-scope.test.ts — mọi trang của màn Arbiter phải mang class .arbiter-ui.
//
// Lý do rất cụ thể: các token --a-* chỉ được khai báo bên trong `.arbiter-ui` (xem
// app/arbiter-ui.css). Một trang quên class đó thì mọi var(--a-*) trở thành rỗng, nền rơi
// về mặc định tối và chữ sáng nằm trên nền sáng — đúng thứ đã xảy ra với not-found.tsx.
// Không nhìn ra bằng cách đọc code, chỉ mở trang mới thấy, nên chốt bằng test.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "app", "arbiter");

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return pageFiles(full);
    return /^(page|not-found)\.tsx$/.test(entry) ? [full] : [];
  });
}

describe("mọi trang Arbiter nằm trong .arbiter-ui", () => {
  for (const file of pageFiles(ROOT)) {
    const rel = file.slice(process.cwd().length + 1);
    it(`${rel} có class arbiter-ui`, () => {
      expect(readFileSync(file, "utf-8"), `${rel} thiếu .arbiter-ui — token --a-* sẽ rỗng`).toContain(
        "arbiter-ui",
      );
    });
  }
});
