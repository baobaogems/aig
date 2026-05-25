# AIG 30-Day Content Calendar

**Day 1 = Mon 2026-05-11 | Day 30 = Tue 2026-06-09**
**Proof points key**: GitHub `https://github.com/baobaogems/aig` (29 commits) | Vercel `https://aig-frontend-blond.vercel.app/dashboard` | Contract BSC Testnet `0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3` (SwapRouter v2) | Deploy tx `0x7d263b1bbb89852862eea824986ca3aff3f94015deb665055a2b4151fc9290f9` | commits `e7b0cde` / `6146088` / `46af981` | APIs `/api/agent/quote` `/api/agent/execute` `/api/points` | pages `/` `/pay/[id]` `/dashboard` | script `scripts/test-cctp-domain7.ts` | schema `003_create_merchants_table.sql`

---

## WEEK 1 — ESTABLISH

### Day 1 — Mon May 11 — **NARRATIVE CONFESSION (revised 2026-05-06)**

> **Pivot note**: D1 was originally technical proof-of-work tweet (AIG voice). Pivoted 2026-05-06 to narrative confession (@baobao_gems voice) after user choice. Strategic logic: existing @baobao_gems audience is VN-heavy and trusts him via personal voice — opening with story creates softer feed transition before D3 technical thread. 4-confession cycle shifted from D5/12/20/28 → **D1/12/20/28** (D5 frees up for regular content).

**@baobao_gems X — NARRATIVE CONFESSION #1** (cross-pollination):
- **Pillar**: Cross-pollination (replaces D1 Build-in-Public — that pillar redistributed to D3/D6/etc.)
- **Format**: X Premium Long EN (~1640 chars, single post — not thread)
- **Voice**: @baobao_gems narrative confession (NOT AIG technical voice). Sample-aligned.
- **Hook (ALL-CAPS reversal)**: `I SHIPPED AIG ON ARC NETWORK IN 24 HOURS. THEN I QUIT FOR 2 MONTHS.`
- **Story arc**:
  - Setup (concrete + dated): March 2026, built AIG, 8 sub-phases, 24h dev, live testnet
  - Decision/Action: Phase 2 hit (multi-chain, microservices, points, admin dashboard) — didn't know where to start, "started nowhere"
  - Consequence (honest): 2 months idle. Project faded into "another abandoned testnet repo"
  - Insight (definition by negation): "The hardest part wasn't getting stuck on Phase 2. It was watching the only thing I'd shipped on Arc fade."
  - Bridge: Looked at Arc ecosystem — 100+ partners, zero VN-native builder, zero VN Arc coverage. Position still empty.
  - Resolution + 3-item framework: (1) shipped MVP, (2) VN community @baobaogemschat, (3) build slow in public
  - Plan stated (not promised): build daily, translate Arc docs to VN, help any builder integrate CCTP
  - Proof block at END: contract `0xa8cea8fa...583a7` + GitHub + Vercel demo
  - Principle close: "Position doesn't come from waiting until you're sure. It comes from showing up again, after you stopped."
- **CTA**: NO hard CTA. Reader who wants to verify clicks proof links.
- **Channel**: @baobao_gems X (EN, X Premium Long format)

**VN Quote-Tweet** (~09:05, 5 phút sau bài EN chính):
- **Format**: Quote-tweet trực tiếp bài EN (X Premium Long VN, ~720 chars)
- **Hook**: `Bài EN trên dành cho Arc team đọc. Tóm tắt VN:`
- **Body**: same story arc condensed — ship 24h → Phase 2 stuck → 2 tháng → quay lại
- **Numbered framework (2 items)**: lý do quay lại = (1) AIG là thứ duy nhất shipped trên Arc — vị thế thật / (2) ecosystem chưa có VN builder
- **Definition by negation**: "Cái đau nhất không phải bị stuck Phase 2. Cái đau nhất là suýt bỏ chỗ đứng mà mình đang đứng độc nhất."
- **Proof links**: Code GitHub + Demo + Group TG @baobaogemschat
- **Channel**: @baobao_gems X (VN, quote-tweet)

**Arc Discord** (Play 0 — OBSERVE-ONLY):
- **Format**: NO posting, NO DM. Server has strict no-self-promo rules.
- **Action**: Read pinned messages in #general / #builders / #devrel. Bookmark visible Arc team / Circle DevRel handles. Note recurring question themes.
- **Why**: First post in Discord without 2 weeks of public proof = burns credibility. First DM shifted to Day 14.

**Notes**:
- Do NOT tag @circlefin on D1 narrative confession — personal story shouldn't open with @mention spam. D3 thread = first @circlefin tag.
- Voice consistency check: dùng "I" trong EN main (translation của "mình"), KHÔNG dùng "we" / "our team" (1-người-build narrative). VN quote-tweet dùng "mình" như sample.
- This is the ONLY narrative confession in W1. D5 freed up for regular content (was the Arc Discord helpful reply slot — keep that, drop the embedded confession).

