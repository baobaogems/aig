// page-backdrop.tsx — glow toả + lưới hairline làm nền trang.
//
// Trên nền TỐI hiệu ứng này là ánh sáng; trên nền SÁNG nó phải rất nhẹ, nếu
// không sẽ thành vệt bẩn. Alpha ở đây đã hạ tương ứng.
//
// Lưới có mask toả dần ở rìa — một lưới chạy hết khung nhìn trông như lỗi render
// chứ không như chất liệu.
//
// Thuần trang trí → aria-hidden (catalog F4), và fixed/pointer-events-none để
// không bao giờ chắn thao tác.

export function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(70vw 62vw at 18% 6%, rgba(var(--a-acc-rgb),.07), transparent 60%)",
            "radial-gradient(55vw 55vw at 88% 74%, rgba(11,109,143,.06), transparent 58%)",
            "linear-gradient(180deg, transparent, rgba(216,230,236,.75))",
          ].join(","),
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(17,17,17,.035) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(17,17,17,.035) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "64px 64px",
          // `black` chứ không phải #000: đây là alpha mask, không phải màu trong
          // bảng màu. Guard no-raw-color cấm hex thô trong primitive, và cấm đúng.
          maskImage: "radial-gradient(70vw 70vh at 50% 30%, black, transparent 78%)",
          WebkitMaskImage: "radial-gradient(70vw 70vh at 50% 30%, black, transparent 78%)",
        }}
      />
    </div>
  );
}
