# DAY 4 — Thu 14 May 2026 — Use Case Demo (AIG voice, bilingual)

> **Pillar**: Use Case Demo
> **Voice**: AIG voice (Builder / honest / technical / proof-driven) — NOT @baobao_gems VN colloquial
> **Format**: X Premium Long EN main post + VN quote-tweet ~5 min later
> **Insights hit** (per references/7-customer-insights.md): **Desire** (merchant muốn nhận USDC dễ) + **Behavior** (show 4-step flow)
> **Proof points**: contract BSC Testnet (full URL) + Vercel demo + GitHub repo + dashboard screenshot (attach when publishing)
> **Schedule recommend**: 9am Vietnam time (UTC+7) — Arc/Circle Bay Area wakes to it

---

## EN main post (X Premium Long, ~1500 chars)

YOUR MERCHANT DOESN'T NEED TO KNOW WHAT CCTP IS. THEY JUST NEED A WALLET.

I built AIG for VN merchants who want to accept USDC on Arc without learning bridge / swap / attestation / Domain 7. Connect wallet, generate QR, get paid. Four steps. That's it.

The flow:

1. Merchant connects wallet at /dashboard. Auto-registered in `merchants` table on first connect. QR code generated from session_id.

2. Customer scans QR → lands on /pay/[id]. Sees fee breakdown: input token, slippage, CCTP attestation time, USDC output. No surprises.

3. Customer signs SwapRouter.swapAndBridge() on BSC. SSE stream from /api/agent/execute pipes live state: swap_executing → bridging → confirmed.

4. Merchant sees USDC settle on Arc explorer. Domain 7 mint complete. Total time: ~60-90 seconds.

What the merchant never has to know: CCTP Domain 7 routing, attestation polling, slippage guards, cold-start handling. All abstracted in SwapRouter.sol + /api/agent/execute.

Proof:

Contract (BSC Testnet): https://testnet.bscscan.com/address/0xa8cea8fa47874c688511cb1d72aa86a4b3c583a7

Live demo: https://aig-frontend-blond.vercel.app/dashboard

Code: https://github.com/baobaogems/aig

This is what Use Case Demo means — not a slide deck, an actual flow you can run on testnet right now. Connect a wallet to /dashboard. See the QR. Try paying yourself from a second wallet. Watch the SSE stream.

If you're building merchant payments on Arc, fork the contract. amountInMax-guarded output swap means the merchant always gets the exact USDC they quoted. No price drift from attestation delay.

Built in 24h. 7 production fixes since. The hardest part wasn't the contract — it was making CCTP invisible to the merchant.

---

## VN quote-tweet (~720 chars)

Tóm tắt VN của bài EN trên:

Merchant VN không cần học bridge / swap / CCTP. Chỉ cần một ví crypto. AIG gói toàn bộ CCTP Domain 7 thành 4 bước:

1. Merchant kết nối ví → /dashboard tự tạo QR code

2. Khách scan QR → /pay/[id] thấy fee breakdown rõ ràng: input token, slippage, attestation time, USDC output

3. Khách ký giao dịch → SSE stream live: swap_executing → bridging → confirmed

4. Merchant nhận USDC trên Arc explorer. Tổng tầm 60-90 giây.

Cái merchant không cần biết: CCTP Domain 7 routing, attestation polling, slippage guard. Tất cả ẩn trong contract.

Test demo: https://aig-frontend-blond.vercel.app/dashboard
Code: https://github.com/baobaogems/aig
Hỏi tiếng Việt: @baobaogemschat

---

## Voice + insight checklist

### AIG voice compliance
- [x] No emoji (per §4 — AIG voice bans 🚀 💎 🔥 💰 and even semantic 🫡 ⚡️ which are @baobao_gems VN-side)
- [x] ALL CAPS hook at top (reversal pattern: expectation "merchant needs to learn CCTP" → flip "just needs a wallet")
- [x] Concrete numbers (60-90s, 24h, 7 production fixes, 4 steps, Domain 7)
- [x] Full clickable proof URLs (bscscan + vercel + github — applies §12.10 news-jacking rule about full URLs to this post too)
- [x] Technical specifics name real files/endpoints (SwapRouter.sol, /api/agent/execute, /pay/[id], /dashboard, session_id, amountInMax, merchants table, SSE)
- [x] Honest about hard part ("hardest part wasn't the contract — it was making CCTP invisible")
- [x] No @baobao_gems VN slang in EN (no "kèo", "anh em", "ăn nhau"); VN quote-tweet uses declarative AIG-VN, not colloquial

### Insight check (per 7-customer-insights.md)
- [x] **Desire** (merchant muốn nhận USDC dễ): Hook flips complicated → simple. Body emphasizes outcome ("just needs a wallet", "no surprises", "USDC settle on Arc explorer").
- [x] **Behavior** (show cách hoạt động): 4-step explicit walkthrough with concrete UI/API references at every step. Reader can mentally simulate the flow.

### Anti-pattern check (adapted from §11 EN Thread + §12 News-Jacking rules)
- [x] No @-tag party critique gap (no @circlefin here — save for D6 reference impl thread)
- [x] Every flow step has concrete reference (file / UI / API)
- [x] Real numbers match real code (60-90s = realistic CCTP attestation window; 24h dev + 7 fixes = consistent with D1 + D3 + bonus posts)
- [x] Closing claim humility hedge: admits what was easy ("hardest part wasn't the contract") — not flexing the hard part
- [x] Single long-form (NOT thread numbering) — Day 4 calendar specified single post, not thread

### Format notes for publish
- **Screenshot REQUIRED**: attach `/dashboard` screenshot (stat cards + payment progress bar mid-flow) to EN main post. Without it, Use Case Demo loses ~30% punch — visual proof is the point of this pillar.
- **No @circlefin tag**: tagged on D3 thread already; save next tag for D6 reference impl post (Activation Play 3).
- **VN quote-tweet timing**: post ~5 min after EN main (same pattern as Day 1). Tag back to EN tweet URL.
- **Avoid markdown URL syntax `[text](url)`** when publishing — X strips it. Use bare URLs (rule from D3 lesson §11.5).

---

## Open questions

1. Screenshot capture — does user have current `/dashboard` screenshot ready, or capture before publishing? If capture needed, suggest mid-flow state showing payment progress bar at `bridging` stage (highest visual interest).
2. "amountInMax-guarded output swap" jargon-dense — counter: EN main post audience = Arc team / devs (9am VN = Bay Area wake), not end merchants. Keep.
3. EN post should also tag a peer Arc builder for cross-pollination? Defer — D6 reserved for that (Activation Play 3). Today is solo demo.
