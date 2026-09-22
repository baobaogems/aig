// /app/api/auth/me/route.ts — who am I?
//
// GET → { address } when the cookie is valid, 401 otherwise.
// The UI polls this to decide what to render; every write route does its own check rather
// than trusting whatever the UI concluded.

import { NextRequest } from "next/server";
import { SESSION_COOKIE, openSession } from "@/lib/auth/siwe-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = openSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!address) return Response.json({ error: "not signed in" }, { status: 401 });
  return Response.json({ address });
}
