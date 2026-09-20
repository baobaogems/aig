// =============================================================================
// arc-addresses-client.ts — the two contract addresses the BROWSER needs.
//
// The poster signs approve() on USDC and createBounty() on the escrow; the worker signs
// claim(). All three happen in the user's wallet, so these addresses must reach the client
// bundle — hence NEXT_PUBLIC_*, hence inlined at build time.
//
// Reading them through a function that throws (rather than exporting a possibly-empty
// string) is deliberate: an empty NEXT_PUBLIC_* silently ships "" into the bundle, and a
// contract call aimed at "" fails in a way nobody can debug from the symptom. This repo has
// already shipped exactly that bug once.
// =============================================================================

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

function required(name: string, value: string | undefined): `0x${string}` {
  if (!value || !ADDR_RE.test(value)) {
    throw new Error(`${name} thiếu hoặc sai định dạng trong bản build này`);
  }
  return value as `0x${string}`;
}

export const escrowAddressClient = () =>
  required("NEXT_PUBLIC_ARBITER_ESCROW_ADDRESS", process.env.NEXT_PUBLIC_ARBITER_ESCROW_ADDRESS);

export const usdcAddressClient = () =>
  required("NEXT_PUBLIC_USDC_ADDRESS_ARC", process.env.NEXT_PUBLIC_USDC_ADDRESS_ARC);

/** USDC has 6 decimals on Arc, same as everywhere else. */
export function usdcUnits(amountUsdc: number): bigint {
  return BigInt(Math.round(amountUsdc * 1e6));
}
