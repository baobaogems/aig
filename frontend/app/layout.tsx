// =============================================================================
// layout.tsx — Root layout (server component)
// Fonts: Geist (body), JetBrains Mono (headings/values)
// Providers live in a separate client component to avoid hydration issues
// =============================================================================

import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Inter, Orbitron } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site-metadata";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Reskin (feat/reskin): Manrope = geometric rounded-terminal headings, Inter = neutral
// body copy. Both load alongside the existing mono — nothing removed, additive only.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Orbitron — chữ display của màn Arbiter (nav, tiêu đề mục, nhãn nút).
// CHỈ có subset "latin": Orbitron KHÔNG hỗ trợ dấu tiếng Việt. Vì thế nó chỉ
// được dùng cho nhãn tiếng Anh viết hoa (MARKET, DASHBOARD, PAY FULL). Mọi câu
// tiếng Việt vẫn dùng --font-body (Inter, có subset vietnamese).
// ui-guards/orbitron-no-vietnamese.test.ts canh ranh giới này ở phase 05.
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

// Link-preview metadata. og:image / twitter:image come from the opengraph-image.tsx and
// twitter-image.tsx files next to this layout, so they are not repeated here.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: { type: "website", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${manrope.variable} ${inter.variable} ${orbitron.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
