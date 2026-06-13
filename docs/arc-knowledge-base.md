# Arc Network — Knowledge Base (Tiếng Việt, ngôn ngữ đơn giản)

> **Mục đích**: Trả lời 5 câu hỏi nền tảng về Arc Network để dùng làm reference khi viết content marketing AIG.
> **Nguồn chính**: [docs.arc.network](https://docs.arc.network), [llms.txt](https://docs.arc.network/llms.txt), Circle press releases (xem Sources cuối file).
> **Cập nhật**: 2026-05-26
> **Quy tắc viết**: từ chuyên môn chỉ dùng khi cần, giải thích ngay lần đầu xuất hiện. Mục tiêu: 1 người không biết code đọc cũng hiểu.

---

## 1. Arc khác Ethereum / Solana ở 3 điểm chính

Arc là blockchain Layer-1 (tức là blockchain độc lập, không phải chạy đè trên Ethereum) do Circle xây riêng cho **tiền số ổn định giá** (stablecoin). Khác với Ethereum hay Solana vốn là chain "đa năng" — chạy game, NFT, DeFi, social — Arc chỉ tập trung 1 việc: làm chỗ luân chuyển tiền điện tử quy ra USD nhanh, rẻ, dự đoán được chi phí.

### 1.1. Phí giao dịch trả bằng USDC, không phải ETH/SOL

Ở Ethereum bạn cần ETH để trả phí. Ở Solana cần SOL. Cả hai đều là token có giá lên xuống theo thị trường, hôm nay phí $0.5 mai có thể $5. Doanh nghiệp ghét điều này vì không thể báo giá cho khách hàng được.

Ở Arc, phí trả bằng **USDC** (1 USDC = $1). Phí cơ bản nhắm tới khoảng **$0.01/giao dịch** và có cơ chế làm phẳng để không giật lên giật xuống dù mạng đông. Doanh nghiệp ghi "phí $0.01" là yên tâm gần đúng quanh đó, không cần dự trữ một loại token thứ ba.

### 1.2. Giao dịch xong là xong, chưa đầy 1 giây

Ethereum cần đợi nhiều block (thường 5-15 phút) để chắc chắn giao dịch không bị "đảo ngược". Solana nhanh hơn nhưng vẫn có khả năng chain reorg (xếp lại thứ tự block). Cả hai đều dùng cơ chế **xác suất** — đợi càng lâu càng chắc.

Arc dùng cơ chế **deterministic finality**: dưới 1 giây là kết quả cuối cùng, không có khả năng bị đảo ngược. Chuyển tiền là chuyển xong, merchant có thể giao hàng ngay. Cơ chế này dùng engine consensus tên là **Malachite** (BFT — Byzantine Fault Tolerant, một dòng thuật toán đồng thuận có toán học chứng minh tính cuối cùng).

### 1.3. Có thể bật chế độ riêng tư khi cần (opt-in privacy)

Ethereum / Solana mặc định mọi giao dịch đều public — ai cũng xem được ví bạn có bao nhiêu, đã chuyển cho ai. Tốt cho minh bạch nhưng tệ cho doanh nghiệp (không ai muốn đối thủ thấy mình trả lương cho ai, mua hàng giá bao nhiêu).

Arc cho phép bật **opt-in privacy** — giao dịch có thể được giấu, nhưng vẫn có cơ chế "selective disclosure" để khi cần (kiểm toán, cơ quan thuế) thì mở ra được. Đây là điều bắt buộc nếu muốn các tổ chức tài chính lớn dùng blockchain.

### Bảng so sánh ngắn

| Tiêu chí | Ethereum | Solana | Arc |
|---|---|---|---|
| Token trả phí | ETH (giá biến động) | SOL (giá biến động) | **USDC** (cố định ~$1) |
| Phí trung bình | $0.5-$50 | $0.001-$1 | **~$0.01 nhắm tới** |
| Thời gian xong giao dịch | 5-15 phút chờ chắc chắn | ~2.5 giây (probabilistic) | **< 1 giây deterministic** |
| Quyền riêng tư | Mặc định public | Mặc định public | **Opt-in privacy** có |
| Tương thích code Ethereum | ✓ (chính là Ethereum) | ✗ (khác kiến trúc) | **✓ EVM compatible** |
| Tình trạng | Mainnet | Mainnet | **Testnet (2026)** |

---

## 2. USDC native gas — nghĩa là gì, sao quan trọng

### 2.1. "Native gas" nghĩa là gì

Trong blockchain, "**gas**" = phí trả cho mạng để xử lý giao dịch. "**Native gas token**" = token mặc định mà mạng nhận làm phí. Ở Ethereum native gas = ETH. Ở Solana = SOL. Ở Arc = **USDC**.

Khác biệt quan trọng: trên Arc, USDC vừa là **token thanh toán** (cái bạn chuyển cho người khác) vừa là **token trả phí** (cái mạng giữ lại). Cùng 1 thứ. Không cần ví giữ 2 loại.

### 2.2. Sao điều này quan trọng?

**Với người dùng cuối**:
- Không cần học khái niệm "gas token riêng". Mở ví, có USDC, gửi được liền.
- Không bị tình huống "có 100 USDC nhưng không gửi được vì hết ETH/SOL trả phí" — bug cực kỳ phổ biến với người mới ở Ethereum.

**Với doanh nghiệp**:
- Báo giá phí cố định. Báo cho khách "phí $0.01" không cần ghi thêm caveat "tuỳ giá ETH thời điểm gửi".
- Sổ sách kế toán đơn giản. Mọi giao dịch đều là USD, không cần convert.
- Quỹ vận hành chỉ giữ USDC, không phải vừa giữ stablecoin vừa giữ token volatile để trả phí.

**Với developer xây app**:
- Code đơn giản hơn. Không cần logic "kiểm tra user có đủ ETH trả gas chưa rồi mới làm tiếp".
- UX mượt hơn. Hết một bước "swap ETH-to-USDC trước khi thanh toán" gây drop-off cao.

**Chi tiết kỹ thuật cho dev**: USDC trên Arc có 2 hình thái — bản native 18 decimals dùng cho gas accounting, và bản ERC-20 6 decimals (giống USDC ở các chain khác) dùng cho transfer và hiển thị balance. Khi viết code, transfer giữa các ví dùng interface ERC-20 quen thuộc.

---

## 3. CCTP v2 — Hoạt động thế nào (giải thích cho người không biết code)

### 3.1. Tên gọi & vai trò

**CCTP** = **Cross-Chain Transfer Protocol**, dịch nôm: "giao thức chuyển USDC qua lại giữa các blockchain". Do Circle (chủ phát hành USDC) làm. **V2** là phiên bản thứ hai, cải tiến tốc độ và phí so với v1.

### 3.2. Vấn đề CCTP giải quyết

Mỗi blockchain (Ethereum, Solana, Arc, Base...) là một "ốc đảo" riêng. USDC trên Ethereum và USDC trên Arc về bản chất là 2 token khác nhau dù cùng tên. Trước CCTP, để chuyển USDC giữa các chain bạn phải dùng "bridge" — đa số bridge hoạt động bằng cách **khoá** USDC bên A, in ra **bản giả** (wrapped USDC) bên B. Cách này:
- Rủi ro: nếu bridge bị hack, bản giả mất giá trị (đã xảy ra nhiều lần, mất hàng tỷ USD)
- Phức tạp: người dùng kết thúc cầm "USDC.e" hoặc "WUSDC" thay vì USDC thật

### 3.3. CCTP làm cách khác — "đốt và đúc" (burn and mint)

Đơn giản hoá thành 4 bước (cho cả v1 và v2):

1. **Bước 1 — Burn (đốt)**: Bạn nói "tôi muốn chuyển 100 USDC từ Ethereum sang Arc". Smart contract của Circle ở Ethereum **đốt** (xoá vĩnh viễn) 100 USDC khỏi ví bạn.
2. **Bước 2 — Attestation (chứng nhận)**: Circle có hệ thống ngoài blockchain quan sát việc đốt này. Khi thấy chắc chắn, Circle ký một "giấy chứng nhận điện tử" (attestation) xác nhận: "ví X đã đốt 100 USDC ở Ethereum, muốn nhận lại ở Arc".
3. **Bước 3 — Mint (đúc)**: Bạn (hoặc app thay bạn) đem giấy chứng nhận tới smart contract của Circle ở Arc. Smart contract kiểm tra chữ ký, hợp lệ thì **đúc** (tạo mới) 100 USDC vào ví bạn ở Arc.
4. **Bước 4 — Xong**: Bạn cầm USDC thật (không phải bản giả) ở Arc.

Tổng thời gian v2: thường **45 giây - 2 phút** giữa các EVM chain. Khác với v1 mất 10-20 phút.

### 3.4. Vì sao không bị mất tiền như bridge cổ điển?

Không có hồ chứa USDC bị khoá → không có target để hack. USDC bên A bị đốt thật (giảm tổng cung), USDC bên B được đúc mới (tăng tổng cung). Tổng cung USDC toàn cầu **không đổi**. Circle là người duy nhất có thẩm quyền đúc USDC, nên cách này tận dụng đúng vai trò sẵn có của họ.

### 3.5. Liên quan tới Arc

Mỗi chain hỗ trợ CCTP có 1 mã số gọi là **"domain"**. Ví dụ: Ethereum = domain 0, Solana = domain 5, Arc = **domain 26** (cẩn thận: nhiều docs cũ ghi domain 7 cho Arc nhưng đó là domain của Polygon — đây là lỗi rất nhiều dev VN mắc phải, xem [`plans/260525-2023-aig-v2-app-kit-rebuild/`](../plans/260525-2023-aig-v2-app-kit-rebuild) trong repo AIG).

App Kit của Circle (xem mục 4 dưới) đã wrap toàn bộ flow CCTP — developer chỉ cần gọi 1 hàm `kit.bridge({from, to, amount})`, App Kit lo hết phần burn/attestation/mint.

---

## 4. Arc ecosystem — Các sản phẩm chính

Arc không phải là 1 blockchain trống rỗng. Circle cung cấp **bộ công cụ trọn gói** để developer ship app nhanh. Có 5 nhóm sản phẩm chính:

### 4.1. App Kit — SDK tổng

**App Kit** là thư viện JavaScript/TypeScript chính. Tên đầy đủ: `@circle-fin/app-kit`. Nó bọc gộp 4 capability dưới đây thành 1 interface duy nhất, để developer khỏi phải gắn từng protocol riêng.

4 capability chính:
- **Bridge**: chuyển USDC giữa các chain (wrap CCTP v2)
- **Swap**: đổi 1 token sang token khác trên cùng chain (vd USDC → EURC)
- **Send**: chuyển token giữa 2 ví trên cùng chain (kiểu "Venmo on-chain")
- **Unified Balance**: gộp USDC của bạn từ nhiều chain (Base, Arbitrum, Solana...) thành 1 số dư duy nhất, tiêu được trên chain bất kỳ. Đây là tính năng đột phá nhất — user không cần biết tiền đang ở chain nào.

Hỗ trợ các adapter: Viem, Ethers, Solana Web3.js, Circle Wallets.

> ⚠️ **Cảnh báo từ kinh nghiệm AIG**: App Kit có giả định kiến trúc nhất định (cần `KIT_KEY` chạy ở server, thiết kế xoay quanh Circle Wallets). Nếu app của bạn cần MetaMask + RPC riêng + signer wallet khác, App Kit có thể không fit — xem chi tiết ADR ở [`plans/260525-2023-aig-v2-app-kit-rebuild/`](../plans/260525-2023-aig-v2-app-kit-rebuild). Lúc đó nên gọi thẳng CCTP contract bằng viem + Circle attestation API.

### 4.2. Bridge Kit — Bản tách riêng của App Kit

Nếu chỉ cần tính năng Bridge thôi (không cần Swap/Send/Unified Balance), Circle cho cài gói nhẹ hơn: `@circle-fin/bridge-kit`. Cùng nội dung như Bridge trong App Kit, nhỏ gọn hơn.

### 4.3. Wallets — 3 loại ví Circle cung cấp

Circle có hệ thống ví trắng nhãn (white-label) để bạn nhúng vào app của mình. Có **3 mô hình quyền sở hữu**:

| Loại | Ai giữ private key | Khi nào dùng |
|---|---|---|
| **Developer-Controlled Wallets** | App developer giữ | App tự động xử lý giao dịch thay user (vd bot, AI agent, automation) |
| **User-Controlled Wallets** | User giữ (qua passkey/biometric) | App có UI riêng, user giữ key nhưng không cần seed phrase phức tạp |
| **Modular Wallets** | Tuỳ chỉnh kết hợp | Account abstraction nâng cao, gas sponsor, multi-sig... |

User dùng ví ngoài (MetaMask, Phantom) thì không cần Circle Wallets — Arc tương thích chuẩn EVM nên các ví Ethereum quen thuộc đều dùng được.

### 4.4. CPN — Circle Payments Network

**CPN** = **Circle Payments Network**, ra mắt tháng 5/2025. Đây là **mạng lưới tổ chức tài chính** dùng USDC làm phương tiện thanh toán xuyên biên giới (cross-border). Khác với App Kit (cho developer xây app), CPN là tầng **B2B/enterprise**: ngân hàng, fintech, payment provider nối vào CPN để chuyển tiền giữa các nước nhanh hơn SWIFT.

Số liệu Circle công bố (Q1/2026): **$8.3 tỷ** annualized transaction volume. Tính tới 2026, CPN có thêm gói **Managed Payments** (Circle quản lý luôn pay-in/pay-out qua 20+ chain bao gồm Ethereum, Base, Solana, Arc).

**Quan trọng**: Arc và CPN được thiết kế để bổ sung nhau. CPN sẽ có "native integration" với Arc — tức là khi 1 ngân hàng dùng CPN, họ có thể settle trực tiếp trên Arc với USDC native gas + sub-second finality + opt-in privacy. Đây là use case lớn nhất khiến Arc được build.

### 4.5. Các tool khác (nhanh)

- **Faucet** ([faucet.circle.com](https://faucet.circle.com)): lấy USDC testnet free để test
- **Block explorer** ([testnet.arcscan.app](https://testnet.arcscan.app)): xem giao dịch
- **MCP server** ([docs.arc.network/ai/mcp](https://docs.arc.network/ai/mcp)): cho AI agent truy cập docs Arc qua Model Context Protocol
- **Sample apps** + **deploy contracts** + **Hardhat/Foundry/Viem support**: full Ethereum dev stack chạy được không sửa code

---

## 5. Circle và Arc — Quan hệ gì

### Câu trả lời ngắn

**Arc là blockchain do Circle xây**, ra mắt testnet để hỗ trợ việc dùng USDC ở quy mô lớn. Cụ thể:

- Circle = công ty fintech, phát hành USDC (và EURC), trụ sở Mỹ, niêm yết sàn chứng khoán (mã CRCL)
- Arc = sản phẩm của Circle, là Layer-1 blockchain mới, mainnet dự kiến muộn 2026

### Vì sao Circle tự build chain riêng?

Trước đây Circle phát hành USDC trên 20+ chain khác (Ethereum, Solana, Base, Polygon...). Mỗi chain Circle phải tuân theo "luật chơi" của chain đó — chịu phí gas của chain đó, chấp nhận latency của chain đó, không kiểm soát được trải nghiệm. Vấn đề:

1. **Phí biến động**: khi Ethereum tắc, phí $50/giao dịch → USDC mất ý nghĩa thanh toán nhỏ
2. **Tốc độ**: 10+ phút finality không đủ cho thương mại điện tử
3. **Privacy**: ngân hàng không thể dùng public mempool cho lương + payroll
4. **Compliance**: Circle không kiểm soát validator set ở chain công cộng

Build chain riêng = Circle kiểm soát được toàn bộ ngăn xếp, tinh chỉnh từng tham số cho payment use case. **Arc là kết quả của 5 năm Circle hoạt động trên chain người khác và đúc rút ra cái thiếu**.

### Mối quan hệ pháp lý / kinh doanh

- Arc là **permissioned validator set** — chỉ tổ chức được Circle chấp nhận mới chạy validator. Khác Ethereum (ai cũng chạy validator được). Tradeoff: kém decentralized hơn nhưng đổi lại có compliance guarantees mà các ngân hàng cần.
- Arc là **permissionless developer access** — bất kỳ ai cũng deploy contract, viết app được. Giống Ethereum ở mặt này.
- Arc roadmap gắn chặt với CPN — CPN volume sẽ là engine kéo activity về Arc khi mainnet ra.

### Hệ quả với người làm content / dev VN

- Arc **không cạnh tranh** Ethereum / Solana — họ phục vụ tệp use case khác (payment-focused, regulated finance). Arc cạnh tranh với SWIFT, Visa, các payment rail truyền thống nhiều hơn.
- "Build trên Arc" về branding = "Build trên Circle stack". Bài viết / pitch nên kết nối sang Circle, USDC adoption, stablecoin narrative — không phải DeFi / NFT narrative.
- Developer Grant / Architects tier của Arc là chương trình của Circle. Submission gắn liền với hệ sinh thái Circle, không chỉ chain.

---

## Tra cứu nhanh (cheat sheet)

| Hỏi nhanh | Trả lời |
|---|---|
| Gas token Arc là gì? | USDC |
| Phí trung bình? | ~$0.01 (target) |
| Finality? | < 1 giây deterministic |
| Tương thích Ethereum? | ✓ EVM compatible |
| Mainnet chưa? | Chưa, đang testnet (5/2026) |
| Faucet | faucet.circle.com |
| Block explorer | testnet.arcscan.app |
| RPC | Xem docs.arc.network/arc/references/connect-to-arc |
| CCTP Arc domain | **26** (không phải 7, 7 là Polygon) |
| App Kit package | `@circle-fin/app-kit` |
| Bridge Kit package | `@circle-fin/bridge-kit` |
| Adapter chính | viem-v2, ethers-v6, solana-kit, circle-wallets |

---

## Câu hỏi mở (chưa có nguồn rõ ràng trong docs công khai)

1. **Mainnet Arc khi nào?** Docs chỉ ghi "may evolve as network parameters are tuned for mainnet launch" — không có ngày cụ thể.
2. **Validator set Arc gồm những ai?** "Permissioned" nhưng Circle chưa công bố danh sách công khai.
3. **Phí giao dịch sau mainnet?** Hiện target $0.01 ở testnet, sau mainnet có thể thay đổi theo gas market.
4. **CPN ↔ Arc integration go-live khi nào?** Circle nói "upcoming" trong báo cáo Q1/2026, chưa có deadline.
5. **Arc có token riêng không?** Tới giờ KHÔNG. Native gas là USDC, không có "ARC token". Có thể thay đổi sau mainnet.

---

## Sources

### Arc docs (chính)
- [Arc developer documentation (home)](https://docs.arc.network/)
- [LLMs index (full doc list)](https://docs.arc.network/llms.txt)
- [Arc Network — Overview & Key Features](https://docs.arc.network/arc-chain)
- [Gas and fees](https://docs.arc.network/arc/references/gas-and-fees)
- [App Kit overview](https://docs.arc.network/app-kit)
- [App Kit: Bridge](https://docs.arc.network/app-kit/bridge)
- [System overview (consensus + execution)](https://docs.arc.network/arc/concepts/system-overview)
- [Stable Fee Design](https://docs.arc.network/arc/concepts/stable-fee-design)
- [Deterministic Finality](https://docs.arc.network/arc/concepts/deterministic-finality)
- [Opt-in Privacy](https://docs.arc.network/arc/concepts/opt-in-privacy)
- [EVM Compatibility](https://docs.arc.network/arc/references/evm-compatibility)
- [Contract Addresses](https://docs.arc.network/arc/references/contract-addresses)

### Circle (CPN)
- [Circle Payments Network — Product page](https://www.circle.com/cpn)
- [CPN Managed Payments (launch press)](https://www.circle.com/pressroom/circle-launches-cpn-managed-payments-a-full-stack-platform-for-seamless-stablecoin-settlement)
- [CPN Product Updates & Roadmap (blog)](https://www.circle.com/blog/cpn-momentum-and-upcoming-roadmap)
- [Circle's Product Vision for 2026](https://www.circle.com/blog/building-the-internet-financial-system-circles-product-vision-for-2026)
- [Circle Q1 2026 Results](https://www.circle.com/pressroom/circle-reports-first-quarter-2026-results)
- [Announcing Payments Network (original launch)](https://www.circle.com/pressroom/circle-announces-payments-network-to-transform-global-money-movement)

### AIG internal (cross-reference)
- [`plans/260525-2023-aig-v2-app-kit-rebuild/`](../plans/260525-2023-aig-v2-app-kit-rebuild) — ADR explaining why AIG dropped App Kit, source of "Domain 7 vs 26" warning
- [`plans/260526-1034-aig-v2-30day-content-calendar.md`](../plans/260526-1034-aig-v2-30day-content-calendar.md) — §2.1 Day 2 draft uses the App Kit pivot story
