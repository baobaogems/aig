// serration.tsx — dải răng cưa ở đáy thẻ.
//
// Mượn dấu hiệu "vé" của prizee.xyz và dịch sang nghĩa của sản phẩm này: một
// bounty là phiếu việc CÓ TIỀN. Thuần trang trí nên aria-hidden (catalog F4).
//
// Là phần tử riêng, KHÔNG phải ::after của thẻ: thẻ bị clip-path cắt góc, một
// pseudo-element nằm trong đó sẽ bị cắt mất hai đầu.

export function Serration({ dim = false }: { dim?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="h-[5px]"
      style={{
        background: `repeating-linear-gradient(90deg, ${
          dim ? "rgba(17,17,17,.13)" : "rgba(var(--a-acc-rgb),.30)"
        } 0 7px, transparent 7px 14px)`,
      }}
    />
  );
}
