// evidence-verbatim-check.ts — every evidence quote must actually appear in the deliverable.
// The grade prompt asks for SHORT VERBATIM quotes, but until this check the code only verified
// that evidence was non-empty. Measured on the 18 real verdicts (18/10/2026): 1 of 165 quotes
// was the model paraphrasing, on a verdict that released money. A quote that is not in the
// deliverable proves nothing, so it is dropped here and judge.ts's existing "no evidence → 0"
// rule takes over. Pure, deterministic, no I/O.

/** Fragments shorter than this are found almost anywhere, so they cannot prove a match. */
export const MIN_FRAGMENT_CHARS = 10;

export interface DroppedQuote {
  quote: string;
  reason: string;
}

export interface EvidenceCheckResult {
  kept: string[];
  dropped: DroppedQuote[];
}

/**
 * One normalisation for both sides, so a quote and the text it came from compare equal when
 * they differ only in encoding or typography:
 * - NFC: Vietnamese diacritics can be precomposed (NFC) or combining (NFD); same text, different bytes.
 * - every whitespace run, newlines included, becomes one space (quotes often span a line break).
 * - curly double/single quotes become straight ones.
 * - lowercase.
 */
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Split a quote on "..." and "…", the model's way of eliding the middle of a passage. */
export function splitQuoteFragments(quote: string): string[] {
  return normalizeForMatch(quote)
    .split(/\.\.\.|…/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

/**
 * Keep the quotes whose every checkable fragment (>= MIN_FRAGMENT_CHARS) is a substring of
 * the deliverable. A quote with any fragment missing is dropped whole; so is a quote with no
 * fragment long enough to check.
 */
export function checkEvidenceVerbatim(evidence: string[], deliverable: string): EvidenceCheckResult {
  const body = normalizeForMatch(deliverable);
  const kept: string[] = [];
  const dropped: DroppedQuote[] = [];

  for (const quote of evidence) {
    const checkable = splitQuoteFragments(quote).filter((f) => f.length >= MIN_FRAGMENT_CHARS);
    if (checkable.length === 0) {
      dropped.push({ quote, reason: `no fragment of at least ${MIN_FRAGMENT_CHARS} characters to verify` });
      continue;
    }
    const missing = checkable.find((f) => !body.includes(f));
    if (missing !== undefined) {
      dropped.push({ quote, reason: `not found in deliverable: "${missing}"` });
      continue;
    }
    kept.push(quote);
  }

  return { kept, dropped };
}

export const NO_EVIDENCE_PLACEHOLDER = "(no evidence cited — scored 0)";
export const UNVERIFIED_EVIDENCE_PLACEHOLDER = "(cited evidence not found verbatim — scored 0)";

export interface ItemDrop {
  item_id: string;
  dropped: DroppedQuote[];
}

/**
 * The effective-score step of judge.ts: filter each item's evidence through the verbatim
 * check, then apply the existing anti-vibes rule — an item left with no evidence scores 0.
 * Exported on its own so a replay over stored verdicts runs exactly the code the judge runs.
 */
export function applyEvidenceRules<T extends { item_id: string; score: number; evidence: string[] }>(
  items: T[],
  deliverable: string,
): { effective: T[]; drops: ItemDrop[] } {
  const drops: ItemDrop[] = [];
  const effective = items.map((s) => {
    const { kept, dropped } = checkEvidenceVerbatim(s.evidence, deliverable);
    if (dropped.length > 0) drops.push({ item_id: s.item_id, dropped });
    if (kept.length > 0) return { ...s, evidence: kept };
    const placeholder = s.evidence.length > 0 ? UNVERIFIED_EVIDENCE_PLACEHOLDER : NO_EVIDENCE_PLACEHOLDER;
    return { ...s, score: 0, evidence: [placeholder] };
  });
  return { effective, drops };
}
