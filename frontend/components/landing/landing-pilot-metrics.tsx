// landing-pilot-metrics.tsx — reskin: the 2-bounty pilot, real numbers, real tx links.
// Pulled from docs/arbiter-escrow-evidence.md — do not restate numbers here without
// updating that doc first; it is the source of truth.

import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PillButton } from "@/components/ui/pill-button";
import { TierPill } from "@/components/ui/tier-pill";
import { Reveal } from "@/components/ui/reveal";

const CASES = [
  {
    label: "Bounty A — clean autonomous release",
    decision: "RELEASE",
    score: "94 / 85",
    amount: "5 USDC settled on-chain",
    tx: "0x3ac63896…37ac1d83",
    href: "https://testnet.arcscan.app/tx/0x3ac63896ed94d300ea3f57a3b155dc077a40892e31bbee1f7ad843cd37ac1d83",
  },
  {
    label: "Bounty B — borderline, escalated, overridden",
    decision: "ESCALATE",
    score: "63 / 72",
    amount: "2.22 USDC held pending refund",
    tx: "poster REJECT — escalation 223494db",
    href: "https://github.com/baobaogems/aig/blob/main/docs/arbiter-escrow-evidence.md",
  },
];

const METRICS: [string, string][] = [
  ["Verdicts", "2"],
  ["T1 autonomous releases", "1"],
  ["REFUSE", "0"],
  ["Escalated to human (T2)", "1"],
  ["Human overrides", "1 (REJECT)"],
  ["Override rate", "1 / 1 escalations"],
];

export function LandingPilotMetrics() {
  return (
    // Cùng nền obsidian với khối safety ngay trên nó. Một đường kẻ mảnh đánh dấu chỗ
    // chuyển từ lời tuyên bố sang bằng chứng — giữ mảng tối liền mạch, không cắt rời
    // bằng khoảng trống hay màu nền khác.
    <section
      id="evidence"
      className="border-t border-white/10 bg-[var(--color-surface-dark)] py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <EyebrowLabel onDark>calibration + pilot</EyebrowLabel>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-[var(--color-on-dark)] sm:text-4xl">
            Two real bounties. Both halves of the safety story, on real transactions.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {CASES.map((c) => (
            <Reveal key={c.label}>
              <GlassPanel tone="dark-raised" interactive className="h-full p-6">
                <TierPill decision={c.decision} />
                <h3 className="mt-3 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-on-dark)]">{c.label}</h3>
                <p className="tnum mt-1 text-sm text-[var(--color-on-dark-muted)]">score {c.score} · {c.amount}</p>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-accent-bright)] underline decoration-[var(--color-accent-bright)]/30 underline-offset-4 hover:decoration-[var(--color-accent-bright)]"
                >
                  {c.tx}
                </a>
              </GlassPanel>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8">
          <GlassPanel tone="dark-raised" className="p-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {METRICS.map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-on-dark-muted)]">{k}</p>
                  <p className="tnum mt-1 font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--color-on-dark)]">{v}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </Reveal>

        <Reveal className="mt-10">
          <PillButton href="https://github.com/baobaogems/aig/blob/main/docs/arbiter-escrow-evidence.md" variant="secondary-on-dark" target="_blank" rel="noopener noreferrer">
            Full on-chain evidence, incl. the fail-closed incident
          </PillButton>
        </Reveal>
      </div>
    </section>
  );
}
