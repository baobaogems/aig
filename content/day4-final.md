# DAY 4 FINAL — Thu 14 May 2026 — Use Case Demo (Baobao VN voice)

> **Pillar**: Use Case Demo
> **Voice**: @baobao_gems VN long-form
> **Format**: Single X Premium Long VN post (~550 words / ~3000 chars)
> **Insights hit** (per references/7-customer-insights.md):
>   - **Pain** (hook + opening): cửa hàng bán lẻ VN muốn nhận crypto nhưng sợ bridge/swap phức tạp
>   - **Desire** (body): chỉ cần connect ví là nhận USDC
>   - **Belief** (new closing): phá belief "phải có sản phẩm đột phá / phải chờ to mới làm" — chợ rau vs Bách Hoá Xanh metaphor
>   - **Hidden** (new closing): động cơ thật — mắc cỡ + muốn truyền lửa builders khác
> **Proof points**: demo link + GitHub + @baobaogemschat; dashboard screenshot attached
> **Schedule recommend**: 9-10am Vietnam time

---

## Post (copy-paste ready)

CỬA HÀNG BÁN LẺ VN MUỐN NHẬN USDC NHƯNG SỢ BRIDGE/SWAP/CCTP? MÌNH ĐÃ DẸP HẾT MẤY THỨ ĐÓ TRONG AIG.

=====

Anh em bán hàng online ở VN nhiều người muốn nhận USDC thay vì USDT vì ổn định hơn, an toàn pháp lý hơn USDT. Nhưng câu hỏi đầu tiên luôn là: "bridge là gì, swap là gì, sao phải qua mấy bước phức tạp vậy?"

Đó chính là vấn đề.

Người bán hàng VN không phải dev. Họ không cần biết CCTP Domain 7 là gì, attestation latency 30-90 giây ra sao, slippage guard hoạt động thế nào. Họ chỉ cần: khách trả tiền → mình nhận USDC → xong.

Mình build AIG (Arc Invisible Gateway) chính cho cái này. 4 bước, không có chữ "bridge" hay "swap" nào xuất hiện với anh em bán hàng:

⚡️ Bước 1: Cửa hàng connect ví crypto vào dashboard. Tự động có QR code riêng. Khỏi setup, khỏi đăng ký, khỏi KYC.

⚡️ Bước 2: Khách hàng scan QR. Trang thanh toán hiện rõ: trả token gì, phí bao nhiêu, USDC cửa hàng sẽ nhận đúng bao nhiêu. Không ẩn phí.

⚡️ Bước 3: Khách hàng ký giao dịch 1 lần trên ví của họ. Màn hình hiện progress bar live: đang xử lý → đang chuyển → xong.

⚡️ Bước 4: Cửa hàng thấy USDC vào trên Arc explorer. Tầm 60-90 giây từ lúc khách ký.

Cái cửa hàng không cần biết: CCTP Domain 7, attestation, bridge logic, slippage. Tất cả ẩn trong contract mình đã viết, đã test, đã chạy thật trên BSC Testnet.

Tại sao mình làm AIG: VN có gần 100 triệu dân, gần như 0 stablecoin payment infrastructure cho cửa hàng nhỏ. Anh em bán hàng online toàn dùng banking truyền thống + USDT OTC manual. AIG là gateway tự động hóa cái đoạn này, mà không bắt anh em bán hàng phải học crypto sâu.

Demo chạy được luôn trên testnet. Anh em connect ví thử 2 tài khoản, gửi qua lại, xem flow chạy thật. Không phải slide deck.

Mục tiêu mainnet summer 2026. Bây giờ là thời điểm vọc vạch trước khi thị trường ùa vào.

Nói thật mình đưa AIG lên còn thấy mắc cỡ. Sản phẩm này không phải đột phá gì ráo. Vấn đề dễ gặp, giải pháp cũng không có gì đột phá, cũng ít người dùng — chỉ mang tính demo là chính.

Nhưng mình vui vì đây là sản phẩm đầu tay. Cái sau chắc chắn sẽ tốt hơn cái trước. Đây chỉ là phase 1, các phase sau sẽ có thêm nhiều tính năng hơn.

Nhiều bạn hỏi mình là làm sản phẩm phức tạp không được thì sao. Mình bảo cứ làm cái đơn giản đi. Giống như ngoài chợ rau cũng cả mấy chục người bán và họ cũng có khách lai rai — đâu phải chờ tới lớn như Bách Hoá Xanh thì mới bắt đầu bán đâu.

Cứ làm, nhé.

=====

🛠 Try demo:

Dashboard cửa hàng: https://aig-frontend-blond.vercel.app/dashboard

Code public: https://github.com/baobaogems/aig

