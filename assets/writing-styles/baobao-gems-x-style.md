# @baobao_gems — X Writing Style Guide

> **Brand owner:** Baobao Gems (personal/crypto brand) — **DIFFERENT** from AIG brand voice.
> **Source:** 5 sample posts (regret confession, TEMPO airdrop guide, AI capabilities framework, fear listicle, alpha 4-levels analysis).
> **Use case:** Personal posts, market analysis, alpha calls, lifestyle/philosophy content. NOT for AIG product posts (AIG uses Builder/honest/technical/proof-driven brand voice — see `docs/brand-guidelines.md`).
> **Last updated:** 2026-05-05

---

## TL;DR — The voice in 1 line

**Crypto OG đã thắng-thua thật, kể chuyện sai lầm để rút nguyên tắc, ngôn ngữ trade tự nhiên, đóng bằng 1 framework đánh số.**

> **Voice update 2026-05-06**: Drop layer "triết Đông / Phật / Bát Nhã / chánh niệm / vô thường" — dù xuất hiện trong sample post 3-4, user đã quyết định bỏ pattern này khỏi voice tương lai. Style mới sẽ thuần secular, không reference Phật/mantra/cultural-spiritual.

> **Voice update 2026-05-13 rev 2** (corrections từ bonus news-jacking post published edit — VN long-form, contributor positioning):
> 1. **VN news-jacking format** gets dedicated section — xem **§12**. Khác hẳn personal confession (Template A) và tactical guide (Template B): hook title-style + `=====` after hook + VN finance dramatization + vibecode signature + market-gap reframe (NOT self-positioning).
> 2. **Self-positioning REMOVED entirely** trong news-jacking — không chỉ humility hedge (§11.5) mà drop hẳn "Mình là 1 trong số ít". Reframe: "I am positioned" → "market has gap, opportunity for YOU".
> 3. **Vibecode + zero-code = signature identity marker** (không phải optional vocab nữa). Self-disclosure paragraph cần có: vibecode pride + honest negative ("chưa có người dùng") + principle extraction với daily-life metaphor (`chén thánh`).
> 4. **Slang dropped by section**: poker-gambling slang (`ăn nhau`, `chiến kèo`) drop khi news-jacking/serious positioning — save for personal/tactical. `khác bọt` drop khỏi body explanatory — save for hook/punch line.
> 5. **Proof URLs full clickable** trong news-jacking — `https://testnet.bscscan.com/...` không phải `(0xa8cea8...583a7)`. Truncated OK cho casual; news-jacking cần verifiable.
> 6. **Hook title-style**: drop audience pronoun, no final period, hyphen-separator cho dual clause, parallel construction (ĐỪNG X - HÃY Y).
> 7. **`=====` divider migrated** từ before-hashtags → after-hook position. Hashtag tail không cần divider nữa.
> 8. **Emoji policy ADD**: `👇` (directional, engagement Q), `🛠` (section header — action-plan), `📌` (section header — community invite).
> 9. **Bullet hierarchy**: `⚡️` = analysis/shifts/insights. `1️⃣ 2️⃣ 3️⃣` keycap = action-plan/imperative. Use deliberately, không mix.
> 10. **VN finance journalism dramatization**: `chính thức / huy động / định giá / dàn backer toàn thế lực / lập tức / cổ phiếu / khởi chạy / tràn ngập / đóng sập`. EN-translated reads weak — localize.
> 11. **Selective country VN-ization**: Nhật Bản/Hàn Quốc/Trung Quốc YES; Brazil/Mexico/Philippines/Indonesia NO (per VN-reader familiarity in crypto context).

> **Voice update 2026-05-13** (corrections từ Day 3 published edit — EN technical thread, AIG voice via @baobao_gems handle):
> 1. **EN thread format** gets dedicated section — xem **§11**. Khác hẳn VN long-form post: thread numbering `1/5...5/5` at END, 3-layer hook, không emoji semantic (`🫡 ⚡️` là VN-side only).
> 2. **Hook 3-layer** thay 1-line: L1 ALL-CAPS reversal → L2 calm prose w/ timestamp anchor + 3-item preview → L3 bridge ("Now I'm documenting it.") + `Thread.` + `@mention` + `1/N`.
> 3. **Diplomacy với @mentioned party**: critique gap-to-prod, KHÔNG critique docs/team trực tiếp. "Docs covered what CCTP does. But the implementation took 24h" thay "docs gave me the what".
> 4. **Concrete > jargon, match real code**: "Polling 60s timeout, retry every 5s until attestation lands" thay "exponential backoff cap 90s". Mọi fix description phải có (file) + (mechanism plain English) + (success condition).
> 5. **Humility hedge ở closing claim**: "One of the first VN builders shipping CCTP on Arc" thay "First VN-native Arc builder shipping CCTP Domain 7". Absolute "first" → "one of the first" + scope qualifier.
> 6. **CTA spacing**: `\n\n` (blank line) giữa mỗi link, không phải `\n`. Bare URLs (X auto-linkify, strip markdown trước publish).
> 7. **Active verb cho community label**: "VN devs building on Arc" thay "VN devs on Arc".

> **Voice update 2026-05-08** (corrections từ Day 2 published edit — tactical/community post): 
> 1. **Audience pronoun**: `anh em` primary cho tactical/community/educational posts. `bạn` chỉ cho personal confession/philosophical.
> 2. **Emoji policy REVISED**: Allowed semantic emoji `🫡` (opener/respect) và `⚡️` (replace numbered bullets `1. 2. 3.` trong tactical lists). STILL banned: `🚀 💎 🔥 💰` (degen culture). Rule: emoji phải serve structural/semantic purpose, không decorate.
> 3. **Subject drop**: Khi context rõ → drop `mình` ("Hôm qua kể chuyện..." không phải "Hôm qua mình kể chuyện..."). Thêm `rồi` cuối câu thay cho hard stop.
> 4. **Slang density tăng**: `chiến kèo`, `khác bọt`, `vọc vạch`, `lằng nhằng`, `ăn nhau`, `ùa vào`, `lạ hoắc`, `cái lõi`, `cái móng`, `fomo`, `vibecode` — native crypto-VN stack.
> 5. **Tech term VN-ize + intensify**: `cực nhanh tầm 30s` thay `Finality ~30 giây`. `tầm Xs` thay `~X giây`. `Q4/2026` thay `Q4 2026`.
> 6. **X-platform conventions ADD**: `@handle` cho project mention (`@arc`, `@circlefin`), `$TICKER` cho token (`$USDC`), `===== ` divider + hashtags ở cuối.
> 7. **CTA pattern**: Community invitation = invite + forward-looking promise + reasoning paragraph. Không phải 1-câu Q&A.
> 8. **Closing**: `!` ALLOWED ở closing principle. Vivid verbs (`ùa vào`, `ăn nhau`) thay clean verb.
> 9. **Punctuation**: Hyphen `-` casual hơn em-dash `—` cho flow VN colloquial.

