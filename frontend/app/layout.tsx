// =============================================================================
// layout.tsx — Root layout (server component)
// Fonts: Geist (body), JetBrains Mono (headings/values)
// Providers live in a separate client component to avoid hydration issues
// =============================================================================

import { JetBrains_Mono, Manrope, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${manrope.variable} ${inter.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
