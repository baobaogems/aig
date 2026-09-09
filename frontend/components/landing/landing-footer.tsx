// landing-footer.tsx — reskin: near-black footer, "circuit-map" sitemap (nav items at
// staggered heights, each with a thin cyan line + hollow ring node), outline-pill links.
// Only real, verifiable links (repo, evidence doc, testnet explorer) — no invented socials.

const SITEMAP = [
  { label: "Problem", href: "#problem", offset: "translate-y-0" },
  { label: "Flow", href: "#flow", offset: "translate-y-3" },
  { label: "Safety", href: "#safety", offset: "-translate-y-2" },
  { label: "Evidence", href: "#evidence", offset: "translate-y-2" },
  { label: "Open app", href: "/arbiter", offset: "translate-y-0" },
];

const LINKS = [
  { label: "GitHub repo", href: "https://github.com/baobaogems/aig" },
  { label: "On-chain evidence", href: "https://github.com/baobaogems/aig/blob/main/docs/arbiter-escrow-evidence.md" },
  { label: "Arc testnet explorer", href: "https://testnet.arcscan.app" },
];

export function LandingFooter() {
  return (
    <footer className="bg-[var(--color-surface-dark-2)] pb-10 pt-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-8 border-b border-white/10 pb-14">
          {SITEMAP.map((item) => (
            <a key={item.label} href={item.href} className={`group relative pl-5 ${item.offset}`}>
              <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-[var(--color-accent)] bg-transparent" />
              <span className="absolute left-2 top-1/2 h-px w-3 -translate-y-1/2 bg-[var(--color-accent)]/40" />
              <span className="text-sm text-[var(--color-on-dark-muted)] transition-colors group-hover:text-[var(--color-accent-bright)]">
                {item.label}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-on-dark)] sm:text-3xl">
              Arbiter Invisible Gateway
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-on-dark-muted)]">
              Testnet only. No real money. Transparent and accountable — every verdict hash is on-chain.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-[var(--color-on-dark-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent-bright)]"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-14 text-xs text-white/30">AIG v4 — built for the Encode hackathon submission, Aug 2026.</p>
      </div>
    </footer>
  );
}
