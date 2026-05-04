# AIG — Brand Guidelines v1.0

> **Last updated:** 2026-05-04
> **Status:** Active (dựa trên hiện trạng 05/2026)
> **Product:** ARC Invisible Gateway — Pay with anything. Receive USDC. Invisibly.
> **Source of truth:** Phase 1 MVP shipped + Pencil dashboard redesign + Vercel production

---

## Quick Reference

| Element | Value |
|---------|-------|
| Primary Color | `#FF8400` (AIG Orange) |
| Background | `#F2F3F0` (Pencil Off-White) |
| Heading Font | JetBrains Mono |
| Body Font | Geist Sans |
| Voice | Builder, honest, technical, proof-driven |
| Tagline | "Pay with anything. Receive USDC. Invisibly." |
| 1-line positioning | Builder đã ship MVP, đang xây community VN cho Arc, thành thật về những gì chưa có, và chứng minh mọi thứ bằng code + tx + screenshot. |

---

## 1. Brand Truth — Được Nói / Không Được Nói

> **NGUYÊN VĂN — KHÔNG ĐƯỢC THAY ĐỔI.** Đây là context thật làm nền tảng cho mọi messaging.

| Sự thật | Ý nghĩa cho marketing |
|---------|----------------------|
| Phase 1 MVP **DONE** — 8/8 phases, 24h effort | Anh KHÔNG phải dreamer. Anh là người ĐÃ SHIP. |
| Deploy Vercel + 7 bug fixes production | Sản phẩm chạy thật, không phải mockup |
| SwapRouter.sol deployed BSC Testnet | Có contract on-chain chứng minh |
| 3 API endpoints + 3 pages + SSE real-time | Full-stack builder, không chỉ frontend |
| Dashboard analytics + Pencil UI redesign | Quan tâm UX, không chỉ backend |
| Phase 2-3 chưa bắt đầu | Có roadmap rõ, nhưng chưa multi-chain |
| Bỏ 2 tháng không care | Phải thành thật về điều này — biến thành story |
| 0 merchants, 0 users | Chưa có traction — **KHÔNG được nói ngược** |

---

## 2. Visual Identity

### 2.1 Color Palette

#### Primary

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| AIG Orange | `#FF8400` | rgb(255, 132, 0) | CTAs, highlights, brand mark, progress fills, focus states |

#### Neutrals (Pencil Off-White Theme)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | `#F2F3F0` | rgb(242, 243, 240) | Page background |
| Border | `#CBCCC9` | rgb(203, 204, 201) | Card borders, dividers |
| Text Primary | `#111111` | rgb(17, 17, 17) | Headings, body, values |
| Text Secondary | `#666666` | rgb(102, 102, 102) | Captions, labels, hints |

#### Semantic / Status (Payment State Badges)

| State | Hex | Usage |
|-------|-----|-------|
| Confirmed | `#16A34A` (green) | Success — payment finalized |
| Pending / Bridge Delayed | `#FF8400` (orange) | In-flight, waiting attestation |
| Bridging / Swap Executing | `#7C3AED` (violet) | Active blockchain operation |
| Expired | `#9CA3AF` (gray) | Session timeout |
| Refunded | `#DC2626` (red) | Failed → user refunded |

#### Accessibility

- `#111111` on `#F2F3F0`: 18.4:1 contrast (AAA)
- `#FF8400` on `#111111`: 7.1:1 contrast (AAA)
- `#666666` on `#F2F3F0`: 5.3:1 contrast (AA)
- All status badges meet WCAG 2.1 AA

### 2.2 Typography

#### Font Stack

```css
--font-heading: 'JetBrains Mono', 'Fira Code', monospace;
--font-body: 'Geist', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

#### Type Scale

| Element | Desktop | Mobile | Weight | Family | Use |
|---------|---------|--------|--------|--------|-----|
| H1 / Hero Numbers | 48px | 32px | 700 | JetBrains Mono | Stat values, page titles |
| H2 | 32px | 24px | 600 | JetBrains Mono | Section headers |
| H3 | 24px | 20px | 600 | JetBrains Mono | Card titles |
| Stat Value | 28px | 24px | 700 | JetBrains Mono | Dashboard metrics |
| Body | 16px | 16px | 400 | Geist | Paragraphs, descriptions |
| Label / Caption | 14px | 14px | 500 | Geist | Form labels, table headers |
| Mono Inline | 14px | 14px | 400 | JetBrains Mono | Tx hash, addresses, code |

#### Loading

```tsx
import { JetBrains_Mono, Geist } from 'next/font/google';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });
const sans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
```

### 2.3 Layout Tokens

| Token | Value |
|-------|-------|
| Border radius (cards) | 8px |
| Border radius (buttons) | 6px |
| Border radius (badges/pills) | 9999px |
| Spacing scale | 4 / 8 / 16 / 24 / 32 / 48px |
| Card padding | 24px |
| Stat card grid | 4-column flex on desktop, stack on mobile |

### 2.4 Logo / Brand Mark

> Hiện tại chưa có logo formal. Tạm thời dùng wordmark:

- **Wordmark:** "AIG" — JetBrains Mono Bold, `#111111`
- **Subwordmark:** "ARC Invisible Gateway" — Geist Regular, `#666666`
- **Accent dot:** `#FF8400` (8px diameter), placed sau "G" để nhấn brand color

