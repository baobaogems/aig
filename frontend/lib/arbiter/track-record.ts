// =============================================================================
// track-record.ts — hồ sơ làm việc của trọng tài, tính sẵn để hiển thị.
//
// Chuyển ra khỏi agent-stats-strip.tsx khi dải 6 số phẳng được thay bằng một câu
// + một thanh tỉ lệ. Hai công thức dưới đây KHÔNG hiển nhiên và đã từng sai, nên
// chúng ở đây — nơi test với tới được — chứ không nằm trong JSX.
// =============================================================================

import type { AgentStats } from "@/lib/arbiter/store";
import { formatOverrideRate } from "@/lib/arbiter/override-rate";

export interface TrackRecordLane {
  key: "auto" | "failed" | "human" | "refused";
  count: number;
  /** Nhãn tiếng Việt — đây là nội dung đọc, không phải nhãn cấu trúc. */
  label: string;
  cssVar: string;
}

export interface TrackRecord {
  totalVerdicts: number;
  /** Dạng phân số khi mẫu số nhỏ: "1 of 1", không phải "100.0%". */
  overturned: string;
  lanes: TrackRecordLane[];
}

export function deriveTrackRecord(stats: AgentStats): TrackRecord {
  // agent_stats đếm REFUSE và KHÔNG BAO GIỜ đếm FAIL, nên phần còn lại vốn bị mất
  // tăm: cộng released + refused + escalated lại vẫn thiếu so với tổng, và ba phán
  // quyết trượt biến mất khỏi hồ sơ. Tính bù ở đây thay vì sửa view trong database.
  const failed = Math.max(
    0,
    stats.total_verdicts - stats.t1_auto_release - stats.refused - stats.human_reviewed,
  );

  return {
    totalVerdicts: stats.total_verdicts,
    // Mẫu số là những phán quyết trọng tài ĐÃ DỨT KHOÁT và người đăng đã trả lời.
    // Một ESCALATE không có lập trường nào để lật, nên không thuộc vế nào.
    overturned: formatOverrideRate({
      escalatedToHuman: stats.human_reviewed,
      overturned: stats.overridden,
      decisiveReviewed: stats.decisive_reviewed,
    }),
    lanes: [
      { key: "auto", count: stats.t1_auto_release, label: "auto-paid", cssVar: "--a-ok" },
      { key: "failed", count: failed, label: "graded, not passed", cssVar: "--a-warn" },
      { key: "human", count: stats.human_reviewed, label: "released to poster", cssVar: "--a-info" },
      { key: "refused", count: stats.refused, label: "grading declined", cssVar: "--a-line-dim" },
    ],
  };
}

/**
 * Bao nhiêu bounty đang chờ CHÍNH người này quyết.
 *
 * JUDGED nghĩa là trọng tài đã chấm xong và tiền vẫn nằm trong escrow tới khi
 * người đăng bấm. Đó là con số đứng trên nav — một lời nhắc việc, nên nó chỉ
 * đếm bounty mà người xem là NGƯỜI ĐĂNG.
 *
 * Trả `null` khi chưa đăng nhập, không phải `0`: 0 là một khẳng định ("bạn không
 * có việc nào chờ"), null là "chưa biết bạn là ai". Nav hiện huy hiệu cho cái
 * đầu và không hiện gì cho cái sau.
 */
export function countPendingDecisions(
  bounties: { status: string; poster_id?: string | null }[],
  viewer: string | null | undefined,
): number | null {
  if (!viewer) return null;
  const me = viewer.toLowerCase();
  return bounties.filter((b) => b.status === "JUDGED" && b.poster_id?.toLowerCase() === me).length;
}
