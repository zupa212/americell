import {
  ArrowDownRight,
  ArrowUpRight,
  ReceiptText,
  Repeat,
  Settings2,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { requireAdminPage } from "@/lib/admin";
import {
  getBalance,
  getLedger,
  isCellgodsConfigured,
  type Balance,
  type LedgerEntry,
} from "@/lib/cellgods";
import { fmtMoney } from "@/lib/money";
import { getDeviceOverrides, getMarginOpts } from "@/lib/pricing";
import { cn } from "@/lib/utils";

import Reveal from "@/components/ui/reveal";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import LottiePlayer from "@/components/ui/lottie";

import LedgerTable from "@/components/admin/ledger-table";
import TopupDialog from "@/components/admin/topup-dialog";
import AutoTopupForm from "@/components/admin/auto-topup-form";
import PricingSettingsForm from "@/components/admin/pricing-settings-form";
import DeviceOverridesManager from "@/components/admin/device-overrides-manager";
import BillingToast from "@/components/admin/billing-toast";

// Frosted-glass surface recipe — matches the dashboard, floats over the aurora.
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

const glassTile =
  "rounded-2xl border border-white/50 bg-white/55 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-16px_rgba(30,41,120,0.18)]";

// Below this the balance is flagged as low (heuristic; the real guard is the
// checkout credit preflight + auto-topup).
const LOW_BALANCE_CENTS = 1000;

/** Roll the ledger up into headline stats for the hero KPI cards. */
function summarizeLedger(entries: LedgerEntry[]) {
  let credited = 0;
  let spent = 0;
  for (const e of entries) {
    if (e.delta_cents >= 0) credited += e.delta_cents;
    else spent += -e.delta_cents;
  }
  return { credited, spent, count: entries.length };
}

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string }>;
}) {
  // Defense in depth: the /admin layout gates too, but this page reads financial
  // data so it re-asserts the owner gate itself (anon → /login, non-owner → 404).
  await requireAdminPage();

  const { topup } = await searchParams;
  const topupStatus =
    topup === "success" ? "success" : topup === "cancel" ? "cancel" : null;

  let balance: Balance | null = null;
  let ledger: LedgerEntry[] = [];
  let loadError = false;

  if (isCellgodsConfigured) {
    try {
      [balance, ledger] = await Promise.all([getBalance(), getLedger()]);
    } catch {
      loadError = true;
    }
  }

  const currency = balance?.currency ?? "usd";
  const low =
    balance != null && balance.credit_balance_cents < LOW_BALANCE_CENTS;
  const stats = summarizeLedger(ledger);
  const autoOn = balance?.auto_topup.enabled ?? false;

  // Live resale margin (DB-backed, env fallback) — powers the pricing control.
  const marginOpts = await getMarginOpts();
  const deviceOverrides = Object.entries(await getDeviceOverrides()).map(
    ([phoneId, pct]) => ({ phoneId, pct }),
  );

  // The /admin layout already provides the wide `max-w-7xl` glass main container
  // and ambient particles, so this page renders edge-to-edge content inside it.
  return (
    <div>
      <BillingToast status={topupStatus} />

      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Billing &amp; Credit
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              The prepaid reseller balance that funds every activation, the
              transaction history, and your top-up settings.
            </p>
          </div>
          {balance != null && <TopupDialog />}
        </div>
      </Reveal>

      {!isCellgodsConfigured ? (
        <Reveal delay={0.05}>
          <Alert className="mt-8 border-white/50 bg-white/60 backdrop-blur-md">
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>CellGods isn&apos;t configured yet.</AlertTitle>
            <AlertDescription>
              Add <code>CELLGODS_API_KEY</code> (see{" "}
              <code>.env.example</code>) to see the balance and credit history.
            </AlertDescription>
          </Alert>
        </Reveal>
      ) : loadError || balance == null ? (
        <Reveal delay={0.05}>
          <Alert
            variant="destructive"
            className="mt-8 border-white/50 bg-white/60 backdrop-blur-md"
          >
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Couldn&apos;t load the balance.</AlertTitle>
            <AlertDescription>
              There was a problem reaching CellGods. Refresh the page and try
              again.
            </AlertDescription>
          </Alert>
        </Reveal>
      ) : (
        <>
          {/* Balance hero */}
          <Reveal delay={0.05}>
            <section
              className={cn(
                "relative mt-8 overflow-hidden p-6 sm:p-8",
                glassCard,
              )}
            >
              <ShineBorder
                className="rounded-3xl"
                borderWidth={1}
                duration={12}
                shineColor={["var(--color-brand)", "var(--color-brand-2)"]}
              />
              <BorderBeam
                size={110}
                duration={9}
                colorFrom="var(--color-brand)"
                colorTo="var(--color-brand-2)"
              />

              <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
                {/* Credit figure */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wallet className="h-4 w-4 text-brand" aria-hidden="true" />
                    Available credit
                    <span className="relative ml-1 inline-flex items-center">
                      <LottiePlayer
                        src="/lottie/pulse.json"
                        className="h-6 w-6"
                      />
                      <span className="sr-only">Live balance</span>
                    </span>
                  </div>

                  <div className="mt-2 text-4xl font-bold tracking-tight text-foreground tabular-nums break-words sm:text-5xl lg:text-6xl">
                    {fmtMoney(balance.credit_balance_cents, currency)}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {low && (
                      <Badge variant="destructive">
                        <TriangleAlert aria-hidden="true" />
                        Low balance
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "border-transparent",
                        autoOn
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Repeat aria-hidden="true" />
                      Auto top-up: {autoOn ? "on" : "off"}
                    </Badge>
                    {autoOn && (
                      <span className="text-xs text-muted-foreground">
                        at{" "}
                        {fmtMoney(
                          balance.auto_topup.threshold_cents,
                          currency,
                        )}{" "}
                        → +{fmtMoney(balance.auto_topup.amount_cents, currency)}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <TopupDialog label="Add credit" />
                    {low && (
                      <span className="text-xs text-muted-foreground">
                        Keep a buffer so activations never stall.
                      </span>
                    )}
                  </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <Card className={cn("border-transparent", glassTile)}>
                    <CardContent className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ArrowUpRight
                          className="size-3.5 text-emerald-600"
                          aria-hidden="true"
                        />
                        Credited
                      </span>
                      <span className="text-lg font-semibold text-foreground tabular-nums">
                        {fmtMoney(stats.credited, currency)}
                      </span>
                    </CardContent>
                  </Card>

                  <Card className={cn("border-transparent", glassTile)}>
                    <CardContent className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ArrowDownRight
                          className="size-3.5 text-rose-600"
                          aria-hidden="true"
                        />
                        Spent
                      </span>
                      <span className="text-lg font-semibold text-foreground tabular-nums">
                        {fmtMoney(stats.spent, currency)}
                      </span>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      "col-span-2 border-transparent sm:col-span-1 lg:col-span-1 xl:col-span-1",
                      glassTile,
                    )}
                  >
                    <CardContent className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ReceiptText
                          className="size-3.5 text-brand"
                          aria-hidden="true"
                        />
                        Transactions
                      </span>
                      <span className="text-lg font-semibold text-foreground tabular-nums">
                        {stats.count}
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
          </Reveal>

          {/* Ledger / Settings tabs */}
          <Reveal delay={0.1}>
            <Tabs defaultValue="ledger" className="mt-8">
              <TabsList>
                <TabsTrigger value="ledger">
                  <ReceiptText aria-hidden="true" />
                  History
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings2 aria-hidden="true" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ledger">
                <div className={cn("mt-4 overflow-hidden", glassCard)}>
                  <LedgerTable entries={ledger} currency={currency} />
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div
                  className={cn(
                    "mt-4 flex flex-col gap-6 p-6 sm:p-8",
                    glassCard,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-md">
                      <h2 className="text-base font-semibold text-foreground">
                        Add credit
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Charge your card through CellGods&apos; Stripe Checkout
                        to top up your balance.
                      </p>
                    </div>
                    <TopupDialog label="Add credit" />
                  </div>

                  <Separator className="bg-white/50" />

                  <AutoTopupForm autoTopup={balance.auto_topup} />

                  <Separator className="bg-white/50" />

                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Resale pricing
                    </h2>
                    <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                      Set your markup over CellGods wholesale. Applies to every
                      device instantly — the price customers browse and the price
                      they&apos;re charged both read this.
                    </p>
                    <div className="mt-4">
                      <PricingSettingsForm current={marginOpts} />
                    </div>
                  </div>

                  <Separator className="bg-white/50" />

                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Per-device overrides
                    </h2>
                    <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                      Give a specific device its own markup instead of the global
                      one. Copy the phone ID from the Inventory page.
                    </p>
                    <div className="mt-4">
                      <DeviceOverridesManager overrides={deviceOverrides} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Reveal>
        </>
      )}
    </div>
  );
}