---

## 3. Voice & Tone

### 3.1 Brand Personality

| Trait | Description |
|-------|-------------|
| **Builder** | Đã ship, không hứa. Nói chuyện qua commit, tx hash, screenshot. |
| **Honest** | Thành thật về cái chưa có (0 users) — không bịa traction. |
| **Technical** | Có depth — contract, SSE, CCTP. Không bullshit "blockchain magic". |
| **Helpful** | Onboard người khác, dịch docs, trả lời Discord. |
| **VN-rooted, Arc-aligned** | Bridge giữa cộng đồng VN và Arc Network. |

### 3.2 Channels — Ngôn ngữ & Tone

> **NGUYÊN VĂN từ source.**

| Kênh | Ngôn ngữ | Tone | Lý do |
|------|----------|------|-------|
| X tiếng Việt | Việt | Builder kể chuyện, có số liệu | VN audience cần hiểu AIG làm gì bằng ngôn ngữ họ |
| X tiếng Anh | Anh | Technical, ngắn, có tx hash/link | Arc team đọc X, họ cần proof không cần drama |
| Arc Discord | Anh | Helpful, trả lời câu hỏi, chia sẻ code | Thể hiện community contribution, không self-promo |
| TG @baobaogemschat | Việt | Thân mật, giải thích đơn giản | Onboard người VN vào Arc, họ không cần kỹ thuật sâu |

### 3.3 Pronouns / Xưng hô

| Kênh | Xưng hô | Lý do |
|------|---------|-------|
| X tiếng Việt | "tôi" hoặc "mình" | Nhất quán với Baobao Gems voice |
| X tiếng Anh | "I" | Chuẩn Anh ngữ |
| Arc Discord | "I" | Chuyên nghiệp |
| TG | "mình" | Thân mật với VN community |

### 3.4 CTAs theo context

| Context | CTA | Lý do |
|---------|-----|-------|
| Post kỹ thuật X | `"Code: [link]"` hoặc `"Tx: [hash]"` | Arc team muốn verify, không muốn follow |
| Post VN | `"Arc VN group ở @baobaogemschat"` | Funnel VN vào community |
| Arc Discord | Không CTA, nội dung là giá trị | Self-promo trong Discord = ban |
| Demo video | `"Test trên testnet: [link]"` | Mời người chạy thử |

### 3.5 Voice Chart

| Trait | We Are | We Are NOT |
|-------|--------|-----------|
| Builder | Đã ship MVP, có git log | Idea-stage, "coming soon" mãi |
| Honest | Nói rõ "0 users, đang tìm merchant đầu" | "Hundreds of users", "rapidly growing" |
| Technical | Chia sẻ commit hash, code snippet | "Revolutionary blockchain solution" |
| Helpful | Trả lời câu hỏi miễn phí trên Discord | Spam DM, drop link |
| Tinh thần Arc | Build cho Arc, chứng minh Arc usable | Multi-chain hype, chain-agnostic posturing |

### 3.6 Prohibited Terms

| Avoid | Reason |
|-------|--------|
| Revolutionary, game-changing | Dreamer language — anh là builder |
| Seamless | Overused; nói "1-click" hoặc "trong 30s" cụ thể hơn |
| Best-in-class, leading | Chưa có user, không claim được |
| To the moon, WAGMI | Crypto cliché, hạ thấp technical credibility |
| "Đang phát triển", "sắp ra mắt" | Nói rõ "Phase 2 đang plan", "Q2 target" |

---

## 4. Content Pillars

> **NGUYÊN VĂN từ source.**

| Pillar | Tần suất | Lý do |
|--------|----------|-------|
| **Build in Public** (40%) | 2 posts/tuần | Đây là cách nhanh nhất để Arc team thấy anh build thật. AIG có đủ technical depth (contract, API, SSE, CCTP) để viết 20+ posts mà không hết chất liệu. |
| **Arc Explainer VN** (25%) | 1 post/tuần | Chứng minh anh đang xây community VN. Không ai trong niche VN giải thích Arc bằng tiếng Việt. Vị trí độc nhất. |
| **Use Case Demo** (20%) | 1/2 tuần | 1 video AIG chạy = 10 bài giải thích. Arc team thích thấy product live hơn đọc thread dài. |
| **VN Community** (15%) | 1/tuần | Dịch docs, tổ chức Q&A, onboard devs. Đây là bằng chứng anh là community **leader**, không chỉ **builder**. |

---

## 5. Proof Points — Vũ khí Marketing

