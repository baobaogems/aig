// /app/api/auth/logout/route.ts — drop the session cookie.
//
// Nothing on-chain changes; this only forgets who the browser was.

import { SESSION_COOKIE } from "@/lib/auth/siwe-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}
