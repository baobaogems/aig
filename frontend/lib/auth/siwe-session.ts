// =============================================================================
// siwe-session.ts — the wallet IS the account (EIP-4361 Sign-In With Ethereum).
//
// Two jobs, kept in one file because they are two halves of one handshake:
//   1. nonce  — issue a single-use, short-lived challenge (stored in Supabase)
//   2. session — verify the signature, then seal the address into a signed cookie
//
// Design rules that must not drift:
//   - The address in the cookie is the ONLY source of truth for "who is calling".
//     No route may ever trust an address sent in a request body.
//   - A nonce verifies at most once. Replaying a signature must fail.
//   - The signed message carries domain + chainId so a signature harvested on another
//     site cannot be replayed here.
// =============================================================================

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { verifyMessage } from "viem";
import { getSupabaseClient } from "../agent";

/** How long a freshly issued nonce stays usable. */
const NONCE_TTL_MS = 5 * 60 * 1000;
/** How long a login lasts before the user signs again. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = "aig_session";

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  // `||` not `??` — an env var set to the empty string is just as broken as an unset one,
  // and this project has been bitten by exactly that before (empty NEXT_PUBLIC_* vars).
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET missing or shorter than 32 chars");
  }
  return s;
}

// ---------------------------------------------------------------- nonce

/** Mint a single-use challenge and record it so a second use can be refused. */
export async function issueNonce(): Promise<string> {
  const nonce = randomBytes(32).toString("base64url");
  const { error } = await getSupabaseClient().from("auth_nonces").insert({ nonce });
  if (error) throw new Error(`issueNonce: ${error.message}`);
  return nonce;
}

/**
 * Burn a nonce. Returns false if it is unknown, already spent, or expired.
 * The update is conditional on `used_at is null`, so two concurrent verifications of the
 * same nonce cannot both succeed — the loser gets zero rows back.
 */
async function consumeNonce(nonce: string, address: string): Promise<boolean> {
  const db = getSupabaseClient();
  const cutoff = new Date(Date.now() - NONCE_TTL_MS).toISOString();
  const { data, error } = await db
    .from("auth_nonces")
    .update({ used_at: new Date().toISOString(), address })
    .eq("nonce", nonce)
    .is("used_at", null)
    .gte("created_at", cutoff)
    .select("nonce");
  if (error) throw new Error(`consumeNonce: ${error.message}`);
  return (data?.length ?? 0) === 1;
}

// ---------------------------------------------------------------- message

export interface SiweFields {
  domain: string;
  address: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
}

/**
 * Build the exact text the wallet signs. Kept here (not in the client) so the server can
 * rebuild it byte-for-byte and never has to parse attacker-supplied text.
 */
export function buildSiweMessage(f: SiweFields): string {
  return [
    `${f.domain} muốn bạn đăng nhập bằng ví Ethereum:`,
    f.address,
    "",
    "Ký để đăng nhập Arbiter. Thao tác này miễn phí và không chuyển bất kỳ khoản tiền nào.",
    "",
    `URI: https://${f.domain}`,
    "Version: 1",
    `Chain ID: ${f.chainId}`,
    `Nonce: ${f.nonce}`,
    `Issued At: ${f.issuedAt}`,
  ].join("\n");
}

// ---------------------------------------------------------------- verify

export interface VerifyInput {
  address: string;
  nonce: string;
  issuedAt: string;
  signature: `0x${string}`;
  expectedDomain: string;
  expectedChainId: number;
}

/**
 * Verify a SIWE signature. Returns the checksummed-as-given address on success.
 * Throws with a caller-safe message on every failure path — never leaks which check failed
 * in a way that helps an attacker enumerate.
 */
export async function verifySiwe(input: VerifyInput): Promise<string> {
  if (!ADDR_RE.test(input.address)) throw new Error("địa chỉ ví không hợp lệ");

  const issued = new Date(input.issuedAt).getTime();
  if (!Number.isFinite(issued) || Math.abs(Date.now() - issued) > NONCE_TTL_MS) {
    throw new Error("thông điệp đã hết hạn, vui lòng ký lại");
  }

  const message = buildSiweMessage({
    domain: input.expectedDomain,
    address: input.address,
    chainId: input.expectedChainId,
    nonce: input.nonce,
    issuedAt: input.issuedAt,
  });

  const ok = await verifyMessage({
    address: input.address as `0x${string}`,
    message,
    signature: input.signature,
  });
  if (!ok) throw new Error("chữ ký không khớp với địa chỉ ví");

  // Burn the nonce LAST: a valid signature on an already-spent nonce must still be refused,
  // and an invalid signature must not consume a nonce the real user is about to use.
  const fresh = await consumeNonce(input.nonce, input.address);
  if (!fresh) throw new Error("phiên ký đã dùng hoặc hết hạn, vui lòng thử lại");

  return input.address;
}

// ---------------------------------------------------------------- cookie

/** `<address>.<expiry>.<hmac>` — opaque to the client, unforgeable without the secret. */
export function sealSession(address: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${address.toLowerCase()}.${expires}`;
  const mac = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

/** Returns the lowercase address, or null for anything malformed, tampered, or expired. */
export function openSession(cookie: string | undefined): string | null {
  if (!cookie) return null;
  const parts = cookie.split(".");
  if (parts.length !== 3) return null;
  const [address, expiresRaw, mac] = parts;

  const expected = createHmac("sha256", sessionSecret())
    .update(`${address}.${expiresRaw}`)
    .digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;
  if (!ADDR_RE.test(address)) return null;

  return address;
}
