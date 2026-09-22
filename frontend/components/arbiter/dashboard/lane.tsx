"use client";

import { ReactNode } from "react";

export function Lane({
  title,
  count,
  hint,
  active = false,
  children,
}: {
  title: string;
  count: number;
  hint?: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`mb-[34px] ${active ? "active-lane" : ""}`}>
      <div className="mb-[13px] flex flex-wrap items-center gap-[11px]">
        <h3
          className="m-0 font-[family-name:var(--font-display)] text-[14px] font-extrabold uppercase tracking-[0.09em]"
          style={{ color: active ? "var(--a-acc)" : "var(--a-muted)" }}
        >
          {title}
        </h3>
        {count > 0 && (
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px]" style={{ color: "var(--a-subtle)" }}>
            {count}
          </span>
        )}
        {hint && (
          <span className="w-full text-[12px] sm:ml-auto sm:w-auto" style={{ color: "var(--a-subtle)" }}>
            {hint}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
