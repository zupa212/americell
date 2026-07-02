"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/actions/auth";
import AuroraBackground from "@/components/ui/aurora-background";
import { BorderBeam } from "@/components/ui/border-beam";
import { AuroraText } from "@/components/ui/aurora-text";
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

const initial: AuthState = { error: null };

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, initial);

  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-16">
      <AuroraBackground className="opacity-70" />
      <Link
        href="/"
        className="mb-8 text-lg font-bold tracking-tight text-foreground"
      >
        <AuroraText>Americell</AuroraText>
      </Link>
      <Card className="relative w-full max-w-sm rounded-2xl border py-6 shadow-card">
        <BorderBeam
          size={80}
          duration={8}
          colorFrom="var(--color-brand)"
          colorTo="var(--color-brand-2)"
        />
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Δημιούργησε τον λογαριασμό σου
          </CardTitle>
          <CardDescription>
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
              />
              <p className="text-xs text-muted-foreground">
                Τουλάχιστον 8 χαρακτήρες.
              </p>
            </div>

            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="h-11 w-full rounded-full"
            >
              {pending ? "Δημιουργία…" : "Δημιουργία λογαριασμού"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Έχεις ήδη λογαριασμό;{" "}
            <Link href="/login" className="font-medium text-brand">
              Σύνδεση
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
