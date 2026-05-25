# Day 6 — Sat May 16 — Build-in-Public (reference implementation) — VN / Baobao voice

**Channel**: @baobao_gems X · **Language**: VN · **Voice**: @baobao_gems Baobao voice (mình / anh em, thẳng thắn, câu ngắn, không triết lý)
**Pillar**: Build-in-Public · **Format**: Single post (X Premium Long VN — ~430 từ) · **Activation Play 3**

> Bản song song với `content/day6-draft.md` (EN, AIG voice). Cùng khung Day 6, khác handle-voice — user yêu cầu bản VN Baobao voice riêng.

---

## POST (copy-paste ready)

MÌNH OPEN-SOURCE AIG KHÔNG PHẢI ĐỂ KHOE. ĐỂ ANH EM KHỎI TỐN 10 TIẾNG NHƯ MÌNH.

Nói thẳng luôn. AIG là code mình viết 2 tháng trước. Build trên Arc testnet, xong để đó.

Tới giờ repo vẫn chưa có ai dùng. Demo chạy được, user thì chưa có. Nói ra hơi mắc cỡ.

Nhưng mình vẫn mở toàn bộ code ra. Lý do đơn giản.

Hồi tháng 3 build, phần khó nhất không phải viết contract. Là CCTP Domain 7. Docs của Circle nói CCTP làm gì. Còn làm sao cho nó chạy thật thì không có. Đoạn đó ngốn của mình cả chục tiếng đồng hồ.

Mở repo ra để anh em build trên Arc khỏi mò lại từ đầu.

Repo có 3 file đáng xem nhất:

⚡️ contracts/src/SwapRouter.sol: 198 dòng. Một luồng swap rồi bridge. Không proxy, không kế thừa lằng nhằng. Đọc một lần là biết nó ký cái gì.

⚡️ frontend/app/api/agent/execute/route.ts: stream SSE, không phải webhook. Nó bắn event swap_executing rồi bridging rồi confirmed. Merchant nhìn bridge chạy thật, không phải refresh rồi đoán.

⚡️ scripts/test-cctp-domain7.ts: bài test 7 bước. Approve TokenMessenger, depositForBurn vào Domain 7, lấy message hash, poll attestation API của Circle (timeout 60s), gọi receiveMessage trên Arc, check số dư đã nhảy chưa. Chạy cái này trước khi viết một dòng code sản phẩm.

Ai fork được? Ai cũng fork được.

CCTP là multi-domain, không khoá cứng vào Arc. Anh em muốn chạy trên Polygon, Ethereum hay Arbitrum thì đổi địa chỉ router với domain ID trong SwapRouter.sol là xong. Fork là đổi config, không phải viết lại.

Mình không giấu chuyện repo chưa có user. Nhưng nó có một thứ docs không cho anh em được. Là một bản tích hợp chạy được. Code anh em hỏng thì mở nó ra so từng dòng. 2 giờ sáng attestation chưa về, nhìn vào đây biết sai chỗ nào.

Docs cho biết CCTP làm gì. Code reference cho biết nó hỏng kiểu gì.

Anh em từng tích hợp bridge cross-chain chưa? Phần nào ngốn thời gian nhất: viết contract, poll attestation, hay dựng test? Comment cho mình biết nhé 👇

---

## Insight applied (per references/7-customer-insights.md)

Pillar map: Build-in-Public = **Pain (debug story) + Behavior (how I built)**. Bản VN này giữ Pain + Behavior, thêm **Desire** (đẩy fork) và một lớp **Hidden** nhẹ qua đoạn thật thà.

