// landing-problem.tsx — reskin: problem statement section, light surface, scroll-reveal.

import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Reveal } from "@/components/ui/reveal";

const POINTS = [
  {
    title: "Bounty payouts are a trust exercise",
    body: "A poster locks money, a worker delivers, and someone has to judge whether it earned payment — usually the poster, unilaterally, after the fact.",
  },
  {
    title: "Manual review doesn't scale — or explain itself",
    body: "Ad-hoc human judgment gives no rubric, no evidence trail, and no record for the next dispute to learn from.",
  },
  {
    title: "\"Trustless\" oversells what's true",
    body: "An AI with budget authority isn't trustless — it's a server-operated wallet with rules. AIG names that honestly instead of hiding it.",
  },
];

export function LandingProblem() {
  return (
    <section id="problem" className="bg-[var(--color-surface-light)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <EyebrowLabel>the problem</EyebrowLabel>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-[var(--color-ink)] sm:text-4xl">
            Someone has to decide if the work earned the money — today that&apos;s a guess.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {POINTS.map((p, i) => (
            <Reveal key={p.title} className={i === 1 ? "sm:translate-y-4" : undefined}>
              <GlassPanel tone="light" className="h-full p-6">
                <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{p.body}</p>
              </GlassPanel>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
