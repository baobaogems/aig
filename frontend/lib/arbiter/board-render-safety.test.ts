// board-render-safety.test.ts — keeps a per-second timer out of any component that owns a
// text input.
//
// The bug this locks down: /arbiter called useCountdown(), which setStates every second, so
// the whole page — including the drawers and the forms inside them — re-rendered once a
// second. Vietnamese input builds one letter from several keystrokes (d + d → đ), and a
// re-render mid-composition discards the pending letter. Typing "đá" produced "dá".
//
// A render test would be the direct way to catch this, but the repo has no jsdom and adding
// it for one assertion is heavier than the thing it protects. This reads the source instead:
// cheap, and it fails loudly the next time someone moves the clock back up the tree.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), "utf8");

/** Components that render a text input, directly or through a drawer they own. */
const INPUT_OWNERS = [
  ["app", "arbiter", "page.tsx"],
  ["components", "arbiter", "poster-bounty-form.tsx"],
  ["components", "arbiter", "worker-submit-form.tsx"],
];

describe("no ticking clock above a text input", () => {
  for (const parts of INPUT_OWNERS) {
    it(`${parts.join("/")} does not subscribe to the per-second clock`, () => {
      expect(read(...parts)).not.toMatch(/useCountdown/);
    });
  }

  it("the grid still has one, because that is where time is displayed", () => {
    expect(read("components", "arbiter", "bounty-grid.tsx")).toMatch(/useCountdown/);
  });

  it("the grid subtree takes no text input", () => {
    // If a card ever grows an input, the clock has to move again — this is the tripwire.
    for (const f of ["bounty-grid.tsx", "bounty-card.tsx"]) {
      const src = read("components", "arbiter", f);
      expect(src, `${f} không được chứa ô nhập chữ khi đồng hồ chạy ở đây`).not.toMatch(
        /<input|<textarea/,
      );
    }
  });
});

describe("the new bounty form cannot default to a deadline in the past", () => {
  it("seeds the deadline from a future offset, not an empty string", () => {
    const src = read("components", "arbiter", "poster-bounty-form.tsx");
    expect(src).toMatch(/useState\(\(\) => \{[\s\S]*?Date\.now\(\) \+ 7 \* 24 \* 60 \* 60 \* 1000/);
  });
});
