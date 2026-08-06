// landing-nav.tsx — reskin: floating rounded frosted-glass pill nav bar.
// Logo lockup (mark in a black rounded chip) top-left, anchor links top-right.
// Single-page nav — no dropdown JS, just section anchors (KISS for a pitch page).

const LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#flow", label: "Flow" },
  { href: "#safety", label: "Safety" },
  { href: "#evidence", label: "Evidence" },
];

export function LandingNav() {
  return (
    <div className="sticky top-4 z-50 mx-auto flex w-[min(100%-2rem,64rem)] items-center justify-between rounded-full border border-black/5 bg-white/70 px-4 py-2.5 shadow-[0_8px_30px_rgba(10,21,18,0.08)] backdrop-blur-xl">
      <a href="#top" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-dark)]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1.5 14 5v6l-6 3.5L2 11V5l6-3.5Z" stroke="var(--color-accent-bright)" strokeWidth="1.2" />
            <path d="M8 5.5 11 7.2v3.1L8 12l-3-1.7V7.2L8 5.5Z" fill="var(--color-accent)" opacity="0.85" />
          </svg>
        </span>
        <span className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
          Arbiter <span className="text-[var(--color-ink-muted)] font-normal">/ AIG v4</span>
        </span>
      </a>
      <nav className="hidden items-center gap-6 sm:flex">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]">
            {l.label}
          </a>
        ))}
      </nav>
      <a href="/arbiter" className="rounded-full bg-[var(--color-surface-dark)] px-4 py-1.5 text-sm font-medium text-[var(--color-on-dark)] transition-transform hover:-translate-y-0.5">
        Open app
      </a>
    </div>
  );
}