---

### Day 2 — Tue May 12

**@baobao_gems X (AIG content)** (1 post — VN Community):
- **Pillar**: VN Community
- **Format**: TG @baobaogemschat announcement
- **Hook**: `Mình vừa ship AIG — Arc Invisible Gateway. Dự án payment crypto đầu tiên của người VN trên Arc Network. Code mở, có thể fork ngay hôm nay.`
- **Body skeleton**:
  - Arc Network là gì — Circle (USDC), chain ID 212, CCTP Domain 7
  - AIG làm gì — BSC token → USDC trên Arc, không cần KYC
  - Fork-ready: clone repo, 30 phút là chạy được testnet
  - Demo live: `https://aig-frontend-blond.vercel.app/dashboard`
  - Có thể hỏi mình trực tiếp bằng tiếng Việt
- **CTA**: `GitHub: [link] | Demo: https://aig-frontend-blond.vercel.app/dashboard | Hỏi trong group này — mình trả lời trong 24h`
- **Channel**: TG @baobaogemschat

**@baobao_gems**: User-driven personal content

**Notes**: Activation Play 4 (TG launch). Conversational, not announcement-blast. "Mình" throughout. No emojis per AIG voice.

---

### Day 3 — Wed May 13

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: Thread EN (5 tweets) — PROOF-OF-WORK thread
- **Hook**: `Shipped AIG to Arc testnet in 24h. Here's what we learned about CCTP Domain 7. Thread.`
- **Body skeleton**:
  - Tweet 2: What's AIG — BSC any-token → USDC on Arc; VN merchant first; 100M+ VN population, zero stablecoin payment infra
  - Tweet 3: Architecture — `SwapRouter.sol` (BSC) `0xa8cea8fa47874c688511cb1d72aa86a4b3c583a7` → CCTP TokenMessenger → Arc MessageTransmitter.receiveMessage → USDC mint; domain routing to Arc domain 7. Deploy tx: `0xac33606531c478760b8776ee8b862476df548fe423e3cb1c7765b163700dfeab` (BSCscan verify)
  - Tweet 4: Build timeline — 2h contract, 4h API, 6h UI, 12h testnet fixes; 7 production commits post-launch (e7b0cde, 6146088, 46af981)
  - Tweet 5: What broke — CCTP attestation latency (added exponential backoff polling in `scripts/test-cctp-domain7.ts`); PancakeSwap V3 slippage guard in `lib/agent.ts`; Vercel cold starts → pre-warm
  - Tweet 6: Live now. Every VN dev needs a proof-of-work Arc example. GitHub + Vercel + contract live on BSC testnet.
- **CTA**: `Code: https://github.com/baobaogems/aig | Demo: https://aig-frontend-blond.vercel.app/dashboard | Arc VN community: @baobaogemschat`
- **Channel**: X EN — tag @circlefin in tweet 1

**@baobao_gems**: User-driven personal content

**Notes**: Activation Play 2. This is the highest-leverage post of Week 1. Schedule for 9am Vietnam time (UTC+7) — Arc team Bay Area wakes to it in their feed. Monitor for RT/reply within 48h.

---

### Day 4 — Thu May 14

**@baobao_gems X (AIG content)** (1 post — Use Case Demo):
- **Pillar**: Use Case Demo
- **Format**: Single tweet VN with screenshot
- **Hook**: `Làm thế nào để merchant VN nhận USDC mà không cần hiểu bridge/swap?`
- **Body skeleton**:
  - Step 1: Merchant connect ví → dashboard `/dashboard` → QR code tự tạo
  - Step 2: Khách scan QR → trang `/pay/[id]` → thấy fee breakdown rõ ràng
  - Step 3: Khách ký SwapRouter.swapAndBridge() → SSE real-time tiến trình
  - Step 4: Merchant nhận USDC trên Arc — không cần biết bridge là gì
  - Screenshot: dashboard stat cards + payment progress bar
- **CTA**: `Test trên testnet: https://aig-frontend-blond.vercel.app/dashboard | Hỏi thêm: @baobaogemschat`
- **Channel**: X VN

**@baobao_gems**: User-driven personal content

---

### Day 5 — Fri May 15

> **Revised 2026-05-06**: Narrative confession originally on D5 → moved to D1. D5 is now Build-in-Public commit highlight + Arc Discord observe continuation.

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: Single tweet EN — commit highlight
- **Hook**: `Pushed commit e7b0cde: API now returns 500-graceful errors instead of unhandled exceptions. Boring fix. Mattered for production.`
- **Body skeleton**:
  - Before: dashboard crashed on Supabase connection error → blank page
  - After: error boundary catches, logs, shows merchant-friendly message
  - Why this is a launch signal: production code = post-launch maintenance, not 1-time hack
  - Link: commit `e7b0cde` on GitHub
- **CTA**: `Commit: https://github.com/baobaogems/aig/commit/e7b0cde`
- **Channel**: @baobao_gems X (EN, AIG voice)

