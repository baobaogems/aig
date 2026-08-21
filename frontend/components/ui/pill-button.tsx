// pill-button.tsx — reskin design token: fully-rounded pill CTA.
// primary = dark fill + cyan circular arrow chip; secondary = outline pill, cyan text.
// Renders <a> when href is given, otherwise <button> — no client hooks, safe in server trees.

import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

interface PillButtonBaseProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "secondary-on-dark";
  className?: string;
}

type PillButtonProps =
  | (PillButtonBaseProps & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | (PillButtonBaseProps & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>);

const base =
  "group inline-flex items-center gap-3 rounded-full text-sm font-medium transition-all duration-200 " +
  "hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";

const variants = {
  primary: "bg-[var(--color-surface-dark)] text-[var(--color-on-dark)] pl-5 pr-1.5 py-1.5",
  secondary:
    "border border-[var(--color-accent)]/40 text-[var(--color-accent)] px-5 py-2 hover:border-[var(--color-accent)]",
  // Trên obsidian, --color-accent (#de1e14) là đỏ sẫm trên nền gần đen — tối và khó
  // đọc. Nền tối dùng ember, giống cách khối safety xử lý chữ nhấn của nó.
  "secondary-on-dark":
    "border border-[var(--color-accent-bright)]/40 text-[var(--color-accent-bright)] px-5 py-2 hover:border-[var(--color-accent-bright)]",
};

export function PillButton({ children, variant = "primary", className = "", ...props }: PillButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;
  const arrowChip = variant === "primary" && (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-surface-dark)]
                 transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 7h9M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );

  if ("href" in props && props.href) {
    const { href, ...rest } = props as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <a href={href} className={classes} {...rest}>
        {children}
        {arrowChip}
      </a>
    );
  }
  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
      {arrowChip}
    </button>
  );
}
