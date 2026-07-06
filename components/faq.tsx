import { FAQS } from "@/lib/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuroraText } from "@/components/ui/aurora-text";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export default function Faq() {
  return (
    <section id="faq" className="relative overflow-hidden">
      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-white/50 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-2 backdrop-blur-xl ring-1 ring-white/40">
            FAQ
          </p>
          <h2 className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Questions?{" "}
            <AuroraText>Answered.</AuroraText>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Everything about running real US phones with Americell. Still
            curious? Reach out — we&apos;re quick.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-14 max-w-3xl">
          <Accordion
            defaultValue={FAQS[0] ? [FAQS[0].q] : []}
            className={cn(
              "rounded-3xl border border-white/50 bg-white/60 px-6 backdrop-blur-xl",
              "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
              "transition-all duration-300 hover:bg-white/70 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]",
            )}
          >
            {FAQS.map((item) => (
              <AccordionItem
                key={item.q}
                value={item.q}
                className="border-white/40"
              >
                <AccordionTrigger className="gap-6 py-6 text-lg font-semibold tracking-tight text-foreground/90 transition-colors duration-300 hover:no-underline data-[panel-open]:text-brand-2">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pr-14 pb-6 text-base leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
