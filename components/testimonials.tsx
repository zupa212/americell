import { Quote } from "lucide-react";
import AuroraBackground from "@/components/ui/aurora-background";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Reveal from "@/components/ui/reveal";
import { TESTIMONIALS } from "@/lib/site";

export default function Testimonials() {
  return (
    <section
      id="clients"
      className="relative isolate overflow-hidden bg-background py-24 sm:py-32"
    >
      <AuroraBackground className="opacity-70" />

      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-2">
            Πελάτες
          </p>
          <h2 className="mt-3 text-balance bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Έμπιστο από ομάδες που δοκιμάζουν σε αληθινές συσκευές
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Υπεύθυνοι QA, πρακτορεία και ομάδες ανάπτυξης χρησιμοποιούν το
            Americell για να ελέγχουν γνήσιο υλικό ΗΠΑ από οπουδήποτε — χωρίς
            αποστολές, χωρίς καλώδια.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal
              key={testimonial.name}
              as="li"
              delay={0.1 * index}
              className="list-none"
            >
              <Card className="h-full gap-0 rounded-xl border shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <CardHeader>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Quote
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </span>
                </CardHeader>

                <CardContent className="flex-1 pt-4">
                  <blockquote className="text-base leading-relaxed text-foreground">
                    “{testimonial.quote}”
                  </blockquote>
                </CardContent>

                <CardFooter className="mt-6 flex-col items-start gap-0.5 border-t bg-transparent pt-5">
                  <div className="text-sm font-bold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </CardFooter>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
