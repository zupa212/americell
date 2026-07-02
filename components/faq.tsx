import { FAQS } from "@/lib/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuroraText } from "@/components/ui/aurora-text";
import AuroraBackground from "@/components/ui/aurora-background";
import Reveal from "@/components/ui/reveal";

export default function Faq() {
  return (
    <section id="faq" className="relative overflow-hidden bg-background">
      <AuroraBackground className="opacity-70" />

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
            className="rounded-2xl border bg-card/80 px-6 shadow-card backdrop-blur-sm"
          >
            {FAQS.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="gap-6 py-6 text-lg font-medium tracking-tight text-foreground/90 hover:no-underline data-[panel-open]:text-brand-2">
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
