# Voice Routing — Operator Reference

**AIG × @baobao_gems content decision guide**
**Last updated**: 2026-05-06 | Ref: `docs/brand-guidelines.md` + `assets/writing-styles/baobao-gems-x-style.md`

---

## 1. Decision Tree

> **Single-account model**: All X posts go through @baobao_gems. Channel routing → voice routing.

```
I have a piece of content to post. Which voice + which surface?
│
├── Is this about AIG product / architecture / proof points?
│   ├── YES → Is the audience EN (Arc team / global builders)?
│   │   ├── YES → @baobao_gems X with AIG voice (EN) — or Arc Discord (W2+ only)
│   │   └── NO (VN audience) → @baobao_gems X with AIG voice (VN) — or TG @baobaogemschat
│   └── NO
│
├── Is this a personal story about MY experience building AIG?
│   ├── YES → @baobao_gems X with @baobao_gems voice (narrative confession template)
│   │          → Max 1 AIG link. No product specs inline.
│   │          → Only D1 / D12 / D20 / D28 (every 7–10 days, revised 2026-05-06).
│   └── NO
│
├── Is this market analysis / alpha / trading insight / personal framework?
│   └── YES → @baobao_gems X with @baobao_gems voice
│              NO AIG mention unless it's a scheduled narrative confession day
│
└── Is this a helpful reply in Arc Discord?
    ├── Week 1 → DO NOT POST. Observe-only per server strict rules.
    └── Week 2+ → AIG voice, EN, zero self-promo
                  → Share AIG link ONLY if it directly answers the question
                  → First DM to Arc team = Day 14 (after 2 weeks public proof)
```

**Single-account voice rule**: Same handle, different voices.
- AIG content → AIG voice (no `mình`, technical, proof-driven, brand-guidelines.md)
- Personal/alpha → @baobao_gems voice (`mình`, numbered framework, baobao-gems-x-style.md)
- Building-AIG-personal-story → @baobao_gems narrative confession (D5/12/20/28 only)

---

## 2. Side-by-Side Voice Comparison

Same idea, two voices. Example: "AIG shipped in 24 hours."

### AIG Brand Voice (Builder/technical/proof-driven)

> AIG shipped Phase 1 MVP in 24h: SwapRouter.sol on BSC Testnet, 3 API endpoints (/api/agent/quote, /api/agent/execute SSE, /api/points), Vercel production. 7 production fixes post-launch. CCTP Domain 7 live. Proof: [commit log] [Vercel URL] [contract address]

Characteristics:
- No "mình" — uses "I" or impersonal statement
- Proof first, story second
- Every claim has a link or hash
- No flourish, no ellipsis for effect
- CTAs are code links, not follow requests

---

### @baobao_gems Voice (narrative confession / personal)

> MÌNH ĐÃ BỎ DỰ ÁN NÀY 2 THÁNG. ĐÂY LÀ VÌ SAO MÌNH QUAY LẠI.
>
> Q1 2026. Mình bắt đầu AIG — một payment gateway trên Arc Network. Rồi bỏ. Lý do: "không có user nào quan tâm."
>
> Sai.
>
> Mình quay lại vì nhận ra: 0 dev VN nào đang xây trên Arc. Đó là vị thế trống — không phải thất bại.
>
> Mình ship lại trong 24h. Contract, API, UI, testnet — hết. Commit log public nếu bạn muốn verify.
>
> Cái đau nhất không phải bỏ 2 tháng. Mà là suýt bỏ cả vị thế mà mình đang đứng độc nhất.

Characteristics:
- `mình` xưng hô bắt buộc
- Hook ALL-CAPS đảo ngược kỳ vọng
- Story arc: setup → action → consequence → reflection → principle
- 1 link max, at end, no hard sell
- No product specs, no API paths, no commit hashes inline
- Closes with principle, NOT with "follow me" or "buy now"

---

## 3. Cross-Pollination Template

**When to use**: **Day 1, 12, 20, 28** (every 7–10 days). @baobao_gems X only. (Revised 2026-05-06 — D1 leads with personal story for softer feed transition into AIG content stream.)

**Template (fill-in-blank)**:

```
[HOOK — ALL-CAPS reversal of expectation about AIG]
=====
[Year/month + what happened + 1 concrete detail]

[Decision made at the time + reasoning (honest, even if dumb)]

[What it cost / what it revealed]

[The thing I almost missed: the actual insight]

[What changed: why back now + 1 proof (commit / demo / builder count)]

[Principle extracted — 1–2 sentences, secular, no mantra]
```

**3 fill-in-blank examples**:

**Example A — "Ship in 24h" story (Day 5)**:
```
MÌNH ĐÃ BỎ DỰ ÁN NÀY 2 THÁNG. ĐÂY LÀ VÌ SAO MÌNH QUAY LẠI — VÀ SHIP TRONG 24H.
=====
Q1 2026. Mình bắt đầu AIG. Rồi bỏ vì "không ai quan tâm Arc."

Mình tự thuyết phục: "Arc mainnet chưa ra, làm gì có traction."

Hậu quả: 0 proof trong 2 tháng. Trong khi đó — vẫn 0 dev VN nào xây trên Arc.

Cái mình suýt bỏ lỡ: vị thế first mover của người Việt trong một ecosystem đang build.

Mình quay lại, ship 8/8 phases trong 24h. Contract live. API live. Vercel live.
Git log public nếu bạn muốn verify: https://github.com/baobaogems/aig

Proof không đến từ chờ đợi. Proof đến từ commit.
```

