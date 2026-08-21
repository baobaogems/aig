// /app/page.tsx — public landing page. Server component; interactivity
// (scroll-reveal) lives in the small client islands under components/ui.
// The app itself lives at /dashboard; /home redirects here for old links.

import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingProblem } from "@/components/landing/landing-problem";
import { LandingFlow } from "@/components/landing/landing-flow";
import { LandingSafety } from "@/components/landing/landing-safety";
import { LandingPilotMetrics } from "@/components/landing/landing-pilot-metrics";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <div className="font-[family-name:var(--font-body)]">
      <LandingNav />
      <LandingHero />
      <LandingProblem />
      <LandingFlow />
      <LandingSafety />
      <LandingPilotMetrics />
      <LandingFooter />
    </div>
  );
}