| Insight | Chạm ở đâu | Vì sao |
|---|---|---|
| **Pain** (kéo view — PRIMARY) | "làm sao cho nó chạy thật thì không có. Đoạn đó ngốn của mình cả chục tiếng" + "2 giờ sáng attestation chưa về" | Nỗi đau tích hợp CCTP từ số 0 — mở và đóng bài. Đám đông dev VN nhận ra ngay. |
| **Behavior** (giáo dục) | 3 file ⚡️ — đường dẫn thật, mỗi file làm gì, 7 bước test, "fork = đổi config" | Phần how-to: file thật + cơ chế thật + bước fork thật. Không nói chung chung. |
| **Desire** (đẩy hành động — drive CTA) | "khỏi tốn 10 tiếng", fork sang Polygon / Ethereum / Arbitrum chỉ đổi config | Cái anh em muốn = ship trên Arc nhanh, vào sớm. Fork là đường tắt → đẩy hành động (clone repo). |
| **Hidden** (chiều sâu personal brand — phụ) | "chưa có ai dùng", "hơi mắc cỡ", "code 2 tháng trước" | Thú thật điểm yếu trước khi đưa giá trị → động cơ thật lộ ra (không phải pitch, là muốn builder khác đỡ khổ). Tăng độ tin, bớt mùi quảng cáo. |

**Combo**: Pain + Desire → *"Kéo → đẩy hành động"*. Behavior gánh phần proof nên Desire (đỡ 10 tiếng) là bằng chứng, không phải lời hứa. Đoạn thật thà (Hidden) là chữ ký giọng Baobao — self-disclosure of weakness first.

## X algorithm compliance

