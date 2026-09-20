// =============================================================================
// require-role.ts — one gate, used by every route that writes.
//
// The rule this file exists to enforce: the caller's address comes from the signed session
// cookie and NOWHERE else. Before this file existed, `poster_id` arrived in the request body,
// which meant anyone could post as anyone — and, with DRY_RUN=false, drain the server wallet:
//
//   POST /api/bounty {worker_id: attacker}  →  approve-rubric (server locks USDC)
//     →  /api/submission (decent text)      →  /api/judge  →  auto-release
//
// Each helper returns a ready-to-return Response on failure, so routes read as:
//     const gate = await requirePoster(req, bountyId);
//     if (gate instanceof Response) return gate;
// =============================================================================

import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, openSession } from "./siwe-session";
import { getBountyDetail } from "../arbiter/store";

export type Role = "poster" | "worker";

/** The signed-in address, or a 401 Response. */
export function requireSession(req: NextRequest): string | Response {
  const address = openSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!address) {
    return Response.json({ error: "chưa đăng nhập — hãy kết nối ví" }, { status: 401 });
  }
  return address;
}

/** Case-insensitive address compare. Addresses differ only by EIP-55 casing, never meaning. */
export function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Assert the caller holds `role` on this bounty. Returns the caller's address on success.
 *
 * A 403 here is logged with the address: repeated denials are how we find out someone is
 * probing, and there is no other place that would notice.
 */
export async function requireRole(
  req: NextRequest,
  bountyId: string,
  roles: Role[],
): Promise<string | Response> {
  const address = requireSession(req);
  if (address instanceof Response) return address;

  let bounty;
  try {
    bounty = (await getBountyDetail(bountyId)).bounty;
  } catch {
    // Do not distinguish "no such bounty" from "not yours" — that difference is only useful
    // to someone enumerating ids.
    return Response.json({ error: "không tìm thấy bounty" }, { status: 404 });
  }

  const allowed = roles.some((r) =>
    r === "poster" ? sameAddress(bounty.poster_id, address) : sameAddress(bounty.worker_id, address),
  );
  if (!allowed) {
    console.warn(`[authz] 403 ${address} tried ${roles.join("|")} on bounty ${bountyId}`);
    return Response.json(
      { error: "bạn không có quyền thao tác trên bounty này" },
      { status: 403 },
    );
  }
  return address;
}

export const requirePoster = (req: NextRequest, bountyId: string) => requireRole(req, bountyId, ["poster"]);
export const requireWorker = (req: NextRequest, bountyId: string) => requireRole(req, bountyId, ["worker"]);
export const requireParty = (req: NextRequest, bountyId: string) => requireRole(req, bountyId, ["poster", "worker"]);