---

## 1. Voice Fingerprint

| Trait | Specifics |
|---|---|
| **Xưng hô (self)** | `mình` — tuyệt đối không `tôi`. 5/5 post |
| **Xưng hô (audience)** | `anh em` PRIMARY cho tactical/community/educational. `bạn` chỉ dành cho personal confession/philosophical. `mấy anh em` / `anh em VN` natural variants. Tone đàn anh / mentor, không hierarchy |
| **Persona** | Crypto trader OG (in market từ 2017+), đã kiếm "cả gia tài 2021-2024", thừa nhận sai, chia sẻ nguyên tắc |
| **Cảm xúc base** | Bình tĩnh + introspective. Có thể provocative khi cần (post 4) nhưng không hype |
| **Trust device chủ đạo** | **Tự thú sai lầm** trước khi đưa principle. "Mình đã không dám", "mình thiếu kỷ luật", "mình bỏ Hyperliquid" |
| **Anti-hype quotient** | Cao — không 1 lần nói "to the moon", "WAGMI", "lambo", "gem 100x" trong 5 sample |

---

## 2. Structural Patterns

### 2.1 Hook archetypes (5 found)

| Hook type | Example | Khi dùng |
|---|---|---|
| **All-caps reversal** | "MÌNH KHÔNG TIẾC VÌ BỎ HYPERLIQUID. MÌNH TIẾC VÌ ĐÃ QUÊN NGUYÊN TẮC" | Personal lesson story — mở bằng twist phá expectation |
| **Title + key data** | "KÈO AIRDROP TIỀM NĂNG: TEMPO" | Tactical play — uppercase tên dự án để scannable |
| **Practical promise** | "Cách build năng lực không thể thay thế thời đại AI" | Educational/framework — promise rõ outcome |
| **Imperative challenge** | "Lao vào nỗi sợ" | Provocative listicle — verb phrase ngắn |
| **Humble framing** | "Một góc nhìn về alpha" | Strategic analysis — không claim thẩm quyền tuyệt đối |

### 2.2 Body templates by topic

**Template A — Narrative confession (post 1):**
```
[All-caps hook đảo ngược]
[Setup: thời điểm + decision cụ thể + con số]
[Action: việc đã làm + reasoning lúc đó]
[Consequence: thị trường đã chứng minh sai/đúng]
[Reflection: nguyên tắc bị quên]
[Bridge: hiện tại đang lặp pattern này hay không]
[Application: kèo hiện tại + nguyên tắc đã quay lại]
```

**Template B — Tactical airdrop guide (post 2):**
```
[Title: KÈO AIRDROP TIỀM NĂNG: <NAME>]
[Bullets: vốn raise / segment / token status / data backing]
[Chú ý: caveats — risks honest]
=====
[Numbered steps with links]
[CTA: Theo dõi TG: @baobaogemschat]
```

**Template C — Philosophical framework (post 3):**
```
[Hook: practical promise]
[Source attribution nếu có]
[Frame statement: "năng lực đến từ: A / B / C"]
[Metaphor đời thường để giảm khô — ví: tạo mây từ hạt bụi, nấu ăn, poker]
[Numbered sections, mỗi section: định nghĩa → mình đã struggle → mình rút ra]
[Closing: 1 câu encouragement secular — "đừng dừng, tiến bộ đang đồng hành"]
```

**Template D — Listicle khô (post 4):**
```
[Imperative title]
[Numbered counter-intuitive items, mỗi item ≤ 1 dòng]
[Multiple list groupings: "Các thứ cần X / Các cách Y / Lợi thế Z"]
[Không closing — kết bằng list cuối]
```

**Template E — Strategic analysis (post 5):**
```
[Humble hook]
[Frame: "X mức độ / X nhóm / X giai đoạn"]
[Bulleted framework]
[Personal credibility data: timeline + scale]
[Thesis với confidence level: "không đúng 100% thì cũng 60%"]
[Provocative engagement question: "Cmt nhé"]
```

### 2.3 Length distribution
- Narrative confession: **600-700 words** — longest format
- Tactical guide: **300-500 words** — bullet-dense
- Philosophical: **600-800 words** — long-form essay
- Listicle: **150-250 words** — shortest
- Analysis: **300-400 words**

→ Default range cho post chính: **300-700 words**. Không thread-numbering style (1/ 2/ 3/) — viết liền paragraph.

---

## 3. Lexical Signature

### 3.1 Phải xuất hiện (signature words)

| Word/phrase | Vai trò |
|---|---|
| `mình` | Xưng hô bắt buộc (có thể drop khi context rõ) |
| `anh em` | Audience default cho tactical/community |
| `kèo` / `chiến kèo` | Deal/play (không nói "trade" hay "deal"). `chiến kèo` = play this trade actively |
| `alpha` | Cơ hội payoff lệch |
| `cày` / `vọc vạch` | Farm/grind / casual tinker |
| `vị thế` | Position (vào sớm) |
| `payoff lệch` | Asymmetric upside |
| `meta` / `meta market` | Market regime |
| `OG` | Old guard |
| `đám đông` / `số đông` | The crowd (đối lập với alpha) |
| `ùa vào` | Crowd rushing in (vivid verb cho closing) |
| `ăn nhau` | "What wins" (gambling slang, dùng closing) |
| `khác bọt` | Slang "different" |
| `lằng nhằng` | Slang "complicated/messy" |
| `lạ hoắc` | "Totally unfamiliar" |
| `cái lõi` / `cái móng` | "Core" / "foundation" (concrete metaphors) |
| `chain con nào` | Slang "which chain" |
| `fomo` | VN-crypto slang loanword |
| `vibecode` | AI-assisted coding (audience-recognized term) |
| `rồi` (sentence-end) | Soft close particle thay hard stop |
| `chén thánh` | Holy grail (secular daily-life metaphor, replaces Buddhist refs) |
| `đóng sập` | Slam shut — strong urgency verb for closing windows |
| `khởi chạy` | Formal launch verb (mainnet/product) |
| `tràn ngập` | Flood/saturate — dramatic verb for market presence |
| `bài xào lại` | VN idiom for "rehash/retread" — replaces EN |
| `xúi` | Loaded VN verb "incite badly" — anti-shill stance |
| `dàn backer toàn thế lực` | Dramatic phrasing for tier-1 investor list |
| `huy động` / `định giá` / `cổ phiếu` | VN finance journalism terms |
| `chính thức` / `lập tức` / `trực tiếp` | Intensifier adverbs for news-jacking setup |
| `Sự thật trần trụi:` | Colon-frame reveal-intro before high-stakes info |
| `(nếu có)` | Hedge for uncertain market state |
| `Hub chuyên biệt` | Forward-looking community premium framing (> "group riêng") |
| `support chéo` | Cross-support EN loanword (dev-native) |
| `tối ưu ROI thời gian` | Finance framing for time-investment value |
| `Action-plan` / `Proof-of-Work` | EN loanwords kept un-translated (industry weight) |
| `"bug"` (quoted) | Quoted dev term for VN→dev audience translation |