**Arc Discord** (continued observe — W1 day 5):
- **Format**: STILL observe-only mode. No posting yet.
- **Action**: Note any builders asking CCTP/USDC questions → save for W2 first helpful reply (D8).

**@baobao_gems**: User-driven personal/alpha content

**Notes**: D5 used to host narrative confession #1 — that moved to D1. D5 now = lightweight Build-in-Public commit signal. Arc Discord stays in observe mode through end of W1.

---

### Day 6 — Sat May 16

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: Single tweet EN — Reference implementation thread (Activation Play 3)
- **Hook**: `AIG is an open-source CCTP Domain 7 reference implementation. If you're integrating Arc, this saves ~10 hrs.`
- **Body skeleton**:
  - SwapRouter.sol — minimal, auditable, <200 lines
  - `/api/agent/execute` — SSE streaming (better UX than webhook callbacks)
  - `scripts/test-cctp-domain7.ts` — 7-step smoke test showing full CCTP message flow
  - Fork for Polygon/Ethereum/Arbitrum CCTP: change router address in SwapRouter.sol
  - Invite: "RT if this helps your Arc build"
- **CTA**: `Code: https://github.com/baobaogems/aig | Fork + adapt for your region`
- **Channel**: X EN — tag Arc peer builders (UnitFlow, Lynn TheLight if active)

**@baobao_gems**: User-driven personal content

---

### Day 7 — Sun May 17

**@baobao_gems X (AIG content)** (1 post — Arc Explainer VN):
- **Pillar**: Arc Explainer VN
- **Format**: TG @baobaogemschat explainer
- **Hook**: `Arc Network là gì — giải thích bằng tiếng Việt, không dùng jargon.`
- **Body skeleton**:
  - Circle là ai (làm ra USDC)
  - Arc là blockchain của Circle — chain ID 212, USDC-native fees, finality ~30 giây
  - Tại sao Arc tốt hơn BSC cho merchant: fees cố định (không phải gas spike), USDC settlement trực tiếp, không Tether risk
  - CCTP là gì — cross-chain bridge protocol của Circle, AIG dùng domain 7
  - AIG là ví dụ đầu tiên của dev VN xây trên Arc
- **CTA**: `Câu hỏi? Hỏi thẳng trong group này. Mình ở đây.`
- **Channel**: TG @baobaogemschat

**@baobao_gems**: User-driven personal content

---

## WEEK 2 — DEEPEN

### Day 8 — Mon May 18

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: Single tweet EN — GitHub good-first-issues announcement (Activation Play 5)
- **Hook**: `AIG repo now has 2 good-first-issues for Arc builders. Fork this, learn CCTP, ship something.`
- **Body skeleton**:
  - Issue 1: "Add USDT-to-USDC bridge on Polygon" — change PancakeSwap → Uniswap V3 router in SwapRouter.sol
  - Issue 2: "Translate README to Vietnamese (README.vi.md)" — no code required
  - Both issues: estimated 2–4 hrs, documented steps, responses in Vietnamese ok
  - Invite: "PR reviewed in 24h. Your name in contributors."
- **CTA**: `GitHub issues: [link] | Questions: @baobaogemschat`
- **Channel**: @baobao_gems X (EN, AIG voice)

**Arc Discord** (Play 4 — FIRST helpful reply):
- After 1 week of pure observation, post 1 helpful technical reply in #builders or #general.
- **Constraint**: Pick a question about CCTP / USDC bridging / Arc deployment that you can answer with code snippet. NO mention of AIG. Just be helpful.
- Use real handle, real expertise. Goal: establish presence as helpful contributor BEFORE any self-mention or DM.
- Track: did Arc team member react / acknowledge? (sets baseline for D14 DM)

**@baobao_gems**: User-driven personal content

---

### Day 9 — Tue May 19

**@baobao_gems X (AIG content)** (1 post — Arc Explainer VN):
- **Pillar**: Arc Explainer VN
- **Format**: Single tweet VN
- **Hook**: `CCTP Domain 7 là gì? Tại sao AIG dùng nó thay vì bridge thông thường?`
- **Body skeleton**:
  - CCTP = Circle Cross-Chain Transfer Protocol — bridge "native" USDC (không wrap)
  - Domain 7 = Arc Network trong CCTP routing table
  - Tại sao tốt hơn: không wrap token → không smart contract risk thêm; attestation từ Circle = finality đáng tin
  - AIG flow: BSC SwapCompleted event → extract MessageSent log → poll Circle attestation API → Arc MessageTransmitter.receiveMessage
  - Code thật: `scripts/test-cctp-domain7.ts` — 7 bước, public trên GitHub
- **CTA**: `Code: https://github.com/baobaogems/aig/blob/main/scripts/test-cctp-domain7.ts`
- **Channel**: X VN + cross-post TG

---

