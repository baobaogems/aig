// track-record.test.ts — khoá hai công thức từng sai, và quy ước null của huy hiệu nav.

import { describe, expect, it } from "vitest";
import type { AgentStats } from "@/lib/arbiter/store";
import { countPendingDecisions, deriveTrackRecord } from "./track-record";

/** Số thật của production lúc 21/09/2026. */
const LIVE: AgentStats = {
  total_verdicts: 13,
  t1_auto_release: 4,
  refused: 0,
  human_reviewed: 4,
  overridden: 1,
  override_rate: 1,
  decisive_reviewed: 1,
};

const lane = (r: ReturnType<typeof deriveTrackRecord>, k: string) =>
  r.lanes.find((l) => l.key === k)!.count;

describe("deriveTrackRecord", () => {
  it("khớp đúng số của dải thống kê cũ", () => {
    const r = deriveTrackRecord(LIVE);
    expect(r.totalVerdicts).toBe(13);
    expect(lane(r, "auto")).toBe(4);
    expect(lane(r, "failed")).toBe(5); // 13 - 4 - 0 - 4
    expect(lane(r, "human")).toBe(4);
    expect(lane(r, "refused")).toBe(0);
  });

  it("các làn cộng lại bằng tổng phán quyết", () => {
    // Đây là điều dải cũ KHÔNG làm được trước khi có ô tính bù: ba phán quyết
    // trượt biến mất vì agent_stats không đếm FAIL.
    const r = deriveTrackRecord(LIVE);
    expect(r.lanes.reduce((s, l) => s + l.count, 0)).toBe(r.totalVerdicts);
  });

  it("ô tính bù không bao giờ âm khi view trả số không nhất quán", () => {
    const skewed: AgentStats = { ...LIVE, t1_auto_release: 99 };
    expect(lane(deriveTrackRecord(skewed), "failed")).toBe(0);
  });

  it("mẫu số nhỏ hiện phân số, không hiện phần trăm", () => {
    // "100.0%" trên đúng một ca là nói quá. "1 of 1" trung thực.
    expect(deriveTrackRecord(LIVE).overturned).not.toMatch(/%/);
    expect(deriveTrackRecord(LIVE).overturned).toMatch(/1/);
  });
});

describe("countPendingDecisions — con số trên huy hiệu nav", () => {
  const rows = [
    { status: "JUDGED", poster_id: "0xABC" },
    { status: "JUDGED", poster_id: "0xdef" },
    { status: "OPEN", poster_id: "0xabc" },
    { status: "RELEASED", poster_id: "0xabc" },
    { status: "JUDGED", poster_id: null },
  ];

  it("chỉ đếm JUDGED mà người xem là NGƯỜI ĐĂNG", () => {
    expect(countPendingDecisions(rows, "0xabc")).toBe(1);
  });

  it("không phân biệt hoa thường — địa chỉ ví đến từ nhiều nguồn", () => {
    expect(countPendingDecisions(rows, "0xABC")).toBe(1);
    expect(countPendingDecisions(rows, "0xAbC")).toBe(1);
  });

  it("chưa đăng nhập trả null, KHÔNG phải 0", () => {
    // 0 là khẳng định "bạn không có việc nào chờ"; null là "chưa biết bạn là ai".
    // Nav hiện huy hiệu cho cái đầu, không hiện gì cho cái sau.
    expect(countPendingDecisions(rows, null)).toBeNull();
    expect(countPendingDecisions(rows, undefined)).toBeNull();
    expect(countPendingDecisions(rows, "")).toBeNull();
  });

  it("đăng nhập nhưng không có việc chờ thì trả 0", () => {
    expect(countPendingDecisions(rows, "0xnobody")).toBe(0);
  });
});
