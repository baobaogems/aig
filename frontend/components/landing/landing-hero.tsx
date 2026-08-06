// landing-hero.tsx — reskin hero: huge left-aligned headline, cyan eyebrow, pill CTAs,
// abstract "escrow vault" visual (glassy hexagon holding a coin of light — our own motif,
// not dv8's butterfly). Cloud-gradient light-mode surface with drifting streaks + grain.

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
          <svg viewBox="0 0 320 320" className="relative h-full w-full p-10" aria-hidden="true">
            <defs>
              <linearGradient id="vault-glow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-bright)" />
                <stop offset="100%" stopColor="var(--color-accent)" />
              </linearGradient>
            </defs>
            <polygon
              points="160,20 280,90 280,230 160,300 40,230 40,90"
              fill="none"
              stroke="url(#vault-glow)"
              strokeWidth="1.5"
              opacity="0.55"
            />
            <circle cx="160" cy="160" r="58" fill="url(#vault-glow)" opacity="0.9" />
            <circle cx="160" cy="160" r="58" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="1" />
            <path d="M136 160l16 16 32-32" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      </div>
    </section>
  );
}
