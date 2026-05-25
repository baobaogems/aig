# Day 6 — Sat May 16 — Build-in-Public (reference implementation)

**Channel**: @baobao_gems X · **Language**: EN · **Voice**: AIG voice (Builder / honest / technical / proof-driven)
**Pillar**: Build-in-Public · **Format**: Single post (X Premium Long — ~1,800 chars) · **Activation Play 3**

---

## POST (copy-paste ready)

I DIDN'T OPEN-SOURCE AIG FOR STARS. I DID IT TO DELETE YOUR FIRST 10 HOURS.

When I built AIG on Arc back in March (I went dark for two months after shipping. Coming back to document what I learned.), CCTP Domain 7 wasn't the hard part on paper. The hard part was everything the quickstart skips: attestation timing, domain routing, pulling the message hash out of a transaction receipt. That's where the hours went.

So the repo isn't a product pitch. It's three files doing one honest job:

1. contracts/src/SwapRouter.sol — 198 lines. One swap-and-bridge path, no proxy, no inheritance tower. You can read the whole contract in a single sitting and know exactly what it signs.

2. frontend/app/api/agent/execute/route.ts — an SSE stream, not a webhook callback. It emits swap_executing → bridging → confirmed, so the merchant watches the bridge happen instead of refreshing a page and hoping.

3. scripts/test-cctp-domain7.ts — a 7-step smoke test: approve the TokenMessenger, depositForBurn into Domain 7, extract the message hash, poll Circle's attestation API on a 60s timeout, call receiveMessage on Arc, confirm the balance actually moved. Run it before you write a single line of product code.

None of this is Arc-specific by accident. CCTP is multi-domain. Change the router address and the domain ID in SwapRouter.sol and the same flow runs on Polygon, Ethereum, or Arbitrum. Forking it for your chain — or your region — is a config change, not a rewrite.

Honest part: the repo has no users yet. What it has is the one thing docs can't hand you on day one — a working integration you can diff your broken one against at 2am.

Because docs tell you what CCTP does. A reference implementation tells you what it does when the attestation hasn't landed and you have no idea why.

If you've shipped a cross-chain integration: which part ate the most hours — the contract, the attestation polling, or the test harness?

---

## Insight applied (per references/7-customer-insights.md)

Pillar map says Build-in-Public = **Pain (debug story) + Behavior (how I built)**. Day 6 keeps both and swaps Day 5's Belief for **Desire** — the right driver for a "fork this" post.

| Insight | Where it lands | Why |
|---|---|---|
| **Pain** (kéo view — PRIMARY) | "everything the quickstart skips: attestation timing, domain routing, pulling the message hash…" + closing "what it does when the attestation hasn't landed and you have no idea why" | Names the concrete from-scratch CCTP integration pain. Opens and closes the post — the frame the reader recognizes. |
| **Behavior** (giáo dục) | the 3 numbered files — exact paths, what each does, the 7-step test sequence, "fork = config change" | How-to substance: real files + real mechanism + real fork step. Not a vague claim — this is the proof layer. |
| **Desire** (đẩy hành động — drives CTA) | "delete your first 10 hours", "config change, not a rewrite", multi-domain fork to Polygon / Ethereum / Arbitrum | The want = ship on a chain fast, be early. The fork is the shortcut to that want → drives the action (clone the repo). |

**Combo**: Pain + Desire → *"Kéo → đẩy hành động"* (per insight combo table). Behavior carries the proof so the saved-10-hours Desire reads as evidence, not a promise.

## X algorithm compliance

- **Ends on an open question** → engineered for replies (highest-weight engagement signal). Question is answerable from personal experience and reinforces the Pain insight — builders like naming what hurt. Low-friction reply.
- **Zero links in body** → no out-of-platform link penalty on the primary post. All links go in the first self-reply (below).
- **No hashtag stuffing** → none used; reads as native builder talk, not SEO bait.
- **Natural voice** → no emoji, no VN slang (AIG EN voice constraints, style §12.8), every claim is file + mechanism + success condition (style §12.4). ALL-CAPS reversal hook, 75 chars (≤80).

> **Skeleton deviation**: calendar Day 6 skeleton ends with "RT if this helps your Arc build". Dropped — it violates style §4.1 ("KHÔNG bao giờ: Like + RT") and the X-algorithm open-question rule. Replaced with an open question. The fork/share intent survives via the question + first-reply link.

---

## End notes

