"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

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

function ResetInner() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        toast.success("Password updated — please log in.");
        router.push("/login");
      } else {
        toast.error(d.error ?? "Couldn't reset your password.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center">
      <Link href="/" aria-label="Americell — Home" className="mb-8 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/americell-logo.png" alt="Americell" width={945} height={496} className="h-16 w-auto sm:h-20" />
      </Link>

      <Card className={cn("w-full max-w-sm py-6", glassCard)}>
        {!token ? (
          <CardContent className="py-4 text-center">
            <p className="text-lg font-bold text-foreground">Invalid reset link</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This link is missing its token. Request a new one.
            </p>
            <Link href="/forgot-password" className="mt-3 inline-block text-sm font-medium text-brand hover:text-brand-2">
              Send a new reset link
            </Link>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Set a new password
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose a new password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={glassInput}
                  />
                  <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={glassInput}
                  />
                </div>
                <Button type="submit" size="lg" disabled={busy} className="h-11 w-full rounded-full">
                  {busy ? "Updating…" : "Update password"}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center px-5 py-12 sm:px-6 sm:py-16">
      <Suspense fallback={null}>
        <ResetInner />
      </Suspense>
    </main>
  );
}
