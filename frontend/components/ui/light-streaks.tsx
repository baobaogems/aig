// light-streaks.tsx — reskin: slow-drifting cyan SVG light-streak paths for hero backgrounds.
// Pure CSS/SVG, no image assets; .light-streak drift animation defined in globals.css
// and disabled under prefers-reduced-motion there.

export function LightStreaks({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`light-streak pointer-events-none absolute ${className}`}
      viewBox="0 0 800 600"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="streak-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-accent-bright)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--color-accent-bright)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M-50 420 C 200 380, 350 460, 850 300" stroke="url(#streak-a)" strokeWidth="2" />
      <path d="M-50 300 C 220 260, 380 340, 850 180" stroke="url(#streak-a)" strokeWidth="1.5" opacity="0.7" />
      <path d="M-50 200 C 180 240, 420 120, 850 260" stroke="url(#streak-a)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
