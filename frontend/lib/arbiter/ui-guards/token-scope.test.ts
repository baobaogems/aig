// token-scope.test.ts — giữ hệ token mới nằm trong phạm vi của nó.
//
// Ràng buộc lớn nhất của đợt redesign: landing page dùng chung :root, PillButton
// và GlassPanel với arbiter. Một token --a-* rơi vào :root, hoặc một mã màu gõ
// thẳng vào component, là cách phạm vi rò ra ngoài mà không ai thấy.

import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { cssBlock, cssVars, read } from "./helpers";

const ARBITER_CSS = read("app", "arbiter-ui.css");

describe("token --a-* chỉ sống dưới .arbiter-ui", () => {
  it("không token --a-* nào trong :root của globals.css", () => {
    const root = cssBlock(read("app", "globals.css"), ":root");
    expect(root).not.toMatch(/--a-[\w-]+\s*:/);
  });

  it("mọi khai báo --a-* đều nằm trong khối .arbiter-ui", () => {
    const scoped = Object.keys(cssVars(cssBlock(ARBITER_CSS, ".arbiter-ui")));
    const all = [...ARBITER_CSS.matchAll(/(--a-[\w-]+)\s*:/g)].map((m) => m[1]);
    const outside = all.filter((n) => !scoped.includes(n));
    expect(outside, `khai báo ngoài .arbiter-ui: ${outside.join(", ")}`).toEqual([]);
  });

  it("globals.css có nạp arbiter-ui.css", () => {
    expect(read("app", "globals.css")).toMatch(/@import\s+["']\.\/arbiter-ui\.css["']/);
  });
});

describe("primitive không gõ thẳng mã màu", () => {
  // Màu phải đi qua token, nếu không việc đổi bảng màu sau này thành trò săn hex.
  // Miễn trừ rgba(17,17,17,...) và rgba(255,255,255,...): đó là sắc độ trung tính
  // dẫn xuất từ mực và giấy, không phải màu thương hiệu.
  const dir = join("components", "arbiter", "ui");
  const files = readdirSync(join(process.cwd(), dir)).filter((f) => f.endsWith(".tsx"));

  it("có đủ 7 primitive", () => {
    expect(files.length).toBeGreaterThanOrEqual(7);
  });

  for (const f of files) {
    it(`${f} không chứa hex thô`, () => {
      const src = read(dir, f).replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      const hex = src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hex, `dùng var(--a-*) thay vì ${hex.join(", ")}`).toEqual([]);
    });
  }
});

describe("bẫy font: Orbitron không có dấu tiếng Việt", () => {
  it("layout.tsx khai báo Orbitron chỉ với subset latin", () => {
    const src = read("app", "layout.tsx");
    const block = /const orbitron = Orbitron\(\{[\s\S]*?\}\);/.exec(src);
    expect(block, "không tìm thấy khai báo Orbitron").toBeTruthy();
    expect(block![0]).toContain('subsets: ["latin"]');
    expect(block![0]).not.toMatch(/vietnamese/);
  });

  it("biến --font-display được gắn vào <html>", () => {
    expect(read("app", "layout.tsx")).toMatch(/orbitron\.variable/);
  });
});