### Day 10 — Wed May 20

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: Single tweet EN — quote-tweet peer builder (Activation Play 7, round 1)
- Scan Arc Discord / X for a builder who shipped something this week
- **Template**: `@[builder] great work on [project]. If you're using USDC settlements, AIG's CCTP integration (https://github.com/baobaogems/aig) might save you bridge logic time. VN-native but architecture is chain-agnostic.`
- **Channel**: X EN

**Arc Discord**: Post 1 helpful technical reply in any Arc builder channel. No links to AIG.

**@baobao_gems**: User-driven personal content

---

### Day 11 — Thu May 21

**@baobao_gems X (AIG content)** (1 post — Use Case Demo):
- **Pillar**: Use Case Demo
- **Format**: Single tweet EN with screenshot/screen recording
- **Hook**: `AIG /api/agent/execute uses SSE streaming, not webhooks. Here's why — and what the event stream looks like.`
- **Body skeleton**:
  - Why SSE over webhooks: no callback URL needed from merchant, real-time UX without polling, simpler merchant integration
  - Event sequence: `swap_executing` → `bridging` → `confirmed` (or `bridge_delayed`)
  - Code snippet: SSE endpoint signature from `/api/agent/execute`
  - Screenshot: `payment-progress-bar.tsx` in action showing live state transitions
- **CTA**: `Code: https://github.com/baobaogems/aig/blob/main/app/api/agent/execute`
- **Channel**: X EN

**@baobao_gems**: User-driven personal content

---

### Day 12 — Fri May 22

**@baobao_gems X (AIG content)** (1 post — Arc Discord):
- **Format**: Arc Discord — if any VN-related conversation or Arc testnet questions, respond. Otherwise maintain helpful presence.

**@baobao_gems X** — NARRATIVE CONFESSION #2:
- **Hook**: `MÌNH ĐÃ PUSH 7 PRODUCTION FIXES SAU KHI "LAUNCH". ĐÂY LÀ NHỮNG GÌ THẬT SỰ XẢY RA KHI SHIP.`
- **Body skeleton**:
  - Setup: Tưởng launch = xong. Thực tế: 7 commits trong 1 tuần sau
  - Fixes thật: e7b0cde (API 500 graceful handling), 6146088 (UX), 46af981 (security)
  - Reflection: "Ship không phải kết thúc. Ship là bắt đầu của vòng lặp fix-test-fix."
  - Bridge: Mỗi commit là proof AIG vẫn đang được maintain — không phải abandoned repo
  - 1 link: git log public trên GitHub
- **CTA**: Không CTA — kết bằng principle về maintenance mindset
- **Channel**: @baobao_gems X (VN)

---

### Day 13 — Sat May 23

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: Single tweet EN
- **Hook**: `AIG database schema: 4 tables, 3 migrations. Here's how we track payments across BSC → Arc.`
- **Body skeleton**:
  - `payment_sessions` — session_id (hex 32B), status, bridge_mode, swap_params (JSONB cache — no recalculation drift)
  - `merchants` — wallet_address (pk), auto-registered on dashboard connect
  - `points_ledger` + `points_balance` — merchant engagement metrics
  - Migration: `003_create_merchants_table.sql` (GitHub link)
  - Design decision: swap_params JSONB cache → /execute uses cached values, no re-quote risk during bridge latency
- **CTA**: `Schema: https://github.com/baobaogems/aig/blob/main/supabase/migrations/`
- **Channel**: X EN

**@baobao_gems**: User-driven personal content

---

### Day 14 — Sun May 24 — **PIVOTAL: First Arc Discord DM (Play 6)**

**@baobao_gems X (AIG content)** (1 post — Arc Explainer VN):
- **Pillar**: Arc Explainer VN
- **Format**: TG @baobaogemschat + X VN
- **Hook**: `CÀI ARC CLI TRONG 5 PHÚT — HƯỚNG DẪN TIẾNG VIỆT`
- **Sub-hook**: `Arc CLI không có docs tiếng Việt. Mình dịch và test từng bước.`
- **Body skeleton** (source: `docs/arc-toolkit-notes.md`):
  - Cài đặt: `npm i -g @axiom-labs/arc-cli` — single Rust binary, startup <20ms, Win/macOS/Linux không cần lib ngoài
  - Config: `arc init` — khởi tạo cấu hình ARC cho codebase
  - First command: `arc chat` — phiên làm việc tương tác đầu tiên với AI agent
  - Troubleshoot: npm global perms, PATH chưa có binary, runtime adapter mismatch
- **Insight mapping**: Behavior (how-to step-by-step) + Pain (docs Arc chỉ có tiếng Anh, khó cho dev VN)
- **CTA**: `Notes đầy đủ: docs/arc-toolkit-notes.md | Hỏi: @baobaogemschat`
- **Channel**: TG @baobaogemschat + X VN

