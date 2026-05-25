# DAY 4 v2 — Thu 14 May 2026 — Use Case Demo (Baobao VN voice, Pain+Desire)

> **Pillar**: Use Case Demo
> **Voice**: @baobao_gems VN long-form (dùng `mình`, `anh em` — NOT AIG technical voice)
> **Format**: Single X Premium Long VN post (~400 words / ~2200 chars)
> **Insights hit** (per references/7-customer-insights.md):
>   - **Pain** (hook + opening): merchant VN muốn nhận crypto nhưng sợ bridge/swap phức tạp
>   - **Desire** (body + outcome): chỉ cần connect ví là nhận USDC
> **Proof points**: demo link + GitHub + @baobaogemschat ở cuối; dashboard screenshot attached
> **Schedule recommend**: 9-10am Vietnam time — peak VN crypto Twitter scroll

---

## Post (copy-paste ready)

MERCHANT VN MUỐN NHẬN USDC NHƯNG SỢ BRIDGE/SWAP/CCTP? MÌNH ĐÃ DẸP HẾT MẤY THỨ ĐÓ TRONG AIG.

=====

Anh em bán hàng online ở VN nhiều người muốn nhận USDC thay vì USDT vì ổn định hơn, ít rủi ro Tether freeze hơn. Nhưng câu hỏi đầu tiên luôn là: "bridge là gì, swap là gì, sao phải qua mấy bước phức tạp vậy?"

Đó chính là vấn đề.

Người bán hàng VN không phải dev. Họ không cần biết CCTP Domain 7 là gì, attestation latency 30-90 giây ra sao, slippage guard hoạt động thế nào. Họ chỉ cần: khách trả tiền → mình nhận USDC → xong.

Mình build AIG (Arc Invisible Gateway) chính cho cái này. 4 bước, không có chữ "bridge" hay "swap" nào xuất hiện với merchant:

⚡️ Bước 1: Merchant connect ví crypto vào dashboard. Tự động có QR code riêng. Khỏi setup, khỏi đăng ký, khỏi KYC.

⚡️ Bước 2: Khách hàng scan QR. Trang thanh toán hiện rõ: trả token gì, phí bao nhiêu, USDC merchant sẽ nhận đúng bao nhiêu. Không ẩn phí.

⚡️ Bước 3: Khách hàng ký giao dịch 1 lần trên ví của họ. Màn hình hiện progress bar live: đang xử lý → đang chuyển → xong.

⚡️ Bước 4: Merchant thấy USDC vào trên Arc explorer. Tầm 60-90 giây từ lúc khách ký.

Cái merchant không cần biết: CCTP Domain 7, attestation, bridge logic, slippage. Tất cả ẩn trong contract mình đã viết, đã test, đã chạy thật trên BSC Testnet.

Tại sao mình làm AIG: VN có gần 100 triệu dân, gần như 0 stablecoin payment infrastructure cho merchant nhỏ. Anh em bán hàng online toàn dùng banking truyền thống + USDT OTC manual. AIG là gateway tự động hóa cái đoạn này, mà không bắt merchant phải học crypto sâu.

Demo chạy được luôn trên testnet. Anh em connect ví thử 2 tài khoản, gửi qua lại, xem flow chạy thật. Không phải slide deck.

Mục tiêu mainnet summer 2026. Bây giờ là thời điểm vọc vạch trước khi thị trường ùa vào.

=====

🛠 Try demo:

Dashboard merchant: https://aig-frontend-blond.vercel.app/dashboard

Code public: https://github.com/baobaogems/aig

Anh em hỏi gì về Arc / CCTP / AIG: vào TG @baobaogemschat trao đổi với mình.

#baobao_gems #AIG #ARC

---

## Voice + insight check

### Baobao VN voice compliance
- [x] `mình` xưng hô (5+ lần) — không `tôi`
- [x] `anh em` cho audience (community/tactical framing)
- [x] ALL CAPS hook reversal — Pain question + flip với "mình đã dẹp hết"
- [x] `=====` divider AFTER hook (per §12 rev 2 rule) + before proof links
- [x] ⚡️ bullets for educational/tactical 4-step list (per §4 hierarchy)
- [x] 🛠 section header before proof links (per §4 rev 2)
- [x] Concrete numbers (4 bước, 30-90s, 60-90s, 100 triệu dân, Q-mainnet)
- [x] Slang light touch: `vọc vạch`, `ùa vào`, `tầm 60-90 giây`
- [x] Anti-hype — no "to the moon", no "gem 100x", no "revolutionary"
- [x] Subject-drop where context clear ("Đó chính là vấn đề.", "Không phải slide deck.")
- [x] Daily-life framing ("anh em bán hàng online", "khách trả tiền — mình nhận USDC — xong")
- [x] Hashtag tail (no `=====` before per §12 rev 2 — but kept here as visual anchor pre-proof since this is product-demo not news-jacking; OK)
- [x] No emoji 🚀 💎 🔥 💰 (banned per §4)

