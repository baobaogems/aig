// landing-nav.tsx — reskin: floating rounded frosted-glass pill nav bar.
// Logo lockup (mark in a black rounded chip) top-left, anchor links top-right.
// Single-page nav — no dropdown JS, just section anchors (KISS for a pitch page).
// Below sm the links move to a second row that scrolls sideways: on a phone they used to
// be `hidden` outright, so four of the five destinations simply did not exist there.
// A scrolling row keeps this a server component — a hamburger would need client state.

const LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#flow", label: "Flow" },
  { href: "#safety", label: "Safety" },
  { href: "#evidence", label: "Evidence" },
];

const LINK_CLASS =
  "text-sm transition-colors hover:text-[var(--a-acc)]";

export function LandingNav() {
  return (
    <header className="sticky top-4 z-50 mx-auto w-[min(100%-2rem,64rem)] border bg-[var(--a-bg-header)] px-4 py-2.5 shadow-[0_8px_30px_rgba(10,21,18,0.08)] backdrop-blur-xl rounded-full"
      style={{ borderColor: "var(--a-border-dark)" }}
    >
      <div className="flex items-center justify-between">
      <a href="#top" className="flex items-center gap-3 transition-opacity hover:opacity-70">
        <div
          className="a-cut-sm grid h-[34px] w-[34px] flex-none place-items-center font-[family-name:var(--font-heading)] text-[15px] font-black"
          style={{ background: "var(--a-acc)", color: "var(--a-on-acc)" }}
          aria-hidden="true"
        >
          A
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-heading)] text-[20px] font-black tracking-[0.2em]" style={{ color: "var(--a-text-light-brand)" }}>
            ARBITER
          </span>
          <span className="hidden text-sm font-normal sm:block" style={{ color: "var(--a-text-light-tab)" }}>
            / AIG v4
          </span>
        </div>
      </a>
      <nav className="hidden items-center gap-6 sm:flex" style={{ color: "var(--a-text-light-tab)" }}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className={LINK_CLASS}>
            {l.label}
          </a>
        ))}
      </nav>
      <a href="/arbiter" className="a-cut-sm px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.1em] transition-transform hover:-translate-y-0.5" style={{ background: "var(--a-acc)", color: "var(--a-on-acc)" }}>
        Open app
      </a>
      </div>

      {/* Mobile row. Scrolls sideways rather than wrapping, so the pill keeps one
          predictable height as the sticky bar. */}
      <nav className="mt-2 flex items-center gap-5 overflow-x-auto border-t pt-2 [scrollbar-width:none] sm:hidden" style={{ borderColor: "var(--a-line-dim)", color: "var(--a-text-light-tab)" }}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className={`${LINK_CLASS} whitespace-nowrap`}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
