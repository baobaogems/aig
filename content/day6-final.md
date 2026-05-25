# DAY 6 FINAL — Sat 16 May 2026 — Build-in-Public (reference implementation)

> **Pillar**: Build-in-Public
> **Channel**: @baobao_gems X
> **Language**: EN
> **Voice**: @baobao_gems Baobao voice, rendered in English (VN-drafted, then AI-translated — see Method below)
> **Format**: Single X Premium Long post (~350 words)
> **Source**: `content/day6-draft-vn.md` (VN, Baobao voice) → AI-translated to EN
> **Insights hit** (per `references/7-customer-insights.md`): Pain (debug story) + Behavior (how I built) + Desire (fork CTA) + light Hidden (honest self-disclosure)

---

## Post (copy-paste ready)

I'M NOT OPEN-SOURCING AIG TO SHOW OFF. IT'S TO SAVE YOU 10 HOURS OF DEBUGGING

=====

AIG is code I built on the @arc testnet 2 months ago and just left there. Zero users so far. A bit embarrassing, but honest.

But I still decided to make the entire codebase public. The reason is purely practical.

Back in March when I started, the hardest part wasn't writing the smart contracts. The real bottleneck was CCTP Domain 7.

Circle's docs sound great in theory, telling you what CCTP can do, but when it comes to practical implementation and making it actually work, there's no guide. That part alone ate up dozens of hours of my time debugging.

So I'm opening up this repo for you devs to use, so you don't have to reinvent the wheel.

In this stack, you only need to look closely at these 3 core files:

⚡️ contracts/src/SwapRouter.sol: Exactly 198 lines long. A single flow: swap then bridge. No proxies, no convoluted inheritance. Read it once and you'll know exactly what it's signing.

⚡️ frontend/app/api/agent/execute/route.ts: Uses SSE streams, forget about webhooks. It fires realtime events (swap_executing -> bridging -> confirmed). Merchants see the bridge actually running on screen, instead of mashing F5 and praying.

⚡️ scripts/test-cctp-domain7.ts: The standard 7-step test. Approve TokenMessenger -> depositForBurn into Domain 7 -> get message hash -> poll Circle's attestation API (60s timeout) -> call receiveMessage on Arc -> check if the balance updated. I highly recommend running this file smoothly before touching the product code.

Who can fork this? Anyone.

CCTP is multi-domain by nature, it's not locked into Arc. If you want to port it to Polygon, ETH, or Arbitrum, just change the router address and domain ID in the config. Forking means changing configs, not rewriting from scratch.

I'm upfront about the repo having no users. But its true value lies here: Docs only tell you how CCTP works, while this repo is a working integration.

If your code breaks, open this and compare it line by line. When it's 2 AM and the attestation hasn't arrived, looking at this will tell you exactly where the bug is.

Have you ever integrated a cross-chain bridge? Which part ate up the most time: writing contracts, polling attestations, or setting up tests? 👇

---

## Method — how this English post was produced

**Even for English-language posts, draft in Vietnamese (Baobao voice) first, then AI-translate to English.**

Workflow:
1. Write the post in the native Baobao Vietnamese voice — `content/day6-draft-vn.md`.
2. AI-translate the finished VN draft into English.
3. The English output keeps the Vietnamese voice DNA intact: ALL-CAPS reversal hook, `=====` divider after hook, ⚡️ semantic bullets, short declarative sentences, honest self-disclosure beats, `👇` engagement close.

Why: translating *after* drafting preserves the unique Baobao style. Writing directly in English tends to drift into a generic "AIG voice" (compare `content/day6-draft.md`, the separately written EN AIG-voice draft — flatter, no emoji, no divider). VN-first locks the voice; translation only changes the language.

This is the canonical method for all EN-style posts on this content calendar going forward.

---

## Voice DNA check

- [x] ALL-CAPS reversal hook, single sentence
- [x] `=====` divider after hook
- [x] ⚡️ bullets for the 3-file list (tactical/educational)
- [x] `👇` engagement marker on closing question
- [x] No em dash (—) anywhere — VN voice constraint preserved through translation
- [x] Short sentences, no philosophizing
- [x] Honest beats kept: "2 months ago and just left there", "Zero users so far", "A bit embarrassing"
- [x] Concrete: 198 lines, 3 named file paths, 7-step test, 60s timeout
- [x] Ends on an open question (reply driver)
- [x] No links in body, no hashtag stuffing

## Publish notes

- **Links → first self-reply, not body** (bare URLs, strip markdown): `Code: github.com/baobaogems/aig` / `Demo: aig-frontend-blond.vercel.app/dashboard`.
- **Image**: terminal screenshot of `scripts/test-cctp-domain7.ts` running, STEP 1→7 with `✓` checkmarks (Option A — proof-of-work, mirrors the post's most concrete claim).
- **Contract address — resolved.** SwapRouter v2 (`0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3`) is committed (`ba827b6`) and pushed to GitHub `main`; the v2 address is propagated to the frontend config, the calendar proof-key, and `docs/system-architecture.md`. Add this line to the first reply: `Contract (BSC Testnet): testnet.bscscan.com/address/0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3`.

## Open questions

1. Hashtag tail: Baobao voice normally appends `#baobao_gems #cryptoinsight #kiemtien`. Omitted per X-algo no-stuffing. Add to first reply instead if brand discoverability is wanted — needs confirm.
2. ~~Contract v1/v2 reconciliation~~ — RESOLVED: v2 committed (`ba827b6`) + pushed; address propagated to frontend / calendar / docs.
