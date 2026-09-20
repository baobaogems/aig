"use client";

// =============================================================================
// filter-bar.tsx — grouped toggles, replacing the row of tabs.
//
// Tabs could only ask one question ("which list?"). The board really has two independent
// questions — is it still open, and is it mine — and tabs forced them into one flat row
// where "Chợ việc" and "Tôi đăng" looked like alternatives despite being different axes.
//
// Grouping them under labels makes the axes visible and drops a level of navigation. Each
// group is a radiogroup for real: arrow keys move within a group, Tab moves between groups,
// which is what a screen reader user expects from a set of mutually exclusive choices.
// =============================================================================

/**
 * Deliberately not generic. A generic would have to be erased to `any` at the array boundary
 * (groups can hold different value types), which buys no safety and costs a lint suppression.
 * Callers keep their own union type and narrow in their own onChange — that is where the
 * knowledge actually lives.
 */
export interface FilterGroup {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function FilterBar({
  groups,
  resultCount,
}: {
  groups: FilterGroup[];
  resultCount?: number;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[var(--radius-card)]
                 border border-[var(--color-border-light)] bg-white/50 px-4 py-3"
    >
      {groups.map((g) => (
        <div key={g.label} className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
            {g.label}
          </span>
          <div role="radiogroup" aria-label={g.label} className="flex flex-wrap gap-1.5">
            {g.options.map((o) => {
              const active = o.value === g.value;
              return (
                <button
                  key={o.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => g.onChange(o.value)}
                  className={
                    "rounded-[var(--radius-pill)] px-3.5 py-1.5 text-sm transition-colors " +
                    // focus-visible is designed, not left to the browser default, which is
                    // invisible against this palette (catalog F1).
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
                    "focus-visible:outline-[var(--color-accent)] " +
                    (active
                      ? "bg-[var(--color-ink)] text-white"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]")
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {typeof resultCount === "number" && (
        <span className="ml-auto self-end text-xs text-[var(--color-ink-muted)]">
          {resultCount} kết quả
        </span>
      )}
    </div>
  );
}
