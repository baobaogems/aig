// route-request.ts — build the NextRequest a route handler actually receives.
//
// The session cookie is sealed with the REAL sealSession, so a test that forgets to sign in
// gets the same 401 a stranger gets, and a test that signs in as the wrong wallet gets the
// same 403. Faking the cookie would have made the authz tests decorative.

import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/siwe-session";
import { TEST_SESSION_SECRET } from "./route-doubles";

/** Must run before any module that reads SESSION_SECRET at call time. */
export function setTestSessionSecret(): void {
  process.env.SESSION_SECRET = TEST_SESSION_SECRET;
}

export async function cookieFor(address: string): Promise<string> {
  setTestSessionSecret();
  const { sealSession } = await import("@/lib/auth/siwe-session");
  return sealSession(address);
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Signed-in wallet. Omit for an anonymous caller. */
  as?: string | null;
  /** Raw cookie value — for tampering tests. */
  rawCookie?: string;
}

export async function apiRequest(url: string, opts: RequestOptions = {}): Promise<NextRequest> {
  const headers = new Headers({ "content-type": "application/json" });
  const cookie = opts.rawCookie ?? (opts.as ? await cookieFor(opts.as) : null);
  if (cookie) headers.set("cookie", `${SESSION_COOKIE}=${cookie}`);

  return new NextRequest(new Request(url, {
    method: opts.method ?? "POST",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  }));
}

/** A future deadline, far enough out that a slow test never trips the past-deadline branch. */
export const futureDeadline = (): string => new Date(Date.now() + 7 * 86_400_000).toISOString();