### 3.2 Crypto vocab tự nhiên (mix EN-VN)
- `airdrop`, `point`, `ví`, `faucet`, `deploy`, `contract`, `mint`, `node`, `vol`, `dex`, `perp`, `stablecoin`, `payment crypto`, `vốn raise`, `users`, `quỹ`, `RPC config`, `testnet faucet`, `bridge`, `wrap token`

**Translation rule (2026-05-08)**: EN technical concept → VN + intensifier. Ví dụ: `Finality ~30s` (EN-heavy) → `xác thực cực nhanh tầm 30s` (VN + intensifier). Giữ EN cho từ không có VN equivalent gọn (`CCTP`, `bridge`, `RPC`); translate những từ có VN tự nhiên (`finality` → `xác thực`).

**Number format**: `tầm 30s` không phải `~30 giây`. `Q4/2026` không phải `Q4 2026`. Slash + tầm = colloquial.

**EN abbreviation**: Cho phép truncate + ellipsis trong list — `Polygon, Arb...` thay full `Arbitrum`.

### 3.3 Metaphor & analogy (DROPPED Buddhist layer per 2026-05-06 update)

**Allowed** — ẩn dụ thường ngày, secular, gần đời sống:
- `tạo mây từ hạt bụi` (process/compound effect)
- `bình minh thị trường` (market stage)
- `mồ chôn` (asset trap)
- `vịtris đứng` (positioning)
- Daily life examples: `nấu ăn`, `poker`, `xe cộ`, `cây cối`

**Dropped** — KHÔNG dùng từ ngày 2026-05-06:
- ~~`chánh niệm`~~
- ~~`Vô uý Vô Luỵ`~~
- ~~Mantra Bát Nhã (`"Yết đế Yết đế ba la yết đế..."`)~~
- ~~`vô thường`~~ (như Buddhist concept)
- ~~Bất kỳ Phật/mantra/cultural-spiritual reference nào~~

→ **Pattern mới**: dùng ẩn dụ đời thường + framework đánh số để elevate post khỏi "degen guide". Voice giữ nguyên depth nhờ self-disclosure + concrete numbers, không cần spiritual layer.

### 3.4 Sentence patterns

| Pattern | Example |
|---|---|
| **Definition by negation** | "X không phải là A. X là B." → "Cái đau nhất của crypto không phải thua kèo, mà là đánh rơi nguyên tắc của chính mình" |
| **Introspective contradiction** | "Mình + verb + nhưng mình + opposite verb" → "Mình không thiếu kèo. Mình thiếu sự tiếp tục của kỷ luật" |
| **List of 3-4 items** | "Sức khoẻ / Thời gian / Gia đình / Tiền bạc" |
| **Didactic opener** | "Anh em thấy khó khăn, chính là do meta market thay đổi..." |
| **Confident hedge** | "Nhận xét này không đúng 100% thì cũng 60%" |
| **Subject-drop opener** | "Hôm qua kể chuyện X rồi. Nay nói chút về Y." (drop `mình`, drop `Hôm nay` → `Nay`, append `rồi`) |
| **Concrete metaphor** | "cái móng bên dưới" (foundation), "thứ trên đó" — physical-spatial thay abstract |

### 3.5 Specificity numbers
**Always concrete, never round-vague**:
- `$500M raise`, `1k vốn`, `5k lợi nhuận`, `10 ví`, `0.0004 ETH`, `2021-2024`, `7%`

→ **Rule**: nếu nhắc số → phải cụ thể. Không nói "rất nhiều" / "khủng" generic.

---

## 4. Format Conventions (X-platform specific)

| Yếu tố | Convention | Lý do |
|---|---|---|
| **Emoji (REVISED 2026-05-13 rev 2)** | Allowed semantic-only: `🫡` (opener/respect), `⚡️` (analysis/shift/insight bullets), `1️⃣ 2️⃣ 3️⃣` keycap (action-plan bullets, NEW), `🛠` (section header — action-plan, NEW), `📌` (section header — community invite, NEW), `👇` (directional — engagement Q close, NEW). STILL banned: `🚀 💎 🔥 💰` (degen). Rule: structural/semantic purpose, không decorate. | Day 2 + Day 13 bonus published edits |
| **All-caps** | Chỉ ở hook line đầu hoặc tên dự án trong tactical guide | Để pop trong feed scroll |
| **Line breaks** | Paragraph break giữa ý — tactical post có thể tighter (single newline) | Đọc liền mạch, không choppy |
| **Dấu câu** | `:` dùng nhiều, hyphen `-` casual hơn em-dash `—` cho colloquial flow, `...` cho trailing thought / truncate list, `!` dùng được ở **closing principle line** (revised — không phải "tiết kiệm tuyệt đối") | Văn nói, không over-formatted |
| **Bold/italic** | Không dùng | X không render markdown — viết phẳng |
| **Section divider** | `=====` multi-position: (1) AFTER ALL-CAPS hook (NEW 2026-05-13 rev 2, news-jacking format), (2) tách context/step trong tactical guide, (3) trước hashtag tail (OPTIONAL — dropped in news-jacking). | Day 13 bonus edit relocated divider |
| **Numbered list** | Hierarchy 3 lớp: (1) `⚡️` cho analysis/shifts/insights, (2) `1️⃣ 2️⃣ 3️⃣` keycap cho action-plan/imperative (NEW 2026-05-13 rev 2), (3) plain `1. / 2. / 3.` cho narrative/philosophical. Không mix. | Day 2 + Day 13 published edits — deliberate bullet hierarchy |
| **Bullet** | Dash `-` đầu dòng | Dùng cho framework / caveat |
| **Typo** | Có rare, không sửa (`thining`, `vịtris`, `né biết`) | Real-time-thought feel — đừng over-polish |
| **@ handle (NEW)** | `@arc`, `@circlefin` cho project mention | X-native — tag được, hyperlink |
| **$ ticker (NEW)** | `$USDC`, `$BNB` cho token symbol | X cashtag — searchable |
| **Hashtag tail (NEW)** | Sau `=====` cuối bài, 3 hashtag: `#baobao_gems #cryptoinsight #kiemtien` (signature combo). Có thể swap topic-specific. | X-native discoverability |

