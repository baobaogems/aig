// =============================================================================
// rubric-table.tsx — the criteria and what each one is worth.
//
// One component, two audiences, and the difference is only the sentence above the list:
//   - the poster, previewing criteria they are about to freeze
//   - the worker, reading criteria that are already frozen and cannot move
//
// That second reading is the product. Anyone can promise a fair review; this is the screen
// that lets a worker check the terms BEFORE spending a weekend on the work, and know the
// poster cannot change them afterwards. So it is a server-safe component with no hooks and
// no session: it renders for a stranger who has not connected a wallet.
// =============================================================================

import { displayCriterion } from "@/lib/arbiter/legacy-vietnamese-copy";

export interface RubricItem {
  item_id: string;
  criterion: string;
  weight: number;
}

export function RubricTable({ items, frozen }: { items: RubricItem[]; frozen: boolean }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-[var(--a-muted)]">No criteria yet.</p>;
  }

  // Weights are meant to sum to 100. Showing the real total rather than assuming it means a
  // malformed rubric is visible to the person it would hurt, instead of silently mis-scoring.
  const total = items.reduce((sum, r) => sum + r.weight, 0);

  return (
    <div>
      <p className="text-[12px] leading-relaxed m-0" style={{ color: "var(--a-muted)" }}>
        {frozen
          ? "These criteria were frozen when funds entered escrow. Nobody can change them — not even the poster. This guarantees that the yardstick you start with is the yardstick you finish with."
          : "Approving freezes this rubric. It cannot be edited after that — so the scoring rules cannot change once work has started."}
      </p>

      <ul className="mt-4 m-0 p-0 list-none space-y-3">
        {items.map((r) => (
          <li
            key={r.item_id}
            className="flex items-baseline justify-between gap-4 border-b pb-3 last:border-0"
            style={{ borderColor: "var(--a-line-dim)" }}
          >
            <span className="text-[13px] leading-relaxed" style={{ color: "var(--a-text)" }}>{displayCriterion(r.criterion)}</span>
            <span className="a-tnum shrink-0 font-[family-name:var(--font-jetbrains-mono)] text-[12px] font-bold" style={{ color: "var(--a-acc)" }}>
              {r.weight}%
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 m-0 text-[11px]" style={{ color: "var(--a-muted)" }}>
        Total weight: <span className="a-tnum font-semibold" style={{ color: "var(--a-text)" }}>{total}%</span>
        {total !== 100 && (
          <span className="text-[var(--a-acc)]"> — suspicious, should equal 100%</span>
        )}
      </p>
    </div>
  );
}
