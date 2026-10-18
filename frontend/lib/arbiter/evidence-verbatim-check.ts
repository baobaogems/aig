// evidence-verbatim-check.ts — every evidence quote must actually appear in the deliverable.
// The grade prompt asks for SHORT VERBATIM quotes, but until this check the code only verified
// that evidence was non-empty. Measured on the 18 real verdicts (18/10/2026): 1 of 165 quotes
// was the model paraphrasing, on a verdict that released money. A quote that is not in the
// deliverable proves nothing, so it is dropped here and judge.ts's existing "no evidence → 0"
// rule takes over. Pure, deterministic, no I/O.

/**
 * Fragments shorter than this are found almost anywhere, so they cannot prove a match.
 * Applies to every alphabetic or syllabic script — Latin, Vietnamese, and also Japanese kana
 * and Korean Hangul: each of those characters is a sound, closer to a letter than to a word,
 * so a short run of them matches by chance just as easily.
 */
export const MIN_FRAGMENT_CHARS = 10;

/**
 * Lower floor for fragments containing Chinese characters (Han). Each Han character carries a
 * whole word or morpheme, so 4 of them are already a specific phrase, and a full line of a
 * lyric is often 7–8 characters. At 10, real quotes such as "天邊的雲一望無際" were rejected.
 */
export const MIN_FRAGMENT_CHARS_HAN = 4;

// CJK Unified Ideographs (U+4E00–U+9FFF) and Extension A (U+3400–U+4DBF). Kana and Hangul are
// deliberately excluded — they keep MIN_FRAGMENT_CHARS.
const HAN = /[㐀-䶿一-鿿]/;

/** The minimum length a fragment must reach to count as checkable evidence. */
export function minFragmentChars(fragment: string): number {
  return HAN.test(fragment) ? MIN_FRAGMENT_CHARS_HAN : MIN_FRAGMENT_CHARS;
}

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
 * Keep the quotes whose every checkable fragment (long enough per minFragmentChars) is a
 * substring of the deliverable. A quote with any fragment missing is dropped whole; so is a
 * quote with no fragment long enough to check.
 */
export function checkEvidenceVerbatim(evidence: string[], deliverable: string): EvidenceCheckResult {
  const body = normalizeForMatch(deliverable);
  const kept: string[] = [];
  const dropped: DroppedQuote[] = [];

  for (const quote of evidence) {
    const checkable = splitQuoteFragments(quote).filter((f) => f.length >= minFragmentChars(f));
    if (checkable.length === 0) {
      dropped.push({
        quote,
        reason: `no fragment long enough to verify (${MIN_FRAGMENT_CHARS} characters, ${MIN_FRAGMENT_CHARS_HAN} if Chinese)`,
      });
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
