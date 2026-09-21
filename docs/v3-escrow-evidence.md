# Escrow v3 — bằng chứng

> Trạng thái: **ĐÃ DEPLOY LÊN ARC TESTNET 20/09/2026.** Chưa nối vào Production
> (env Vercel chưa đổi, code chưa push). Ô nào chưa đo được vẫn ghi **CHƯA XÁC MINH**.

## Địa chỉ

| | Địa chỉ | Cửa sổ | Dùng làm gì |
|---|---|---|---|
| **v3 chính** | `0xA4BB0B0448277B433A2c01b6F828771e9C5920B1` | settle 48h · claim 72h | bản sẽ dùng thật |
| v3 cửa sổ ngắn | `0x968bf4863EF570576Bc4cAf752e237e0D2218638` | settle 120s · claim 180s | **chỉ để thử** `timeoutRelease`/`expireClaim` trong một phiên; **không** nối vào app |
| v2 (đóng băng) | `0xD4f53A1bD89a05Ac568601b4c30655A678C5f9f1` | — | bounty cũ kết thúc ở đây |

- Deploy tx v3 chính: `0xe52a9f570e93b131d708156124d1147ef26309a86f5aee85060523bb6739adef`, **block 63109048**
- Deploy tx bản thử: `0xc706f5ed454670e10e070e97a5840713ca8961b64d24c56324b38dd104ecb4ff`, block 63109123
- Chain 5042002 (Arc testnet) · USDC `0x3600000000000000000000000000000000000000`
- arbiter = owner = `0x0809a724862D6636874809775Ba3623080c5ceF8`

### Bytecode

`cast code` so với `contracts/out/ArbiterEscrow.sol/ArbiterEscrow.json` → **cùng độ dài 12314**,
khác đúng **25 đoạn, tất cả đều là immutable** (local để 0 làm chỗ trống):

| On-chain | Là gì |
|---|---|
| `0809a724…c5cef8` (3 lần) | địa chỉ arbiter |
| `36` | byte đầu địa chỉ USDC `0x3600…` |
| `2a300` = 172800 | settleWindow = 48h |
| `3f480` = 259200 | claimWindow = 72h |

Không có khác biệt nào khác ⇒ **bytecode khớp**.

## Vì sao có v3

v2 chỉ biết "đã khoá" và "đã trả", **không biết đã có bài nộp hay chưa**. Hệ quả:

1. **Làm không công.** Người đăng nhận bài, im lặng tới hạn, `refund()` — giữ cả sản phẩm lẫn tiền,
   không tốn gì. Im lặng là chiến lược rẻ nhất và nó thắng.
2. **Đua deadline.** `release()` không bị chặn sau hạn, `refund()` mở sau hạn ⇒ bài nộp sát hạn
   có thể thua cuộc đua vào block, dù bài đạt.

v3 thêm đúng một khái niệm — `submittedAt` — và mặc định đảo chiều quanh nó.

## Bề mặt hợp đồng

| Hàm | Ai gọi được | Ghi chú |
|---|---|---|
| `createBounty` | người đăng | như v2, thêm ghi `claimedAt` khi chỉ định sẵn worker |
| `claim` | bất kỳ ai, trước hạn | ghi `claimedAt` |
| `markSubmitted` | arbiter | **chặn `refund` đơn phương**, mở đồng hồ |
| `settle(id, hash, workerBps)` | arbiter | trả theo tỉ lệ; phần dư về ví người đăng **ngay trong cùng giao dịch** |
| `timeoutRelease` | **bất kỳ ai**, sau cửa sổ | worker nhận 100% — quyền không phụ thuộc nền tảng |
| `expireClaim` | **bất kỳ ai**, sau `claimWindow` | mở lại việc bị nhận rồi bỏ; **không chạm tiền** |
| `refund` | người đăng, sau hạn | **chỉ khi chưa `markSubmitted`** |

`settleWindow` = 48h · `claimWindow` = 72h, cả hai `immutable` (đổi = deploy mới, một hành vi thấy được).

## Thang phí huỷ

| Điểm máy chấm | Worker nhận khi bị từ chối |
|---|---|
| <40 (T3) | 0% |
| 40–69 (T2) | 0% → 30%, tuyến tính |
| ≥70 (T1, người đăng phản đối) | 50% |