**Arc Discord** (Play 6 — FIRST DM):
- **Format**: DM to Arc DevRel / Ecosystem Lead identified during W1-W2 observation
- **Pre-condition met**: D3 thread + D6 ref impl + D8 helpful reply visible (2 weeks public proof established)
- **Message template** (adapted from `arc-team-member.md` Play 1):
  ```
  Hi [name],
  
  I've been observing in #builders for 2 weeks. AIG (Arc Invisible Gateway) is a VN-native stablecoin payment layer using CCTP Domain 7. Built it in 24h, ran 7 production fixes since.
  
  - Contract on BSC Testnet: 0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3
  - Demo: https://aig-frontend-blond.vercel.app/dashboard
  - Reference impl thread: <paste D3 thread URL after publishing>
  
  Why DM: targeting 100M+ VN devs — uncontested in your ecosystem. Happy to walk through CCTP Domain 7 flow live if 15 min works.
  
  — Bao Bao (@baobao_gems)
  ```
- **Constraints**: NOT cold (references public posts). Specific 15-min ask. Real proof points. No sales pitch.

---

## WEEK 3 — AMPLIFY

### Day 15 — Mon May 25

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: Single tweet EN
- **Hook**: `AIG's SwapRouter.sol: 3 key design decisions that make CCTP work reliably.`
- **Body skeleton**:
  - Decision 1: `exactOutputSingle` (output-based swap) — merchant always receives exact USDC target, slippage absorbed by `amountInMax`
  - Decision 2: `dualMode` — CCTP primary path / ADMIN_RELAY fallback; switch via env var, no code change
  - Decision 3: BNB auto-wrap WBNB → allows native BNB as payment input without pre-approval
  - Contract: BSC Testnet, source on GitHub (public, auditable)
- **CTA**: `Contract: https://github.com/baobaogems/aig/blob/main/contracts/src/SwapRouter.sol`
- **Channel**: X EN

**@baobao_gems**: User-driven personal content

---

### Day 16 — Tue May 26

**@baobao_gems X (AIG content)** (1 post — Arc Explainer VN):
- **Pillar**: Arc Explainer VN
- **Format**: X VN thread (step by step)
- **Hook**: `ARC TOOLKIT: DEPLOY CONTRACT BẰNG CLI — STEP BY STEP`
- **Sub-hook**: `Mình deploy SwapRouter.sol bằng Arc CLI. Đây là mỗi bước.`
- **Body skeleton** (source: `docs/arc-toolkit-notes.md`):
  - Init project: `arc init` trong thư mục contract
  - Compile: agent tự lập kế hoạch + biên dịch SwapRouter.sol
  - Deploy: chạy deploy lên BSC Testnet qua phiên `arc chat`
  - Verify: `arc graph index` + `arc graph search` xác minh hàm/contract; check tx trên explorer
- **Insight mapping**: Behavior (deploy step-by-step) + Desire (dev VN muốn deploy được contract thật)
- **CTA**: `Code: https://github.com/baobaogems/aig | Notes: docs/arc-toolkit-notes.md`
- **Channel**: X VN

**Arc Discord**: Post helpful reply / answer builder question. If relevant opportunity: share AIG as reference (only if directly answers the question).

---

### Day 17 — Wed May 27

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: X EN — quote-tweet peer builder (Activation Play 7, round 2)
- Follow same template as Day 10. Target: Arc Discord builder who shipped this week.
- **Channel**: X EN

**@baobao_gems**: User-driven personal content

---

### Day 18 — Thu May 28

**@baobao_gems X (AIG content)** (1–2 posts — Use Case Demo):
- **Pillar**: Use Case Demo
- **Format**: Demo video (20–30 min, YouTube or TG) — Activation Play 6
- **Hook (video title)**: `AIG on Arc Testnet — Clone, Deploy, Execute in 30 Minutes`
- **Video outline**:
  - 00:00–03:00: What's Arc, what's AIG (architecture diagram, no jargon)
  - 03:00–08:00: Clone AIG + walk through SwapRouter.sol — key functions explained
  - 08:00–14:00: Deploy to BSC Testnet, run smoke test `scripts/test-cctp-domain7.ts`
  - 14:00–22:00: Execute payment: `/pay/[id]` → sign → SSE stream → Arc USDC confirmed
  - 22:00–28:00: Fork walkthrough — change merchant wallet, change token, redeploy
  - 28:00–30:00: Q&A invitation, @baobaogemschat link
- Post X EN tweet: "AIG full demo: Arc testnet payment in 30 min. [YouTube link]"
- Post TG: Same video link with VN description
- **CTA X**: `Video: [YouTube link] | Code: https://github.com/baobaogems/aig`
- **CTA TG**: `Xem demo: [YouTube link] | Fork trong 30 phút: https://github.com/baobaogems/aig`
- **Channel**: X EN + TG @baobaogemschat

**@baobao_gems**: User-driven personal content

---

### Day 19 — Fri May 29

