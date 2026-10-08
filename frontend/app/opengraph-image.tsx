// opengraph-image.tsx — the 1200×630 card shown when a link to this site is pasted into
// Telegram, X, Slack. Inherited by every route below app/ (including /arbiter).
//
// Brand colours mirror globals.css (--color-surface-light, --color-ink, --color-accent).
// Deliberately NO figures: previews are cached by the chat apps for weeks, and a stale
// "N USDC paid out" in someone's chat history is a false claim we can't take back.

import { ImageResponse } from "next/og";
import { OG_IMAGE_ALT } from "@/lib/site-metadata";

export const alt = OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SURFACE = "#f4f6f6";
const INK = "#111111";
const INK_MUTED = "#555555";
const ACCENT = "#c41e3a";

const STEPS = ["Lock USDC", "AI grades vs frozen rubric", "Poster approves or rejects at a price", "Window closes, worker paid"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: SURFACE,
          borderTop: `14px solid ${ACCENT}`,
          color: INK,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: ACCENT }}>AIG ARBITER</div>
          <div style={{ marginTop: 28, fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>
            AI-judged USDC bounties,
          </div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>escrowed on Arc.</div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                borderRadius: 999,
                border: `2px solid ${i === 0 ? ACCENT : "#d4d8d8"}`,
                background: "#ffffff",
                fontSize: 24,
                color: i === 0 ? ACCENT : INK_MUTED,
              }}
            >
              {s}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", fontSize: 24, color: INK_MUTED }}>
          Arc testnet · verdict hash on-chain with every payout
        </div>
      </div>
    ),
    size,
  );
}
