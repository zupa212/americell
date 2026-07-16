"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronDown,
  Server,
  ShieldCheck,
} from "lucide-react";

import PageShell from "@/components/page-shell";
import {
  initialContactState,
  sendContactMessage,
} from "@/app/actions/contact";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";

type Option = { value: string; label: string };

const CONTACT_CHANNELS: readonly Option[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "video", label: "Video call" },
  { value: "slack", label: "Slack Connect" },
];

const FLEET_SIZES: readonly Option[] = [
  { value: "1-5", label: "1–5 devices" },
  { value: "6-25", label: "6–25 devices" },
  { value: "26-100", label: "26–100 devices" },
  { value: "101-500", label: "101–500 devices" },
  { value: "500+", label: "500+ devices" },
];

const TIMELINES: readonly Option[] = [
  { value: "immediate", label: "Immediately" },
  { value: "30-days", label: "Within 30 days" },
  { value: "quarter", label: "This quarter" },
  { value: "exploring", label: "Just exploring" },
];

const USE_CASES: readonly Option[] = [
  { value: "qa-app-validation", label: "QA & app validation" },
  { value: "mobile-operations", label: "Mobile operations" },
  { value: "security-compliance", label: "Security & compliance" },
  { value: "agency-client-work", label: "Agency / client work" },
  { value: "enterprise-device-pool", label: "Enterprise device pool" },
  { value: "other", label: "Something else" },
];

// Native <select> styled to match the shadcn Input primitive so the enterprise
// dropdowns sit consistently in the glass form. Native selects guarantee the
// value rides along in FormData and reset cleanly on formRef.current.reset(),
// while giving the OS-native picker on mobile.
const SELECT_CLASS =
  "h-11 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 pr-9 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 md:text-sm dark:bg-input/30";

function FleetSelect({
  id,
  name,
  label,
  placeholder,
  options,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: readonly Option[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select id={id} name={name} defaultValue="" className={SELECT_CLASS}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [state, action, pending] = useActionState(
    sendContactMessage,
    initialContactState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Surface a toast on each new result and reset the form once a message has
  // been accepted. (Preserves the original ContactForm behavior.)
  useEffect(() => {
    if (state.ok) {
      toast.success("Thanks — our sales team will be in touch shortly.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wide text-brand uppercase ring-1 ring-white/40 backdrop-blur-xl">
          <Server className="size-3.5" aria-hidden="true" />
          Talk to Sales
        </span>

        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Tell us about your fleet
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Deploy real, physical iPhones and Android devices in US datacenters —
          hosted, powered, connected, and maintained, all controlled from one
          dashboard. Share your device count, timeline, and use case, and our
          team will design a fleet that fits your operation.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Request a fleet consultation
            </CardTitle>
            <CardDescription>
              A specialist will reach out at the channel you choose, typically
              within one business day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={action} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    placeholder="Your name"
                    className="h-11 sm:h-8"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="h-11 sm:h-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  placeholder="Your company or team"
                  className="h-11 sm:h-8"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FleetSelect
                  id="contact_channel"
                  name="contact_channel"
                  label="Preferred contact channel"
                  placeholder="How should we reach you?"
                  options={CONTACT_CHANNELS}
                />
                <FleetSelect
                  id="fleet_size"
                  name="fleet_size"
                  label="Estimated devices"
                  placeholder="How many devices?"
                  options={FLEET_SIZES}
                />
                <FleetSelect
                  id="timeline"
                  name="timeline"
                  label="Timeline"
                  placeholder="When do you need it?"
                  options={TIMELINES}
                />
                <FleetSelect
                  id="use_case"
                  name="use_case"
                  label="Primary use case"
                  placeholder="What are you building?"
                  options={USE_CASES}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Project details</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  rows={5}
                  placeholder="Which apps or workflows will run on the fleet? Tell us about device models, regions, session recording, or any compliance needs (DPA, access controls)."
                />
              </div>

              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={pending}
                  className="h-11 w-full rounded-full sm:h-9 sm:w-auto sm:px-6"
                >
                  {pending ? "Sending…" : "Talk to Sales"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  render={<a href="/signup" />}
                  className="h-11 w-full gap-2 rounded-full sm:h-9 sm:w-auto sm:px-6"
                >
                  Deploy your fleet
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                By reaching out you agree we may contact you about your fleet.
                We support legitimate mobile operations only — not fraud or
                circumvention of any platform&rsquo;s terms.
              </p>
            </form>
          </CardContent>
        </Card>

        <h2 className="mt-12 text-xl font-semibold tracking-tight">
          What our team can help with
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/50 bg-white/60 p-5 ring-1 ring-white/40 backdrop-blur-xl">
            <Building2 className="size-5 text-brand" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              Fleet sizing & rollout
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Right-size a pool of real iPhones and Android devices and go live
              in minutes, with hardware maintenance included.
            </p>
          </div>
          <div className="rounded-3xl border border-white/50 bg-white/60 p-5 ring-1 ring-white/40 backdrop-blur-xl">
            <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              Security & compliance
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Role-based access, full session recording and logs, and a DPA for
              enterprise agreements.
            </p>
          </div>
          <div className="rounded-3xl border border-white/50 bg-white/60 p-5 ring-1 ring-white/40 backdrop-blur-xl">
            <CalendarClock className="size-5 text-brand" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              Pricing & data plans
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Volume pricing, 24/7 dedicated support, 99.9% uptime, and optional
              SIM data plans from $15/mo.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
