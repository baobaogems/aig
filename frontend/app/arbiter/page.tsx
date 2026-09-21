"use client";

// =============================================================================
// /app/arbiter/page.tsx — the board.
//
// Redesigned from a wall of identical rows (see plans/ ui-redesign stop 1–4). The failures it
// was built to fix, by name:
//
//   D1  ten rows with identical spacing read as one undifferentiated block. Now: two sections,
//       56px apart, against 12–16px inside a card — the eye separates them without a rule.
//   E1  the amount had the least weight on screen. Now it is the card's anchor (AmountBlock).
//   H1  "date · worker" glued two kinds of fact together. Now they live in different places.
//   —   four tabs flattened two independent questions ("still open?" and "mine?") into one
//       row where they looked like alternatives. Now: two labelled filter groups.
//
// One filled accent button on the page (E3), and it is the one that puts money into escrow.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { PosterBountyForm } from "@/components/arbiter/poster-bounty-form";
import { WorkerSubmitForm } from "@/components/arbiter/worker-submit-form";
import { BountyGrid } from "@/components/arbiter/bounty-grid";
import { TrackRecordBand } from "@/components/arbiter/track-record-band";
import { ArbiterNav } from "@/components/arbiter/arbiter-nav";
import { PageBackdrop } from "@/components/arbiter/ui/page-backdrop";
import type { AgentStats } from "@/lib/arbiter/store";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { PillButton } from "@/components/ui/pill-button";
import { Drawer } from "@/components/ui/drawer";
import { WalletConnectButton } from "@/components/arbiter/wallet-connect-button";
import type { BountyCardData } from "@/components/arbiter/bounty-card";

interface BountyRow extends BountyCardData {
  created_at: string;
}

type OpenDrawer = null | "create" | "submit";
type Availability = "open" | "done" | "all";
type Role = "all" | "posted" | "claimed";

/** Which server view answers a given role filter. Availability is applied client-side. */
const ROLE_VIEW: Record<Role, string> = {
  all: "all",
  posted: "mine-posted",
  claimed: "mine-claimed",
};

const OPEN_STATUSES = new Set(["OPEN", "SUBMITTED"]);

