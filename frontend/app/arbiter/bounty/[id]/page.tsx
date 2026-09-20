// =============================================================================
// /arbiter/bounty/[id] — one bounty, in the order a person needs it.
//
// This is the link that gets pasted into a Telegram group, so it must answer a stranger's
// questions without a wallet, without an account, and without scrolling:
//   how much · how long · is it still free · what exactly do I do · how will I be scored
//
// The scoring criteria are PUBLIC and deliberately so. Other bounty boards hide the task
// behind a connect button; here, being able to read the rubric before committing a weekend
// to the work is the product. Hiding it would leave nothing but a wallet waiting for money.
//
// Server component: the public record renders without JavaScript, and the deliverable is
// redacted by the same rule the API uses (lib/arbiter/bounty-view.ts).
// =============================================================================

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { RubricTable } from "@/components/arbiter/rubric-table";
import { DecisionThresholds } from "@/components/arbiter/decision-thresholds";
import { BountyActionPanel } from "@/components/arbiter/bounty-action-panel";
import { getBountyDetail } from "@/lib/arbiter/store";
import { scopeDetailToViewer } from "@/lib/arbiter/bounty-view";
import { SESSION_COOKIE, openSession } from "@/lib/auth/siwe-session";
import { STATE_LABEL, bountyState, shortCode, timeLeft } from "@/lib/arbiter/bounty-display";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { bounty } = await getBountyDetail(id);
    return {
      title: `${bounty.amount_usdc} USDC · ${shortCode(id)} — Arbiter`,
      description: bounty.brief.slice(0, 160),
    };
  } catch {
    return { title: "Không tìm thấy bounty — Arbiter" };
  }
}

export default async function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let scoped;
  try {
    const viewer = openSession((await cookies()).get(SESSION_COOKIE)?.value);
    scoped = scopeDetailToViewer(await getBountyDetail(id), viewer);
  } catch {
    notFound();
  }

  const { detail, isParty } = scoped;
  const { bounty, rubric, submission, verdict } = detail;

  // Rendered on the server, so this is the state at request time. The board's live ticker is
  // the place for a second-by-second countdown; here the number only has to be honest.
  const now = Date.now();
  const state = bountyState(bounty.worker_id, bounty.status, bounty.deadline, now);

  return (
    <main className="bg-grain min-h-screen bg-gradient-to-b from-[var(--color-surface-light)] via-[var(--color-surface-light-2)] to-[var(--color-surface-light)] px-4 pb-16 pt-12">
      <div className="mx-auto grid max-w-3xl gap-6">
        <Link href="/arbiter" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]">
          ← Về chợ việc
        </Link>

        <header>
          <div className="flex flex-wrap items-center gap-2">
            <EyebrowLabel>{shortCode(bounty.id)}</EyebrowLabel>
            <span className="rounded-[var(--radius-pill)] border border-[var(--color-ink)]/20 px-2 py-0.5 text-xs text-[var(--color-ink-muted)]">
              {STATE_LABEL[state]}
            </span>
          </div>

          <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--color-ink)]">
            {bounty.amount_usdc} USDC
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            đã khoá trong escrow trên Arc testnet · {timeLeft(bounty.deadline, now)}
          </p>
        </header>

        {/* Three facts a worker weighs before reading any further. */}
        <dl className="grid gap-3 sm:grid-cols-3">
          <Stat label="Hạn chót" value={new Date(bounty.deadline).toLocaleString("vi-VN")} />
          <Stat label="Trạng thái" value={STATE_LABEL[state]} />
          <Stat
            label="Tiền đến từ"
            value="escrow của người đăng"
            note="không phải ví của Arbiter"
          />
        </dl>

        <Section title="Nhiệm vụ">
          {/* Plain text, never dangerouslySetInnerHTML — this is user input. */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink)]">
            {bounty.brief}
          </p>
        </Section>

        <Section title="Tiêu chí chấm điểm">
          <RubricTable items={rubric?.items_json ?? []} frozen={Boolean(rubric?.frozen)} />
        </Section>

        <Section title="Tiền được trả theo ngưỡng nào">
          <DecisionThresholds />
        </Section>

        {submission && (
          <Section title="Bài đã nộp">
            {isParty ? (
              <p className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white/60 p-3 text-sm leading-relaxed text-[var(--color-ink)]">
                {submission.content_snapshot}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-ink-muted)]">
                Đã có bài nộp. Nội dung chỉ người đăng và người làm đọc được.
              </p>
            )}
          </Section>
        )}

        {verdict && (
          <Section title="Phán quyết">
            <p className="text-sm text-[var(--color-ink)]">
              {verdict.decision} · điểm {verdict.total_score} · tự tin {verdict.confidence}
            </p>
            <p className="mt-1 break-all font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-muted)]">
              hash: {verdict.verdict_hash}
            </p>
          </Section>
        )}

        <BountyActionPanel bountyId={bounty.id} state={state} />
      </div>
    </main>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-ink)]/10 bg-white/60 px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="mt-1 text-sm text-[var(--color-ink)]">{value}</dd>
      {note && <dd className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{note}</dd>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--color-ink)]/10 bg-white/50 px-5 py-4">
      <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}