Anh em hỏi gì về Arc / CCTP / AIG: vào TG @baobaogemschat trao đổi với mình.

#baobao_gems #AIG #ARC

---

## Changes from v2 → final

1. **`merchant` → `cửa hàng bán lẻ` / `anh em bán hàng`** (contextual mix):
   - Hook: `MERCHANT VN` → `CỬA HÀNG BÁN LẺ VN` (formal subject for title)
   - Steps 1, 2, 4 + abstraction paragraph: `cửa hàng` (action subject)
   - Market context + AIG motivation: `anh em bán hàng` (warmer mentor tone)
   - Dashboard CTA: `Dashboard cửa hàng`
2. **`ít rủi ro Tether freeze hơn` → `an toàn pháp lý hơn USDT`** (cleaner, legal-not-technical framing)
3. **NEW closing paragraph block** (4 micro-paragraphs) before proof links:
   - Self-deprecating honesty ("mắc cỡ", "không đột phá gì ráo", "ít người dùng — chỉ demo")
   - Optimism + roadmap ("sản phẩm đầu tay", "phase 1, các phase sau...")
   - Chợ rau vs Bách Hoá Xanh metaphor — phá belief "phải đợi to mới làm"
   - Vivid principle close: `Cứ làm, nhé.`

## Insight impact (v2 → final)

| Version | Insights hit | Coverage |
|---|---|---|
| v1 (AIG voice) | Desire + Behavior | 2/7 |
| v2 (Baobao VN) | Pain + Desire | 2/7 |
| **final** | **Pain + Desire + Belief + Hidden** | **4/7** |

New paragraph adds:
- **Belief**: Reader belief "phải có sản phẩm đột phá / phải to mới làm" → flipped by chợ rau metaphor + "cứ làm cái đơn giản đi"
- **Hidden**: Author's hidden motive surfaced — mắc cỡ + muốn truyền lửa cho builders khác (không phải pitch sản phẩm)

Per framework combo table: Pain + Desire = "Kéo → đẩy hành động" (existing) + Belief + Hidden = personal brand depth. Post now hits both tactical AND personal-brand insights — rare combo.

## Voice DNA check (post-edits)

- [x] `mình` xưng hô throughout
- [x] `anh em` for audience (community/tactical/mentor)
- [x] ALL CAPS hook Pain-question + flip
- [x] `=====` divider after hook + before proof links
- [x] ⚡️ bullets for 4 steps (tactical/educational)
- [x] 🛠 section header before proof (per §4 rev 2)
- [x] Concrete numbers (4 bước, 30-90s, 60-90s, 100 triệu dân)
- [x] Plain VN in 4 steps — no code jargon (SwapRouter/SSE/session_id NOT in steps; appear ONLY in "Cái cửa hàng không cần biết" paragraph naming the abstracted complexity)
- [x] Slang: `vọc vạch`, `ùa vào`, `mắc cỡ`, `gì ráo`, `khách lai rai`, `tầm`
- [x] Anti-hype — no "to the moon", no "đột phá" (and explicitly disclaims "không đột phá gì ráo")
- [x] Daily-life metaphor: chợ rau / Bách Hoá Xanh (per §3.3 secular, replaces Buddhist refs)
- [x] Definition by negation: "không phải đột phá", "không phải slide deck"
- [x] Self-disclosure of weakness FIRST before principle (sample post 1 pattern): "đưa lên còn thấy mắc cỡ" → "cứ làm cái đơn giản đi" principle
- [x] Vivid verb close: "Cứ làm, nhé." (per §4.1 closing principle pattern with `!`/`.` allowed)

## Format notes for publish

- **Screenshot REQUIRED**: dashboard view mid-`bridging` state (progress bar visible). Without it, Use Case Demo pillar loses ~30% punch.
- **Bare URLs**: strip any markdown `[text](url)` before publish — X strips it.
- **No @circlefin tag** — saved for D6 reference impl thread.
- **Schedule**: 9-10am Vietnam time = peak VN crypto Twitter scroll window.
- **Engagement watch**: monitor for replies asking "fork được không?" / "có hướng dẫn deploy không?" → save for D8 good-first-issue announcement thread.

## Open questions

1. Dashboard screenshot still pending capture — recommend frame at `bridging` state with progress bar visible.
2. Chợ rau metaphor — should I worry it makes AIG sound TOO small/unimportant to Arc team if they see it later? Counter: Arc team likely won't see VN-only posts (different audience layer). Builder-honesty signals to VN audience > positioning to Arc team in THIS post. D6 + D14 are Arc-team-facing posts.
3. Self-deprecation level — is "mắc cỡ" too strong? Counter: pairs perfectly with chợ rau metaphor (humble shop owner vibe). Removing would make the philosophical close feel preachy. Keep.
