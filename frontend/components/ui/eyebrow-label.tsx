// eyebrow-label.tsx — reskin: small lowercase letter-spaced section label.
// Accent red on light surfaces; muted grey on dark ones.

export function EyebrowLabel({
  children,
  onDark = false, // unused
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <p
      className="m-0 mb-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.17em]"
      style={{ color: "var(--a-acc)" }}
    >
      {children}
    </p>
  );
}
