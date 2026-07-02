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
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-2">
            Συχνές ερωτήσεις
          </p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            <AuroraText>Απαντήσεις στις ερωτήσεις σου</AuroraText>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Όλα όσα χρειάζεται να ξέρεις για τη λειτουργία αληθινών τηλεφώνων
            ΗΠΑ με την Americell. Έχεις ακόμη απορίες; Επικοινώνησε μαζί μας και
            θα σε βοηθήσουμε.
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
                <AccordionTrigger className="gap-6 py-6 text-lg font-medium tracking-tight text-foreground/90 transition-colors duration-300 hover:no-underline data-[panel-open]:text-brand-2">
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