### 4.1 CTA conventions
- Tactical post → `Theo dõi thêm thông tin tại TG: @baobaogemschat`
- Analysis post → `Cmt nhé.` / `Anh em muốn mình ở vị trí nào trong cuộc đua này? Cmt nhé.`
- Personal/philosophical → **không CTA** — kết bằng câu principle (vivid verb + `!` allowed)
- **Community invitation (NEW pattern, 2026-05-08)** — 3 phần, không phải 1-câu Q&A:
  1. **Invite line**: "Hiện anh em [chiến kèo này / quan tâm X] có thể vào TG @baobaogemschat trao đổi với mình."
  2. **Forward-looking promise**: "Khi anh em [verb] đông mình sẽ mở riêng 1 group riêng."
  3. **Reasoning paragraph**: "Tuy [đối tượng] đã biết X, nhưng trong quá trình sử dụng chắc chắn sẽ có nhiều thắc mắc nên có cộng đồng hỏi đáp sẽ rất hữu ích. Hơn nữa anh em chung nhóm có thể hỗ trợ nhau nhiều thứ mà đi một mình không có."
- **KHÔNG bao giờ**: "Like + RT", "Follow for more", giveaway baits

---

## 5. Topic-to-Format Map

| Topic loại | Template | Hook archetype | Length | Có CTA TG? |
|---|---|---|---|---|
| Bài học cá nhân / regret | A — Narrative confession | All-caps reversal | 600-700w | Không |
| Tactical airdrop / kèo cụ thể | B — Tactical guide | Title + data | 300-500w | **Có** |
| Skill-building / mindset / triết | C — Philosophical framework | Practical promise | 600-800w | Không |
| Provocative quick-hit | D — Listicle khô | Imperative verb | 150-250w | Không |
| Market analysis / strategy | E — Strategic analysis | Humble framing | 300-400w | Engagement question |

---

## 6. Stylistic DNA (10 đặc trưng cốt)

1. **Self-disclosure of mistake first** — luôn thừa nhận sai trước khi đưa principle
2. **Principle extraction over flex** — story kết bằng rule, không phải "xem mình giàu"
3. **Numbered frameworks** — 4 mức cạnh tranh / 3 năng lực / 4 nỗi sợ / 4 nguồn tiền / 4 thứ cần giữ
4. **Concrete numbers + timeline** — "$500M", "10 ví", "2021-2024", "7%"
5. **Mentor energy không preachy** — encouragement không self-help-guru
6. **Engagement-bait endings nhẹ** — "Cmt nhé" cho analysis, không cho personal
7. **Tactical + Strategic mix tự nhiên** — TEMPO airdrop guide nằm cạnh framework alpha trong cùng feed → đó chính là phần độc đáo
8. **Vietnamese-first + EN crypto loanwords** — `alpha`, `payoff lệch`, `vốn raise` chen tự nhiên trong văn VN
9. **Anti-hype** — nói thua, nói chưa chắc, nói "60% đúng", thay vì certainty
10. **Daily-life analogy over spiritual** — dùng `nấu ăn`, `poker`, `tạo mây từ hạt bụi` thay vì Phật/mantra để illustrate concept

---

## 7. Prohibited (không có trong 5 sample → tránh)

| Avoid | Reason |
|---|---|
| Decorative emoji 🚀 🔥 💎 💰 ✨ | Degen culture — phá tone OG mature. (REVISED 2026-05-08: semantic emoji `🫡 ⚡️` cho phép — xem §4) |
| `WAGMI`, `to the moon`, `ape in`, `GM`, `gem 100x` | Degen culture — phá tone OG mature |
| `Revolutionary`, `disruptive`, `game-changing` | Hype generic — không có trong sample |
| Twitter thread numbering `1/ 2/ 3/` | Sample dùng paragraph + `1.` style, không thread-numbering |
| `Like + RT để biết thêm` | CTA loại spam, không xuất hiện |
| Affiliate / referral link kèm post | Không thấy — nếu có cũng tách biệt |
| Self-aggrandizement | "Tôi giỏi" — sample dùng kể-mình-đã-sai instead |
| Over-polish (zero typo, perfect punctuation) | Sample có typo lai rai → giữ feel real-time |

---

## 8. Voice Charts

### 8.1 We Are vs We Are NOT

| Trait | We Are | We Are NOT |
|---|---|---|
| OG | Người đã trade từ 2017, đã ăn lớn ở 21-24 | "Crypto bro mới vào 2024" |
| Honest | Kể bỏ Hyperliquid, kể chùn bước, kể quên nguyên tắc | "Tôi luôn đúng, follow tôi để giàu" |
| Tactical | KÈO TEMPO + step + faucet link + caveats | Vague "this gem will moon" |
| Strategic | Framework năng lực + 4 mức cạnh tranh + ẩn dụ đời thường | Phật/mantra/spiritual vibes (DROPPED 2026-05-06) |
| Engaging | "Cmt nhé" + "Bạn muốn mình ở vị trí nào?" | "Like + RT cho ai chưa biết" |

### 8.2 Pronoun map

| Context | Self | Audience |
|---|---|---|
| Tactical / analysis post | mình | bạn / các bạn / anh em |
| Personal confession | mình | bạn (singular, intimate) |
| Philosophical | mình | bạn (universal "you") |

---

## 9. Output Templates (copy-paste ready)