### Plain language — no code jargon in steps (per user req)
- [x] No `SwapRouter.sol`, no `/api/agent/execute`, no `SSE`, no `session_id`, no `amountInMax`
- [x] Step 1: "connect ví" (not "wallet connect"), "QR code riêng" (not "session_id-keyed QR")
- [x] Step 2: "Trang thanh toán" (not "/pay/[id]"), "trả token gì, phí bao nhiêu" (not "fee breakdown")
- [x] Step 3: "Ký giao dịch 1 lần" (not "sign SwapRouter.swapAndBridge()"), "progress bar live" (not "SSE state machine swap_executing→bridging→confirmed")
- [x] Step 4: "USDC vào trên Arc explorer" (not "Domain 7 mint complete")
- [x] Tech jargon only appears in "what merchant doesn't need to know" paragraph — naming the abstracted complexity, not asking reader to understand it

### Insight check (per 7-customer-insights.md)
- [x] **Pain in hook** (per framework "Hook, tiêu đề, content viral"): "MERCHANT VN MUỐN NHẬN USDC NHƯNG SỢ BRIDGE/SWAP/CCTP?" — direct question that names the fear
- [x] **Pain in opening setup**: "câu hỏi đầu tiên luôn là: 'bridge là gì, swap là gì, sao phải qua mấy bước phức tạp vậy?'" — gives voice to the pain
- [x] **Desire throughout body**: "Họ chỉ cần: khách trả tiền → mình nhận USDC → xong", "Khỏi setup, khỏi đăng ký, khỏi KYC", "Không ẩn phí", "không bắt merchant phải học crypto sâu" — repeats simplicity outcome
- [x] **Pain + Desire combo** (per framework combos table): "Kéo → đẩy hành động" — opens with fear, closes with action (demo link)

### Format notes for publish
- **Screenshot REQUIRED**: attach dashboard screenshot (merchant view with QR + stat cards). Use Case Demo without visual loses punch. If capturing fresh, recommend frame showing payment progress bar mid-`bridging` for highest visual interest.
- **Bare URLs**: strip any markdown link syntax before publish (X strips it). Already bare in draft.
- **No @circlefin tag** — saved for D6 reference impl thread.
- **VN-only this version** — no EN quote-tweet. User flagged previous AIG voice EN version as "reads like README". V2 keeps single-language focus.

---

## What changed from v1 (AIG voice EN+VN bilingual)

| Aspect | v1 (AIG voice EN main + VN qt) | v2 (Baobao VN single) |
|---|---|---|
| Voice | Builder/technical/proof-driven AIG | @baobao_gems VN colloquial với `mình` |
| Format | Bilingual: EN long + VN qt ~5min later | VN single long-form |
| Hook | `YOUR MERCHANT DOESN'T NEED TO KNOW WHAT CCTP IS` (English, declarative) | `MERCHANT VN MUỐN NHẬN USDC NHƯNG SỢ BRIDGE/SWAP/CCTP? MÌNH ĐÃ DẸP HẾT MẤY THỨ ĐÓ` (VN, Pain-led question + flip) |
| Step language | `SwapRouter.swapAndBridge() on BSC. SSE stream from /api/agent/execute` | `Khách hàng ký giao dịch 1 lần trên ví của họ. Màn hình hiện progress bar live` |
| Insights named | Desire + Behavior (retroactive check) | Pain + Desire (DRAFTING guide, hook leads with Pain) |
| Audience clarity | Ambiguous: devs? merchants? | Clear: VN merchants reading X feed in Vietnamese |
| Length | ~1500 EN + ~720 VN = ~2200 total | ~2200 VN single |
| Reads like | README (tech-doc tone) | Social post (story → demo → invite) |

### Why v2 wins for this pillar

Use Case Demo pillar's job is to show merchant audience WHY they should care + HOW it works in their language. v1 was tech-doc explaining HOW to devs in English. v2 leads with WHY merchants care (Pain) then HOW in plain VN. Same 4 steps, totally different reader experience.

The framework (7-customer-insights.md) catches this: v1 hit Desire+Behavior but Behavior dominated → reads like tutorial. v2 leads with Pain → hooks reader emotion FIRST, then delivers Desire through plain-language steps. Pain+Desire combo per framework = "Kéo → đẩy hành động".

---

## Open questions

1. Dashboard screenshot — fresh capture needed? Recommend frame at `bridging` state showing progress bar mid-flow.
2. Should mention specific merchant types (cafe, online shop) for relatability? Currently generic "anh em bán hàng online". Counter: keeping generic reaches wider audience.
3. Drop the "Tại sao mình làm AIG" paragraph for tighter post? It adds VN-market context (100M dân, 0 stablecoin infra) which connects Pain insight to opportunity. Keep for now — defer to user.
