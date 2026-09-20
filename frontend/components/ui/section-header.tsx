// =============================================================================
// section-header.tsx — the orientation line before any wall of data.
//
// The board used to drop straight from a row of tabs into ten identical rows, so a visitor
// had to infer what they were looking at from the data itself. Three lines fix that: what
// kind of thing this is (eyebrow), what it is called (heading), and what is in it (one
// sentence). It is the pattern every good marketplace uses, and the cheapest hierarchy there is.
//
// The action slot sits on the same baseline as the heading rather than above it, so the
// section reads as one unit — the D1 fix is the SPACE around this block, not a rule under it.
// =============================================================================

import type { ReactNode } from "react";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** Primary action for this section. At most one filled accent button per view (E3). */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <EyebrowLabel>{eyebrow}</EyebrowLabel>
        <h2 className="mt-1.5 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
