"use client";

// track-record-band.tsx — hồ sơ trọng tài, thay dải 6 số phẳng.
//
// Lỗi E1 của bản cũ: 13 / 4 / 5 / 0 / 4 / 1of1 cùng cỡ chữ, cùng màu mực. Sáu sự
// thật ngang hàng nhau thì mắt không biết bắt đầu từ đâu — trong khi đây là thứ
// duy nhất chứng minh hệ thống chạy thật.
//
// Bản này nói MỘT câu trước, rồi mới chi tiết: một thanh tỉ lệ cho thấy tỉ trọng,
// legend cho con số. Ô escrow tách sang phải vì nó trả lời câu hỏi khác ("hiện
// đang giữ bao nhiêu tiền"), không phải một ô thứ bảy của cùng dãy.

import type { AgentStats } from "@/lib/arbiter/store";
import { deriveTrackRecord } from "@/lib/arbiter/track-record";
import { AEyebrow } from "@/components/arbiter/ui/a-eyebrow";

export function TrackRecordBand({
  stats,
  escrowUsdc,
  activeCount,
}: {
  stats: AgentStats | null;
  escrowUsdc: number;
  activeCount: number;
}) {
  if (!stats) {
    return (
      <div
        className="a-cut flex min-h-[4.5rem] items-center border px-5"
        style={{ borderColor: "var(--a-line)", background: "var(--a-panel)" }}
      >
        <p className="text-sm" style={{ color: "var(--a-muted)" }}>
          Đang tải hồ sơ trọng tài…
        </p>
      </div>
    );
  }

  const r = deriveTrackRecord(stats);
  const total = Math.max(1, r.lanes.reduce((s, l) => s + l.count, 0));

  return (
    <div
      className="a-cut grid gap-6 border px-[22px] py-5 lg:grid-cols-[1fr_auto] lg:items-center"
      style={{ borderColor: "var(--a-line)", background: "var(--a-panel)" }}
    >
      <div>
        <AEyebrow>TRACK RECORD · ARC TESTNET</AEyebrow>

        <p className="m-0 text-[25px] font-extrabold leading-[1.3] tracking-[-0.01em]">
          <span className="a-tnum font-[family-name:var(--font-jetbrains-mono)]">
            {r.totalVerdicts}
          </span>{" "}
          phán quyết đã ghi lên chain.{" "}
          <span style={{ color: "var(--a-acc)" }}>{r.overturned} bị người đăng lật.</span>
        </p>

        {/* Thanh tỉ lệ: tỉ trọng đọc được trước cả khi đọc số. */}
        <div className="mt-4 flex h-1.5 overflow-hidden" style={{ background: "rgba(17,17,17,.08)" }}>
          {r.lanes.map((l) => (
            <i
              key={l.key}
              aria-hidden="true"
              style={{ flexGrow: l.count / total, background: `var(${l.cssVar})` }}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-[18px] gap-y-2">
          {r.lanes.map((l) => (
            <div key={l.key} className="flex items-center gap-[7px] text-[11.5px]" style={{ color: "var(--a-muted)" }}>
              <i
                aria-hidden="true"
                className="h-[7px] w-[7px] flex-none"
                style={{ background: `var(${l.cssVar})` }}
              />
              <b className="a-tnum font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-bold" style={{ color: "var(--a-text)" }}>
                {l.count}
              </b>
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div
        className="a-cut-sm border px-[22px] py-4 lg:text-right"
        style={{ borderColor: "var(--a-line-hard)", background: "rgba(var(--a-acc-rgb),.055)" }}
      >
        <div className="font-[family-name:var(--font-jetbrains-mono)] text-[9px] uppercase tracking-[0.15em]" style={{ color: "var(--a-muted)" }}>
          TOTAL IN ESCROW
        </div>
        <div className="a-tnum mt-2 font-[family-name:var(--font-jetbrains-mono)] text-[30px] font-extrabold leading-none" style={{ color: "var(--a-acc)" }}>
          {escrowUsdc}
          <span className="ml-1.5 text-[11px]" style={{ color: "var(--a-muted)" }}>USDC</span>
        </div>
        <div className="mt-2.5 font-[family-name:var(--font-jetbrains-mono)] text-[9px] uppercase tracking-[0.15em]" style={{ color: "var(--a-muted)" }}>
          {activeCount} BOUNTY ACTIVE
        </div>
      </div>
    </div>
  );
}
