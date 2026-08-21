// landing-flow.tsx — reskin: the 6-step bounty flow (F1–F5 + poster override), numbered
// cyan chips on a thin connecting line. Closes with the "rails existed, we built the driver"
// line pointing at the v2/v3 payment-rail foundation this repo already runs.

import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { Reveal } from "@/components/ui/reveal";

const STEPS = [
  { n: "01", title: "Create", body: "Poster writes a brief; the arbiter drafts a weighted rubric (3–7 items). Poster approves — it freezes." },
  { n: "02", title: "Lock", body: "Poster signs createBounty(...), escrowing USDC in the contract, hard-capped per bounty." },
  { n: "03", title: "Submit", body: "The assigned worker submits text or a link; the deliverable is snapshotted at submit time." },
  { n: "04", title: "Judge", body: "The arbiter scores each rubric item against the snapshot, citing verbatim evidence, with a confidence and its reasoning." },
  { n: "05", title: "Settle", body: "High confidence + score → auto-release on-chain (T1). Mid-range → escalate to the poster with a recommendation (T2)." },
  { n: "06", title: "Override", body: "The poster's APPROVE/REJECT on an escalation is recorded — the public override rate is the arbiter's track record." },
];

export function LandingFlow() {
  return (
    <section id="flow" className="bg-[var(--color-surface-light-2)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <EyebrowLabel>how a bounty flows</EyebrowLabel>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-[var(--color-ink)] sm:text-4xl">
            Six steps from a brief to an on-chain verdict.
          </h2>
        </Reveal>

        <div className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="pointer-events-none absolute inset-x-0 top-6 hidden h-px bg-[var(--color-accent)]/20 lg:block" />
          {STEPS.map((s) => (
            <Reveal key={s.n}>
              <div className="flex gap-4">
                <span className="tnum flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent)]/30 bg-white font-[family-name:var(--font-jetbrains-mono)] text-sm font-semibold text-[var(--color-accent)]">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16">
          <p className="max-w-2xl border-l-2 border-[var(--color-gold)] pl-4 text-sm italic leading-relaxed text-[var(--color-ink-muted)]">
            The rails existed — we built the driver. Arbiter settles on payment infrastructure
            this repo already runs in production: the v2.2 CCTPv2 gateway and v3 agentic
            nanopayments over x402. Judgment is the new part; movement of money was proven first.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
