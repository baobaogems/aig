# AIG Content Calendar v4 — Arbiter pivot + Saigon builder positioning

> 🧊 **ĐÓNG BĂNG 18/08/2026** — file này không cập nhật nữa, giữ để tra cứu.
> Trạng thái hiện tại + lý do mọi thay đổi: [`docs/marketing-status.md`](./marketing-status.md).


> Thay thế `content-calendar-v3.md` (neo tháng 6–7/2026, đã hết hạn — gap thực tế 47 ngày).
> Viết ngày 18/08/2026, sau meetup Arc Sài Gòn 16/08.
> **Đổi brand**: AIG = **Arbiter Invisible Gateway** — trọng tài phân xử hợp đồng giữa AI agent
> bên mua dịch vụ và bên cung cấp. Định hướng theo Arc Hackathon.

## Thay đổi định vị so với v3

v3 giả định giá trị nằm ở **chiều sâu kỹ thuật** (CCTP, domain 26, strangler-fig). Meetup 16/08
chứng minh giả định đó chỉ đúng một nửa: thứ tạo ra người thật, việc thật là **series dạy build
từ 0** — có người tới gặp nói nhờ series mà làm được dự án Arc đầu tiên. Đó mới là tài sản
định vị "builder số 1 phía Nam", không phải thêm một bài internals nữa.

⚠️ CHƯA XÁC MINH: "6 bài series build dự án từ 0" anh nhắc tới không nằm trong `content/` repo này
(repo chỉ có day4/6/7/8/10/11 + nhóm arc/nanopay). Phải xác định series đó ở đâu trước khi
build content dựa lên nó — nó là tài sản trung tâm của v4.

---

## 1. Content pillars — giữ / bỏ / thêm

| Pillar | v3 | v4 | Lý do |
|---|---|---|---|
| **P1 · Build-in-public kỹ thuật** (CCTP, flag, QR) | trụ chính | **GIỮ, hạ xuống #3** | Vẫn là proof không ai bắt chước được, nhưng tệp hẹp. Dùng để giữ uy tín, không dùng để tăng trưởng. |
| **P2 · Arc explainer VN** | trụ phụ | **GIỮ, nâng lên #2** | Mở tệp non-dev, hợp với vai "người dẫn đường phía Nam". |
| **P3 · Agentic / nanopay** | pool A5 | **GỘP vào P5 (Arbiter)** | Nanopay là tiền đề của Arbiter. Không giữ riêng nữa. |
| **P4 · Dạy build từ 0** | ❌ không có | **THÊM — trụ số #1** | Bằng chứng hiệu quả duy nhất đã đo được ngoài đời (người tới gặp ở meetup). |
| **P5 · Arbiter (brand mới)** | ❌ không có | **THÊM — trụ #2 kỹ thuật** | Brand mới, hướng hackathon. Đã có contract live + evidence. |
| **P6 · Cộng đồng Sài Gòn / mặt người** | ❌ không có | **THÊM — trụ nhịp điệu** | Cà phê build hằng tuần = ảnh mới mỗi tuần, chi phí gần 0, không cạn nội dung. |
| P · Challenge / Grant | có | **BỎ khỏi lịch** | Deadline 13/07 đã trôi. Chỉ viết khi có kết quả thật. |

**Thứ tự ưu tiên v4:** P4 (dạy) > P6 (cộng đồng) > P5 (Arbiter) > P2 (explainer) > P1 (internals).

## 2. Sự thật kỹ thuật được phép trích cho P5 (Arbiter)

Nguồn: `docs/arbiter-escrow-evidence.md`. Chỉ trích những dòng này, không suy diễn thêm.

| Claim | Giá trị | Nguồn |
|---|---|---|
| Contract | `0x6F4f038d30Cfc3Dd88c9ed1Ce55D44f89cc96FF5` | evidence, deploy 03/08/2026 |
| Chain | Arc testnet `eip155:5042002` — **testnet, không phải tiền thật** | evidence |
| USDC | `0x3600…0000` — native gas token của Arc | evidence |
| Hard cap | `MAX_BOUNTY` = 50 USDC, không nâng được | evidence |
| Cơ chế | chỉ ví arbiter gọi được `release`; verdict hash ghi on-chain | evidence |
| Không trả 2 lần | `AlreadySettled()` verified bằng eth_call | evidence |
| Non-arbiter bị chặn | `NotArbiter()` verified | evidence |
| Refund | POST /api/refund — trả escrow về poster sau deadline | commit `2e166a1` |
| Pilot thật | 2 bounty live: verdict release + split-profile escalation có human override | commit `c3e918b` |

**Guardrail giữ nguyên từ v3:** không viết "173 dòng" (là 178), "Domain 7" (là 26), "45 giây e2e"
(là ~60–120s), không gọi AIG là "AI agent", không bịa phí dịch vụ. Thêm cho v4: **luôn nói rõ
testnet**; **không nói Arbiter tự phân xử bằng AI** trừ khi code thật sự có LLM — hiện chưa kiểm chứng.

