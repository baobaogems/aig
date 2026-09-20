// client-key-diagnostics.test.ts — the diagnostics must stay diagnostic.
//
// describeApiKey() exists so a 401 can be debugged from a server log without anyone pasting a
// key into a chat window to compare it. That only holds if it can never widen into the key
// itself, so the cap is pinned here rather than left to reviewer memory.

import { afterEach, describe, expect, it } from "vitest";
import { API_KEY_ENV, describeApiKey } from "./client";

const REAL = process.env[API_KEY_ENV];
afterEach(() => {
  if (REAL === undefined) delete process.env[API_KEY_ENV];
  else process.env[API_KEY_ENV] = REAL;
});

const FAKE = "sk-ant-api03-" + "Z".repeat(95);

describe("describeApiKey", () => {
  it("names the variable it reads, so a log says WHICH env was checked", () => {
    expect(API_KEY_ENV).toBe("ANTHROPIC_API_KEY");
    expect(describeApiKey().envName).toBe("ANTHROPIC_API_KEY");
  });

  it("never returns more than 10 characters of the key", () => {
    process.env[API_KEY_ENV] = FAKE;
    const d = describeApiKey();
    expect(d.keyPrefix).toHaveLength(10);
    expect(FAKE).toContain(d.keyPrefix);
    // The whole point: the description must not be usable as a credential.
    expect(JSON.stringify(d)).not.toContain(FAKE);
    expect(JSON.stringify(d)).not.toContain(FAKE.slice(0, 20));
  });

  it("reports length, which is how a truncated paste is spotted", () => {
    process.env[API_KEY_ENV] = FAKE;
    expect(describeApiKey().keyLen).toBe(FAKE.length);
    process.env[API_KEY_ENV] = "sk-ant-short";
    expect(describeApiKey().keyLen).toBe(12);
  });

  it("says plainly when nothing is set", () => {
    delete process.env[API_KEY_ENV];
    expect(describeApiKey()).toMatchObject({ keyPresent: false, keyLen: 0, keyPrefix: "" });
  });

  it("distinguishes a real prefix from a placeholder someone forgot to replace", () => {
    process.env[API_KEY_ENV] = "your-key-here";
    expect(describeApiKey().keyPrefix).toBe("your-key-h");
  });
});
