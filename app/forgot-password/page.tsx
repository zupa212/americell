"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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
import { cn } from "@/lib/utils";

const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";
const glassInput =
  "h-11 border-white/50 bg-white/60 backdrop-blur-md transition-all duration-300 focus-visible:bg-white/80 focus-visible:ring-brand/40";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {
      setSent(true); // still show the neutral confirmation (no enumeration)
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center px-5 py-12 sm:px-6 sm:py-16">
      <div className="flex w-full flex-col items-center">
        <Link href="/" aria-label="Americell — Home" className="mb-8 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/americell-logo.png" alt="Americell" width={945} height={496} className="h-16 w-auto sm:h-20" />
        </Link>

        <Card className={cn("w-full max-w-sm py-6", glassCard)}>
          {sent ? (
            <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-11 w-11 text-emerald-500" aria-hidden="true" />
              <p className="text-lg font-bold text-foreground">Check your email</p>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we&rsquo;ve
                sent a link to reset your password. It expires in 30 minutes.
              </p>
              <Link href="/login" className="mt-2 text-sm font-medium text-brand hover:text-brand-2">
                Back to log in
              </Link>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                  Reset your password
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your email and we&rsquo;ll send you a reset link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={glassInput}
                    />
                  </div>
                  <Button type="submit" size="lg" disabled={busy} className="h-11 w-full rounded-full">
                    {busy ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Remembered it?{" "}
                  <Link href="/login" className="font-medium text-brand hover:text-brand-2">
                    Log in
                  </Link>
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
