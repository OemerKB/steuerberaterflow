import { Navbar } from "@/components/navbar";
import { Hero, DashboardMockup } from "@/components/hero";
import {
  TrustBar, ProblemSection, PlatformOverview, FeatureDeep, FirmSection,
  PortalSection, SecuritySection, IntegrationsSection, Pricing, FAQ, FinalCTA, Footer,
} from "@/components/sections";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <TrustBar />
        <ProblemSection />
        <PlatformOverview />
        <FeatureDeep />
        <FirmSection />
        <PortalSection />
        <SecuritySection />
        <IntegrationsSection />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
