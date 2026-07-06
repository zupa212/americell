import { Wallet, Settings2, TriangleAlert, ReceiptText } from "lucide-react";

import { requireAdminPage } from "@/lib/admin";
import {
  getBalance,
  getLedger,
  isCellgodsConfigured,
  type Balance,
  type LedgerEntry,
} from "@/lib/cellgods";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

import Reveal from "@/components/ui/reveal";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import LedgerTable from "@/components/admin/ledger-table";
import TopupDialog from "@/components/admin/topup-dialog";
import AutoTopupForm from "@/components/admin/auto-topup-form";
import BillingToast from "@/components/admin/billing-toast";

// Frosted-glass surface recipe — matches the dashboard, floats over the aurora.
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// Below this the balance is flagged as low (heuristic; the real guard is the
// checkout credit preflight + auto-topup).
const LOW_BALANCE_CENTS = 1000;

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

  // The /admin layout already provides the centered `max-w-6xl` main container
  // and ambient particles, so this page renders plain content inside it.
  return (
    <div>
      <BillingToast status={topupStatus} />

      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Χρέωση &amp; Πίστωση
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Το προπληρωμένο υπόλοιπο reseller που τροφοδοτεί κάθε ενεργοποίηση,
              το ιστορικό κινήσεων και οι ρυθμίσεις προσθήκης πίστωσης.
            </p>
          </div>
          {balance != null && <TopupDialog />}
        </div>
      </Reveal>

      {!isCellgodsConfigured ? (
        <Reveal delay={0.05}>
          <Alert className="mt-8 border-white/50 bg-white/60 backdrop-blur-md">
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Το CellGods δεν έχει ρυθμιστεί ακόμη.</AlertTitle>
            <AlertDescription>
              Πρόσθεσε <code>CELLGODS_API_KEY</code> (δες το{" "}
              <code>.env.example</code>) για να δεις το υπόλοιπο και το ιστορικό
              πίστωσης.
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
            <AlertTitle>Δεν ήταν δυνατή η φόρτωση του υπολοίπου.</AlertTitle>
            <AlertDescription>
              Υπήρξε πρόβλημα επικοινωνίας με το CellGods. Ανανέωσε τη σελίδα και
              δοκίμασε ξανά.
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

              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wallet className="h-4 w-4 text-brand" aria-hidden="true" />
                    Διαθέσιμη πίστωση
                  </div>
                  <div className="mt-2 text-4xl font-bold tracking-tight text-foreground tabular-nums sm:text-5xl">
                    {fmtMoney(balance.credit_balance_cents, currency)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {low && (
                      <Badge variant="destructive">
                        <TriangleAlert aria-hidden="true" />
                        Χαμηλό υπόλοιπο
                      </Badge>
                    )}
                    <Badge
                      variant={
                        balance.auto_topup.enabled ? "secondary" : "outline"
                      }
                    >
                      Αυτόματη προσθήκη:{" "}
                      {balance.auto_topup.enabled ? "ενεργή" : "ανενεργή"}
                    </Badge>
                    {balance.auto_topup.enabled && (
                      <span className="text-xs text-muted-foreground">
                        στο{" "}
                        {fmtMoney(
                          balance.auto_topup.threshold_cents,
                          currency,
                        )}{" "}
                        → +
                        {fmtMoney(balance.auto_topup.amount_cents, currency)}
                      </span>
                    )}
                  </div>
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
                  Ιστορικό
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings2 aria-hidden="true" />
                  Ρυθμίσεις
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ledger">
                <div className={cn("mt-4 overflow-hidden p-2 sm:p-4", glassCard)}>
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
                  <div className="flex flex-col gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">
                        Προσθήκη πίστωσης
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Χρέωσε την κάρτα σου μέσω του Stripe Checkout του CellGods
                        για να αυξήσεις το υπόλοιπο.
                      </p>
                    </div>
                    <div>
                      <TopupDialog />
                    </div>
                  </div>

                  <Separator />

                  <AutoTopupForm autoTopup={balance.auto_topup} />
                </div>
              </TabsContent>
            </Tabs>
          </Reveal>
        </>
      )}
    </div>
  );
}