**@baobao_gems X (AIG content)** (1 post — VN Community):
- **Pillar**: VN Community
- **Format**: TG @baobaogemschat — VN builders shoutout (Activation Play 8, round 1)
- Highlight any VN dev who forked AIG, asked GitHub issue, or posted testnet tx this week
- If no forks yet: post "VN Builders on Arc — Week 2 Update" with AIG metrics (GitHub stars, demo views, TG questions)
- **Hook**: `VN Builders trên Arc — update tuần này.`
- **Body skeleton**:
  - [If applicable] Shoutout dev by GitHub handle + what they shipped
  - AIG metrics this week: demo views, GitHub clones, TG questions answered
  - Invitation: "Ship gì đó trên Arc testnet tuần tới → mình shoutout trong group"
- **CTA**: `Fork AIG: https://github.com/baobaogems/aig | Post tx hash vào group = shoutout`
- **Channel**: TG @baobaogemschat

**@baobao_gems**: User-driven personal content

---

### Day 20 — Sat May 30

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: X EN single tweet
- **Hook**: `AIG's points system: why we track merchant engagement on-chain.`
- **Body skeleton**:
  - `/api/points` returns `{totalPoints, tier}` from `points_balance` table
  - `points_ledger` tracks per-tx points — auditable history
  - Business logic: incentivize merchants to process volume → drive AIG network effect
  - Tier card: `points-tier-card.tsx` on dashboard
  - Phase 2 plan: points distribution to affiliates who refer merchants
- **CTA**: `Code: https://github.com/baobaogems/aig/blob/main/lib/points.ts`
- **Channel**: X EN

**@baobao_gems X** — NARRATIVE CONFESSION #3:
- **Hook**: `MÌNH XÂY AIG CHO NGƯỜI VIỆT. KHÔNG PHẢI ĐỂ "MO LÊN".`
- **Body skeleton**:
  - Crypto OG thấy gì: mọi dự án đều pitch cho Western devs, EN only
  - Nhận ra: 100M người Việt, 0 Arc coverage bằng tiếng Việt — đây là vị thế trống
  - Không phải charity — đây là asymmetric play: first mover VN × Arc community
  - AIG là proof: community @baobaogemschat đang học Arc nhờ có code bằng VN
  - Link @baobaogemschat TG
- **CTA**: Không CTA — kết bằng câu về first mover advantage và cộng đồng
- **Channel**: @baobao_gems X (VN)

---

### Day 21 — Sun May 31

**@baobao_gems X (AIG content)** (1 post — Arc Explainer VN):
- **Pillar**: Arc Explainer VN
- **Format**: X VN + TG
- **Hook**: `Arc Network ra mainnet 2026. Dev VN nên chuẩn bị gì ngay bây giờ?`
- **Body skeleton**:
  - Mainnet target Q4 2026 — testnet window là bây giờ để xây portfolio
  - Arc team đang theo dõi early builders — RT, pin, ecosystem feature đều có thật
  - Ecosystem còn trống: 100+ partners toàn institutional, gần như không có indie VN builder
  - AIG là gateway: fork → customize → deploy → có Arc testnet tx trong portfolio
  - First mover advantage: builder #1 từ VN trên Arc mainnet sẽ được Circle feature
- **CTA**: `Clone AIG, deploy ngay hôm nay: https://github.com/baobaogems/aig | Community: @baobaogemschat`
- **Channel**: X VN + TG @baobaogemschat

---

## WEEK 4 — CONVERT

### Day 22 — Mon Jun 1

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: X EN single tweet — 3-week build-in-public milestone
- **Hook**: `3 weeks of AIG in public. Here's where we are.`
- **Body skeleton**:
  - Technical: SwapRouter.sol live, 3 API endpoints, 7+ prod fixes, CCTP Domain 7 working
  - Community: [N] VN devs in @baobaogemschat, [N] GitHub stars, [N] demo views
  - Builder signal: [N] forks, [N] good-first-issue contributors
  - Honest gap: 0 mainnet merchants, Phase 2 not started — stated plainly
  - Next: first merchant onboarding + Phase 2 planning
- **CTA**: `Repo: https://github.com/baobaogems/aig | Demo: https://aig-frontend-blond.vercel.app/dashboard`
- **Channel**: X EN

---

### Day 23 — Tue Jun 2

**@baobao_gems X (AIG content)** (1 post — Arc Explainer VN):
- **Pillar**: Arc Explainer VN
- **Format**: X VN single tweet + TG (cheat sheet — bảng)
- **Hook**: `ARC CLI COMMANDS — CHEAT SHEET TIẾNG VIỆT`
- **Sub-hook**: `Tổng hợp tất cả commands Arc CLI mình dùng khi build AIG.`
- **Body skeleton** (source: `docs/arc-toolkit-notes.md`):
  - Bảng commands: `arc init` (khởi tạo config) · `arc chat` (phiên agent tương tác) · `arc review` (auto review PR) · `arc graph index` / `arc graph search` (index + tìm code) · `arc dashboard` (web giám sát realtime)
  - Ví dụ: mỗi command kèm 1 use case thật khi build AIG
  - Lỗi hay gặp: quên `arc init` trước khi chat, graph chưa index, npm global perms
