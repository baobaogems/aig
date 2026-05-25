# Phase 00 — Foundation & Deps

**Status:** ✅ DONE (25/05/2026, this session) · **Priority:** P0

## What landed

- Verified `v1.0` tag on origin: `c435a15d04a79bd70148ef36b0d51ef5f29f3de6` — rollback path real
- Verified PRD package name `@arc-network/app-kit` is **404 on npm**; real package is `@circle-fin/app-kit`
- Ran `npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2` in `frontend/` — 181 packages added, no install errors
- 22 pre-existing audit warnings (19 moderate + 3 high) — unrelated to App Kit, Next.js project noise

## Files

- `frontend/package.json` + `frontend/package-lock.json` — modified (not yet committed; will commit at end of Phase 1)
- `frontend/node_modules/@circle-fin/*` — added

## Outcomes

- App Kit core + viem adapter ready to import
- v1 code path 100% intact — no demolition yet
- `main` still green; Vercel demo unaffected

## Next

→ Phase 1: `frontend/lib/appkit.server.ts` + SSE spike. Phase 0 deps commit folds into Phase 1's commit to keep history tight.
