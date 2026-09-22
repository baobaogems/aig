import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("reduced-motion", () => {
  it("arbiter-ui.css has prefers-reduced-motion block", () => {
    const src = readFileSync(
      join(process.cwd(), "app", "arbiter-ui.css"),
      "utf8",
    );
    expect(src).toMatch(/@media[\s]*\([\s]*prefers-reduced-motion:[\s]*reduce[\s]*\)/);
  });
});