**Example B — "7 production fixes" story (Day 12)**:
```
MÌNH PUSH 7 FIX SAU KHI "LAUNCH". ĐÂY LÀ NHỮNG GÌ THẬT SỰ XẢY RA KHI SHIP SỚM.
=====
Tháng 3/2026. AIG ra mắt. Mình tưởng xong.

Ngày hôm sau: API 500 không có error boundary. Ngày 3: UX break trên mobile. Ngày 5: security gap.

Mình fix 7 lần trong 1 tuần. Mỗi commit là 1 bằng chứng mình không bỏ.

Cái đau nhất không phải bug. Mà là nhận ra: "launch" không phải finish line — đó là starting line của maintain.

Commits public: e7b0cde, 6146088, 46af981. Bạn có thể trace từng fix.

Ship sớm — fix thật — đó là cách mình biết mình đang build, không phải đang hứa.
```

**Example C — "Building for VN" story (Day 20)**:
```
MÌNH XÂY AIG KHÔNG PHẢI VÌ "BLOCKCHAIN REVOLUTION". MÌNH XÂY VÌ KHÔNG AI LÀM.
=====
Tháng 5/2026. Mình search: Arc Network tiếng Việt. 0 kết quả.

100 triệu người Việt. 0 dev VN nào giải thích Arc bằng tiếng Việt.

Mình không build AIG vì muốn nổi tiếng. Mình build vì nhìn thấy lỗ hổng và không chịu được việc để trống.

Giờ có [N] dev VN đang học Arc qua AIG. Một số đã fork. Một số đã test.

Đó là community đầu tiên — trước cả merchant, trước cả mainnet.

Vị thế không đến từ "tôi tốt nhất." Đến từ "tôi ở đây — trước khi ai khác đến."
Group: @baobaogemschat
```

---

## 4. Prohibited Terms — Unified List

### AIG brand prohibitions (từ brand-guidelines.md)
| Term | Reason |
|------|--------|
| Revolutionary, game-changing, disruptive | Dreamer language — AIG is a shipper |
| Seamless | Vague — say "30 seconds" or "1 QR code" |
| Best-in-class, leading, #1 | No users yet — can't claim |
| To the moon, WAGMI | Crypto cliché, kills technical credibility |
| "Đang phát triển", "sắp ra mắt" | Say "Phase 2 planned Q2" — specific |
| "Hundreds of users", "rapidly growing" | Fabricated traction — AIG has 0 users |

### @baobao_gems prohibitions (từ writing-styles/baobao-gems-x-style.md)
| Term | Reason |
|------|--------|
| Emojis of any kind | Not in any of 5 sample posts — breaks credibility |
| WAGMI, to the moon, ape in, GM, gem 100x | Degen culture — breaks OG mature tone |
| Twitter thread numbering `1/ 2/ 3/` | Use paragraph + `1.` style |
| "Like + RT để biết thêm" | Spam CTA — not in sample |
| Self-aggrandizement | "Tôi giỏi" style — forbidden |
| Over-polish (zero typo) | Sample has rare typos — keep real-time feel |

### NEW — Buddhist/spiritual ban (effective 2026-05-06, both brands)
| Term | Reason |
|------|--------|
| Chánh niệm | Buddhist concept — DROPPED |
| Vô thường (as Buddhist concept) | DROPPED |
| Bát Nhã, mantra of any kind | DROPPED |
| Phật, giáo lý Phật | DROPPED |
| Any Eastern wisdom / spiritual framework | DROPPED across ALL channels |

Use instead: secular daily-life analogies (`nấu ăn`, `poker`, `tạo mây từ hạt bụi`), numbered frameworks, concrete numbers.

---

## 5. Pre-Publish Quality Checklist

Before posting any content on any channel:

- [ ] 1. **Voice match**: Does this post use the right voice for this channel? (AIG tech voice ≠ @baobao_gems narrative voice)
- [ ] 2. **Proof backing**: Every claim has a link, hash, or path behind it (or is explicitly labeled as "planned")
- [ ] 3. **No prohibited terms**: Scanned list above — no revolutionary / seamless / WAGMI / spiritual refs
- [ ] 4. **No fabricated metrics**: No invented user counts, growth rates, or follower numbers
- [ ] 5. **Pillar check**: Which pillar does this serve? Is the pillar count still balanced across the week?
- [ ] 6. **Cross-pollination guard**: If posting on @baobao_gems about AIG — is it a narrative confession day (D1/12/20/28, revised 2026-05-06)? Is there only 1 AIG link?
- [ ] 7. **Arc Discord check**: If posting in Discord — does the post have zero self-promo? Is AIG only mentioned if it directly answers the question?
- [ ] 8. **CTA correct**: AIG X → code link or demo URL. @baobao_gems → no CTA (personal) or TG link (tactical). Discord → no CTA.
- [ ] 9. **Vietnamese accuracy**: VN posts use `mình` (TG/@baobao_gems) or `tôi` (AIG X VN formal). No mixing pronouns.
- [ ] 10. **Brand separation**: AIG product specs NEVER appear on @baobao_gems. @baobao_gems personal story NEVER appears on AIG channel.
