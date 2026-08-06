// eyebrow-label.tsx — reskin: small cyan lowercase letter-spaced section label.

export function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium lowercase tracking-[0.2em] text-[var(--color-accent)]">
      {children}
    </p>
  );
}
