"use client";

// arbiter-nav.tsx — thanh điều hướng của màn Arbiter.
//
// Trang cũ không có nav, chỉ có một cái tiêu đề. Nghĩa là không có đường sang
// Dashboard, và không có chỗ nào báo "có việc đang chờ bạn quyết".
//
// HAI ĐIỀU DỄ LÀM SAI, ĐÃ LÀM SAI MỘT LẦN Ở BẢN MOCKUP
//
// 1. Ở mobile KHÔNG được ẩn cụm link. Bản mockup từng đặt display:none cho cả
//    cụm ở dưới 820px — nghĩa là trên điện thoại mất hẳn đường vào Dashboard,
//    đúng cái màn hình quan trọng nhất. Ở đây cụm link xuống HÀNG RIÊNG, full
//    width, chia đều. ui-guards/nav-mobile.test.ts canh điều này.
//
// 2. Huy hiệu chỉ hiện khi pendingDecisions là số DƯƠNG. null nghĩa là chưa
//    đăng nhập (chưa biết bạn là ai), 0 nghĩa là không có việc chờ — cả hai đều
//    không đáng chiếm một chấm đỏ.
//
// Nhãn là tiếng Anh không dấu vì chúng dùng Orbitron, font không có dấu tiếng Việt.

import Link from "next/link";
import { AButton } from "@/components/arbiter/ui/a-button";

const LINK =
  "flex items-center justify-center px-[15px] py-2 font-[family-name:var(--font-display)] " +
  "text-[11px] font-semibold uppercase tracking-[0.11em] no-underline transition-colors";

export function ArbiterNav({
  current = "market",
  pendingDecisions,
  walletSlot,
}: {
  current?: "market" | "dashboard";
  pendingDecisions: number | null;
  /** Nút kết nối ví do trang truyền vào — nav không biết gì về phiên đăng nhập. */
  walletSlot?: React.ReactNode;
}) {
  const showBadge = typeof pendingDecisions === "number" && pendingDecisions > 0;

  const item = (href: string, key: "market" | "dashboard", label: string) => (
    <Link
      href={href}
      className={LINK}
      style={
        current === key
          ? { background: "var(--a-acc)", color: "var(--a-on-acc)", fontWeight: 800 }
          : { color: "var(--a-text-light-tab)" }
      }
    >
      {label}
      {key === "dashboard" && showBadge && (
        <span
          className="a-tnum ml-1.5 rounded-[var(--a-pill)] px-1.5 py-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[9px] font-extrabold tracking-normal"
          style={{ background: "var(--a-bad)", color: "#fff" }}
        >
          {pendingDecisions}
        </span>
      )}
    </Link>
  );

  return (
    <nav
      className="sticky top-0 z-20 border-b"
      style={{ background: "var(--a-bg-header)", borderColor: "var(--a-line-dim)" }}
    >
      {/* flex-wrap + order-3 trên cụm link: ở hẹp nó rơi xuống hàng riêng thay vì biến mất. */}
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-4 gap-y-2.5 px-5 py-3">
        <div
          className="a-cut-sm grid h-[34px] w-[34px] flex-none place-items-center font-[family-name:var(--font-display)] text-[15px] font-black"
          style={{ background: "var(--a-acc)", color: "var(--a-on-acc)" }}
          aria-hidden="true"
        >
          A
        </div>
        <div className="mr-auto">
          <p
            className="m-0 font-[family-name:var(--font-display)] text-[20px] font-black leading-none tracking-[0.2em]"
            style={{ color: "var(--a-text-light-brand)" }}
          >
            ARBITER
          </p>
          <p
            className="mt-[3px] hidden font-[family-name:var(--font-jetbrains-mono)] text-[9px] uppercase tracking-[0.16em] sm:block"
            style={{ color: "var(--a-text-light-label)" }}
          >
            ON-CHAIN BOUNTY ARBITRATION
          </p>
        </div>

        <div
          className="order-3 flex w-full gap-1 border p-1 md:order-none md:w-auto"
          style={{ borderColor: "var(--a-line-dim)" }}
        >
          <div className="flex flex-1 md:flex-none">{item("/arbiter", "market", "Market")}</div>
          <div className="flex flex-1 md:flex-none">
            {item("/arbiter/dashboard", "dashboard", "Dashboard")}
          </div>
          {/* Docs ẩn ở mobile: ít dùng nhất, và không có route nội bộ — nó trỏ ra GitHub. */}
          <a
            href="https://github.com/baobaogems/aig/blob/main/docs/arbiter-escrow-evidence.md"
            target="_blank"
            rel="noopener noreferrer"
            className={`${LINK} hidden md:flex`}
            style={{ color: "var(--a-text-light-tab)" }}
          >
            Docs ↗
          </a>
        </div>

        {walletSlot ?? <AButton variant="solid">Connect wallet</AButton>}
      </div>
    </nav>
  );
}