### Suggested image
- **Option A (recommended)**: terminal screenshot of `scripts/test-cctp-domain7.ts` running — the log output showing `STEP 1 → STEP 7` with the `✓` checkmarks ("Attestation received ✓", "receiveMessage tx confirmed ✓", "Arc USDC after: … ✓"). Strongest: it is literal proof-of-work, visually mirrors the post's most concrete claim (the 7-step test), needs zero design effort — just run the script and screenshot.
- **Option B**: architecture diagram — `SwapRouter.sol` (BSC) → CCTP TokenMessenger → Circle attestation API → Arc `MessageTransmitter.receiveMessage` → USDC mint. Cleaner for a non-dev reader but more design work and less "raw build" texture.
- Use **A** as the post image.

### Link → first reply (NOT in body)
Post the body first, then immediately self-reply with bare URLs (X auto-linkifies; strip any markdown brackets). One link per line, blank line between (style §12.5):

```
Code: github.com/baobaogems/aig

Demo: aig-frontend-blond.vercel.app/dashboard
```

- **Contract address — RESOLVE BEFORE PUBLISH (see Unresolved #6).** `status_AIG.json` (2026-05-17) records that SwapRouter was redeployed as **v2** at `0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3`, superseding the v1 address `0xa8cea8fa…583a7` still listed in the calendar proof-key. The 198-line file this post describes IS the v2 working tree — but v2 is **not yet git-committed and not pushed to GitHub**. Until the repo reflects v2, do **not** add a contract line to the reply: it would point readers at a contract that disagrees with the code they'd fork. Once v2 is committed + pushed, add this line: `Contract (BSC Testnet): testnet.bscscan.com/address/0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3`
- Peer-builder tag (skeleton suggested UnitFlow / Lynn TheLight): if either account is confirmed active, add **one** tag to the first reply only — not the body (avoids @mention-spam open). Skip if handles can't be verified.

### Pre-publish checklist
- [ ] Hook line is ALL-CAPS, single sentence, reversal framing, ≤80 chars (current: 75)
- [ ] No emoji anywhere (AIG EN voice — even semantic `🫡 ⚡️` is VN-side only)
- [ ] No VN slang (`kèo`, `alpha`, `anh em`) — EN, no pronoun translation
- [ ] No links in the body post
- [ ] No hashtags
- [ ] Ends with an open question (reply driver)
- [ ] File paths match repo: `contracts/src/SwapRouter.sol` (198 lines, verified), `frontend/app/api/agent/execute/route.ts` (SSE — `swap_executing → bridging → confirmed`, verified), `scripts/test-cctp-domain7.ts` (7-step STEP 1→7, verified)
- [ ] SSE event names match `route.ts` header comment; 7-step sequence matches the script's STEP logs
- [ ] Closing claim is relative-safe (no "first/only" absolute) — uses Pain framing, not self-positioning
- [ ] First-reply links queued, markdown stripped to bare URLs, `\n\n` between
- [ ] Test-run terminal screenshot attached (Option A)
- [ ] **Cadence**: last ARC post went out 18/05 — 3-day gap. Publish **today (21/05)** to resume rhythm; content is evergreen so the gap does no damage. Lock a fixed cadence after this.

---

## Unresolved

1. `references/x-algorithm-policy.md` (named in the task) still does not exist — only `references/7-customer-insights.md` is present. Applied the X-algorithm rules from the task prompt directly (open-question close, no body links, no hashtag stuffing, natural voice), same as Day 5. Confirm whether a canonical policy file should be created.
2. **Format conflict**: calendar skeleton line says "Format: Single tweet EN" but the description calls it a "Reference implementation thread". Produced a **single X Premium Long post** — consistent with Day 5 and with the task's single-hook + single-open-question instruction. Confirm if a 5-tweet thread was wanted instead.
3. Skeleton's "RT if this helps" invite dropped (see X-algorithm note above) — confirm OK.
4. "~10 hrs saved" (skeleton) vs Day 3's "24h debugging": kept both, distinct — 24h = full build; ~10h = the CCTP-integration slice a fork removes. Confirm the 10h figure is acceptable as a rough estimate.
5. Peer-builder handles (UnitFlow, Lynn TheLight) not verified — left out of body, optional in first reply only.
6. **Contract address v1 vs v2 — publish blocker.** `status_AIG.json` (2026-05-17T22:40) records a SwapRouter **v2** redeploy → new address `0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3` (deploy tx `0x7d263b1b…9290f9`), superseding v1 `0xa8cea8fa…583a7`. v2 is the current working-tree code (the 198-line file this post describes) but is **not committed to git, not pushed to GitHub, not propagated to frontend / docs / content calendar**. The post body carries no address (safe). Recommend: commit + push v2, update the calendar proof-key + docs, then add the v2 address to the first reply. Until then, publish with GitHub + Demo links only.
