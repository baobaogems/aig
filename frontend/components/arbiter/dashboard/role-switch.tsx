"use client";

export function RoleSwitch({
  role,
  onRoleChange,
  postedActionCount,
  claimedActionCount,
}: {
  role: "posted" | "claimed";
  onRoleChange: (r: "posted" | "claimed") => void;
  postedActionCount: number;
  claimedActionCount: number;
}) {
  return (
    <div className="mb-[30px] mt-[26px] inline-flex gap-1 p-[5px]" style={{ border: "1px solid var(--a-line-dim)", background: "rgba(17,17,17,.02)" }}>
      <button
        onClick={() => onRoleChange("posted")}
        className={`a-cut-sm inline-flex cursor-pointer items-center gap-[9px] border border-transparent px-[18px] py-[10px] font-[family-name:var(--font-display)] text-[11px] font-extrabold uppercase tracking-[0.11em] transition-[0.15s] ${
          role === "posted" ? "bg-[var(--a-acc)] text-white" : "bg-transparent text-[var(--a-subtle)] hover:text-[var(--a-text)]"
        }`}
      >
        As poster
        <span
          className={`a-tnum rounded-full px-[7px] py-[2px] font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-extrabold ${
            role === "posted"
              ? "bg-[rgba(255,255,255,.25)] text-white"
              : postedActionCount > 0
              ? "bg-[var(--a-bad)] text-white"
              : "bg-[rgba(17,17,17,.08)] text-[var(--a-muted)]"
          }`}
        >
          {postedActionCount}
        </span>
      </button>

      <button
        onClick={() => onRoleChange("claimed")}
        className={`a-cut-sm inline-flex cursor-pointer items-center gap-[9px] border border-transparent px-[18px] py-[10px] font-[family-name:var(--font-display)] text-[11px] font-extrabold uppercase tracking-[0.11em] transition-[0.15s] ${
          role === "claimed" ? "bg-[var(--a-acc)] text-white" : "bg-transparent text-[var(--a-subtle)] hover:text-[var(--a-text)]"
        }`}
      >
        As worker
        <span
          className={`a-tnum rounded-full px-[7px] py-[2px] font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-extrabold ${
            role === "claimed"
              ? "bg-[rgba(255,255,255,.25)] text-white"
              : claimedActionCount > 0
              ? "bg-[var(--a-bad)] text-white"
              : "bg-[rgba(17,17,17,.08)] text-[var(--a-muted)]"
          }`}
        >
          {claimedActionCount}
        </span>
      </button>
    </div>
  );
}
