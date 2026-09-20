// decision-thresholds.test.ts — guards the one rule this component has: the numbers on the
// page come from tiers.ts, never from a literal typed into the JSX.
//
// Not a render test (the repo has no jsdom, and adding it for this would be heavier than what
// it protects). It reads the source and fails if a threshold value appears hard-coded — which
// is precisely the drift that would put a wrong promise in front of a worker.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TIER_THRESHOLDS } from "./tiers";

const source = readFileSync(
  join(process.cwd(), "components", "arbiter", "decision-thresholds.tsx"),
  "utf8",
);

describe("decision-thresholds source", () => {
  it("imports the thresholds instead of restating them", () => {
    expect(source).toMatch(/import \{ TIER_THRESHOLDS \} from "@\/lib\/arbiter\/tiers"/);
  });

  it("interpolates every threshold rather than hard-coding its value", () => {
    for (const [name, value] of Object.entries(TIER_THRESHOLDS)) {
      // The key must be referenced...
      expect(source, `${name} phải được đọc từ TIER_THRESHOLDS`).toContain(`T.${name}`);
      // ...and its current number must not appear as a bare literal in the copy.
      const bare = new RegExp(`(?<![.\\w])${value}(?![\\w])`);
      const copyOnly = source.replace(/import[\s\S]*?;\n/g, "");
      expect(bare.test(copyOnly), `số ${value} (${name}) bị chép cứng vào JSX`).toBe(false);
    }
  });
});
