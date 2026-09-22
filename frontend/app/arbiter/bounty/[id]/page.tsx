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
import { RubricTable } from "@/components/arbiter/rubric-table";
import { DecisionThresholds } from "@/components/arbiter/decision-thresholds";
import { BountyActionPanel } from "@/components/arbiter/bounty-action-panel";
import { getBountyDetail } from "@/lib/arbiter/store";
import { scopeDetailToViewer } from "@/lib/arbiter/bounty-view";
import { SESSION_COOKIE, openSession } from "@/lib/auth/siwe-session";
import { STATE_LABEL, bountyState, shortCode, timeLeft } from "@/lib/arbiter/bounty-display";
import { AMoney } from "@/components/arbiter/ui/a-money";
import { AChip } from "@/components/arbiter/ui/a-chip";
import { ArbiterNav } from "@/components/arbiter/arbiter-nav";
import { PageBackdrop } from "@/components/arbiter/ui/page-backdrop";

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
    return { title: "Bounty not found — Arbiter" };
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
  const { bounty, rubric, submission } = detail;
  const now = Date.now();
  const state = bountyState(bounty.worker_id, bounty.status, bounty.deadline, now);
  const closed = state === "closed" || state === "expired";

  return (
    <div className="arbiter-ui">
      <PageBackdrop />
      <ArbiterNav current="market" walletSlot={<span />} pendingDecisions={null} />
      <main className="bg-grain relative z-[1] min-h-screen px-4 pb-16 pt-12">
        <div className="mx-auto grid max-w-[1120px] gap-6">
          <Link
            href="/arbiter"
            className="text-[12px] font-bold uppercase tracking-widest transition-colors hover:opacity-100 opacity-70"
            style={{ color: "var(--a-text-dark-label)" }}
          >
            ← Back to market
          </Link>

          <header>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-widest font-bold m-0" style={{ color: "var(--a-text-dark-h1)" }}>
                {shortCode(bounty.id)}
              </span>
              <AChip tone={closed ? "neutral" : "acc"}>{STATE_LABEL[state]}</AChip>
            </div>

            <div className="mt-3 max-w-xs">
              <AMoney amountUsdc={bounty.amount_usdc} label="IN ESCROW" dim={closed} />
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--a-text-dark-sub)" }}>
              locked on Arc testnet · {timeLeft(bounty.deadline, now)}
            </p>
          </header>

          <dl className="grid gap-3 sm:grid-cols-3">
            <Stat label="Deadline" value={new Date(bounty.deadline).toLocaleString("vi-VN")} />
            <Stat label="Status" value={STATE_LABEL[state]} />
            <Stat
              label="Funds from"
              value="poster's escrow"
              note="not Arbiter's wallet"
            />
          </dl>

          <Section title="Task">
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed m-0" style={{ color: "var(--a-text-dark-h1)" }}>
              {bounty.brief.replace("cho 1 bài văn 500 chữ miêu tả tiềm năng của nền kinh tế AI agent mà Arc đã khởi xướng", "Write a 500-word essay describing the potential of the AI agent economy initiated by Arc")}
            </p>
          </Section>

          <Section title="Grading Rubric">
            <RubricTable items={rubric?.items_json ?? []} frozen={Boolean(rubric?.frozen)} />
          </Section>

          <Section title="Payout Thresholds">
            <DecisionThresholds />
          </Section>

          {submission && (
            <Section title="Submission">
              {isParty ? (
                <div
                  className="a-cut-sm max-h-72 overflow-y-auto whitespace-pre-wrap border p-4 text-[13px] leading-relaxed"
                  style={{ background: "var(--a-box-dark)", borderColor: "var(--a-border-dark)", color: "var(--a-text-dark-h1)" }}
                >
                  {submission.content_snapshot}
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: "var(--a-text-dark-sub)" }}>
                  Submission received. Content is visible only to the poster and worker.
                </p>
              )}
            </Section>
          )}

          <BountyActionPanel bountyId={bounty.id} state={state} />
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div
      className="a-card flex flex-col p-4 border"
      style={{ background: "var(--a-card-dark)", borderColor: "var(--a-border-dark)" }}
    >
      <dt className="font-[family-name:var(--font-jetbrains-mono)] text-[9px] uppercase tracking-[0.1em]" style={{ color: "var(--a-text-dark-label)" }}>
        {label}
      </dt>
      <dd className="mt-1 text-[13px] font-bold" style={{ color: "var(--a-text-dark-h1)" }}>
        {value}
      </dd>
      {note && (
        <dd className="mt-0.5 text-[11px]" style={{ color: "var(--a-text-dark-label)" }}>
          {note}
        </dd>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="a-card p-5 border"
      style={{ background: "var(--a-card-dark)", borderColor: "var(--a-border-dark)" }}
    >
      <h2
        className="font-[family-name:var(--font-display)] text-[14px] font-bold tracking-[0.05em] uppercase m-0 mb-4"
        style={{ color: "var(--a-text-dark-label)" }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
