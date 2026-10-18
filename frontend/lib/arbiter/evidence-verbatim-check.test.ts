// evidence-verbatim-check.test.ts — a quote counts as evidence only if it is really in the
// deliverable. The paraphrase case is transcribed from a real RELEASE verdict (snapshot 18/10/2026).

import { describe, expect, it } from "vitest";
import {
  applyEvidenceRules,
  checkEvidenceVerbatim,
  NO_EVIDENCE_PLACEHOLDER,
  normalizeForMatch,
  UNVERIFIED_EVIDENCE_PLACEHOLDER,
} from "./evidence-verbatim-check";

const BODY_VI =
  "Khách Mỹ đặt một bộ 120 USD, muốn trả bằng USDC.\nVí của khách nằm trên mạng Ethereum, còn chị Lan muốn nhận trên mạng Arc.";

describe("checkEvidenceVerbatim", () => {
  it("keeps a verbatim Vietnamese quote with diacritics", () => {
    const r = checkEvidenceVerbatim(["Ví của khách nằm trên mạng Ethereum"], BODY_VI);
    expect(r.kept).toHaveLength(1);
    expect(r.dropped).toHaveLength(0);
  });

  it("matches the same Vietnamese text whether it arrives as NFC or NFD", () => {
    const nfc = "chị Lan muốn nhận trên mạng Arc".normalize("NFC");
    const nfd = nfc.normalize("NFD");
    expect(nfd).not.toBe(nfc); // different bytes going in
    expect(checkEvidenceVerbatim([nfd], BODY_VI.normalize("NFC")).kept).toEqual([nfd]);
    expect(checkEvidenceVerbatim([nfc], BODY_VI.normalize("NFD")).kept).toEqual([nfc]);
  });

  it("treats curly and straight quote marks as the same character", () => {
    const body = "She said “ship it today” and left. It’s done.";
    const r = checkEvidenceVerbatim(['said "ship it today" and', "It's done."], body);
    expect(r.kept).toHaveLength(2);
  });

  it("matches across a line break in the deliverable", () => {
    const r = checkEvidenceVerbatim(["USDC. Ví của khách"], BODY_VI);
    expect(r.kept).toHaveLength(1);
  });

  it("accepts an elided quote when every fragment is present, with ... or …", () => {
    const r = checkEvidenceVerbatim(
      ["Khách Mỹ đặt một bộ 120 USD ... chị Lan muốn nhận trên mạng Arc", "muốn trả bằng USDC…nằm trên mạng Ethereum"],
      BODY_VI,
    );
    expect(r.kept).toHaveLength(2);
  });

  it("drops an elided quote when one fragment is not in the deliverable", () => {
    // Real case: the deliverable says "nằm trên mạng Ethereum", the model quoted "từ mạng Ethereum".
    const quote = "từ mạng Ethereum ... nhận trên mạng Arc";
    const r = checkEvidenceVerbatim([quote], BODY_VI);
    expect(r.kept).toHaveLength(0);
    expect(r.dropped).toEqual([{ quote, reason: expect.stringContaining("từ mạng ethereum") }]);
  });

  it("drops a paraphrased quote", () => {
    const r = checkEvidenceVerbatim(["Khách hàng người Mỹ mua một bộ giá 120 USD"], BODY_VI);
    expect(r.kept).toHaveLength(0);
    expect(r.dropped).toHaveLength(1);
  });

  it("ignores fragments under 10 characters but still checks the long ones", () => {
    // "Arc" alone would match almost anything; the long fragment is what must be real.
    expect(checkEvidenceVerbatim(["Arc ... Ví của khách nằm trên"], BODY_VI).kept).toHaveLength(1);
    expect(checkEvidenceVerbatim(["Arc ... Ví của khách bị khoá"], BODY_VI).kept).toHaveLength(0);
  });

  it("drops a quote whose every fragment is under 10 characters", () => {
    const r = checkEvidenceVerbatim(["mạng Arc", "USD ... USDC"], BODY_VI);
    expect(r.kept).toHaveLength(0);
    expect(r.dropped.map((d) => d.reason)).toEqual([
      expect.stringContaining("no fragment"),
      expect.stringContaining("no fragment"),
    ]);
  });
});

describe("normalizeForMatch", () => {
  it("collapses whitespace runs and lowercases", () => {
    expect(normalizeForMatch("  Ví\n\tCỦA   khách ")).toBe(" ví của khách ");
  });
});

describe("applyEvidenceRules", () => {
  const item = (item_id: string, score: number, evidence: string[]) => ({ item_id, score, evidence });

  it("zeroes an item whose only quote was paraphrased, and leaves verified items alone", () => {
    const { effective, drops } = applyEvidenceRules(
      [item("r1", 90, ["Ví của khách nằm trên mạng Ethereum"]), item("r2", 97, ["từ mạng Ethereum"])],
      BODY_VI,
    );
    expect(effective[0]).toEqual(item("r1", 90, ["Ví của khách nằm trên mạng Ethereum"]));
    expect(effective[1]).toEqual(item("r2", 0, [UNVERIFIED_EVIDENCE_PLACEHOLDER]));
    expect(drops.map((d) => d.item_id)).toEqual(["r2"]);
  });

  it("keeps an item's score when at least one of its quotes is verified", () => {
    const { effective } = applyEvidenceRules(
      [item("r1", 80, ["từ mạng Ethereum", "muốn trả bằng USDC"])],
      BODY_VI,
    );
    expect(effective[0]).toEqual(item("r1", 80, ["muốn trả bằng USDC"]));
  });

  it("keeps the existing rule for an item that cited nothing", () => {
    const { effective, drops } = applyEvidenceRules([item("r1", 85, [])], BODY_VI);
    expect(effective[0]).toEqual(item("r1", 0, [NO_EVIDENCE_PLACEHOLDER]));
    expect(drops).toHaveLength(0);
  });
});
