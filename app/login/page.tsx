"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/app/actions/auth";
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

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initial);

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
            Καλώς όρισες ξανά
          </CardTitle>
          <CardDescription>
            Συνδέσου στον λογαριασμό σου Americell.
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
                autoComplete="current-password"
              />
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
              {pending ? "Σύνδεση…" : "Σύνδεση"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Δεν έχεις λογαριασμό;{" "}
            <Link href="/signup" className="font-medium text-brand">
              Δημιούργησε έναν
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
