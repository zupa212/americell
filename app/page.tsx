import SiteHeader from "@/components/site-header";
import Hero from "@/components/hero";
import LogosStrip from "@/components/logos-strip";
import Stats from "@/components/stats";
import Features from "@/components/features";
import BenefitsStack from "@/components/benefits-stack";
import HowItWorks from "@/components/how-it-works";
import Economics from "@/components/economics";
import Pricing from "@/components/pricing";
import Testimonials from "@/components/testimonials";
import Faq from "@/components/faq";
import CallToAction from "@/components/cta";
import SiteFooter from "@/components/site-footer";

export default function Page() {
  return (
    <div className="dark dark-surface relative flex min-h-screen flex-col">
      {/* Black homepage backdrop — covers the global light aurora for `/` only,
          with soft brand glows so the dark isn't flat. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-[5] bg-[#080b16]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-5%,rgba(43,107,255,0.22),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_88%_108%,rgba(124,58,237,0.20),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_35%_at_8%_60%,rgba(34,211,238,0.12),transparent_60%)]" />
      </div>

      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <LogosStrip />
        <Stats />
        <Features />
        <BenefitsStack />
        <HowItWorks />
        <Economics />
        <Pricing />
        <Testimonials />
        <Faq />
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  );
}