### 9.0 Community/educational tactical template (NEW 2026-05-08, derived from Day 2 published edit)
```
[Bridge from previous post: "Hôm qua kể chuyện X rồi. Nay nói chút về Y — Z."]
[Audience question framing: "Thấy mấy anh em nhắn hỏi: '[câu hỏi]'."]

🫡 [Tóm gọn / Frame statement]: [Subject] là [definition]. Nó khác bọt với [comparison] ở [N] cái lõi:

⚡️ [Core point 1 — concrete, EN concept VN-translated + intensifier]
⚡️ [Core point 2]
⚡️ [Core point 3 — có thể truncate list "X, Y, Z..."]

[Time-window framing: "Target [date]. Tức là giờ vẫn đang [phase]. Đây là thời điểm vàng để anh em VN [verb] trước khi [crowd outcome]."]

[Community invite — 3 parts:]
- Invite: "Hiện anh em chiến kèo này có thể vào TG @baobaogemschat trao đổi với mình."
- Promise: "Khi anh em chiến kèo X đông mình sẽ mở riêng 1 group riêng."
- Reasoning: "Tuy hiện tại nhiều anh em đã biết Y, nhưng trong quá trình sử dụng chắc chắn sẽ có nhiều thắc mắc nên có cộng đồng hỏi đáp sẽ rất hữu ích. Hơn nữa anh em chung nhóm có thể hỗ trợ nhau nhiều thứ mà đi một mình không có."

[Closing principle — vivid verb + `!`]: "Đám đông sẽ ùa vào khi [event]. Vị thế ăn nhau là ở lúc này!"

=====
#baobao_gems #cryptoinsight #kiemtien
```

### 9.1 Tactical airdrop template
```
KÈO AIRDROP TIỀM NĂNG: <DỰ ÁN>
- Vốn raise: <$>, từ <quỹ> (track record: ...)
- Segment: <Layer/category>, <thesis lý do thị trường cần>
- Token status: <chưa có / đã có nhưng X>
- Data backing: <số liệu cụ thể chứng minh segment hot>

Chú ý:
- <Caveat 1 — risk thẳng>
- <Caveat 2 — phí / điều kiện>
- <Caveat 3 — diversify>

=====
1. <Step name>
- <action với link>

2. <Step name>
- <action với link>

...

Theo dõi thêm thông tin tại TG: @baobaogemschat
```

### 9.2 Personal lesson template
```
<HOOK ALL-CAPS REVERSAL — đảo ngược kỳ vọng>
=====
<Năm + setup cụ thể với con số ví/vốn/kết quả>

<Diễn biến: lý do quyết định lúc đó — đặc biệt là reasoning self-justify>

<Hậu quả: thị trường đã chứng minh sai như thế nào>

<Đoạn pivot: thứ đau nhất KHÔNG phải X, mà là Y>

<Nguyên tắc bị quên — nêu rõ ngắn gọn>

<Bridge tới hiện tại: kèo hiện tại / mindset hiện tại>

<Closing: nguyên tắc đã quay lại + 1 câu thái độ>
```

### 9.3 Framework analysis template
```
<Humble hook — "Một góc nhìn về X" / "Cách build Y">

<Frame statement: "X đến từ A / B / C" hoặc "có N mức độ">

<Numbered framework:>
- <Mức 1>
- <Mức 2>
- <Mức 3>
- <Mức 4>

<Personal credibility data với timeline + scale>

<Thesis với confidence level — "không đúng 100% thì cũng X%">

<Engagement bait: "Bạn ở đâu trong cái này? Cmt nhé.">
```

---

## 10. Khi áp dụng cho AIG content

> **CRITICAL**: voice này KHÔNG phải AIG voice. AIG voice = Builder/honest/technical/proof-driven (xem `docs/brand-guidelines.md`).

**Mapping recommendation** (locked sau khi anh confirm):
- AIG Build-in-Public posts (40%) → **AIG voice**. Nếu EN thread technical (CCTP/contract/debugging) post từ @baobao_gems handle → xem **§11 EN Thread Format**.
- AIG Arc Explainer VN (25%) → có thể blend — dùng template C (philosophical framework) + AIG technical proof points
- AIG Use Case Demo (20%) → **AIG voice**
- AIG VN Community (15%) → có thể dùng style này nếu post từ @baobao_gems brand kéo về AIG, nhưng phải declare context rõ

**Cross-post strategy idea (cần anh confirm trong content calendar phase)**:
- @baobao_gems X kể câu chuyện cá nhân về việc build AIG → kết nối với AIG GitHub / Vercel demo (dùng template A — narrative confession nhưng ending xoay sang "lần này mình không quên — đây là proof")
- AIG official account post technical depth bằng AIG voice
→ 2 brand cross-pollinate nhưng không nhầm lẫn voice

---

## 11. EN Thread Format — AIG voice via @baobao_gems handle (NEW 2026-05-13)

> **Context**: AIG technical content (Build-in-Public pillar) post từ @baobao_gems handle bằng EN, dùng AIG voice (Builder/honest/technical/proof-driven). Day 3 published edit (2026-05-13) là reference implementation cho format này.
> **Use case**: CCTP / Arc / contract walkthrough / debugging story threads. Tag `@circlefin` hoặc peer Arc builders.
> **NOT for**: VN long-form, personal confession, tactical airdrop guide (those follow §2 templates A-E).

### 12.1 Hook structure — 3-layer (T1)

```
[L1 — ALL-CAPS reversal/tension line — single sentence, ≤80 chars]

[L2 — calm prose paragraph: context + timestamp anchor + 3-item preview list]

[L3 — bridge line + "Thread." + @mention]

1/N
```

**Published reference (Day 3 T1)**:
```
I BUILT ON CCTP DOMAIN 7 BEFORE THE DOCS WERE CLEAR. HERE'S WHAT BROKE.

I built a payment gateway on CCTP Domain 7 (Arc Network) back in March. Circle's docs and blog covered what CCTP does on Arc. But the implementation — attestation timing, slippage handling, cold starts — took 24 hours of debugging.

Now I'm documenting it. Thread. @circlefin

1/5
```

**Why 3-layer**:
- **L1** catches scroll (caps), builds credibility-by-tension ("I built X BEFORE docs Y")
- **L2** anchors timestamp (`back in March`) + 3-item preview so readers commit to thread
- **L3** explains WHY posting now (retrospective documentation, not realtime drama) + respectful @-tag

### 12.2 Thread numbering convention

- Format: `1/5`, `2/5`, ..., `5/5` — on its own line at **END** of each tweet, after blank line.
- ❌ NOT `1/ ` at start — old Twitter convention, competes with hook for attention.
- ❌ NOT `1.` or `(1)` — reserved for numbered lists inside body.
- Reason: end-position numbering reads as soft footer, doesn't compete with hook.

### 12.3 Diplomacy with @-mentioned reference party

When tagging @circlefin / @arc / etc., critique the **gap between docs and prod reality** — not the docs/team themselves.

