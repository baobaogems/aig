// bounty-create-contract.test.ts — guards the two source-level defects that made it to a user.
//
// Neither was caught by 83 existing tests, because nothing here tests a route handler. These
// read the source instead. That is a weak form of testing and it is chosen deliberately: a
// real handler test needs a Supabase double and an LLM double, which is a day of scaffolding,
// while these two failures are both "a line that should not be there" and cost minutes.
//
// What happened: a python search-and-replace inserted a new, correct worker_id check and left
// the OLD one below it. str.replace does not complain when its pattern is missing, so the
// edit "succeeded" while the old line survived. Every attempt to post a bounty then failed
// with "worker_id must be a wallet address" — the main flow of the product, broken silently,
// found only when Baobao tried to use it.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSrc = readFileSync(join(process.cwd(), "app", "api", "bounty", "route.ts"), "utf8");
const formSrc = readFileSync(
  join(process.cwd(), "components", "arbiter", "poster-bounty-form.tsx"),
  "utf8",
);
const drawerSrc = readFileSync(join(process.cwd(), "components", "ui", "drawer.tsx"), "utf8");

describe("POST /api/bounty accepts a bounty with no worker", () => {
  it("rejects a worker_id only when one was actually supplied", () => {
    const guards = routeSrc.match(/if \([^)]*ADDR_RE\.test\(worker_id[^)]*\)[^)]*\)/g) ?? [];
    expect(guards, "chỉ được có ĐÚNG MỘT chỗ kiểm worker_id").toHaveLength(1);
    // The surviving guard must be conditional on worker_id being present.
    expect(guards[0]).toMatch(/worker_id != null/);
  });

  it("has no guard that treats a missing worker_id as invalid", () => {
    // `ADDR_RE.test(worker_id ?? "")` is the shape of the old bug: it turns "omitted" into
    // "empty string", which never matches an address, so an open bounty can never be created.
    expect(routeSrc).not.toMatch(/ADDR_RE\.test\(worker_id \?\? ""\)/);
  });

  it("does not read poster_id from the request body", () => {
    const destructure = routeSrc.match(/const \{[^}]*\} = await req\.json\(\)/)?.[0] ?? "";
    expect(destructure).not.toMatch(/poster_id/);
  });
});

describe("the new-bounty form matches what the route expects", () => {
  it("sends no worker_id and no poster_id", () => {
    const body = formSrc.match(/body: JSON\.stringify\(\{[\s\S]*?\}\),/)?.[0] ?? "";
    expect(body).toBeTruthy();
    expect(body).not.toMatch(/worker_id|poster_id/);
    expect(body).toMatch(/brief/);
  });
});

describe("the drawer cannot steal focus from a field being typed into", () => {
  it("moves focus in an effect that depends on `open` alone", () => {
    // The bug: focus() sat in an effect whose deps included onClose, which every caller
    // writes as an inline arrow — a new function each parent render, so the effect re-ran and
    // yanked the caret. Vietnamese exposed it: a letter takes several keystrokes and the
    // caret never survived one.
    const focusEffect = drawerSrc.match(/useEffect\(\(\) => \{[^}]*panelRef\.current\?\.focus\(\)[\s\S]*?\}, \[([^\]]*)\]\)/);
    expect(focusEffect, "không tìm thấy effect lấy focus").toBeTruthy();
    expect(focusEffect![1].trim()).toBe("open");
  });

  it("keeps onClose out of any effect that DOES something", () => {
    // One effect is allowed to depend on onClose: the one whose only job is to copy it into
    // the ref. Any effect that moves focus or binds a listener must not, because re-running
    // those is exactly what broke typing.
    const effects = drawerSrc.match(/useEffect\([\s\S]*?\}, \[[^\]]*\]\);/g) ?? [];
    expect(effects.length).toBeGreaterThanOrEqual(2);

    for (const eff of effects) {
      const deps = eff.match(/\}, \[([^\]]*)\]\);$/)?.[1] ?? "";
      if (!deps.includes("onClose")) continue;

      // This effect depends on onClose — it may do nothing but assign the ref.
      expect(eff, "effect phụ thuộc onClose thì chỉ được gán ref, không được làm gì khác")
        .toMatch(/onCloseRef\.current = onClose;/);
      expect(eff).not.toMatch(/\.focus\(\)|addEventListener|document\.body/);
    }
  });
});
