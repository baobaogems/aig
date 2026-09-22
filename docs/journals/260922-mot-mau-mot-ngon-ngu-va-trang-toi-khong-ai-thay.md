# Một bảng màu, một ngôn ngữ, và trang tối không ai nhìn thấy

**22/09/2026** · giao diện Arbiter · commit `2669903`, `fb7dd97`, `56a7895`

## Chuyện gì

Phiên trước hết credit giữa chừng, phần việc giao diện được làm tiếp bằng một
công cụ khác. Ba commit ra đời trong một buổi sáng, và hai trong số đó đẩy ngược
chiều nhau: `e546766` ghi "sync landing sang **dark mode** tokens", rồi một giờ
sau `b3f8ac9` ghi "apply **light theme** colors". Không ai chốt hướng nào đúng.

Chạy test: 25/298 đỏ.

## Ba nhóm đỏ, ba nguyên nhân khác nhau

**Nhóm 1 — test đang làm đúng việc của nó.** `landing-untouched.test.ts` đóng
băng 9 file landing bằng fingerprint, có chủ đích, để đợt redesign Arbiter không
tràn sang. `e546766` sửa đúng 9 file đó. Test đỏ không phải vì test sai. Cách xử
lý là **revert**, không phải cập nhật baseline.

**Nhóm 2 — hệ màu và bài đo tương phản đi ngược nhau.** Token gốc đã trỏ sang bộ
tối, trong khi `contrast.test.ts` đo trên nền sáng `#f4f6f6`. Ba màu trạng thái
đo ra 2.1 / 1.98 / 3.39 — đều dưới ngưỡng AA 4.5. Không mắt người nào bắt được,
phải tính mới ra.

**Nhóm 3 — code dịch rồi, test thì chưa.** Chuỗi hiển thị đã sang tiếng Anh từ
đợt trước nhưng `bounty-display.test.ts` vẫn kỳ vọng tiếng Việt. Dịch xong thì
`timeLeft` trả về `"1 hours left"`.

## Cái sâu hơn: hai bảng màu sống chung một màn hình

Dọn sạch hex cứng xong mới lộ ra vấn đề thật. Màn Arbiter đang dùng **song song**
hai bộ token: `--a-*` của riêng nó và `--color-ink*` / `--color-chip-*` /
`--color-surface-*` mượn từ landing. Chữ báo lỗi có ba màu khác nhau ở ba chỗ,
trong đó một chỗ trỏ vào `--color-danger` **chưa bao giờ tồn tại** và đang sống
bằng giá trị dự phòng.

Đây mới là gốc của chuyện "sửa màu chỗ này hỏng chỗ kia" suốt hai phiên. Một bề
mặt chỉ được có một bảng màu.

## Trang tối không ai nhìn thấy

Sau khi thống nhất token, mở thử bằng trình duyệt — `not-found.tsx` hiện ra **nền
đen**.

Lý do: các token `--a-*` chỉ được khai báo bên trong class `.arbiter-ui`. Trang
này render ngoài layout Arbiter nên không mang class đó; mọi `var(--a-*)` trả về
rỗng, nền rơi về mặc định.

Đọc code không thấy. Đọc diff không thấy. Test cũng không thấy — nó vẫn xanh,
vì không có test nào hỏi câu "trang này có nằm trong phạm vi token không".
Chỉ mở trang mới thấy.

Đã chốt bằng `arbiter-ui-scope.test.ts`: mọi `page.tsx` / `not-found.tsx` dưới
`app/arbiter/` phải chứa chuỗi `arbiter-ui`, thiếu là đỏ.

## Rồi chạy tiền thật

Deploy xong, chạy ba nhánh quyết định trên Arc testnet, 1 USDC mỗi bounty:

| Nhánh | Máy chấm | Tiền đi đâu |
|---|---|---|
| Duyệt thẳng | `RELEASE` 94/85 | người làm nhận đủ 1 USDC |
| Từ chối thẳng | `FAIL` 4/95 (bài nhét lệnh) | không đồng nào rời escrow; hoàn tiền sau hạn |
| Người đăng quyết | `ESCALATE` 70/70 | tiền đứng yên lúc chấm xong; người đăng từ chối → kill fee 30% → 0.3 / 0.7 |

Nhánh thứ ba trước đó **không có test nào**. Harness chỉ có RELEASE và FAIL —
đúng hai nhánh mà máy tự quyết. Nhánh mà con người phải quyết, nhánh dễ lén nhét
một con số tuỳ tiện vào nhất, thì bỏ trống. Giờ phần người làm nhận lấy thẳng từ
`killFeeBps()`, và số dư phải khớp tới từng micro-USDC.

## Học được gì

- Test đỏ thì đọc **lý do tồn tại** của test trước, đừng sửa nó cho xanh.
- Hai commit ngược chiều trong cùng một phiên là dấu hiệu chưa ai chốt hướng.
  Chốt trước, sửa sau.
- Token chỉ sống trong phạm vi khai báo nó. Trang nằm ngoài phạm vi là trang
  không màu — và không ai phát hiện cho tới khi mở nó ra.
- Nhánh nào để con người quyết thì nhánh đó cần test chặt nhất, không phải lỏng nhất.
