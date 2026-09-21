// a-money.tsx — khối tiền. Neo thị giác của mọi thẻ bounty.
//
// Đây là lỗi E1 trong catalog mà cả đợt redesign này đi sửa: điểm nhấn cũ chỉ TO
// HƠN chứ không KHÁC VẬT LIỆU. Khối này khác hẳn phần còn lại của thẻ — nền tint
// accent, viền đậm hơn, chữ mono cỡ lớn — nên mắt bắt được số tiền trước khi đọc
// tên việc. Trong một chợ việc, số tiền mới là câu hỏi đầu tiên.
//
// KHÔNG dùng components/ui/amount-block.tsx: file đó landing và trang chi tiết
// đang dùng, sửa nó là rò ra ngoài phạm vi (xem phase 01 của plan).

export function AMoney({
  amountUsdc,
  label,
  dim = false,
}: {
  amountUsdc: number;
  /** Nhãn tiếng Anh viết hoa: BOUNTY PRIZE, IN ESCROW, RELEASED… */
  label: string;
  /** Việc đã xong: vẫn đọc được nhưng không còn tranh chỗ với việc đang mở. */
  dim?: boolean;
}) {
  return (
    <div
      className="a-cut-sm flex items-center gap-2.5 border px-3 py-2.5"
      style={
        dim
          ? { borderColor: "var(--a-line-dim)", background: "rgba(17,17,17,.035)" }
          : {
              borderColor: "rgba(var(--a-acc-rgb),.28)",
              background:
                "linear-gradient(180deg, rgba(var(--a-acc-rgb),.09), rgba(var(--a-acc-rgb),.02))",
            }
      }
    >
      <span
        className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full border text-xs"
        style={
          dim
            ? { background: "rgba(17,17,17,.05)", borderColor: "var(--a-line-dim)", color: "var(--a-muted)" }
            : {
                background: "rgba(var(--a-acc-rgb),.12)",
                borderColor: "rgba(var(--a-acc-rgb),.38)",
                color: "var(--a-acc)",
              }
        }
        aria-hidden="true"
      >
        $
      </span>
      <div>
        <div
          className="font-[family-name:var(--font-jetbrains-mono)] text-[8.5px] uppercase tracking-[0.14em]"
          style={{ color: "var(--a-muted)" }}
        >
          {label}
        </div>
        <div
          className={`a-tnum mt-[3px] font-[family-name:var(--font-jetbrains-mono)] font-extrabold leading-none ${
            dim ? "text-[21px]" : "text-[26px]"
          }`}
          style={{ color: dim ? "var(--a-text)" : "var(--a-acc)" }}
        >
          {amountUsdc}
          <small className="ml-1.5 text-[10px] font-semibold" style={{ color: "var(--a-muted)" }}>
            USDC
          </small>
        </div>
      </div>
    </div>
  );
}