- **Insight mapping**: Behavior (reference/cheat sheet) + Pain (dev hay quên commands, phải tra lại)
- **CTA**: `Notes: docs/arc-toolkit-notes.md | Hỏi: @baobaogemschat`
- **Channel**: X VN + TG @baobaogemschat

---

### Day 24 — Wed Jun 3

**@baobao_gems X (AIG content)** (1 post — Use Case Demo):
- **Pillar**: Use Case Demo
- **Format**: X EN single tweet with screen recording
- **Hook**: `AIG merchant dashboard: connect wallet, generate QR, receive USDC. Demo.`
- **Body skeleton**:
  - Screen recording: wallet connect → auto-register merchant → QR generate
  - Stat cards: totalRevenue, transactionCount, successRate, recentVolume from `/api/dashboard`
  - Real-time payment feed: Supabase subscription → live table update
  - Points tier card showing current tier
  - Note: 0 real merchants yet — this is testnet demonstration
- **CTA**: `Test dashboard: https://aig-frontend-blond.vercel.app/dashboard`
- **Channel**: X EN

**Arc Discord**: Week 4 heightened presence — answer any CCTP/merchant payment questions.

---

### Day 25 — Thu Jun 4

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: X EN single tweet — merchant onboarding pitch (first merchant hunt)
- **Hook**: `Looking for AIG's first merchant. BSC-based, crypto-accepting, willing to test Arc USDC settlement.`
- **Body skeleton**:
  - What they get: customer pays any BSC token → merchant receives USDC on Arc
  - Setup: connect wallet, generate QR — 10 minutes
  - Risk: testnet only, no mainnet yet — honest
  - What we want: 1 real merchant tx to prove demand to Arc team
  - DM open
- **CTA**: `DM me or @baobaogemschat if you're a merchant willing to test`
- **Channel**: X EN

**TG @baobaogemschat**: Same merchant hunt post in Vietnamese.

---

### Day 26 — Fri Jun 5

**@baobao_gems X (AIG content)** (1 post — Use Case Demo):
- **Pillar**: Use Case Demo
- **Format**: X VN — merchant-facing explainer
- **Hook**: `Merchant VN nhận USDC trên Arc: cần gì? Chỉ cần 1 ví crypto.`
- **Body skeleton**:
  - Không cần tài khoản ngân hàng đặc biệt
  - Không cần KYC
  - Setup: kết nối ví MetaMask → `/dashboard` → QR code sẵn sàng
  - Khách trả bằng BNB/token BSC → merchant nhận USDC on Arc trong 30 giây
  - Phase 2 plan: webhook notifications khi nhận payment
- **CTA**: `Thử ngay: https://aig-frontend-blond.vercel.app/dashboard | Câu hỏi: @baobaogemschat`
- **Channel**: X VN

**@baobao_gems**: User-driven personal content

---

### Day 27 — Sat Jun 6

**@baobao_gems X (AIG content)** (1 post — Arc Explainer VN):
- **Pillar**: Arc Explainer VN
- **Format**: TG @baobaogemschat — "VN builders on Arc" round 2
- Full shoutout update: name every VN dev who has forked, deployed, or contributed in the 30 days
- **Hook**: `VN Builders on Arc — tổng kết tháng đầu tiên.`
- **Body skeleton**:
  - List mọi VN dev đã ship gì đó liên quan Arc/AIG (GitHub + tx hash nếu có)
  - Metrics: GitHub stars, forks, demo views, TG members growth
  - Ghi nhận cả người đặt câu hỏi + học — community contribution quan trọng ngang ship
  - Preview: tháng tới AIG hướng đến Phase 2 (multi-chain) nếu có merchant signal
- **CTA**: `Bạn muốn được shoutout? Deploy gì đó trên Arc testnet + post tx hash vào đây`
- **Channel**: TG @baobaogemschat

---

### Day 28 — Sun Jun 7

**@baobao_gems X (AIG content)** (1 post — Build-in-Public):
- **Pillar**: Build-in-Public
- **Format**: X EN — Arc team direct signal post (Activation Play 9, part 1)
- **Hook**: `28 days of building AIG in public. Here's the VN Arc community signal.`
- **Body skeleton**:
  - Technical proof: SwapRouter.sol, CCTP Domain 7 live, 7+ prod fixes, 3 API endpoints, Vercel
  - Community proof: [N] VN devs learning Arc, [N] forks, [N] TG members
  - VN TAM: zero VN-language Arc coverage when AIG started. Now: [N] VN devs have shipped/attempted Arc
  - Explicit ask framing: "Looking for VN community builder role in Arc ecosystem"
  - No groveling — proof speaks. One clear ask at the end.
- **CTA**: `GitHub: [link] | Demo: https://aig-frontend-blond.vercel.app/dashboard | Arc community for VN devs: @baobaogemschat`
- **Channel**: X EN — tag @circlefin

