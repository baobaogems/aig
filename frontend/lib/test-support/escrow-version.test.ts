// escrow-version.test.ts — the dual-contract routing, which decides WHOSE money is touched.

import { afterEach, describe, expect, it } from "vitest";
import {
  CURRENT_ESCROW_VERSION, assertCurrentVersion, escrowAbiFor, escrowAddressFor, isCurrentVersion,
} from "../escrow-version";

const V2 = "0xD4f53A1bD89a05Ac568601b4c30655A678C5f9f1";
const V3 = "0x1111111111111111111111111111111111111111";

afterEach(() => {
  delete process.env.ARBITER_ESCROW_ADDRESS;
  delete process.env.ARBITER_ESCROW_ADDRESS_V2;
});

describe("routing to the right contract", () => {
  it("sends each version to its own address", () => {
    process.env.ARBITER_ESCROW_ADDRESS = V3;
    process.env.ARBITER_ESCROW_ADDRESS_V2 = V2;
    expect(escrowAddressFor(3)).toBe(V3);
    expect(escrowAddressFor(2)).toBe(V2);
  });

  it("gives v2 the frozen ABI, which has no settle", () => {
    expect(escrowAbiFor(2).some((e) => "name" in e && e.name === "settle")).toBe(false);
    expect(escrowAbiFor(3).some((e) => "name" in e && e.name === "settle")).toBe(true);
  });
});

describe("fail closed", () => {
  it("refuses a version it does not recognise rather than guessing", () => {
    process.env.ARBITER_ESCROW_ADDRESS = V3;
    for (const v of [null, undefined, 0, 1, 4, 99]) {
      expect(() => escrowAddressFor(v as number)).toThrow(/không nhận diện được/);
      expect(() => escrowAbiFor(v as number)).toThrow(/không nhận diện được/);
    }
  });

  it("refuses when the address for that version is missing or malformed", () => {
    expect(() => escrowAddressFor(3)).toThrow(/ARBITER_ESCROW_ADDRESS/);
    process.env.ARBITER_ESCROW_ADDRESS = "0xnope";
    expect(() => escrowAddressFor(3)).toThrow(/malformed/);
  });

  it("blocks a v3-only action on a v2 bounty, in words a person can act on", () => {
    expect(() => assertCurrentVersion(2, "markSubmitted")).toThrow(/chỉ có trên escrow v3/);
    expect(() => assertCurrentVersion(CURRENT_ESCROW_VERSION, "markSubmitted")).not.toThrow();
    expect(isCurrentVersion(2)).toBe(false);
  });
});
