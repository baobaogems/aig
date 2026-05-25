# Day 3 Thread Draft — Wed May 13, 2026

> **Channel**: @baobao_gems X (EN, AIG voice)
> **Format**: Thread, 5 tweets
> **Schedule**: 9:00am Vietnam time (UTC+7) — Arc team Bay Area (UTC-7) wakes ~7-9am their time
> **Pillar**: Build-in-Public · **Activation Play 2**
> **Voice**: AIG (Builder/honest/technical/proof-driven). "I" not "we". No emojis. No "revolutionary/seamless/WAGMI".
> **Tag**: @circlefin in T1
> **Status**: DRAFT — pending user review before publishing

---

## T1 — Hook (~150 chars)

```
I built a payment gateway on CCTP Domain 7 (Arc Network).

The docs gave me the what.
The how took 24 hours of debugging.

Thread.

@circlefin
```

---

## T2 — The pain (~275 chars)

```
Three things broke me in those 24h:

CCTP attestation latency — submit on BSC, then poll Circle's API blind for 60-180s. No webhook.

PancakeSwap V3 slippage guard tripping on small swaps.

Vercel cold starts killing the SSE stream mid-payment.
```

---

## T3 — The fix (~270 chars)

```
Fixes:

Exponential backoff polling for the attestation in scripts/test-cctp-domain7.ts.

SwapRouter.sol uses exactOutputSingle — merchant always gets the exact USDC target. Slippage absorbed by amountInMax.

Pre-warm the Vercel route before SSE handshake.
```

---

## T4 — Architecture survived (~272 chars)

```
What survived: the architecture.

BSC SwapRouter → CCTP TokenMessenger → Arc MessageTransmitter.receiveMessage → USDC minted on Arc Domain 7.

Contract: 0xa8cea8fa47874c688511cb1d72aa86a4b3c583a7
Deploy tx: 0xac33606531c478760b8776ee8b862476df548fe423e3cb1c7765b163700dfeab
```

---

## T5 — Timeline + CTA (~250 chars)

```
Timeline: 2h contract, 4h API, 6h UI, 12h debugging Arc + CCTP. 7 production fixes since (e7b0cde, 6146088, 46af981).

Live now. Fork it.

Code: github.com/baobaogems/aig
Demo: aig-frontend-blond.vercel.app/dashboard
VN Arc community: @baobaogemschat
```

---

## Quality checklist

- [x] Voice: AIG (Builder, no "mình", no narrative confession)
- [x] Pronoun: "I" throughout (T1: "I built", T2: "broke me", T3 imperative, T4 declarative, T5 imperative)
- [x] Proof backing: contract address + deploy tx + 3 commit hashes + GitHub + Vercel
- [x] No prohibited terms: no revolutionary / seamless / WAGMI / spiritual refs
- [x] No fabricated metrics: no user counts claimed
- [x] No emojis
- [x] Tag @circlefin in T1 (not T5 — opens with mention so feed shows in their notifications, doesn't bury)
- [x] CTA: code link + demo + community (Arc team verifies via code, VN devs go to TG)
- [x] Honest about pain — story arc respects "show the bruises" principle
- [x] Char count per tweet under 280 (free X limit)

## Pre-publish checks (run morning of May 13)

- [ ] Re-verify contract still deployed at `0xa8cea8fa47874c688511cb1d72aa86a4b3c583a7` on BSCscan testnet
- [ ] Verify Vercel demo `https://aig-frontend-blond.vercel.app/dashboard` returns 200
- [ ] Confirm @circlefin handle still active on X
- [ ] Confirm GitHub repo public + readable
- [ ] Optional: run `scripts/test-cctp-domain7.ts` once and capture exit-0 screenshot for reply-to-self if Arc team RTs
- [ ] Optional: pin the thread to @baobao_gems profile for 48h to catch Arc team eyes

## Post-publish actions (within 4 hours)

- Monitor mentions/RT/QT every ~2h
- If @circlefin / Arc team engages → draft polite, technical reply (not gushing)
- Cross-post link to TG @baobaogemschat with VN context line: "Bài EN bên trên là proof-of-work thread cho Arc team. Code đã link sẵn — VN dev fork được luôn."
- Update `status_AIG.json` with publish timestamp + initial response signal at +24h

## Open questions before publish

1. Should T1 include `@arc` handle alongside `@circlefin`? Need verified Arc team handle — skeleton notes "Arc team handles unverified" as Open Question. **Default**: tag `@circlefin` only (verified, official Circle account).
2. E2E swap+bridge tx hash beyond deploy tx — running `scripts/test-cctp-domain7.ts` would generate a real BSC→Arc USDC mint tx. If captured before publish, T4 could swap deploy tx for a full-flow tx (stronger proof). User flagged this as "should run before D3 publishes" in 2026-05-06 status entry.
3. T5 mentions 7 production fixes — actual count from `git log` might differ. Verify `git log --oneline | wc -l` close to 29 commits, of which ~7 are post-launch fixes. Adjust number if off.