| ❌ Implies blame | ✅ Critiques the gap |
|---|---|
| "The docs gave me the what. The how took 24h." | "Circle's docs covered what CCTP does. But the implementation took 24h." |
| "Docs are incomplete." | "Docs cover the protocol. Production timing was the missing piece." |

**Rule**: docs cover their scope (the protocol). The gap is between protocol-on-paper and protocol-in-prod. Critique the gap.

### 12.4 Concrete numbers > jargon (match real code)

Every fix/feature description must have:
1. **File reference** (`scripts/test-cctp-domain7.ts`, `SwapRouter.sol`)
2. **Mechanism in plain English** (not jargon)
3. **Success/exit condition** (what tells you it worked)

| ❌ Jargon | ✅ Concrete + code-matched |
|---|---|
| "Exponential backoff polling, cap 90s" | "Polling with 60s timeout in scripts/test-cctp-domain7.ts — retry every 5s until attestation lands" |
| "Slippage protection" | "amountInMax guard in SwapRouter.sol — output-based swap so merchant gets exact USDC" |
| "Cold start mitigation" | "Pre-warm Vercel routes before opening a payment session" |

**Rule**: don't paraphrase wrong — read the actual file before claiming what the fix does.

### 12.5 CTA tweet (T5) — spacing, URLs, humility

**Spacing**: each link on its own line, blank line between:
```
Code: github.com/baobaogems/aig

Demo: aig-frontend-blond.vercel.app/dashboard

VN devs building on Arc: @baobaogemschat
```

**URLs**: bare URLs only on X (auto-linkify). If draft tool exports markdown `[text](url)`, **strip before publish** — X renders literal brackets.

**Closing claim — absolute → relative**:

| ❌ Unverifiable absolute | ✅ Defensible relative |
|---|---|
| "First VN-native Arc builder" | "One of the first VN builders shipping CCTP on Arc" |
| "Only VN dev on Arc" | "One of the few VN devs publicly building on Arc" |

**Rule**: replace `First X` / `Only X` with `One of the first X + scope qualifier`. Still positions, harder to debunk.

### 12.6 Community label — active verb

- ❌ Static: "VN devs on Arc" (just exists)
- ✅ Active: "VN devs building on Arc" (ongoing work signal)

Same for self-reference: "shipping CCTP on Arc" (gerund) > "ships CCTP on Arc" (third-person flat).

### 12.7 Length per tweet

| Tweet | Char range | Notes |
|---|---|---|
| T1 (3-layer hook) | 350-420 | **Requires X Premium** (over 280). Non-Premium → compress L2: drop timestamp + preview list. |
| T2-T4 (body) | 230-280 | Standard tweet length, no Premium needed |
| T5 (CTA) | 230-280 | Standard tweet length |

**Note**: Day 3 published T1 ≈ 390 chars — Premium-required. Plan for Premium when designing 3-layer hooks.

### 12.8 Voice constraints retained (no drift to @baobao_gems VN style)

