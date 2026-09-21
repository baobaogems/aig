import { describe, test, expect } from "vitest";
import { inPrizeBand } from "./prize-band";

describe("prize-band", () => {
  test("Biên 0.999 / 1 / 5 / 5.001 — 1 và 5 thuộc bậc giữa", () => {
    // 0.999
    expect(inPrizeBand(0.999, "under_1")).toBe(true);
    expect(inPrizeBand(0.999, "1_to_5")).toBe(false);

    // 1
    expect(inPrizeBand(1, "under_1")).toBe(false);
    expect(inPrizeBand(1, "1_to_5")).toBe(true);

    // 5
    expect(inPrizeBand(5, "1_to_5")).toBe(true);
    expect(inPrizeBand(5, "over_5")).toBe(false);

    // 5.001
    expect(inPrizeBand(5.001, "1_to_5")).toBe(false);
    expect(inPrizeBand(5.001, "over_5")).toBe(true);
  });

  test("all luôn đúng", () => {
    expect(inPrizeBand(10, "all")).toBe(true);
    expect(inPrizeBand(0.1, "all")).toBe(true);
  });

  test("Bậc rỗng hoặc không hợp lệ trả về false", () => {
    expect(inPrizeBand(NaN, "under_1")).toBe(false);
    expect(inPrizeBand(NaN, "1_to_5")).toBe(false);
    expect(inPrizeBand(NaN, "over_5")).toBe(false);
  });
});
