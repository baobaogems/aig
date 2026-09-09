// eyebrow-label.tsx — reskin: small lowercase letter-spaced section label.
// Accent red on light surfaces; muted grey on dark ones.

export function EyebrowLabel({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  /** Trên obsidian, --color-accent chỉ đạt 3.62:1 — trượt WCAG AA, và eyebrow là chữ
   *  nhỏ + in hoa + giãn ký tự nên còn tệ hơn con số. Nền tối dùng --color-on-dark-muted
   *  (7.63:1). Đỏ cũng vốn chỉ dành cho hành động chính, không dành cho nhãn trang trí. */
  onDark?: boolean;
}) {
  const tone = onDark ? "text-[var(--color-on-dark-muted)]" : "text-[var(--color-accent)]";
  return <p className={`text-xs font-medium lowercase tracking-[0.2em] ${tone}`}>{children}</p>;
}