- ❌ NO emojis — even semantic `🫡 ⚡️` (those are §4 VN-side conventions, not AIG EN)
- ❌ NO `mình` / `anh em` (EN — no pronoun-translation needed)
- ❌ NO crypto-VN slang (`kèo`, `alpha`, `chiến`, `vọc vạch`)
- ✅ Numbered lists `1. 2. 3.` (NOT `⚡️` — that's VN tactical bullet)
- ✅ `@handle` for project mention (`@circlefin`), bare URL for links, `$TICKER` if relevant
- ✅ Concrete numbers everywhere (`30-90s`, `60s timeout`, `every 5s`, `24h`, `5/5`)
- ✅ Closing principle OK but softer — no `!`, no `ăn nhau`/`ùa vào` vivid verbs (those are VN-side)
- ✅ Definition-by-negation OK (AIG voice trait shared): "Docs covered what CCTP does. But the implementation..."

### 12.9 Anti-pattern checklist (Day 3 ClaudeKit draft vs published edit)

Quick QA before publishing any EN thread:

- [ ] T1 is 3-layer (not 1-line technical)?
- [ ] T1 L2 has explicit timestamp (`back in March`, `Q1 2026`, etc.)?
- [ ] T1 L2 previews the 3 items that come in T2?
- [ ] T1 L3 has bridge line explaining WHY post now?
- [ ] Every tweet ends with `N/5` on own line?
- [ ] Critique targets gap-to-prod, NOT the @-tagged party's docs/team?
- [ ] Every fix has file + mechanism + success condition?
- [ ] Real numbers match real code (read the file, don't paraphrase)?
- [ ] T5 has `\n\n` between links (not `\n`)?
- [ ] URLs are bare (markdown stripped)?
- [ ] Closing claim uses "One of the first" not "First"?
- [ ] Community label uses active verb ("building on") not static ("on")?

### 12.10 Output template (copy-paste ready)

```
[T1 — Hook]
<L1 ALL-CAPS REVERSAL — single sentence ≤80 chars>

<L2 calm prose: 1-sentence context + timestamp anchor + 3-item preview separated by em-dashes>

<L3 bridge line>. Thread. @<reference-party>

1/5

[T2 — What broke / What's new / What's true]
<Frame line — "3 things that..." / "Here's what...">:

1. <Item 1 — concrete, plain English>
2. <Item 2>
3. <Item 3>

2/5

[T3 — How / Fixes / Mechanism]
<Frame line — "Fixes that worked:" / "Here's how:">:

1. <File + mechanism + success condition>
2. <File + mechanism + success condition>
3. <File + mechanism + success condition>

3/5

[T4 — Architecture / Proof]
<Frame line — "Architecture, live on <env>:">:

<Component A> → <Component B> → <Component C> → <End state>

Contract: <0x... full address>

<One-line where to find more on GitHub>

4/5

[T5 — CTA]
<1-line status: "Live now. Open source. Fork it for your chain.">

Code: <bare github URL>

Demo: <bare vercel URL>

VN devs building on Arc: @baobaogemschat

<Closing claim — "One of the first VN builders shipping <thing> on <chain>.">

5/5
```

---

## 12. News-Jacking VN Long-form Format (NEW 2026-05-13 rev 2)

> **Context**: VN long-form single post reacting to hot 24-48h Arc/Circle/CCTP news, positioning author as contributor/builder, not spectator. @baobao_gems voice với Builder-credibility-by-shipping layer. Reference implementation: `content/bonus-260513.md` published edit (ARC $222M presale news-jacking).
> **Use case**: Major news drops. Time-sensitive (post within 24-48h). VN audience.
> **NOT for**: Personal confession (Template A), tactical airdrop guide (Template B), EN technical thread (§11).

### 12.1 Structure (9 beats)

```
[Beat 1 — Hook ALL-CAPS title — no audience pronoun, no period, hyphen-separator nếu dual clause, parallel construction ĐỪNG X - HÃY Y]
[=====]
[Beat 2 — News setup paragraph: WHO + WHAT + AMOUNT + BACKERS + MARKET REACTION với VN finance dramatization]
[Beat 3 — Anti-shill framing: loaded VN verb `xúi` + `(nếu có)` hedge]
[Beat 4 — Reveal-intro `Sự thật trần trụi:` + risk facts + explicit thesis bridge `Cái anh em cần nhìn nhận là...`]
[Beat 5 — `🫡 Dưới đây là N dịch chuyển (shifts) cốt lõi:` + ⚡️ numbered shifts]
[Beat 6 — Contributor credibility: "Mình không nói/phân tích từ ghế khán giả" + full clickable proof URLs + honest negative + vibecode signature + principle extraction]
[Beat 7 — Market-gap reframe: drop self-positioning, frame as opportunity for READER]
[Beat 8 — `🛠 N Action-plan thực tế...` + `1️⃣ 2️⃣ 3️⃣` items với action → outcome → concrete framing]
[Beat 9 — Closing principle: explicit-choice agency, NO poker slang]
[`📌` community invite — 3-part pattern + Hub upgrade]
[Engagement Q + 👇]
[Hashtag tail — NO ===== before]
```

### 12.2 Beat-by-beat rules (with diff examples)

#### Beat 1 — Hook title-style

| ❌ ClaudeKit | ✅ Published |
|---|---|
| `$222M VÀO ARC HÔM QUA. ANH EM ĐỪNG FOMO TOKEN. NÊN FOMO VỊ THẾ.` | `$222M ĐẦU TƯ VÀO ARC HÔM QUA. ĐỪNG FOMO TOKEN - HÃY FOMO VỊ THẾ` |

- Explicit verb (`ĐẦU TƯ VÀO`) > preposition-only (`VÀO`)
- Drop audience pronoun (`ANH EM`) — declarative universal
- Hyphen `-` separator between clauses (NOT period split)
- No final period — title style
- Parallel construction: `ĐỪNG X - HÃY Y`

#### Beat 2 — News setup VN finance dramatization

| ❌ EN-translated | ✅ VN-native dramatic |
|---|---|
| "Circle đóng presale ARC — $222M @ FDV $3B" | "Circle **chính thức** đóng presale ARC - **huy động** $222M ở **mức định giá** FDV $3B" |
| "Lead a16z $75M" | "**lead bởi** a16z ($75M)" (passive voice) |
| "Có cả BlackRock, Apollo..." | "với **dàn backer tham gia toàn thế lực**: BlackRock, Apollo..." |
| "CRCL stock +16%" | "**Cổ phiếu** CRCL **lập tức** +16%" |

#### Beat 3 — Anti-shill loaded verb

```
❌ "Nhưng đây không phải bài về cách mua $ARC trên secondary."
✅ "Nhưng đây không phải bài viết xúi anh em đi mua $ARC trên secondary market (nếu có)"
```
- Loaded VN verb `xúi` (incite-with-bad-intent) sharpens anti-degen
- `(nếu có)` hedge acknowledges market may not exist yet

#### Beat 4 — Reveal-intro + thesis bridge

```
❌ "Cái thay đổi thực sự nằm ở chỗ khác." (vague, passive)
✅ "Sự thật trần trụi: [risk facts] ... Cái anh em cần nhìn nhận là sự thay đổi cấu trúc cuộc chơi."
```
- `Sự thật trần trụi:` / `Nói thẳng:` — colon-frame reveal-intro before high-stakes info
- Explicit thesis bridge with active verb `cần nhìn nhận` / `cần thấy`
- `!` allowed mid-body for risk warnings (not just closing principle)

#### Beat 5 — Framework intro + selective country localization

```
✅ "🫡 Dưới đây là 3 dịch chuyển (shifts) cốt lõi trong 48h qua:"
```
- `Dưới đây là` — formal scaffolding presents list
- VN translation + EN in parens: `dịch chuyển (shifts)` — VN-first searchability
- Elevating adjective: `cốt lõi` / `thực dụng` / `trần trụi`

**Country names — selective VN-ization**:

| Translate to VN | Keep as EN |
|---|---|
| Nhật Bản, Hàn Quốc, Trung Quốc, Đài Loan, Anh, Pháp, Đức, Mỹ | Brazil, Mexico, Philippines, Indonesia, Singapore, Thailand, Argentina, Chile |

Rule: VN-ize countries với deeply internalized VN forms; keep EN cho countries VN-readers know primarily by EN name in crypto context.

#### Beat 6 — Contributor credibility

```
✅ "Mình không phân tích từ góc độ khán giả. Từ tháng 3, mình đã trực tiếp build AIG (Arc Invisible Gateway) trên Arc Testnet -  cổng thanh toán dành cho merchant VN.

Code public, contract live trên BSC Testnet: https://testnet.bscscan.com/address/0xa8cea8fa47874c688511cb1d72aa86a4b3c583a7

Demo Vercel chạy thực tế. Đổi lấy 24h debug liên tục và 7 lần fix lỗi production sau đó. Tới giờ project có thể chạy được mà chưa có người dùng. link: https://aig-frontend-blond.vercel.app/dashboard

Nói thẳng mình khá tự hào khi ship được sản phẩm IT đầu tiên bằng vibecode, với 1 người background tự nhận là zero code như mình. Theo trải nghiệm của mình thì không có chén thánh nào để học vibecode nhanh cả, trả giá sớm thì học được sớm."
```

**Sub-rules**:
1. Opener: `Mình không [phân tích / nói] từ [góc độ / ghế] khán giả` — disclaim spectator status
2. Time anchor at FRONT: `Từ tháng 3, mình đã trực tiếp build` (NOT "Mình đã build... từ tháng 3")
3. **Full clickable URLs** — `https://testnet.bscscan.com/address/<full-hash>` NOT truncated `(0xa8cea8...583a7)`
4. **Honest negative** — `chưa có người dùng` admits zero users alongside ship proof; strengthens credibility
5. **Vibecode signature paragraph** (mandatory for this format): vibecode + zero-code identity markers + principle extraction with `chén thánh` (holy grail) daily-life metaphor

#### Beat 7 — Market-gap reframe (DROP self-positioning)

| ❌ Self-positioning (even with §11.5 hedge) | ✅ Market-gap observation |
|---|---|
| "Vị thế first-mover Arc ecosystem cho dev VN còn trống. Mình là 1 trong số ít — không phải duy nhất..." | "Và mình để ý thấy sản phẩm Việt Nam trong hệ sinh thái ARC hiện tại có rất ít, còn khả năng cạnh tranh." |

**Critical rule**: trong news-jacking, REMOVE personal positioning entirely. Reframe "I am positioned" → "market has gap, opportunity for YOU". Even §11.5 humility hedge ("one of the few") reads as self-flex khi news-jacking. Pure market-state observation > positioning statement.

Urgency close: `đóng sập khi Mainnet khởi chạy vào mùa hè. Lúc đám đông ùa vào, giá của vị thế sẽ không còn rẻ.`
- `đóng sập` (slam shut) > `đóng` (close)
- `giá của vị thế` (price of positioning) — explicit price framing

#### Beat 8 — Action-plan format

```
🛠 3 Action-plan thực tế anh em có thể làm ngay trong 2-3 tháng tới:

1️⃣ [Action verb] [object]: [Outcome]. [Concrete framing sentence].

2️⃣ [Action verb] [object]: [Outcome]. [Anti-shill clarifier].

3️⃣ [Action verb] [object]: [Outcome]. [Audience filter — "không phải airdrop farmer hay shillooor"].
```

**Bullet hierarchy enforced**:
- `⚡️` — analysis/shift/insight (Beat 5)
- `1️⃣ 2️⃣ 3️⃣` — action-plan (Beat 8)
- Different visual = different reader processing mode

#### Beat 9 — Closing principle explicit-choice

| ❌ Poker slang | ✅ Choice-agency |
|---|---|
| "ăn nhau ở việc đứng được đâu bây giờ!" | "hoàn toàn phụ thuộc vào việc anh em chọn đứng ở đâu ngay bây giờ!" |

**Rule**: drop `ăn nhau` / `chiến kèo` poker-gambling slang trong news-jacking (still §3.1 vocab, but NOT used here). Mentor energy = explicit-choice agency framing.

#### Community invite — Hub upgrade

```
📌 Hiện anh em quan tâm Arc có thể vào TG @baobaogemschat trao đổi với mình. Khi số lượng anh em build trên Arc đủ lớn, mình sẽ mở một Hub chuyên biệt. Thông tin Arc bằng tiếng Anh đã có nhiều, nhưng trong quá trình triển khai hệ thống chắc chắn sẽ sinh ra "bug". Có một cộng đồng VN support chéo sẽ tối ưu ROI thời gian cho tất cả.
```

**Upgrades from §4.1 base 3-part pattern**:
- `📌` section emoji
- `Hub chuyên biệt` > `group riêng` (premium positioning)
- Dev term quoted: `"bug"` (NOT `thắc mắc`)
- EN loanwords: `support chéo`, `Action-plan`, `Proof-of-Work` — kept un-translated for industry weight
- Finance framing: `tối ưu ROI thời gian` — high-density value framing for indie dev audience

#### Engagement Q + 👇

```
✅ "Anh em nghĩ vị thế ngon nhất trong cuộc đua Arc này là gì? Thả comment bên dưới nhé 👇"
```
- Full `comment` (NOT `cmt`)
- `Thả ... bên dưới` VN-native CTA verb
- `👇` directional emoji (semantic)

### 12.3 Anti-pattern checklist

Pre-publish QA cho VN news-jacking:

- [ ] Hook title-style (no pronoun, no period, hyphen-separator if dual clause)?
- [ ] `=====` AFTER hook (not before hashtags)?
- [ ] VN finance dramatization (chính thức/huy động/định giá/lập tức/cổ phiếu)?
- [ ] Anti-shill uses `xúi` + `(nếu có)`?
- [ ] `Sự thật trần trụi:` reveal-intro?
- [ ] Explicit thesis bridge before framework?
- [ ] 🫡 + `Dưới đây là N dịch chuyển (shifts) cốt lõi:`?
- [ ] ⚡️ bullets for shifts; EN terms get `VN-translation (EN)`?
- [ ] Selective country VN-ization (Nhật Bản/Hàn Quốc YES, Brazil/Mexico/Philippines NO)?
- [ ] Contributor opener disclaims spectator status?
- [ ] Proof URLs FULL clickable (bscscan + vercel)?
- [ ] Honest negative ("chưa có người dùng")?
- [ ] Vibecode signature paragraph với `chén thánh` principle?
- [ ] Market-gap reframe — NO self-positioning even with §11.5 hedge?
- [ ] `đóng sập` urgency verb + `giá của vị thế`?
- [ ] 🛠 section header + `1️⃣ 2️⃣ 3️⃣` for action-plan (NOT ⚡️)?
- [ ] Closing uses choice-agency NOT poker slang?
- [ ] 📌 community invite + Hub + `"bug"` quoted + `tối ưu ROI thời gian`?
- [ ] Full `comment` + `👇` engagement Q?
- [ ] Hashtag tail with NO `=====` divider before?

---

## 13. Open Questions

1. Tần suất post hiện tại của @baobao_gems trên X? (cần biết để fit vào content calendar nhịp đập sẵn)
2. @baobao_gems có audience overlap nhiều với @baobaogemschat (TG) không? Hay 2 cộng đồng tách biệt?
3. Có post nào dùng emoji / format khác sample 5 này không? (5 sample này có pattern rất rõ — cần confirm đại diện cho 100% style hay chỉ "best 5")
4. Có post quảng cáo / sponsored / referral nào trong inventory @baobao_gems không? Nếu có → cần extract style cho format đó riêng (không có trong sample)
5. AIG có content nào nên ship dưới @baobao_gems voice không? Default đề xuất: KHÔNG (giữ tách biệt) — trừ khi user có lý do strategic ngược lại

---

## Methodology

- **Sample size**: 5 posts paste trực tiếp 2026-05-05
- **Coverage**: 5 topics khác nhau (regret confession / airdrop guide / capability framework / fear listicle / alpha analysis) → đủ đa dạng để generalize template
- **Confidence**: HIGH cho structural/lexical/format patterns (>3 corroborating signals). MEDIUM cho topic-format mapping (cần thêm sample để confirm). LOW cho frequency/cadence (chưa có data)
- **Selection bias caveat**: 5 post là "best" → có thể skew toward signature style. Cần xem 10-15 post random để xác định baseline voice
