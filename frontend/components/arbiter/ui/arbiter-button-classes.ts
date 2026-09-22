// arbiter-button-classes.ts — lớp ghi đè đưa PillButton của landing về bảng màu Arbiter.
//
// PillButton sống ở components/ui và bị landing-untouched.test.ts đóng băng, nên màn Arbiter
// không sửa được nó — chỉ ghi đè được từ ngoài. Ba chỗ từng chép tay cùng một chuỗi class;
// gom về đây để đổi màu một lần là đổi cả ba. Giá trị lấy từ token, không hardcode hex.

/** Nút hành động chính (tạo bounty, duyệt rubric, khoá tiền). */
export const ARBITER_PRIMARY_BUTTON =
  "!bg-[var(--a-acc)] !text-white hover:!bg-[var(--a-acc-2)] !border-[var(--a-acc)]";

/** Nút phụ: viền nhạt trên nền sáng, chữ đậm. */
export const ARBITER_SECONDARY_BUTTON =
  "!text-[var(--a-text)] !border-[var(--a-line-dim)] hover:!bg-[var(--a-box)]";