- **Kết bằng câu hỏi mở** → engineered để kéo reply (engagement signal nặng nhất). Câu hỏi trả lời được từ trải nghiệm, lại tái khẳng định Pain — dev thích kể phần nào hành mình nhất. Reply ít ma sát.
- **Zero link trong body** → không dính phạt link out-of-platform trên bài chính. Toàn bộ link đẩy xuống reply đầu (bên dưới).
- **Không nhồi hashtag** → bài chính không hashtag. Đọc như builder nói chuyện, không phải SEO bait. (Xem Unresolved #6 — hashtag tail signature của Baobao §4.)
- **Voice tự nhiên** → giọng Baobao VN (mình/anh em), emoji semantic-only theo §4 (⚡️ cho list, 👇 cho câu hỏi engagement), **không dùng em dash (—)** theo yêu cầu, câu ngắn, không triết lý. Mỗi claim file có đường dẫn + cơ chế + điều kiện thành công (§12.4).

> **Lệch skeleton**: skeleton Day 6 kết bằng "RT if this helps your Arc build". Bỏ — vi phạm style §4.1 ("KHÔNG bao giờ: Like + RT") và luật kết-câu-hỏi-mở. Thay bằng câu hỏi mở. Ý định lan toả/fork vẫn còn qua câu hỏi + link reply đầu.

---

## End notes

### Ảnh minh hoạ gợi ý
- **Option A (recommended)**: ảnh chụp terminal chạy `scripts/test-cctp-domain7.ts` — log hiện `STEP 1 → STEP 7` với các dấu `✓` ("Attestation received ✓", "receiveMessage tx confirmed ✓", "Arc USDC after: … ✓"). Mạnh nhất: là proof-of-work thật, khớp đúng claim cụ thể nhất của bài (bài test 7 bước), không tốn công design — chỉ chạy script rồi chụp.
- **Option B**: sơ đồ kiến trúc — `SwapRouter.sol` (BSC) → CCTP TokenMessenger → Circle attestation API → Arc `MessageTransmitter.receiveMessage` → USDC mint. Sạch hơn cho người không phải dev nhưng tốn công design, ít "chất build thô".
- Dùng **A** làm ảnh bài đăng.

### Link nào đặt trong reply đầu (KHÔNG trong body)
Đăng body trước, rồi self-reply ngay với URL trần (X tự linkify; strip mọi ngoặc markdown). Mỗi link một dòng, cách nhau một dòng trống (§12.5):

```
Code: github.com/baobaogems/aig

Demo: aig-frontend-blond.vercel.app/dashboard
```

- **Địa chỉ contract — XỬ LÝ TRƯỚC KHI ĐĂNG (xem Unresolved #2).** `status_AIG.json` (17/05) ghi SwapRouter đã redeploy bản **v2** tại `0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3`, thay thế địa chỉ v1 `0xa8cea8fa…583a7` mà calendar proof-key vẫn ghi. File 198 dòng bài này mô tả CHÍNH là code v2 — nhưng v2 **chưa commit git, chưa push GitHub**. Tới khi repo phản ánh v2, **đừng** thêm dòng contract vào reply: nó trỏ tới contract lệch với code anh em sẽ fork. Khi v2 đã commit + push, thêm dòng: `Contract (BSC Testnet): testnet.bscscan.com/address/0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3`
- Tag peer-builder (skeleton gợi ý UnitFlow / Lynn TheLight): nếu account còn active, thêm **một** tag vào reply đầu — không phải body. Bỏ qua nếu không verify được handle.

### Checklist trước khi đăng
- [ ] Hook ALL-CAPS, kiểu reversal, câu ngắn
- [ ] "mình" / "anh em" xuyên suốt — không "tôi" / "bạn"
- [ ] Không dùng em dash (—) trong post (yêu cầu giọng văn)
- [ ] Câu ngắn, không triết lý
- [ ] Đủ 3 beat thật thà: "code 2 tháng trước" / "chưa ai dùng" / "hơi mắc cỡ"
- [ ] File paths khớp repo: `contracts/src/SwapRouter.sol` (198 dòng, đã verify `wc -l`), `frontend/app/api/agent/execute/route.ts` (SSE `swap_executing → bridging → confirmed`, đã verify header), `scripts/test-cctp-domain7.ts` (7 bước STEP 1→7, đã verify grep)
- [ ] Không có link trong body
- [ ] Không nhồi hashtag
- [ ] Kết bằng câu hỏi mở
- [ ] Link queued ở reply đầu, URL trần (strip markdown)
- [ ] Địa chỉ contract v1/v2 đã reconcile (Unresolved #2) trước khi thêm vào reply
- [ ] Ảnh test-run 7 bước đính kèm (Option A)
- [ ] **Nhịp đăng**: bài ARC gần nhất đăng 18/05 — cách 3 ngày. Đăng **hôm nay (21/05)** để quay lại nhịp; bài evergreen nên gap không hại. Sau bài này khoá lịch đăng cố định.

---

## Unresolved

1. `references/x-algorithm-policy.md` (task yêu cầu đọc) vẫn không tồn tại — chỉ có `references/7-customer-insights.md` trong `references/`. Đã áp luật X-algorithm trực tiếp (kết câu hỏi mở, không link body, không nhồi hashtag, voice tự nhiên), giống bản EN. Đề xuất tạo file canonical.
2. **Địa chỉ contract v1 vs v2 — blocker đăng bài.** `status_AIG.json` (17/05 22:40) ghi SwapRouter **v2** redeploy → địa chỉ mới `0xd5A7a98367F5ECf033bFD617d49e96d7dF751ab3` (deploy tx `0x7d263b1b…9290f9`), thay v1 `0xa8cea8fa…583a7`. v2 chưa commit/push GitHub, chưa propagate sang frontend/docs/calendar. Body bài không chứa địa chỉ nào (an toàn). Đề xuất: commit + push v2, cập nhật calendar proof-key + docs, rồi thêm v2 vào reply. Trước đó: đăng với link GitHub + Demo thôi.
3. **Lệnh cuối bị cắt** — task gốc kết thúc ở "- Kết". Đã xác nhận với user: kết bằng câu hỏi mở.
4. Skeleton ghi "Format: Single tweet EN"; task yêu cầu bản VN. Đã làm single post X Premium Long VN (X Premium budget 25k ký tự — đủ cho long-form).
5. Tag peer-builder (UnitFlow, Lynn TheLight) chưa verify handle — để ngoài body, optional trong reply đầu.
6. **Hashtag tail**: Baobao VN voice §4.3 thường đóng bài bằng `=====` + 3 hashtag signature `#baobao_gems #cryptoinsight #kiemtien`. Đã BỎ khỏi bài chính theo luật X-algo "không nhồi hashtag" và để bài kết sạch ở câu hỏi mở (kéo reply). Nếu muốn ưu tiên discoverability thương hiệu, thêm 3 hashtag đó vào reply đầu thay vì body. Cần user xác nhận.