export default function ArbiterPage() {
  const [bounties, setBounties] = useState<BountyRow[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<OpenDrawer>(null);
  const [session, setSession] = useState<string | null>(null);
  const [pending, setPending] = useState<number | null>(null);

  const [availability, setAvailability] = useState<Availability>("open");
  const [role, setRole] = useState<Role>("all");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/bounty?view=${ROLE_VIEW[role]}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setBounties(j.bounties);
      setStats(j.stats);
      setPending(j.pending_decisions ?? null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  // Split once, render twice. A bounty is "open" while it is still workable; everything that
  // has been judged, paid, refunded or run out of time belongs to the record below.
  //
  // Deliberately NOT recomputed on a per-second clock. This page owns the drawers, and the
  // drawers own text inputs: re-rendering it every second interrupted IME composition, so
  // typing "đá" in Vietnamese produced "dá" — the second keystroke of the đ was wiped by a
  // re-render before it could combine. The ticking clock now lives inside BountyGrid, which
  // contains no inputs. Section membership therefore updates on data refresh rather than the
  // instant a deadline passes, which is also the calmer behaviour: a card should not jump to
  // another section while someone is reading it.
  const { open, done } = useMemo(() => {
    const at = Date.now();
    const isOpen = (b: BountyRow) =>
      OPEN_STATUSES.has(b.status) && new Date(b.deadline).getTime() > at;
    return {
      open: bounties.filter(isOpen),
      done: bounties.filter((b) => !isOpen(b)),
    };
  }, [bounties]);

  const showOpen = availability !== "done";
  const showDone = availability !== "open";

  return (
    <div className="arbiter-ui">
      <PageBackdrop />
      <ArbiterNav
        current="market"
        pendingDecisions={pending}
        walletSlot={<WalletConnectButton onSession={setSession} />}
      />
      <main className="bg-grain relative z-[1] min-h-screen bg-gradient-to-b from-[var(--color-surface-light)] via-[var(--color-surface-light-2)] to-[var(--color-surface-light)] px-4 pb-20 pt-12">
      <div className="mx-auto grid max-w-5xl gap-14">
        <div>
          <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--a-muted)" }}>
            Người đăng khoá USDC vào escrow trên Arc testnet. Một trọng tài AI chấm bài theo
            bộ tiêu chí đã đóng băng, và tiền tự đi khi bài đủ điểm — mọi phán quyết đều ghi
            hash lên chain.
          </p>
        </div>

        <TrackRecordBand
          stats={stats}
          escrowUsdc={Number(open.reduce((sum, b) => sum + b.amount_usdc, 0).toFixed(3))}
          activeCount={open.length}
        />

        {error && (
          <p
            className="rounded-xl px-4 py-3 text-sm"
            style={{ color: "var(--color-ink-danger)", backgroundColor: "var(--color-chip-danger)" }}
          >
            {error}
          </p>
        )}

        <section className="grid gap-5">
          <SectionHeader
            eyebrow="đang mở"
            title="Chợ việc"
            description="Việc đã khoá tiền và còn hạn. Đọc tiêu chí chấm trước khi nhận — không cần đăng nhập."
            action={
              session ? (
                <div className="flex flex-wrap gap-2">
                  {/* The only filled accent button on the page: it is the one that moves money. */}
                  <PillButton onClick={() => setDrawer("create")}>Đăng việc</PillButton>
                  <PillButton variant="secondary" onClick={() => setDrawer("submit")}>
                    Nộp bài
                  </PillButton>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-ink-muted)]">Kết nối ví để đăng hoặc nhận việc.</p>
              )
            }
          />

          <FilterBar
            resultCount={showOpen && showDone ? bounties.length : showOpen ? open.length : done.length}
            groups={[
              {
                label: "Trạng thái",
                value: availability,
                onChange: (v) => setAvailability(v as Availability),
                options: [
                  { value: "open", label: "Đang mở" },
                  { value: "done", label: "Đã xong" },
                  { value: "all", label: "Tất cả" },
                ],
              },
              {
                label: "Vai trò",
                value: role,
                onChange: (v) => setRole(v as Role),
                options: [
                  { value: "all", label: "Tất cả" },
                  { value: "posted", label: "Tôi đăng" },
                  { value: "claimed", label: "Tôi nhận" },
                ],
              },
            ]}
          />

          {showOpen && (
            <BountyGrid
              bounties={open}
              loading={loading}
              signedIn={Boolean(session)}
              onChanged={refresh}
              emptyTitle="Chưa có việc nào đang mở."
              emptyHint="Việc chỉ hiện ở đây sau khi người đăng đã khoá USDC vào escrow."
            />
          )}
        </section>

        {showDone && (
          <section className="grid gap-5">
            <SectionHeader
              eyebrow="kết quả"
              title="Việc đã xong"
              description="Những việc đã chấm xong hoặc hết hạn — trả tiền, hoàn tiền, hay người đăng tự quyết. Đây là hồ sơ công khai của trọng tài."
            />
            <BountyGrid
              bounties={done}
              loading={loading}
              emptyTitle="Chưa có việc nào kết thúc."
              emptyHint="Việc sẽ chuyển xuống đây sau khi được chấm, hoàn tiền, hoặc quá hạn."
            />
          </section>
        )}
      </div>

      <Drawer
        open={drawer === "create"}
        onClose={() => setDrawer(null)}
        title="Đăng việc mới"
        description="Mô tả công việc bằng lời thường. Trọng tài soạn bộ tiêu chí từ đó; bạn duyệt và đóng băng trước khi khoá tiền."
      >
        <PosterBountyForm onChanged={refresh} />
      </Drawer>

      <Drawer
        open={drawer === "submit"}
        onClose={() => setDrawer(null)}
        title="Nộp bài"
        description="Nội dung được đóng băng ngay lúc nộp. Sửa nguồn sau đó không tính."
      >
        <WorkerSubmitForm onChanged={refresh} />
      </Drawer>
      </main>
    </div>
  );
}
