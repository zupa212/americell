"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

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
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="faq" className="relative overflow-hidden">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-white/50 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-2 backdrop-blur-xl ring-1 ring-white/40">
            FAQ
          </p>
          <h2 className="mt-6 text-balance break-words text-4xl font-extrabold leading-[0.98] tracking-tight text-foreground sm:text-6xl sm:leading-[0.95] lg:text-7xl">
            Questions?{" "}
            <AuroraText>Answered.</AuroraText>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Everything about deploying a real device fleet on Americell —
            hardware, latency, security, and billing. Need specifics? Talk to
            our team.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-14 max-w-3xl">
          <Accordion
            defaultValue={FAQS[0] ? [FAQS[0].q] : []}
            className={cn(
              "rounded-3xl border border-white/50 bg-white/60 px-5 backdrop-blur-xl sm:px-6",
              "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
              "transition-all duration-300 hover:bg-white/70 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]",
            )}
          >
            {FAQS.map((item, i) => (
              <motion.div
                key={item.q}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={
                  prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
                }
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.06,
                }}
              >
                <AccordionItem
                  value={item.q}
                  className={cn(
                    "border-white/40",
                    i !== FAQS.length - 1 && "border-b",
                  )}
                >
                  <AccordionTrigger
                    className={cn(
                      "gap-4 py-6 text-lg font-semibold tracking-tight text-foreground/90 sm:gap-6",
                      "transition-colors duration-300 hover:no-underline focus-visible:ring-brand/40",
                      "data-[panel-open]:text-brand-2",
                      // Hide the primitive's default chevron pair; we render our own rotating one.
                      "[&_svg[data-slot=accordion-trigger-icon]]:hidden",
                    )}
                  >
                    <span className="flex-1 text-left">{item.q}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        "border border-white/50 bg-white/60 text-brand ring-1 ring-white/40",
                        "transition-all duration-300",
                        "group-hover/accordion-trigger:bg-white/80",
                        "group-aria-expanded/accordion-trigger:border-transparent group-aria-expanded/accordion-trigger:bg-gradient-to-br group-aria-expanded/accordion-trigger:from-brand group-aria-expanded/accordion-trigger:to-brand-2 group-aria-expanded/accordion-trigger:text-white group-aria-expanded/accordion-trigger:shadow-lg group-aria-expanded/accordion-trigger:shadow-brand/25",
                      )}
                    >
                      <ChevronDown className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-aria-expanded/accordion-trigger:rotate-180" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent
                    className={cn(
                      "pr-4 pb-6 text-base leading-relaxed text-muted-foreground sm:pr-14",
                      "motion-safe:transition-[height] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]",
                    )}
                  >
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
