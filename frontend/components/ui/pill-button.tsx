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
  "a-cut-sm inline-flex items-center gap-2 border font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[0.11em] transition-colors px-[18px] py-2.5 text-[11px] text-center";

const variants = {
  primary: "bg-[var(--a-acc)] border-[var(--a-acc)] text-[var(--a-on-acc)] hover:opacity-90",
  secondary:
    "bg-[rgba(255,255,255,.05)] border-[var(--a-line-hard)] text-[var(--a-text-dark-h1)] hover:bg-[rgba(255,255,255,.1)]",
  "secondary-on-dark":
    "bg-[rgba(255,255,255,.05)] border-[var(--a-line-hard)] text-[var(--a-text-dark-h1)] hover:bg-[rgba(255,255,255,.1)]",
};

export function PillButton({ children, variant = "primary", className = "", ...props }: PillButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if ("href" in props && props.href) {
    const { href, ...rest } = props as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <span className="a-focus-host inline-flex">
        <a href={href} className={classes} {...rest}>
          {children}
        </a>
      </span>
    );
  }
  return (
    <span className="a-focus-host inline-flex">
      <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    </span>
  );
}
