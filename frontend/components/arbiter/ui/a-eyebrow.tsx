// a-eyebrow.tsx — nhãn mono nhỏ đứng trên tiêu đề mục.
//
// 10px, letter-spacing .17em, viết HOA. Đo từ prizee.xyz: chính khoảng cách chữ
// rộng bất thường này làm một dòng 10px đọc ra "nhãn hệ thống" chứ không phải
// "chữ bị nhỏ".
//
// Nội dung PHẢI là tiếng Anh không dấu — xem ghi chú font trong app/layout.tsx.

export function AEyebrow({ children, tone = "accent" }: { children: string; tone?: "accent" | "dim" }) {
  return (
    <p
      className="m-0 mb-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.17em]"
      style={{ color: tone === "accent" ? "var(--a-acc)" : "var(--a-subtle)" }}
    >
      {children}
    </p>
  );
}
