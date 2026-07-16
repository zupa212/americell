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
    <>
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
    </>
  );
}