## Kết quả đo

### Tự động

| Hạng mục | Kết quả |
|---|---|
| `forge test` | **55/55 PASS** (32 test cũ viết lại theo API mới + 23 mới) |
| Kiểm chứng test có răng | **ĐẠT** — bỏ điều kiện `submittedAt == 0` khỏi `refund` ⇒ `test_refund_revertsOnceWorkWasSubmitted` đỏ ngay |
| `forge build --sizes` | runtime **6.156 B**, còn dư 18.420 B |
| Test tầng app | **229 PASS**, gồm test route handler cho mọi nhánh tiền |
| `tsc --noEmit` / `eslint` / `next build` | sạch |

### Vòng tiền thật trên Arc testnet

Chạy bằng `frontend/scripts/escrow-v3-live-round.ts` — **chỉ nói chuyện với chain**, không
qua Supabase, không qua route app. Mỗi khẳng định đọc **số dư**, không đọc giá trị trả về.

Người đăng + arbiter `0x0809a724…c5ceF8`, người làm `0xBF2DCFa2…00B91`, mỗi vòng 1 USDC.

| Nhánh | Người làm nhận | Người đăng nhận lại | tx |
|---|---|---|---|
| T1 tự trả (bps 10000) | 1.0 | 0 | [`0x7e1c655b…`](0x7e1c655b46d6e5d6b48fbf8760765220572fe00c1bdaa941ce3081bdd40a7548) |
| Phản đối T1 (bps 5000) | 0.5 | 0.5 | [`0x75babfb9…`](0x75babfb92228f4f05c99024dd6b12aa8b500f32860aa1a3aa11051a246832701) |
| Từ chối T2, phí huỷ (bps 3000) | 0.3 | 0.7 | [`0xd7bd9056…`](0xd7bd90566dde4560f770aed8b6484856dff0d58310dedc3f773fff6a83a45205) |
| Người làm tự nhận sau hết hạn | 1.0 | 0 | [`0x1b0431ab…`](0x1b0431ab0eb2b1787d3e2b26c9b5214181f3316a863489bbcbe88e38972f9f3e) |

Bốn nhánh trên chạy xong đều: **escrow nhả ra đúng số đã khoá, không đồng nào kẹt lại**,
`workerAmount + posterAmount` luôn bằng đúng số tiền, verdict hash lên chain khớp.

| Kiểm tra khác | Kết quả |
|---|---|
| **Hoàn tiền sau khi đã có bài nộp** | **BỊ CHẶN** ✓ — đây chính là lỗ L5, đã đóng trên chain thật |
| **`timeoutRelease` do ví người làm tự ký** | ✓ nhận đủ 100%, **không cần arbiter ký gì** |
| **`expireClaim` mở lại việc bị bỏ** | ✓ worker về `address(0)`, **số dư escrow không đổi** |

Bốn nhánh chia tiền + chặn hoàn tiền chạy trên **cả hai** bản (chính và cửa sổ ngắn);
`timeoutRelease`/`expireClaim` chỉ chạy được trên bản cửa sổ ngắn, vì bản chính phải chờ 48h.

> **Bẫy khi tự đo lại:** trên Arc **gas trả bằng chính USDC**. Ví nào ký giao dịch thì ví đó
> bị trừ thêm ~0.002 USDC. Đo số dư ví người ký rồi kết luận "trả thiếu" là sai — lần đầu
> em đã mắc đúng lỗi này. Nhân chứng đúng là **số dư của escrow**, không phải ví người ký.

### Chưa đo được

| Hạng mục | Vì sao |
|---|---|
| Vòng đầy đủ qua giao diện trên **v3** | chưa ai tạo bounty nào trên v3 (v3 count = 0) |
| Nguồn gốc 1 USDC còn kẹt trong v2 | không thuộc bounty nào trong DB; chưa truy, không đoán |
| `timeoutRelease` trên bản chính (48h) | phải chờ đủ 48 giờ |

## Migration 010 — ĐÃ CHẠY 20/09

`supabase db push --linked` từ thư mục `frontend/`. Đính chính nhận định sai trước đó: bảng
lịch sử migration trên remote **không** trống — 001–009 đã ghi nhận đủ, nên `db push` chỉ áp
đúng `010_settlement.sql` (đã `--dry-run` xác nhận trước).

