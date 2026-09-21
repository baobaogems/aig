# 21/09/2026 — Người đăng giữ được cả bài lẫn tiền, và mặc định đã nghiêng nhầm bên suốt từ đầu

## Sự cố

Baobao hỏi một câu tưởng là câu hỏi thiết kế: *"Tại sao Arbiter có quyền phán quyết? Nếu
người đăng lấy sản phẩm rồi bảo không đạt thì chế tài ra sao?"*

Rà lại toàn bộ luồng thì không phải chuyện thiếu chế tài. Escrow v2 chỉ biết hai trạng thái —
**đã khoá** và **đã trả** — và **không biết đã có ai nộp bài hay chưa**. Một chỗ mù duy nhất,
sinh ra hai hỏng hóc nặng:

1. **Làm không công.** Người đăng nhận `content_snapshot` lúc worker nộp, im lặng tới hạn,
   gọi `refund()`. Giữ cả sản phẩm lẫn tiền, không tốn một đồng. Im lặng là chiến lược rẻ
   nhất và nó **thắng**.
2. **Đua deadline.** `release()` không bị chặn sau hạn, `refund()` mở ra sau hạn. Bài nộp sát
   hạn có thể thua cuộc đua vào block dù bài đạt. Không phải lựa chọn thiết kế — là lỗi.

## Chẩn đoán

Bốn ràng buộc chốt trước khi thiết kế: giữ T1 tự trả nhưng thêm cửa phản đối · contract v3 tối
thiểu · **không có người phân xử cuối** · người lạ thật, tiền thật.

Hai ràng buộc cuối đi với nhau rất khắc nghiệt: phải giả định có người cố tình gian, mà lại
không có ai tuyên bố ai đúng ai sai. Hệ quả bắt buộc — **không thể trừng phạt "từ chối sai",
chỉ có thể định giá cho mọi lần từ chối.** Danh tiếng gắn ví bị loại từ đầu: ví mới miễn phí.

Nguyên lý trục rút ra được:

> **Mặc định nghiêng về bên đã trao đi thứ không đòi lại được.**

Trước khi nộp bài, chưa ai trao gì không rút lại được ⇒ hết hạn thì tiền về người đăng, đúng
như cũ. Sau khi nộp bài, worker đã trao sản phẩm ⇒ mặc định **phải** nghiêng về họ. Bug nằm ở
đúng chỗ đó, không nằm ở chỗ thiếu hình phạt.

Vai Arbiter được định nghĩa lại: nó **không quyết ai được trả tiền**, nó quyết **mặc định là
gì và giá để lật mặc định**. Verdict của máy dùng để **chặn phí huỷ**, không dùng để **chặn
tiền công**. Một cái máy có thể sai thì được phép định giá, không được phép tuyên án.

## Đã làm

Contract v3 thêm **đúng một khái niệm** — `submittedAt` — và hai hỏng hóc tự đóng:

| Hàm | Ai gọi | Tác dụng |
|---|---|---|
| `markSubmitted` | arbiter | chặn `refund` đơn phương, mở đồng hồ |
| `settle(id, hash, workerBps)` | arbiter | trả theo tỉ lệ, phần dư về ví người đăng ngay |
| `timeoutRelease` | **bất kỳ ai**, sau cửa sổ | worker nhận 100% — quyền không phụ thuộc nền tảng |
| `expireClaim` | **bất kỳ ai** | mở lại việc bị nhận rồi bỏ, không chạm tiền |

Phí huỷ lấy từ chính điểm máy chấm: `<40 → 0%` · `40–69 → 0→30%` · `T1 phản đối → 50%`.
Một cơ chế giải bốn việc: có trả một phần, từ chối có giá, rải bài rác không có lãi, và người
đăng viết brief cẩu thả thì tự trả giá.

Không dùng cron: ba đồng hồ tính lười lúc đọc, cộng hai hàm permissionless để người dùng tự gọi.

## Sai lầm của chính phiên này

Bốn cái, đều do em, ghi lại vì mỗi cái đều suýt thành hỏng thật:

1. **Đo nhầm rồi kết luận contract sai.** Vòng tiền thật đầu tiên báo 3 mục hỏng. Thật ra trên
   Arc **gas trả bằng chính USDC**, mà ví người đăng cũng là ví ký `settle`, nên bị trừ thêm
   ~0.002. Nhân chứng đúng là **số dư của escrow**, không phải ví người ký.
2. **Thay khối UI bằng khối có điều kiện hẹp hơn mà không liệt kê mọi trạng thái khối cũ từng
   phục vụ.** Bounty v2 không bao giờ có đồng hồ thanh toán, nên panel mới `return null` ⇒
   **người đăng mất sạch nút trả tiền**. Đúng lúc có một bounty như vậy giữ 5 USDC thật.
3. **Đặt quyết định phía trên bằng chứng.** Người đăng cuộn xuống đọc kết quả chấm rồi tìm nút
   ở cuối — không có gì. Bố cục dạy người dùng tin rằng tính năng không tồn tại.
4. **Kết luận "đã deploy" bằng hai mốc giờ gần nhau.** Không bản deploy nào có metadata git —
   `git push` **chưa từng** sinh ra production build ở dự án này, trong khi `status_AIG.json`
   ghi là có. Mọi lần "push xong, build Ready" trước đó đều là suy diễn sai.

## Kết quả đo

- `forge test` **55/55**; kiểm chứng test có răng: bỏ điều kiện `submittedAt == 0` khỏi
  `refund` thì test đua deadline đỏ ngay.
- Test tầng app **231**, gồm test route handler cho mọi nhánh tiền — thứ trước đây hoàn toàn
  không có, và chính vì thiếu nó mà `POST /api/bounty` từng trả 400 cho mọi người suốt nửa ngày.
- Vòng tiền thật 6 nhánh trên Arc testnet, tất cả đạt.
- v3 `0xA4BB0B0448277B433A2c01b6F828771e9C5920B1`, block 63109048, bytecode khớp (25 đoạn khác
  đều là immutable, đã chỉ ra từng cái).
- Bounty v2 cuối cùng còn giữ tiền đã tất toán: 5 USDC trả cho người làm, tx
  `0x5b98780bdd09c50f6345b6d6eaa78f4ce28c1cc06049b800dcb9e4ab3634b88e`, block 63261432.
  Đi qua đường legacy `releaseEscrowV2` — code mới, hợp đồng cũ, chạy đúng ngay lần đầu.

## Chưa xong

- **Chưa ai đi hết một vòng trên v3 qua giao diện.** Số bounty tạo trên v3: **0**.
- **Contract v2 còn giữ 1 USDC** không thuộc bounty nào trong DB. Chưa truy ra, không đoán.
- **Tích hợp GitHub → Vercel**: chưa rõ có bật không. Tài liệu đang nói ngược với thực tế.

## Giới hạn đã biết, không giấu

Không có cọc thì **không trừng phạt được nền tảng** — trần của mô hình không-toà-án là *kiểm
toán được*, không phải *trừng phạt được*. Và người đăng cố tình gian **vẫn mua được bài 70
điểm với giá 50%**. Không có toà án thì không phân biệt được từ chối thật lòng với từ chối để
cướp; chỉ định giá được, không diệt được. Phải nói thẳng điều này với người dùng.
