"use client";

// =============================================================================
// /app/dashboard/page.tsx — Merchant Dashboard, Pencil design
// Layout: Header | Metrics Row | (Recent Payments | QR + Points columns)
// Data: Supabase via /api/dashboard + /api/points, real-time feed in table
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { PaymentFeedTable } from "@/components/payment-feed-table";
import { DashboardStatCards } from "@/components/dashboard-stat-cards";
import { PointsTierCard } from "@/components/points-tier-card";
import { NanoAgentsCard } from "@/components/nano-agents-card";
import { DashboardConnectGate } from "@/components/dashboard/dashboard-connect-gate";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardApiErrorBanner } from "@/components/dashboard/dashboard-api-error-banner";
import { DashboardQrCard } from "@/components/dashboard/dashboard-qr-card";
import { cardClass } from "@/components/dashboard/dashboard-card-style";
import type { DashboardStats } from "@/lib/merchant";

interface PointsData {
  totalPoints: number;
  tier: string;
  lastActivity: string | null;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [mounted, setMounted] = useState(false);
  const [targetUSDC, setTargetUSDC] = useState<number>(5);
  const [qrKey, setQrKey] = useState(0);
  const qrCardRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Prevent hydration mismatch: wagmi state differs server vs client
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    const load = async () => {
      setApiError(null);
      setStatsLoading(true);

      try {
        const data = await fetch(`/api/points?wallet=${address}`).then((r) =>
          r.json(),
        );
        if (!cancelled && !data.error) setPoints(data);
      } catch {
        // ignore — points are non-critical
      }

      try {
        const data = await fetch(`/api/dashboard?wallet=${address}`).then((r) =>
          r.json(),
        );
        if (cancelled) return;
        if (data.error) setApiError(data.error);
        else setDashStats(data.stats);
      } catch (e) {
        if (!cancelled)
          setApiError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  // SSR placeholder — render nothing until client hydrates
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-light)] flex items-center justify-center">
        <p className="text-[var(--color-ink-muted)] text-sm">Loading...</p>
      </main>
    );
  }

  // ── Not connected: wallet connect screen ─────────────────────────────────
  if (!isConnected) {
    return <DashboardConnectGate onConnect={() => connect({ connector: injected() })} />;
  }

  // ── Connected: full Pencil layout ─────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[var(--color-surface-light)]" style={{ padding: "32px 40px" }}>
      <div className="flex flex-col gap-7">

        {/* ── 1. Page Header ─────────────────────────────────────────────── */}
        <DashboardHeader
          address={address}
          onGenerateQr={() => {
            setQrKey((k) => k + 1);
            qrCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          onDisconnect={() => disconnect()}
        />

        {/* ── API Error Banner ───────────────────────────────────────────── */}
        {apiError && <DashboardApiErrorBanner />}

        {/* ── 2. Metrics Row ──────────────────────────────────────────────── */}
        <DashboardStatCards
          totalRevenue={dashStats?.totalRevenue ?? 0}
          transactionCount={dashStats?.transactionCount ?? 0}
          pointsBalance={points?.totalPoints ?? 0}
          tier={points?.tier ?? "Builder"}
          loading={statsLoading}
        />

        {/* ── 3. Content Columns ──────────────────────────────────────────── */}
        <div className="flex flex-row gap-6">

          {/* Left: Recent Payments table */}
          <div className={`flex-1 flex flex-col ${cardClass}`}>
            {/* Table header */}
            <div className="flex flex-row items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--color-ink)]">
                Recent Payments
              </span>
            </div>
            {/* Table body */}
            <PaymentFeedTable merchantWallet={address ?? ""} />
          </div>

          {/* Right column: QR card + Points card */}
          <div className="w-[340px] flex flex-col gap-6">

            {/* QR Code Card */}
            <DashboardQrCard
              cardRef={qrCardRef}
              qrKey={qrKey}
              address={address}
              targetUSDC={targetUSDC}
              onAmountChange={setTargetUSDC}
            />

            {/* Points & Tier Card */}
            <PointsTierCard
              totalPoints={points?.totalPoints ?? 0}
              tier={points?.tier ?? "Builder"}
            />
          </div>
        </div>

        {/* ── 4. Agent Nanopayments (v3.1 aggregate) ──────────────────────── */}
        <NanoAgentsCard merchantWallet={address ?? ""} />

      </div>
    </main>
  );
}
