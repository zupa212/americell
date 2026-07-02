"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/actions/auth";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { AuroraText } from "@/components/ui/aurora-text";
import { Particles } from "@/components/ui/particles";
import Reveal from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const initial: AuthState = { error: null };

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// Smooth, legible glass inputs.
const glassInput =
  "border-white/50 bg-white/60 backdrop-blur-md transition-all duration-300 focus-visible:bg-white/80 focus-visible:ring-brand/40";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, initial);

  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Ambient particles drifting behind the glass for depth. */}
      <Particles
        className="pointer-events-none absolute inset-0 -z-[1]"
        quantity={48}
        ease={80}
        color="#2b6bff"
        staticity={60}
      />

      <Reveal className="flex w-full flex-col items-center">
        <Link
          href="/"
          className="mb-8 text-lg font-bold tracking-tight text-foreground"
        >
          <AuroraText>Americell</AuroraText>
        </Link>

        <Card
          className={cn(
            "relative w-full max-w-sm overflow-hidden py-6",
            glassCard,
            "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]",
          )}
        >
          <ShineBorder
            className="rounded-3xl"
            borderWidth={1}
            duration={12}
            shineColor={["var(--color-brand)", "var(--color-brand-2)"]}
          />
          <BorderBeam
            size={80}
            duration={8}
            colorFrom="var(--color-brand)"
            colorTo="var(--color-brand-2)"
          />
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Δημιούργησε τον λογαριασμό σου
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Ξεκίνα να ελέγχεις αληθινές συσκευές ΗΠΑ μέσα σε λίγα λεπτά.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={glassInput}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Κωδικός</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={glassInput}
                />
                <p className="text-xs text-muted-foreground">
                  Τουλάχιστον 8 χαρακτήρες.
                </p>
              </div>

              {state.error ? (
                <Alert
                  variant="destructive"
                  className="border-white/50 bg-white/60 backdrop-blur-md"
                >
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="h-11 w-full rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(43,107,255,0.5)]"
              >
                {pending ? "Δημιουργία…" : "Δημιουργία λογαριασμού"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Έχεις ήδη λογαριασμό;{" "}
              <Link
                href="/login"
                className="font-medium text-brand transition-colors duration-300 hover:text-brand-2"
              >
                Σύνδεση
              </Link>
            </p>
          </CardContent>
        </Card>
      </Reveal>
    </main>
  );
}
