// =============================================================================
// decision-thresholds.tsx — what happens to the money, in numbers, before you start.
//
// Every number here is READ FROM lib/arbiter/tiers.ts. None is typed into this file.
// That is the whole point: tiers.ts is where the money decision actually lives, and a
// threshold written twice is a threshold that will eventually disagree with itself — on the
// one page whose entire claim is "you can check this yourself".
//
// tiers.ts is pure and imports nothing server-only, so a client component can read it.
// =============================================================================

import { TIER_THRESHOLDS } from "@/lib/arbiter/tiers";

const T = TIER_THRESHOLDS;

export function DecisionThresholds() {
  return (
    <div>
      <p className="text-[12px] leading-relaxed m-0" style={{ color: "var(--a-muted)" }}>
        The Arbiter proposes a score and confidence level. The decision of where funds go is fully
        deterministic by code, not the model — the same verdict always yields the same result.
      </p>

      <dl className="mt-4 m-0 space-y-3">
        <Row
          label="Auto-release funds"
          value={`confidence ≥ ${T.autoReleaseConfidence} AND score ≥ ${T.autoReleaseScore}`}
          note="Both conditions must be met. High score with low confidence will not trigger auto-release."
          accent
        />
        <Row
          label="Escalate to poster"
          value="everything in between"
          note="The Arbiter states its inclination but does not decide. The poster approves or rejects, and the choice is publicly recorded."
        />
        <Row
          label="Fail"
          value={`score < ${T.failScore}`}
          note="Includes criterion-by-criterion explanation with verbatim quotes from the submission."
        />
        <Row
          label="Refuse to grade"
          value={`confidence < ${T.refuseConfidence}, or submission is unreadable/off-topic`}
          note="The Arbiter explicitly states it cannot grade, rather than guessing."
        />
        <Row
          label="Critical failure on one criterion"
          value={`criterion ≤ ${T.splitUnmetAtOrBelow} while another ≥ ${T.splitStrongAtOrAbove} → blocks auto-release`}
          note={`Confidence is capped at ${T.splitConfidenceCeiling}, ensuring the poster makes the decision. An entirely ignored requirement is a matter for the payer, not the machine.`}
        />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="border-b pb-3 last:border-0" style={{ borderColor: "var(--a-line-dim)" }}>
      <dt className="flex flex-wrap items-baseline gap-2 m-0">
        <span className="text-[13px] font-bold" style={{ color: "var(--a-text)" }}>{label}</span>
        <span
          className="a-tnum font-[family-name:var(--font-jetbrains-mono)] text-[11px]"
          style={{ color: accent ? "var(--a-ok)" : "var(--a-subtle)" }}
        >
          {value}
        </span>
      </dt>
      <dd className="mt-1 text-[12px] m-0 leading-relaxed" style={{ color: "var(--a-muted)" }}>{note}</dd>
    </div>
  );
}
