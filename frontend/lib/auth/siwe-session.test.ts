// siwe-session.test.ts — the session cookie is the security boundary of the whole app:
// every write route will trust the address it carries. So these tests attack it.
//
// No mocks. Real HMAC, real secp256k1 signatures from viem. The nonce store is the one part
// that needs Supabase, so its replay behaviour is covered by the Phase 07 integration script
// rather than faked here.

import { beforeAll, describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { verifyMessage } from "viem";

const SECRET = "test-secret-at-least-32-characters-long-xxxx";

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

async function mod() {
  return await import("./siwe-session");
}

const ADDR = "0x0809a724862D6636874809775Ba3623080c5ceF8";

describe("sealSession / openSession", () => {
  it("round-trips the address, lowercased", async () => {
    const { sealSession, openSession } = await mod();
    expect(openSession(sealSession(ADDR))).toBe(ADDR.toLowerCase());
  });

  it("returns null for undefined, empty and garbage", async () => {
    const { openSession } = await mod();
    expect(openSession(undefined)).toBeNull();
    expect(openSession("")).toBeNull();
    expect(openSession("not-a-cookie")).toBeNull();
    expect(openSession("a.b")).toBeNull();
    expect(openSession("a.b.c.d")).toBeNull();
  });

  it("rejects a swapped address — the MAC no longer covers it", async () => {
    const { sealSession, openSession } = await mod();
    const [, expires, mac] = sealSession(ADDR).split(".");
    const forged = `0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef.${expires}.${mac}`;
    expect(openSession(forged)).toBeNull();
  });

  it("rejects an extended expiry", async () => {
    const { sealSession, openSession } = await mod();
    const [address, expires, mac] = sealSession(ADDR).split(".");
    const later = String(Number(expires) + 365 * 24 * 3600 * 1000);
    expect(openSession(`${address}.${later}.${mac}`)).toBeNull();
    // sanity: the untouched cookie still opens
    expect(openSession(`${address}.${expires}.${mac}`)).toBe(ADDR.toLowerCase());
  });

  it("rejects a cookie that has expired", async () => {
    const { openSession } = await mod();
    const { createHmac } = await import("node:crypto");
    const past = Date.now() - 1000;
    const payload = `${ADDR.toLowerCase()}.${past}`;
    const mac = createHmac("sha256", SECRET).update(payload).digest("base64url");
    expect(openSession(`${payload}.${mac}`)).toBeNull();
  });

  it("rejects a cookie sealed with a different secret", async () => {
    const { openSession } = await mod();
    const { createHmac } = await import("node:crypto");
    const payload = `${ADDR.toLowerCase()}.${Date.now() + 60_000}`;
    const mac = createHmac("sha256", "some-other-secret-also-32-chars-long!!").update(payload).digest("base64url");
    expect(openSession(`${payload}.${mac}`)).toBeNull();
  });

  it("refuses to seal when SESSION_SECRET is too short", async () => {
    const { sealSession } = await mod();
    const saved = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "short";
    expect(() => sealSession(ADDR)).toThrow(/SESSION_SECRET/);
    process.env.SESSION_SECRET = saved;
  });
});

describe("buildSiweMessage", () => {
  it("is byte-stable for the same fields", async () => {
    const { buildSiweMessage } = await mod();
    const f = { domain: "myarbiter.xyz", address: ADDR, chainId: 5042002, nonce: "abc", issuedAt: "2026-09-20T00:00:00.000Z" };
    expect(buildSiweMessage(f)).toBe(buildSiweMessage({ ...f }));
  });

  it("changes when the domain changes — a signature for another site cannot be replayed", async () => {
    const { buildSiweMessage } = await mod();
    const base = { address: ADDR, chainId: 5042002, nonce: "abc", issuedAt: "2026-09-20T00:00:00.000Z" };
    expect(buildSiweMessage({ ...base, domain: "myarbiter.xyz" }))
      .not.toBe(buildSiweMessage({ ...base, domain: "evil.example" }));
  });

  it("carries the chain id, so a signature for another chain differs", async () => {
    const { buildSiweMessage } = await mod();
    const base = { domain: "myarbiter.xyz", address: ADDR, nonce: "abc", issuedAt: "2026-09-20T00:00:00.000Z" };
    expect(buildSiweMessage({ ...base, chainId: 5042002 }))
      .not.toBe(buildSiweMessage({ ...base, chainId: 1 }));
  });
});

describe("signature verification (real secp256k1, no mock)", () => {
  const pk = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as const;

  it("accepts a signature the wallet really made over the built message", async () => {
    const { buildSiweMessage } = await mod();
    const account = privateKeyToAccount(pk);
    const message = buildSiweMessage({
      domain: "myarbiter.xyz", address: account.address, chainId: 5042002,
      nonce: "nonce-1", issuedAt: new Date().toISOString(),
    });
    const signature = await account.signMessage({ message });
    expect(await verifyMessage({ address: account.address, message, signature })).toBe(true);
  });

  it("rejects that same signature against a message built for another domain", async () => {
    const { buildSiweMessage } = await mod();
    const account = privateKeyToAccount(pk);
    const fields = {
      address: account.address, chainId: 5042002,
      nonce: "nonce-2", issuedAt: new Date().toISOString(),
    };
    const signature = await account.signMessage({ message: buildSiweMessage({ ...fields, domain: "myarbiter.xyz" }) });
    const elsewhere = buildSiweMessage({ ...fields, domain: "evil.example" });
    expect(await verifyMessage({ address: account.address, message: elsewhere, signature })).toBe(false);
  });

  it("rejects a signature made by a different wallet", async () => {
    const { buildSiweMessage } = await mod();
    const signer = privateKeyToAccount(pk);
    const other = privateKeyToAccount("0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba");
    const message = buildSiweMessage({
      domain: "myarbiter.xyz", address: signer.address, chainId: 5042002,
      nonce: "nonce-3", issuedAt: new Date().toISOString(),
    });
    const signature = await signer.signMessage({ message });
    expect(await verifyMessage({ address: other.address, message, signature })).toBe(false);
  });
});
