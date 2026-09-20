// /app/api/auth/siwe/route.ts — verify the signature, seal the session cookie.
//
// POST { address, nonce, issuedAt, signature } → { address } + Set-Cookie
// A failure here is always 401 with a human-readable Vietnamese reason; the reason says what
// the user should do next, never which internal check tripped.

import { NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_TTL_MS, sealSession, verifySiwe } from "@/lib/auth/siwe-session";
import { expectedChainId, expectedDomain } from "@/lib/auth/siwe-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { address, nonce, issuedAt, signature } = await req.json();

    if (typeof address !== "string" || typeof nonce !== "string" || typeof issuedAt !== "string")
      return Response.json({ error: "thiếu thông tin đăng nhập" }, { status: 400 });
    if (typeof signature !== "string" || !signature.startsWith("0x"))
      return Response.json({ error: "thiếu chữ ký" }, { status: 400 });

    const verified = await verifySiwe({
      address,
      nonce,
      issuedAt,
      signature: signature as `0x${string}`,
      expectedDomain: expectedDomain(req),
      expectedChainId: expectedChainId(),
    });

    const res = Response.json({ address: verified.toLowerCase() });
    res.headers.append(
      "Set-Cookie",
      [
        `${SESSION_COOKIE}=${sealSession(verified)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
        // Secure would break plain-http local dev; on Vercel every request is https anyway.
        process.env.NODE_ENV === "production" ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; "),
    );
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "đăng nhập thất bại";
    console.warn("[API /auth/siwe] rejected:", msg);
    return Response.json({ error: msg }, { status: 401 });
  }
}
