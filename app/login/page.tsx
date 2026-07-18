"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { login, type AuthState } from "@/app/actions/auth";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
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
  "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// Smooth, legible glass inputs. Roomy (h-11) on mobile for comfortable tapping,
// tightening to the app's dense field height (h-8) from sm up. text-base on the
// primitive keeps mobile Safari from zooming on focus.
const glassInput =
  "h-11 border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 focus-visible:bg-white/10 focus-visible:ring-brand/40 sm:h-8";

// Leading glyph nested inside a glass input.
const leadingIcon =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/55";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initial);
  const [showPassword, setShowPassword] = useState(false);
  // Flag both credential fields on a failed sign-in (undefined = attribute absent).
  const invalid = state.error ? true : undefined;

  return (
    <main className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[#0a0d16] px-4 py-10 text-white sm:px-6 sm:py-16">
      {/* Ambient particles drifting behind the glass for depth. */}
      <Particles
        className="pointer-events-none absolute inset-0 -z-[1]"
        quantity={48}
        ease={80}
        color="#2b6bff"
        staticity={60}
      />

      <Reveal className="flex w-full max-w-sm flex-col items-center">
        {/* Brand mark — mirrors the site-header lockup for a consistent identity. */}
        <Link
          href="/"
          aria-label="Americell — Home"
          className="mb-7 block rounded-2xl outline-none transition-transform duration-300 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:mb-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/americell-logo.png"
            alt="Americell"
            width={945}
            height={496}
            className="h-16 w-auto sm:h-20"
          />
        </Link>

        <Card
          className={cn(
            "relative w-full overflow-hidden py-6 sm:py-7",
            glassCard,
            "transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
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
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Welcome back
            </CardTitle>
            <CardDescription className="text-white/55">
              Log in to your Americell account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail aria-hidden="true" className={leadingIcon} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={invalid}
                    className={cn(glassInput, "pl-9")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-brand transition-colors hover:text-brand-2"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock aria-hidden="true" className={leadingIcon} />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="current-password"
                    placeholder="Your password"
                    aria-invalid={invalid}
                    className={cn(glassInput, "pl-9 pr-11 sm:pr-9")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-white/55 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-9"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {state.error ? (
                <Alert
                  variant="destructive"
                  className="border-white/10 bg-white/5 backdrop-blur-md"
                >
                  <TriangleAlert aria-hidden="true" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="h-11 w-full gap-2 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] text-white shadow-[0_10px_30px_-12px_rgba(43,107,255,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[position:100%_center] hover:shadow-[0_18px_44px_-16px_rgba(43,107,255,0.6)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {pending ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Logging in…
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-white/55">
              New to Americell?{" "}
              <Link
                href="/signup"
                className="font-medium text-brand underline-offset-4 transition-colors duration-300 hover:text-brand-2 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-white/55">
          <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
          Encrypted, private sign-in
        </p>
      </Reveal>
    </main>
  );
}