Kiểm sau khi chạy: **18 bounty, tất cả `escrow_version = 2`, không dòng nào null**;
`bounties.submitted_at` và `verdicts.worker_bps` đọc được.

## Kiểm kê v2 — mốc đối chiếu

Chạy `frontend/scripts/escrow-v2-inventory.ts` sau khi deploy v3:

**18 bounty trên v2, đúng 1 cái còn giữ tiền:**

| Bounty | Trạng thái | Trên chain | Tiền | Hạn |
|---|---|---|---|---|
| `00c18910-3e36-464e-b633-8b015a4dd51f` | JUDGED | **HOLDING** | **5 USDC** | 27/09/2026 |

17 cái còn lại: `never-created` trên chain (draft, hoặc dòng cũ chưa từng khoá tiền) hoặc đã tất toán.

**Đây là mốc.** Chạy lại lệnh trên bất cứ lúc nào; danh sách phải giống hệt. Khác một dòng là dừng lại.

Bounty `00c18910…` sẽ **kết thúc theo luật v2**: người đăng duyệt thì trả đủ, hoặc họ tự hoàn
tiền sau 27/09. Code mới định tuyến nó qua `escrow_version = 2` và đường `releaseEscrowV2`.

## v2 — đã tất toán hết 21/09

Bounty cuối cùng còn giữ tiền, `00c18910…` (5 USDC), người đăng đã **duyệt trả đủ** qua giao
diện. Giao dịch đi bằng đường legacy `releaseEscrowV2` — **code v3 gọi hợp đồng v2** — và
đúng ngay lần đầu chạy bằng tiền thật:

| | |
|---|---|
| tx | `0x5b98780bdd09c50f6345b6d6eaa78f4ce28c1cc06049b800dcb9e4ab3634b88e` |
| block | 63261432, status `0x1` |
| người làm nhận | 5 USDC, đủ 100% (`worker_bps = 10000`) |

Kiểm kê lại sau đó: **0 bounty còn giữ tiền trên v2.** Không bounty nào bị kẹt bởi đợt chuyển.

> Lưu ý chưa giải quyết: contract v2 vẫn còn **1 USDC** không thuộc bounty nào trong cơ sở dữ
> liệu. Script kiểm kê chỉ soi bounty có trong DB nên khoản này nằm ngoài tầm nó. **CHƯA XÁC
> MINH** nguồn gốc — muốn truy thì quét sự kiện `BountyCreated` trên v2 rồi đối chiếu DB.

## v2 — không đụng vào

v2 `0xD4f53A1bD89a05Ac568601b4c30655A678C5f9f1` giữ nguyên, **không pause** (pause sẽ nhốt
đường `refund` của người đăng đang treo). Bounty mở trên v2 kết thúc trên v2; code chọn hợp
đồng theo `bounties.escrow_version` và **từ chối** khi gặp version lạ thay vì đoán.

Kiểm kê trước/sau khi deploy bằng script **chỉ đọc**:

```bash
cd frontend && npx tsx scripts/escrow-v2-inventory.ts
```

Hai lần chạy phải ra danh sách **giống hệt nhau**. Khác một dòng là dừng lại.
Không có script nào chuyển tiền giữa hai hợp đồng, và không được viết.

## Giới hạn đã biết, ghi ra chứ không giấu

- **Không trừng phạt được nền tảng.** Không có cọc ⇒ arbiter sai thì không mất gì. Cái làm được
  là thu hẹp những gì khoá arbiter làm được (hợp đồng ép) + verdict hash công khai để đối chiếu.
  Trần của mô hình không-toà-án là **kiểm toán được**, không phải **trừng phạt được**.
- **Người đăng gian vẫn mua được bài 70 điểm với giá 50%.** Không có toà án thì không phân biệt
  được "từ chối thật lòng" với "từ chối để cướp". Chỉ định giá được, không diệt được.
- **`expireClaim` vô dụng nếu hạn chót ngắn hơn `claimWindow`** — quá hạn thì không ai claim được
  nữa. Đã chặn ở tầng app: từ chối tạo bounty có hạn < 72h. Có test biên trong Foundry.
- **Ba tham số thời gian chưa có dữ liệu thật** (48h/72h/72h), chốt bằng phán đoán. Đo lại sau pilot.