> **NGUYÊN VĂN — KHÔNG ĐƯỢC THAY ĐỔI.** Mọi claim phải back bằng 1 trong các proof này.

| Loại proof | Giá trị cụ thể từ AIG | Dùng trong post nào |
|-----------|----------------------|---------------------|
| Contract address | SwapRouter.sol trên BSC Testnet | Build in Public về smart contract |
| Commit hash | `e7b0cde`, `6146088`, `46af981`... | Post về bug fix, production stability |
| API endpoints | `/api/agent/quote`, `/api/agent/execute` (SSE), `/api/points` | Post về architecture |
| Pages | `/`, `/pay/[id]`, `/dashboard` | Demo video, screenshot |
| Tx hash testnet | E2E flow trên BSC Testnet | Chứng minh flow chạy thật |
| Code snippet | `exactOutputSingle` logic, SSE stream, `pollSwapCompleted` | Deep technical posts |
| Vercel URL | Production URL (nếu public) | Demo cho Arc team |
| Git log | 7+ production fixes | Chứng minh product đang được maintain |
| Supabase schema | `003_create_merchants_table.sql` | Post về database design |
| Smoke test | `scripts/test-cctp-domain7.ts` (7-step) | Post về testing approach |

---

## 6. Competitor Positioning

### 6.1 So sánh với MoonPay

> **MoonPay** = global fiat-to-crypto onramp, KYC bắt buộc, custodial.

| Trục | AIG | MoonPay |
|------|-----|---------|
| **Hướng giao dịch** | Crypto → USDC (cross-chain) | Fiat (USD/EUR) → crypto |
| **KYC** | Không (wallet = identity) | Bắt buộc, full KYC |
| **Custody** | Non-custodial (user hold key) | Custodial trong flow |
| **Chain target** | Arc Network (settlement) | Multi-chain general |
| **Merchant model** | Merchant nhận USDC trên Arc | Merchant nhận fiat hoặc crypto |
| **Onboarding cost** | ~0 (kết nối wallet) | Account + KYC + bank link |
| **Geographic** | VN-first, Arc-focused | Global, US/EU primary |
| **Open source** | Code + commit public | Closed proprietary |

**Positioning vs MoonPay:** AIG **không** là đối thủ trực tiếp — khác layer. MoonPay giải bài "fiat → crypto đầu tiên". AIG giải bài "crypto → USDC sạch trên Arc, không cần KYC, không cần fiat rail". Nói rõ:
> "MoonPay đưa bạn vào crypto. AIG đưa crypto vào touch điểm thanh toán cuối — invisibly, on Arc."

### 6.2 Differentiation Triangle

```
                    AIG
                  /      \
        VN community     On-chain proof
                  \      /
              Build in Public
```

**3 điểm AIG sở hữu duy nhất (so với MoonPay & các onramp truyền thống):**
1. **VN community first** — không ai trong VN crypto đang giải thích Arc bằng tiếng Việt
2. **On-chain verifiable** — mỗi claim có contract address / tx hash back up (custodial onramp không show được)
3. **Build in Public với git log** — code mở, commit công khai, không phải closed-source proprietary

---

## 7. Messaging Framework

### 7.1 Primary Message

> **"Pay with anything. Receive USDC. Invisibly."**

3 từ khóa: `anything` (token), `USDC` (settlement clarity), `invisibly` (UX promise).

### 7.2 Supporting Messages

| Audience | Message |
|----------|---------|
| Arc team | "MVP shipped on Arc Testnet. SwapRouter on BSC, CCTP to Arc Domain 7. Proof: [contract] + [tx]." |
| VN devs | "Tôi build AIG để chứng minh Arc usable cho payment. Code mở, đang tìm merchant đầu." |
| Merchants (future) | "Khách trả bằng token nào cũng được. Bạn nhận USDC trên Arc. Setup 1 QR code." |
| Crypto-curious VN | "Thanh toán crypto mà không cần customer hiểu bridge / swap. AIG xử lý hết." |

### 7.3 Story Arc (Build-in-Public Narrative)

1. **Hook** — "Tôi đã ship MVP cross-chain payment trong 24h dev"
2. **Proof** — commit, contract, tx hash
3. **Honest gap** — "Phase 2 chưa bắt đầu. 0 users. Đang tìm merchant đầu tiên."
4. **CTA** — "Test trên testnet: [link]" / "Arc VN group: @baobaogemschat"

---

## 8. Tóm Lại Bằng 1 Câu

> **NGUYÊN VĂN từ source.**

> AIG brand = Builder đã ship MVP, đang xây community VN cho Arc, thành thật về những gì chưa có, và chứng minh mọi thứ bằng code + tx + screenshot.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-04 | Initial guidelines — restructured từ source Notion 04/05; thêm Visual Identity (Pencil dashboard), Competitor Positioning (MoonPay); giữ nguyên Truth & Proof Points |
| 1.1 | 2026-05-04 | Bỏ section Aituvi (không liên quan AIG); renumber 6.2→6.1, 6.3→6.2 |
