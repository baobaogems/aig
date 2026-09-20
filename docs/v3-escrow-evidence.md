# Escrow v3 — bằng chứng

> Trạng thái: **CHƯA DEPLOY.** File này dựng sẵn khung; mọi ô "CHƯA XÁC MINH" phải được điền
> bằng số đo thật trước khi coi v3 là đang chạy. Không điền bằng phán đoán.

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

| Hạng mục | Kết quả |
|---|---|
| `forge test` | **55/55 PASS** (32 test cũ viết lại theo API mới + 23 mới) |
| Kiểm chứng test có răng | **ĐẠT** — bỏ điều kiện `submittedAt == 0` khỏi `refund` ⇒ `test_refund_revertsOnceWorkWasSubmitted` đỏ ngay |
| `forge build --sizes` | runtime **6.156 B**, còn dư 18.420 B |
| Test tầng app | **229 PASS**, gồm test route handler cho mọi nhánh tiền |
| `tsc --noEmit` / `eslint` / `next build` | sạch |
| Địa chỉ v3 trên Arc testnet | **CHƯA XÁC MINH** — chưa deploy |
| Block deploy | **CHƯA XÁC MINH** |
| Bytecode khớp | **CHƯA XÁC MINH** |
| Vòng tiền thật T1 tự trả | **CHƯA XÁC MINH** |
| Vòng tiền thật phản đối (50%) | **CHƯA XÁC MINH** |
| Vòng tiền thật từ chối (phí huỷ) | **CHƯA XÁC MINH** |
| `timeoutRelease` bằng ví worker | **CHƯA XÁC MINH** |

Lệnh để đo phần còn thiếu: xem `plans/260920-2147-arbiter-dispute-mechanism/phase-06-deploy-migrate-v2-to-v3.md`.

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
