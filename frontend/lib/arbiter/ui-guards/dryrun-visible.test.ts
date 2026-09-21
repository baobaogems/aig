import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("dryrun-visible", () => {
  it("trang dashboard có tham chiếu cờ dry-run", () => {
    const src = readFileSync(
      join(process.cwd(), "app", "arbiter", "dashboard", "page.tsx"),
      "utf8",
    );
    expect(src).toMatch(/NEXT_PUBLIC_DRY_RUN/);
    expect(src).toMatch(/dry-run/i);
  });
});
