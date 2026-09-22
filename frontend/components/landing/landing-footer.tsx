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
    <footer className="border-t pt-20 pb-10" style={{ background: "var(--a-bg-dark)", borderColor: "var(--a-border-dark)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-8 border-b pb-14" style={{ borderColor: "var(--a-border-dark)" }}>
          {SITEMAP.map((item) => (
            <a key={item.label} href={item.href} className={`group relative pl-5 ${item.offset}`}>
              <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border bg-transparent" style={{ borderColor: "var(--a-acc)" }} />
              <span className="absolute left-2 top-1/2 h-px w-3 -translate-y-1/2" style={{ background: "var(--a-acc)", opacity: 0.4 }} />
              <span className="text-sm transition-colors group-hover:text-[var(--a-acc)]" style={{ color: "var(--a-text-dark-sub)" }}>
                {item.label}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold sm:text-3xl" style={{ color: "var(--a-text-dark-h1)" }}>
              Arbiter Invisible Gateway
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--a-text-dark-sub)" }}>
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
                className="a-cut-sm border px-4 py-1.5 text-xs transition-colors hover:border-[var(--a-acc)] hover:text-[var(--a-acc)]"
                style={{ borderColor: "var(--a-border-dark)", color: "var(--a-text-dark-label)" }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-14 text-xs" style={{ color: "var(--a-text-dark-label)" }}>AIG v4 — built for the Encode hackathon submission, Aug 2026.</p>
      </div>
    </footer>
  );
}
