import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("decorative-aria", () => {
  it("page-backdrop has aria-hidden=true", () => {
    const src = readFileSync(
      join(process.cwd(), "components", "arbiter", "ui", "page-backdrop.tsx"),
      "utf8",
    );
    expect(src).toMatch(/aria-hidden="true"/);
  });

  it("serration has aria-hidden=true", () => {
    const src = readFileSync(
      join(process.cwd(), "components", "arbiter", "ui", "serration.tsx"),
      "utf8",
    );
    expect(src).toMatch(/aria-hidden="true"/);
  });
});
