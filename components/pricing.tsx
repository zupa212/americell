"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Reveal from "@/components/ui/reveal";
import AuroraBackground from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DEVICES,
  monthlyEquivalent,
  priceFor,
  type Cycle,
  type Device,
} from "@/lib/devices";

export default function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  // Which card is mid-request (drives the spinner on that card only).
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleCheckout = async (device: Device) => {
    setPendingId(device.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, cycle }),
      });

      if (res.status === 401) {
        // Not logged in — send them to sign in.
        window.location.href = "/login";
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url as string;
        return;
      }

      toast(
        data.demo
          ? "Οι πληρωμές είναι σε demo mode — τα κλειδιά Stripe δεν έχουν οριστεί ακόμη."
          : (data.error ?? "Δεν ήταν δυνατή η έναρξη πληρωμής. Δοκίμασε ξανά."),
      );
    } catch {
      toast("Σφάλμα δικτύου. Δοκίμασε ξανά.");
    } finally {
      setPendingId(null);
    }
  };

  // Subtly highlight the middle card as the most popular choice.
  const popularIndex = Math.floor(DEVICES.length / 2);

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative isolate overflow-hidden bg-background py-24 sm:py-32"
    >
      {/* Subtle aurora wash behind the whole pricing section */}
      <AuroraBackground className="opacity-70" />

      <div className="mx-auto w-full max-w-6xl px-6">
        {/* Section header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">
            Τιμές
          </p>
          <h2
            id="pricing-heading"
            className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Μία αληθινή συσκευή,{" "}
            <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-transparent">
              ένα απλό πλάνο
            </span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Διάλεξε ένα αληθινό τηλέφωνο ΗΠΑ, έλεγξέ το από τον browser σου και
            πλήρωσε μία σταθερή τιμή. Χωρίς emulators, χωρίς κρυφές χρεώσεις —
            μόνο αληθινό hardware σε καθαρή οικιακή σύνδεση.
          </p>
        </Reveal>

        {/* Billing-cycle toggle — drives the same `cycle` state */}
        <Reveal delay={0.08} className="mt-12 flex justify-center">
          <Tabs
            value={cycle}
            onValueChange={(value) => setCycle(value as Cycle)}
            aria-label="Κύκλος χρέωσης"
          >
            <TabsList className="h-11 rounded-full bg-card p-1 shadow-soft ring-1 ring-border backdrop-blur">
              <TabsTrigger
                value="monthly"
                className="min-w-[7rem] rounded-full px-5 data-active:bg-gradient-to-r data-active:from-brand data-active:to-brand-2 data-active:text-white data-active:shadow-glow"
              >
                Μηνιαία
              </TabsTrigger>
              <TabsTrigger
                value="annual"
                className="min-w-[7rem] gap-2 rounded-full px-5 data-active:bg-gradient-to-r data-active:from-brand data-active:to-brand-2 data-active:text-white data-active:shadow-glow"
              >
                Ετήσια
                <Badge
                  variant="secondary"
                  className="border-transparent bg-brand-2/10 text-[10px] text-brand-2 group-data-active/tabs-list:bg-white/20 group-data-active/tabs-list:text-white"
                >
                  Έκπτωση ~20%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Reveal>

        {/* Device / fleet grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEVICES.map((device, index) => {
            const isPopular = index === popularIndex;
            const perMonth = monthlyEquivalent(device, cycle);
            const annualTotal = priceFor(device, "annual");
            const isPending = pendingId === device.id;

            return (
              <Reveal as="article" key={device.id} delay={0.08 * index}>
                <Card
                  className={cn(
                    "relative h-full gap-0 rounded-2xl py-0 ring-1 transition duration-300",
                    isPopular
                      ? "shadow-glow ring-brand/25 lg:-translate-y-2"
                      : "shadow-soft ring-border hover:-translate-y-1 hover:ring-brand-2/30",
                  )}
                >
                  {/* Beam accent reserved for the most-popular card */}
                  {isPopular && (
                    <BorderBeam
                      size={70}
                      duration={7}
                      colorFrom="var(--color-brand)"
                      colorTo="var(--color-brand-2)"
                    />
                  )}

                  {/* Accent top bar driven by device.accent */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                    style={{ backgroundColor: device.accent }}
                  />

                  <CardHeader className="px-7 pt-8 sm:px-8">
                    {isPopular && (
                      <Badge className="absolute right-6 top-6 bg-gradient-to-r from-brand to-brand-2 uppercase tracking-wide text-white shadow-glow">
                        Πιο δημοφιλές
                      </Badge>
                    )}
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                      {device.name}
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-sm text-muted-foreground">
                      {device.os} · {device.location}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 px-7 sm:px-8">
                    {/* Price */}
                    <div className="mt-7 flex items-baseline gap-1.5">
                      <span className="text-5xl font-extrabold tracking-tight text-foreground">
                        ${perMonth}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        /μήνα
                      </span>
                    </div>
                    <p className="mt-1.5 h-5 text-sm text-muted-foreground">
                      {cycle === "annual"
                        ? `χρέωση $${annualTotal}/έτος`
                        : "χρέωση μηνιαία"}
                    </p>

                    {/* Spec line as a check row */}
                    <div className="mt-7 flex items-start gap-2.5 border-t border-border pt-6">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/15 to-brand-2/15">
                        <Check
                          className="h-3.5 w-3.5 text-brand"
                          aria-hidden="true"
                        />
                      </span>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {device.specs}
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter className="mt-8 border-t-0 bg-transparent px-7 pb-8 sm:px-8">
                    <Button
                      type="button"
                      onClick={() => handleCheckout(device)}
                      disabled={isPending}
                      aria-label={`Απόκτησε ${device.name}`}
                      className={cn(
                        "group/cta h-12 w-full rounded-full px-6 text-sm font-semibold",
                        isPopular
                          ? "bg-gradient-to-r from-brand to-brand-2 text-white shadow-glow hover:opacity-95"
                          : "bg-foreground text-background hover:bg-foreground/90",
                      )}
                    >
                      {isPending ? (
                        <>
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Έναρξη…
                        </>
                      ) : (
                        <>
                          Απόκτησέ το
                          <ArrowRight
                            className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
