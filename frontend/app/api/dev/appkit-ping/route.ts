// =============================================================================
// /api/dev/appkit-ping — Phase 01 smoke gate.
//
// Proves the App Kit wrapper resolves AND can call a no-credential SDK method
// (`getSupportedChains()` requires no KIT_KEY, no wallet). If this returns
// 200 with a non-empty chain list, Phase 01 client is wired correctly.
//
// Gated to non-production. Safe to keep in main; the dev path is hidden but
// returns 404 in prod so an accidental probe can't enumerate App Kit state.
// =============================================================================
import { NextResponse } from "next/server";
import { getKit } from "@/lib/appkit.server";

export const dynamic = "force-dynamic"; // no cache — always fresh

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const kit = getKit();
    const chains = kit.getSupportedChains();
    return NextResponse.json({
      ok: true,
      package: "@circle-fin/app-kit",
      chainCount: chains.length,
      sample: chains.slice(0, 5).map((c) => ({
        name: c.name,
        chainId: "chainId" in c ? c.chainId : undefined, // EVM only
        isTestnet: c.isTestnet,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
