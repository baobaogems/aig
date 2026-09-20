"use client";

// use-countdown.ts — one clock for the whole board.
//
// The countdown used to be computed once at render, so a tab left open for twenty minutes
// showed a deadline twenty minutes wrong — and the number that matters most on this screen
// is exactly the one that was quietly rotting.
//
// One interval at the list level, not one per card: with thirty rows that would be thirty
// timers waking the tab every second to render the same instant.

import { useEffect, useState } from "react";

/** Returns Date.now(), refreshed every `intervalMs`. Pass it down to pure display helpers. */
export function useCountdown(intervalMs = 1000): number {
  // Seeded at mount rather than at module load, so a long-lived bundle cannot start stale.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
