// /app/arbiter/layout.tsx — server wrapper whose only job is metadata. The board itself
// (page.tsx) is a client component and cannot export `metadata`.
// Bounty detail pages override the title via their own generateMetadata.

import type { Metadata } from "next";
import { ARBITER_DESCRIPTION, ARBITER_TITLE } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: ARBITER_TITLE,
  description: ARBITER_DESCRIPTION,
  // No `url`: this layout also wraps /arbiter/dashboard and /arbiter/bounty/[id].
  openGraph: { title: ARBITER_TITLE, description: ARBITER_DESCRIPTION },
  twitter: { card: "summary_large_image", title: ARBITER_TITLE, description: ARBITER_DESCRIPTION },
};

export default function ArbiterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