**@baobao_gems X** — NARRATIVE CONFESSION #4:
- **Hook**: `MÌNH TÌM ĐƯỢC MERCHANT ĐẦU TIÊN CHO AIG CHƯA? THÀNH THẬT MÀ NÓI...`
- **Body skeleton**:
  - Honest: chưa có merchant (0 là 0)
  - Nhưng: đã có [N] VN dev học Arc nhờ AIG, [N] fork, demo chạy được
  - Insight: community trước, merchant sau — không phải ngược lại
  - Bridge: đang tìm merchant VN thử nghiệm testnet — nếu bạn có quen ai
  - 1 link: AIG dashboard demo
- **CTA**: Không CTA hard — "Nếu bạn biết merchant VN nào muốn thử, DM mình"
- **Channel**: @baobao_gems X (VN)

---

### Day 29 — Mon Jun 8

**@baobao_gems X (AIG content)** (1 post — Use Case Demo):
- **Pillar**: Use Case Demo
- **Format**: X EN — Phase 2 teaser / roadmap transparency
- **Hook**: `AIG Phase 1: done. Phase 2: not started. Here's what we're planning — and what's blocking us.`
- **Body skeleton**:
  - Phase 1 shipped: SwapRouter.sol, 3 endpoints, dashboard, CCTP Domain 7, 7 prod fixes
  - Phase 2 targets: multi-chain (Polygon, Ethereum, Arbitrum), points distribution, webhook notifications
  - Blocker: no first merchant signal yet → Phase 2 spec depends on real usage data
  - Honest ask: "If you're building on Arc and need CCTP reference — use AIG. If you're a merchant — DM."
  - Roadmap public: `roadmap_AIG.json` on GitHub
- **CTA**: `Roadmap: https://github.com/baobaogems/aig/blob/main/roadmap_AIG.json | Demo: https://aig-frontend-blond.vercel.app/dashboard`
- **Channel**: X EN

**Arc Discord** (Play 10 — second DM, recap + mod role ask):
- **Format**: DM follow-up to D14 contact (or new DM if D14 unanswered)
- **Reference**: link D30 30-day recap thread (publishing tomorrow)
- **Ask**: explicit — "VN community contributor / mod role discussion. AIG = proof-of-work, @baobaogemschat = audience signal. 15 min next week?"
- **Attach**: GitHub link, Vercel demo, count of VN devs engaged in TG (real numbers only)

---

### Day 30 — Tue Jun 9

**@baobao_gems X (AIG content)** (1 post — VN Community):
- **Pillar**: VN Community
- **Format**: X EN thread (final 30-day recap) + TG VN message
- **X EN Thread Hook**: `30 days building AIG in public on Arc. Final numbers. @circlefin`
- **Thread body**:
  - Tweet 2: What shipped — SwapRouter.sol, CCTP Domain 7, 3 APIs, Vercel, 7 prod fixes, merchant dashboard
  - Tweet 3: VN community signal — [N] devs learning Arc, [N] forks, [N] testnet deployments, [N] TG members
  - Tweet 4: Uncontested position — zero VN Arc coverage confirmed when we started. Now: first VN Arc builder cohort.
  - Tweet 5: Ask — "Looking for VN community moderator role in Arc ecosystem. AIG is the proof-of-work. DM or reply."
  - Tweet 6: GitHub + Vercel + @baobaogemschat links
- **CTA**: `DM for Arc mod role discussion | Repo: https://github.com/baobaogems/aig | VN community: @baobaogemschat`
- **Channel**: X EN — tag @circlefin

**TG @baobaogemschat** (Day 30 VN recap):
- **Hook**: `30 ngày AIG — tổng kết và bước tiếp theo.`
- **Body**: Same metrics in Vietnamese. Thank the community. Preview Phase 2 if merchant signal exists. Commitment to continue.
- **CTA**: `Tiếp tục build cùng mình: @baobaogemschat | Fork AIG: https://github.com/baobaogems/aig`

**@baobao_gems**: User-driven personal content (no AIG mention — Day 28 was the last confession)

**Notes**: This is the conversion day. X EN thread + TG VN recap + Arc Discord DM all fire today or within 24h. Monitor Arc team response closely in next 48h.

---

## Post Count Summary

| Pillar | Posts |
|--------|-------|
| Build-in-Public | 12 |
| Arc Explainer VN | 8 |
| Use Case Demo | 6 (incl. 1 video on D18, 1 screen recording on D24) |
| VN Community | 4 |
| **AIG Total** | **30** |
| @baobao_gems narrative confession | 4 (D5, D12, D20, D28) |

| Channel | Posts |
|---------|-------|
| X EN (AIG voice) | 17 |
| X VN (AIG voice) | 7 |
| TG @baobaogemschat | 8 |
| Arc Discord | Ongoing (min 12 helpful replies + 2 formal posts) |
| @baobao_gems X (confession) | 4 |
