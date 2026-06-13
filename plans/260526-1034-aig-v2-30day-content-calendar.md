# AIG v2 — 30-Day Content Calendar (26/05 → 24/06 2026)

> **Status:** draft (this file = source of truth; per-post drafts will land in `content/` as they're produced)
> **Owner:** @baobao_gems
> **Goal:** Visibility → Architects tier (3500 pts) → eventual Community Mod VN seat
> **Anchors:** Circle Developer Grant application (week 2-3) · Stablecoins Commerce Stack Challenge submission (week 4, final deadline 13/07)
> **Skill basis:** `ckm:content-marketing` (editorial-calendar-template, content-strategy-framework), `docs/brand-guidelines.md` §4 (pillars), `assets/writing-styles/baobao-gems-x-style.md`

---

## 1. Strategy Snapshot

### Audience
| Persona | Channel | Voice |
|---|---|---|
| Arc team (Circle / Anthropic Stablecoins judges) | X EN + Arc House guest posts | AIG brand voice: Builder / honest / technical / proof-driven |
| Arc builders (global EN) | X EN, Arc House | EN thread format, code-linked, diplomatic critique |
| VN crypto community | X VN long-form | @baobao_gems voice (VN-first), confessional + tactical |

### Pillar Mix (per `docs/brand-guidelines.md` §4)
| Pillar | Share | Calendar count (30 days) |
|---|---|---|
| Build in Public | 40% | 5 posts |
| Arc Explainer VN | 25% | 3 posts |
| Use Case Demo | 20% | 2 posts |
| VN Community | 15% | 2 posts |
| **Total X** | — | **12 posts** (≈3/week) |
| Arc House guest posts | — | **6 posts** (1.5/week) |

### Voice Discipline (locked)
- **VN-first drafting**: every post (incl. EN) drafted in `content/dayXX-draft-vn.md` (Baobao voice) → AI-translate → `content/dayXX-final.md` (per Day 6 method).
- **No em dash (—)** in body. Hyphen `-` only.
- **Hook**: ALL-CAPS reversal (1 line) → `=====` → body.
- **Bullets**: `⚡️` = analysis · `1️⃣ 2️⃣` = action-plan · never mix.
- **Proof rule**: every claim back-linked to contract / commit / tx / file path. No "trust me bro".

### Channel Math (Arc House points → Architects tier)
- 6 guest posts × 200 pts = **1,200 pts** baseline
- X engagement boosts (reposts, replies from Arc/Circle team) = variable, estimate **+800-1500 pts**
- Grant submission acknowledgment = **+500 pts** (one-time)
- Challenge submission = **+500 pts** (one-time)
- Projected total at day 30: **~3,000-3,700 pts** — Architects threshold reachable if engagement holds.

---

## 2. The 30-Day Master Table

| Day | Date | Channel | Pillar | Working title | Anchor link |
|---|---|---|---|---|---|
| 1 | Tue 26/05 | X EN | Build in Public | "v1 repo is now public — fork it before you debug CCTP for 24h" (PUBLISH `content/day6-final.md` — held since 16/05) | — |
| 2 | Thu 28/05 | X VN long | Arc Explainer VN | "MÌNH BỎ 800 DÒNG CODE TỰ VIẾT ĐỂ DÙNG SDK CIRCLE. ĐẾN PHASE 2 BỎ NỐT CẢ SDK" (Template A narrative confession + AIG technical proof — full draft in §2.1) | Grant prep mention |
| 3 | Sat 30/05 | Arc House guest | Build in Public | "Why we dropped @circle-fin/app-kit and went direct: a dual-trust-domain post-mortem" (EN technical) | Grant prep |
| 4 | Mon 01/06 | X EN | Build in Public | "v2 shipped: 173-line client hook + Circle attestation. Code walkthrough." (thread w/ file links) | — |
| 5 | Wed 03/06 | X VN long | Arc Explainer VN | "CCTP Domain 26 chứ không phải 7 — anh em VN đừng copy paste docs cũ" | Grant prep |
| 6 | Thu 04/06 | X EN + Arc House | Build in Public | **SUBMIT Circle Developer Grant** + post: "Just submitted Circle Dev Grant — here's the 3-slide deck" | **⭐ Grant submission** |
| 7 | Sat 06/06 | Arc House guest | Build in Public | "CCTPv2 in TypeScript: a reference integration for builders" (long-form, code-embedded) | Grant follow-up |
| 8 | Mon 08/06 | X EN | Use Case Demo | 30-sec video: pay $1 USDC on Sepolia → 45s later it lands on Arc (proof: tx hash) | — |
| 9 | Wed 10/06 | X VN long | VN Community | "Mình mở Q&A: AMA về Arc / CCTP / build trên testnet — drop câu hỏi" | Community building |
| 10 | Fri 12/06 | X EN | Build in Public | "Strangler-fig in production: how I swapped v1 → v2 with `BRIDGE_BACKEND=v1\|v2` flag and zero downtime" | — |
| 11 | Sat 13/06 | Arc House guest | Use Case Demo | "Live demo: cross-chain payment in 45 seconds (Sepolia → Arc CCTPv2)" (embed video) | Challenge prep |
| 12 | Mon 15/06 | X EN | Build in Public | "Things I got wrong on v1 that v2 fixed: a debrief" (honest, proof-heavy) | — |
| 13 | Wed 17/06 | X VN long | Arc Explainer VN | "Stablecoins Commerce Stack Challenge là gì — và sao anh em VN nên nộp" | **⭐ Challenge prep** |
| 14 | Thu 18/06 | X EN + Arc House | Build in Public | **SUBMIT Stablecoins Challenge entry** + post: "Submitted to the Stablecoins Commerce Stack Challenge — here's the AIG entry" | **⭐ Challenge submission** |
| 15 | Sat 20/06 | Arc House guest | Build in Public | "Lessons from shipping a payment flow twice: v1 BSC → v2 Sepolia + CCTPv2" | Challenge follow-up |
| 16 | Mon 22/06 | X EN | VN Community | "30 days of building v2 in public: numbers, mistakes, what's next" (recap thread) | — |
| 17 | Tue 23/06 | X VN long | Arc Explainer VN | "VN devs trên Arc: vì sao Architects tier đáng săn (và mình target nó như thế nào)" | Community-led visibility |
| 18 | Wed 24/06 | Arc House guest | Use Case Demo | "Open-source repo + 30-day journal: take what you need" (closing post for the cycle) | Architects qualification |

> **Why some Mon/Wed/Fri slots skip a post**: per pillar mix (40/25/20/15), 12 X posts in 30 days = ~3/week average. Heavier weeks (grant week 2, submission week 4) bunch more.

---

## 2.1 Day 2 — Full Draft (App Kit pivot story, Baobao voice)

> **Slot:** Day 2 · Thu 28/05 · X VN long-form · Arc Explainer VN pillar · Anchor: Grant prep mention
> **Template:** Template A (narrative confession) + AIG technical proof points
> **Voice:** @baobao_gems VN (per `assets/writing-styles/baobao-gems-x-style.md`)
> **Source intent:** preserve facts + events + timeline from user-supplied draft; rewrite only for voice

### Post (copy-paste ready)

```
MÌNH BỎ 800 DÒNG CODE TỰ VIẾT ĐỂ DÙNG SDK CIRCLE. ĐẾN PHASE 2 BỎ NỐT CẢ SDK
=====
Tháng 3/2026 mình ship AIG v1. Payment gateway cross-chain - khách trả $tBNB bên BSC Testnet, merchant nhận $USDC trên Arc Network. Swap tự viết, bridge tự viết, attestation tự poll. Deploy Vercel, push GitHub, chạy được.

Tháng 4/2026 @circlefin công bố App Kit. Mình mở docs ra đọc. Bridge: có. Swap: có. 10 dòng code thay được 800 dòng mình vừa viết xong.

Phản ứng đầu tiên: hoang mang. SDK chính thức ra rồi mà mình ngồi giữ code tự chế thì kỳ quá.

Nên mình quyết định rebuild v2 trên App Kit. Viết PRD mới. Lên plan 8 phases. Code Phase 0, Phase 1. Đến Phase 2 thì sập.

Lý do sập: App Kit cần 1 chìa khoá bí mật (KIT_KEY) chạy ở server. Nhưng bước bridge bắt buộc phải chạy trong trình duyệt của khách. Đưa key ra trình duyệt thì lộ. Vọc vạch tiếp thì thấy App Kit thiết kế cho ví do Circle tạo, không phải MetaMask. Mà AIG thì cần khách dùng ví riêng của họ.

Dead end.

Mình bỏ App Kit. Không quay lại v1. Chọn đường thứ 3: gọi thẳng bridge contract của Arc + Circle attestation API. Code v2 đúng 173 dòng. Kiểm soát được hết.

Trong quá trình sửa còn lòi ra 1 cái cay hơn: CCTP domain mình dùng ở v1 là sai. Domain 7 là của Polygon, không phải Arc. Arc là domain 26. Không rebuild thì không bao giờ biết mình đã sai.

v2 chưa xong. Đang loay hoay fix lỗi MetaMask trên Sepolia testnet. Mình đăng bài này lúc đang chiến với bug, không phải lúc đã thắng.

3 bài học rút ra:

1. SDK chính thức không có nghĩa fit mọi dự án. Đọc kỹ docs trước khi bốc cuốc rebuild.
2. Build từ đầu tuy tốn thời gian nhưng dạy mình đủ sâu để biết cái nào nên bỏ, cái nào nên giữ.
3. Ship messy trước, polish sau. Đợi hoàn hảo thì không bao giờ ship được.

Vibecode tới đâu, sai tới đó, sửa tới đó. Cái móng là ở chỗ dám xoá đi viết lại!

Repo: github.com/baobaogems/aig

Bạn có project nào từng xoá hết để rebuild rồi cuối cùng phải quay đầu chọn đường khác chưa? Drop câu chuyện ở dưới 👇

=====
#baobao_gems #cryptoinsight #vibecode
```

### Proof points (links → first self-reply, bare URLs)

- v1 commit history: `github.com/baobaogems/aig/commits/main` (filter T3-T4/2026 for ship timeline)
- App Kit ADR: `plans/260525-2023-aig-v2-app-kit-rebuild/../reports/adr-260525-2333-drop-app-kit-sdk-use-bridge-contract-directly.md`
- v2 hook code (173 dòng): `frontend/lib/payment-flow-v2.ts`
- CCTPv2 domain 26 evidence: `frontend/.env.local` line `NEXT_PUBLIC_ARC_CCTP_DOMAIN=26`

### Voice DNA check (per `assets/writing-styles/baobao-gems-x-style.md`)

- [x] ALL-CAPS reversal hook, 2 sentences, no final period
- [x] `=====` divider after hook
- [x] No em dash (—) anywhere, hyphen `-` only
- [x] Short declarative sentences
- [x] `mình` self-reference (drop where context clear)
- [x] `bạn` audience pronoun (personal confession per §8.2)
- [x] Concrete numbers: 800 dòng / 10 dòng / 173 dòng / 8 phases / Phase 0,1,2 / domain 7 / domain 26
- [x] Honest self-disclosure: "hoang mang", "kỳ quá", "loay hoay", "chưa thắng", "không bao giờ biết mình đã sai"
- [x] Time anchors at front: "Tháng 3/2026", "Tháng 4/2026"
- [x] EN crypto loanwords mixed: SDK, bridge, contract, attestation, repo, dead end, testnet, payment gateway, vibecode
- [x] VN slang injected: `vọc vạch`, `bốc cuốc`, `cái móng`, `loay hoay`, `chiến với bug`, `lòi ra`, `cay`
- [x] `@handle`: `@circlefin`
- [x] `$ticker`: `$tBNB`, `$USDC`
- [x] Numbered list = plain `1. 2. 3.` (philosophical/reflection per §4 — not ⚡️ analysis, not 1️⃣ action-plan)
- [x] Closing principle with `!` allowed (per §4.1 — personal/philosophical kết bằng principle, vivid verb)
- [x] Bare URL CTA, no markdown brackets
- [x] Engagement Q close + `👇`
- [x] Hashtag tail after final `=====`

### Publish notes

- **Image**: optional — terminal screenshot of `git log` showing v1 → v2 phase commits, OR side-by-side LOC count diff (800 vs 173)
- **Links → first self-reply** (bare URLs): repo + Vercel demo + the ADR
- **Reply chain idea**: T+1: drop the MM gas debug story (link to commit `6267fe5`) — proof that "đang loay hoay" is literal, real-time
- **Cross-post**: 24h later, repackage as Arc House guest post (target Day 3 / Sat 30/05 slot) — translate to EN per `content/day6-final.md` method (VN-first → AI-translate, voice DNA intact)

### Decisions (locked 26/05 22:31)

1. ✅ `@circlefin` placement: **body only**, not in hook (preserves clean ALL-CAPS visual).
2. ✅ Closing principle: keep the **vivid `!` version** — "Cái móng là ở chỗ dám xoá đi viết lại!"
3. ✅ Hashtag tail: keep the **`#vibecode` swap-in** — `#baobao_gems #cryptoinsight #vibecode` (identity-marker for this post; reverts to default combo on non-vibecode posts).

Draft is publish-ready. Schedule slot: Thu 28/05.

---

## 3. Per-Week Breakdown

### Week 1 — 26/05 → 01/06 — "The Pivot Story"
**Theme:** Honest post-mortem of App Kit drop + open-source v1 + v2 ship announcement.
**Anchor commitment:** Circle Grant prep mentioned in every post (sets up week 2 submission).
**Posts:** Days 1, 2, 3, 4 (4 posts — heavy front-load because Day 6 is overdue).
**Production prerequisite:** Day 6 final is publish-ready RIGHT NOW (`content/day6-final.md`). Just push it.

### Week 2 — 02/06 → 08/06 — "Technical Authority + Grant Submission"
**Theme:** Deep technical content showing v2 quality + the Grant ask itself.
**Anchor commitment:** Submit Circle Developer Grant on day 6 (Thu 04/06).
**Posts:** Days 5, 6, 7, 8 (4 posts — peak week, includes grant announcement).
**Production prerequisite:** Grant application deck (3 slides) draft by Sun 31/05, polish by Wed 03/06.

### Week 3 — 09/06 → 15/06 — "Demo + Challenge Prep"
**Theme:** Move from "I built it" → "watch it work" (use-case demo) + raise Challenge awareness.
**Anchor commitment:** Stablecoins Challenge prep post (VN), demo video on Arc House.
**Posts:** Days 9, 10, 11, 12 (4 posts).
**Production prerequisite:** Demo video recording — Sat 06/06 (during week 2) with funded Sepolia wallet (resolve MM gas issue first, see `plans/.../phase-04-flip-default-to-v2.md`).

### Week 4 — 16/06 → 22/06 — "Submission + Visibility Push"
**Theme:** Submit to Challenge, push for visibility, position for Architects tier review.
**Anchor commitment:** Submit Stablecoins Commerce Stack Challenge on day 14 (Thu 18/06).
**Posts:** Days 13, 14, 15, 16 (4 posts — second peak week).
**Production prerequisite:** Challenge entry written + Vercel demo URL stable + supporting screenshots by Mon 15/06.

### Week 5 — 23/06 → 24/06 — "Close + Forward Look" (partial 2 days)
**Theme:** Wrap the 30-day cycle, position Architects qualification post, signal next cycle.
**Posts:** Days 17, 18 (2 posts).
**Production prerequisite:** None — recap + reflection content only.

---

## 4. Per-Post Mini-Brief (drafting checklist)

For each entry above, the draft brief lives in `content/dayXX-draft-vn.md` and follows this structure:

```
# Day XX — DD/MM — [Pillar]
> Channel: [X EN / X VN / Arc House]
> Anchor: [none / Grant / Challenge]
> Voice: [Baobao VN / AIG EN]
> Format: [single tweet / thread N/N / VN long-form / guest post]
> Insights hit: [Pain / Behavior / Desire / Hidden / Identity / Frame / Trigger]

## Post (copy-paste ready)
[hook ALL-CAPS]
=====
[body]
[engagement Q ending in 👇]

## Proof points
- Contract: 0x...
- Commit: <hash>
- Tx: <hash>
- File: path/to/file.ts:LINE

## Publish notes
- Links → first self-reply (bare URLs)
- Image: [screenshot / video / none]
- Hashtag tail: [yes/no, where]

## Voice DNA check
- [ ] ALL-CAPS reversal hook
- [ ] ===== divider
- [ ] ⚡️ or 1️⃣ bullets if list
- [ ] No em dash
- [ ] Short sentences
- [ ] Open question close
```

---

## 5. Production Pipeline

```
Idea (this calendar)
  → VN draft (content/dayXX-draft-vn.md)
    → AI-translate to EN if needed (content/dayXX-final.md)
      → Voice DNA check (per §4 checklist)
        → Publish on X
          → 24h: track reposts + replies
            → Repackage best-performers as Arc House guest posts (200 pts each)
              → Log in this calendar's tracking table (§7)
```

**Cadence:** draft 2 days ahead, schedule 1 day ahead, publish on day.

---

## 6. Risks + Mitigations

| Risk | Mitigation |
|---|---|
| MM gas issue on Sepolia (parked) blocks demo video (week 3) | Resolve before Thu 04/06 (week 2 mid). Fallback: pre-record from a clean wallet on day issue is fixed. |
| Circle Grant rejection or delay | Calendar doesn't depend on approval — submission post lands either way. Architects points come from posts + Arc House contribs, not grant outcome. |
| Stablecoins Challenge entry not ready by Thu 18/06 | Soft-deadline only — final deadline is 13/07. Slip 18/06 → 25/06 if needed, but lose the "submitted!" momentum post. |
| Voice drift on EN translations | Day 6 method is the canon — every EN final goes through VN draft + checklist. Don't write directly in EN. |
| Posts pile up if MM debug eats more days | Cut Use Case Demo posts (days 8, 11, 18) before cutting Build in Public — BIP is the load-bearing pillar. |

---

## 7. Tracking Table (fill as posts publish)

| Day | Date | Published? | URL | Impressions | Engagement (RT/Q/L) | Notes |
|---|---|---|---|---|---|---|
| 1 | 26/05 | ☐ | | | | Day 6 final from 16/05 — held content |
| 2 | 28/05 | ☐ | | | | |
| 3 | 30/05 | ☐ | | | | Arc House guest #1 |
| 4 | 01/06 | ☐ | | | | |
| 5 | 03/06 | ☐ | | | | |
| 6 | 04/06 | ☐ | | | | ⭐ Grant submission |
| 7 | 06/06 | ☐ | | | | Arc House guest #2 |
| 8 | 08/06 | ☐ | | | | |
| 9 | 10/06 | ☐ | | | | |
| 10 | 12/06 | ☐ | | | | |
| 11 | 13/06 | ☐ | | | | Arc House guest #3 |
| 12 | 15/06 | ☐ | | | | |
| 13 | 17/06 | ☐ | | | | |
| 14 | 18/06 | ☐ | | | | ⭐ Challenge submission |
| 15 | 20/06 | ☐ | | | | Arc House guest #4 |
| 16 | 22/06 | ☐ | | | | |
| 17 | 23/06 | ☐ | | | | |
| 18 | 24/06 | ☐ | | | | Arc House guest #5 (final in cycle) |

---

## 8. Open Questions

1. **Day 6 publish timing — today (26/05) or hold for narrative beat?** Calendar assumes today. If you'd rather pair it with the App Kit ADR post (Day 2 / Thu 28/05) as a 2-post sequence, swap days 1↔2.
2. **Circle Developer Grant — application deck location?** Calendar references "3-slide deck" but no draft exists in repo yet. Likely a `plans/260604-grant-application/` directory should be spun up around Sat 31/05.
3. **Stablecoins Challenge — confirm entry requirements?** Calendar assumes solo entry with the v2 demo + GitHub repo + 2-min video. If the form needs a team or different deliverables, week 4 plan changes.
4. **Arc House submission cadence — do they cap at 1 guest post/week?** Calendar plans 6 in 30 days (1.5/week). If capped at 1/week, drop to 4 (still 800 pts baseline).
5. **VN Community Mod path — do they want activity proof beyond posts?** AMA on Day 9 is a step, but a Telegram/Discord moderation rotation may also matter. Flag if known.
