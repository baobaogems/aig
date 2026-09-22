import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("money-math-reuse", () => {
  it("decision-card.tsx calls kill-fee.ts instead of reinventing the math", () => {
    const src = readFileSync(
      join(process.cwd(), "components", "arbiter", "dashboard", "decision-card.tsx"),
      "utf8",
    );
    expect(src).toMatch(/import.*kill-fee/);
    expect(src).toMatch(/killFeeBps/);
    expect(src).toMatch(/workerAmountUsdc/);
    expect(src).toMatch(/posterAmountUsdc/);
    
    // Should NOT contain raw division or multiplication for split
    expect(src).not.toMatch(/10_000/);
    expect(src).not.toMatch(/10000/);
  });
});
