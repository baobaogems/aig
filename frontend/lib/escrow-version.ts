// =============================================================================
// escrow-version.ts — which contract holds this bounty's money.
//
// v3 shipped while v2 still held real escrow for open bounties. They finish where they
// started: a bounty opened on v2 is read, released and refunded on v2, and NO MONEY MOVES
// BETWEEN THE TWO CONTRACTS. There is no migration of funds, and there must never be a
// script that tries — the only safe way to touch someone else's locked escrow is not to.
//
// FAIL CLOSED on anything unrecognised. A bounty whose version we cannot place is one whose
// money we must not guess about: calling the wrong contract would either revert (good) or
// touch a different escrow with the same id (very bad). Refusing is the only honest answer.
// =============================================================================

import "server-only";
import { arbiterEscrowAbi } from "./escrow-abi";
import { arbiterEscrowV2Abi } from "./escrow-abi-v2";

export const CURRENT_ESCROW_VERSION = 3;

export function isCurrentVersion(version: number | null | undefined): boolean {
  return version === CURRENT_ESCROW_VERSION;
}

/** Address of the contract a given bounty version lives in. Throws rather than guessing. */
export function escrowAddressFor(version: number | null | undefined): `0x${string}` {
  const key = version === 2 ? "ARBITER_ESCROW_ADDRESS_V2" : "ARBITER_ESCROW_ADDRESS";
  if (version !== 2 && version !== 3) {
    throw new Error(`escrow_version ${version} không nhận diện được — từ chối gọi hợp đồng`);
  }
  const addr = process.env[key];
  if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
    throw new Error(`${key} missing or malformed (escrow_version ${version})`);
  }
  return addr as `0x${string}`;
}

/** The ABI matching that version. v2's is frozen; see escrow-abi-v2.ts. */
export function escrowAbiFor(version: number | null | undefined) {
  if (version === 2) return arbiterEscrowV2Abi;
  if (version === 3) return arbiterEscrowAbi;
  throw new Error(`escrow_version ${version} không nhận diện được — từ chối gọi hợp đồng`);
}

/**
 * Guard for anything that only v3 can do (settle with a split, markSubmitted, the windows).
 * A v2 bounty reaching one of those paths is a bug upstream, and a clear refusal beats a
 * revert whose message nobody can read.
 */
export function assertCurrentVersion(version: number | null | undefined, what: string): void {
  if (!isCurrentVersion(version)) {
    throw new Error(
      `${what} chỉ có trên escrow v3; bounty này ở v${version ?? "?"} — nó kết thúc theo luật cũ`,
    );
  }
}
