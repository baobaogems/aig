// landing-hero.tsx — reskin hero: huge left-aligned headline, cyan eyebrow, pill CTAs,
// abstract "withheld verdict" visual (an unclosed glassy hexagon around a confidence bar
// short of its threshold — our own motif, not dv8's butterfly). Cloud-gradient light-mode
// surface with drifting streaks + grain.

import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { PillButton } from "@/components/ui/pill-button";
import { LightStreaks } from "@/components/ui/light-streaks";

export function LandingHero() {
  return (
    <section
      id="top"
      className="bg-grain relative overflow-hidden bg-gradient-to-b from-[var(--color-surface-light)] via-[var(--color-surface-light-2)] to-[var(--color-surface-light)] pt-28 pb-24"
    >
      <LightStreaks className="left-[-10%] top-10 h-[500px] w-[900px] opacity-70" />
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <EyebrowLabel>the arbiter</EyebrowLabel>
          <h1 className="mt-4 font-[family-name:var(--font-heading)] text-[clamp(2.5rem,5vw,4.2rem)] font-semibold leading-[1.05] tracking-tight text-[var(--color-ink)]">
            An AI that earns<br />the right to release<br />the money.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-ink-muted)]">
            AIG v4 escrows USDC on Arc testnet and judges a submitted deliverable against a
            poster-approved rubric — evidence-cited, confidence-scored, and refused when it
            isn&apos;t sure. Every release writes its verdict hash on-chain.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <PillButton href="/arbiter" variant="primary">
              See it settle on Arc
            </PillButton>
            <PillButton
              href="https://github.com/baobaogems/aig/blob/main/docs/arbiter-escrow-evidence.md"
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the evidence
            </PillButton>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <div className="absolute inset-0 rounded-[var(--radius-card)] bg-white/60 shadow-[0_20px_60px_rgba(10,21,18,0.12)] backdrop-blur-xl" />
          {/* Withheld-verdict motif: a hexagon whose top-right edge is deliberately left
              open (nothing has been released yet) around a confidence bar that stops short
              of the release threshold. Static SVG, no decorative red — cyan is the tier
              language already used for verdicts. */}
          <svg viewBox="0 0 320 320" className="relative h-full w-full p-10" aria-hidden="true">
            {/* hexagon, unclosed: the 160,20 -> 280,90 edge is omitted */}
            <path
              d="M280 90 L280 230 L160 300 L40 230 L40 90 L160 20"
              fill="none"
              stroke="var(--color-ink-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
            />
            {/* confidence track */}
            <rect x="72" y="149" width="176" height="14" rx="7" fill="var(--color-ink-muted)" opacity="0.15" />
            {/* fill — short of the threshold */}
            <rect x="72" y="149" width="98" height="14" rx="7" fill="var(--color-tier-t1)" opacity="0.85" />
            {/* release threshold */}
            <line
              x1="212"
              y1="130"
              x2="212"
              y2="182"
              stroke="var(--color-ink-muted)"
              strokeWidth="1.5"
              strokeDasharray="3 4"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