## 3. Lịch — 4 tuần, nhịp 3 bài/tuần

Nhịp: **T3 dạy/explainer · T5 kỹ thuật Arbiter · CN ảnh cà phê + recap tuần**.
Ảnh CN là chi phí thấp nhất, giữ nhịp không đứt như gap 47 ngày vừa rồi.

### Tuần 1 (19–24/08) — phá băng, đặt lại brand

| # | Ngày | Pillar | Bài | Ghi chú |
|---|---|---|---|---|
| 1 | T3 19/08 | P6+P4 | **Recap meetup 16/08 + lời mời cà phê build** | Bài quan trọng nhất. Kể chuyện gặp người dùng series. Chốt luôn địa điểm/giờ tuần đầu. |
| 2 | T5 21/08 | P5 | **"AIG đổi tên: Arbiter Invisible Gateway"** — vì sao chuyển từ cổng thanh toán sang trọng tài | Giải thích pivot; dùng bảng §2. |
| 3 | CN 24/08 | P6 | Ảnh buổi cà phê build #1 | Ảnh thật, tên người tham gia (xin phép trước). |

### Tuần 2 (26–31/08) — dựng lại trụ dạy

| # | Ngày | Pillar | Bài |
|---|---|---|---|
| 4 | T3 26/08 | P4 | **"Bạn build được rồi mà không nộp hackathon — vì sao và sửa thế nào"** — đánh trúng nhóm đã gặp ở meetup |
| 5 | T5 28/08 | P5 | Arbiter cơ chế: tiền khoá, chỉ trọng tài mở, verdict ghi on-chain (có tx thật) |
| 6 | CN 31/08 | P6 | Cà phê build #2 |

### Tuần 3 (02–07/09) — mở tệp

| # | Ngày | Pillar | Bài |
|---|---|---|---|
| 7 | T3 02/09 | P2 | **"AI agent thuê AI agent thì ai xử khi cãi nhau"** — explainer VN, không kỹ thuật |
| 8 | T5 04/09 | P5 | Bài học từ 2 pilot bounty: split-profile + human override (`c3e918b`) |
| 9 | CN 07/09 | P6 | Cà phê build #3 |

### Tuần 4 (09–14/09) — thu hoạch

| # | Ngày | Pillar | Bài |
|---|---|---|---|
| 10 | T3 09/09 | P4 | **Series mới "Build dự án Arc đầu tiên" tập 1** — làm lại series đã chứng minh hiệu quả, lần này cho Arbiter |
| 11 | T5 11/09 | P1 | Refund path: trả tiền về khi hết hạn (`2e166a1`) — internals, giữ uy tín |
| 12 | CN 14/09 | P6 | Cà phê build #4 + recap 1 tháng: số người, số dự án ra lò |

## 4. Nhóm cà phê build Sài Gòn — vận hành

Insight từ meetup: chỉ cần anh khởi xướng là gom được. Đây là **đòn bẩy rẻ nhất** trong toàn bộ
kế hoạch — một buổi cà phê cho ra: ảnh, nội dung, quan hệ, và người sẽ nộp hackathon.

- **Nhịp**: cuối tuần, cố định 1 khung giờ. Cố định quan trọng hơn địa điểm đẹp.
- **Địa điểm**: Q1 hoặc Q2, chọn **một quán và giữ nguyên** — đổi quán mỗi tuần là cách nhanh nhất để nhóm tan.
- **Quy mô đầu**: 3–5 người. Đừng mở rộng trước khi buổi #3 chạy trơn.
- **Sản phẩm mỗi buổi**: ≥1 ảnh nhóm + ≥1 dòng vào `content/_signals-log.md` (log đang trống 0 signal).
- **Chỉ số 4 tuần**: ≥4 buổi liên tiếp không đứt; ≥3 người quay lại ≥2 lần; ≥1 dự án Arc mới ra lò.

## 5. Việc phải làm trước khi chạy lịch

1. **Xác định "6 bài series build từ 0" nằm ở đâu** — nó là trụ P4, không có nó thì tuần 2 và 4 rỗng.
2. **Điền `published_url` cho 18 bản ghi trong dashboard** (port 5174) — hiện 0/18 có URL, không đo được gì.
3. **Chốt quán + khung giờ cà phê** trước khi đăng bài #1 (bài đó có CTA mời).
4. **Xác minh có LLM trong Arbiter không** — quyết định được phép nói "AI phân xử" hay không.

## Câu chưa trả lời

- Series 6 bài build-từ-0 lưu ở đâu? (repo khác? chỉ trên X?)
- Arc Hackathon deadline là ngày nào? Lịch v4 chưa neo vào mốc đó — nếu có deadline, phải sắp lại.
- Bài meetup 16/08 anh nói "đã có" — đã đăng rồi hay mới viết xong? Nếu đăng rồi thì bài #1 tuần 1 đổi thành góc khác.
- Nội dung video (ngách anh hỏi phiên trước) chưa gộp vào lịch này — chờ chốt xong P4/P6 rồi thêm.
