"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Database,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import RentalCard, { type RentalCardData } from "@/components/rental-card";
import DashboardBuyPanel from "@/components/dashboard-buy-panel";
import CheckoutSuccess from "@/components/checkout-success";
import DashboardUserMenu from "@/components/dashboard-user-menu";
import { AuroraText } from "@/components/ui/aurora-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
// Types ONLY — `@/lib/pricing` is server-only, so these imports are erased at
// build time and never pull the server module into the client bundle.
import type { BillingPeriod, PublicRetailPhone } from "@/lib/pricing";
// The crypto-provider shape is a shared TYPE (erased at build) — reused verbatim
// so the checkout flows never drift.
import type { CryptoProvider } from "@/components/pricing-grid";

/* ────────────────────────────────────────────────────────────────────────────
 * Prop contract — exported so `app/dashboard/page.tsx` (the Server Component that
 * fetches everything) is compiler-locked to the exact shape this island consumes.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * A single purchase receipt. Because Americell payments are one-time Stripe
 * (mode:payment), every rental IS its own receipt — we NEVER call the Stripe
 * Invoices API. Mirrors `toCardData`'s secret-stripping: retail cents only, so
 * margin/wholesale (`wholesaleQuotedCents` / `chargedCents`) never reaches the
 * client.
 */
export type BillingRow = {
  id: string; // rental.id — React key
  model: string; // rental.model
  platform: string; // "iphone" | "android" — platform pill
  billingPeriod: string; // "daily" | "weekly" | "monthly" → Day/Week/Month
  amountCents: number; // rental.retailCents — what the CUSTOMER paid (retail only)
  currency: string; // "usd"
  status: string; // raw rental.status; mapped to a receipt label + tone here
  createdAt: string; // rental.createdAt.toISOString() — the receipt date
};

export type DashboardShellProps = {
  email: string; // session.user.email ?? ""
  activeCount: number; // rentals.active.length; forwarded to <CheckoutSuccess/>
  rentals: {
    active: RentalCardData[]; // ACTIVE_STATUSES (active|pooled), newest-first
    history: RentalCardData[]; // everything else, newest-first
  };
  store:
    | {
        ok: true;
        phones: PublicRetailPhone[];
        durations: readonly { period: BillingPeriod; days: number; label: string }[];
        cryptoProviders: CryptoProvider[];
      }
    | { ok: false; reason: "unconfigured" | "error" };
  billing: BillingRow[]; // rows.map(toBillingRow), newest-first
  dbConnected: boolean; // isDbConfigured && !dbError → drives the DATABASE_URL notice
};

/* ────────────────────────────────────────────────────────────────────────────
 * Section model — client-side "tabs", synced to ?tab for deep-linking.
 * ──────────────────────────────────────────────────────────────────────────── */

type SectionKey = "overview" | "phones" | "rent" | "billing";

type SectionMeta = {
  key: SectionKey;
  label: string;
  description: string;
  icon: LucideIcon;
};

const SECTIONS: readonly SectionMeta[] = [
  {
    key: "overview",
    label: "Overview",
    description: "Your account at a glance",
    icon: LayoutDashboard,
  },
  {
    key: "phones",
    label: "My Phones",
    description: "Rentals, PINs & remote control",
    icon: Smartphone,
  },
  {
    key: "rent",
    label: "Rent a phone",
    description: "Browse live US inventory",
    icon: ShoppingBag,
  },
  {
    key: "billing",
    label: "Billing & Account",
    description: "Receipts & account",
    icon: ReceiptText,
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Shared design tokens — the frosted surface + the one brand gradient, kept
 * byte-identical to the rental / buy cards so the whole shell reads as one system.
 * ──────────────────────────────────────────────────────────────────────────── */

const glassCard =
  "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

const CTA_GRADIENT =
  "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-glow border-white/10 ring-1 ring-white/20 hover:opacity-95";

/* ── Receipt status mapping (same palette rental-card uses) ─────────────────── */

type ReceiptTone = "green" | "amber" | "rose" | "muted";

/** Receipt chip classes — the exact green/amber/rose/muted tones as rental-card. */
const RECEIPT_CHIP: Record<ReceiptTone, string> = {
  green:
    "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber:
    "border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300",
  muted: "border-border bg-muted text-muted-foreground",
};

/** rental.status → receipt label + tone. Paid captured = green/muted, in-flight = amber. */
function billingReceipt(status: string): { label: string; tone: ReceiptTone } {
  switch (status) {
    case "active":
    case "pooled":
      return { label: "Paid", tone: "green" };
    case "expired":
    case "deactivated":
      return { label: "Paid", tone: "muted" };
    case "paid":
    case "activating":
    case "activation_pending_credit":
      return { label: "Processing", tone: "amber" };
    case "pending_payment":
      return { label: "Pending", tone: "amber" };
    case "refunded":
      return { label: "Refunded", tone: "rose" };
    default:
      return { label: "Paid", tone: "muted" };
  }
}

/** Statuses where money was actually captured — drives the "Total spent" sum. */
const PAID_ISH = new Set([
  "active",
  "pooled",
  "expired",
  "deactivated",
  "paid",
  "activating",
  "activation_pending_credit",
]);

/** Per-platform pill (iPhone = brand blue, Android = brand violet). */
function platformPill(platform: string): { label: string; className: string } {
  const isIphone = platform === "iphone";
  return {
    label: isIphone ? "iPhone" : "Android",
    className: isIphone
      ? "border-transparent bg-brand/10 text-brand"
      : "border-transparent bg-brand-2/10 text-brand-2",
  };
}

/** Billing period → short English term. */
function termLabel(period: string): string {
  switch (period) {
    case "daily":
      return "Day";
    case "weekly":
      return "Week";
    case "monthly":
      return "Month";
    default:
      return period;
  }
}

// UTC-pinned so the SSR string and the hydrated string always match (no locale /
// timezone drift → no hydration warning).
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
function formatDate(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "—" : DATE_FMT.format(t);
}

/** Human "expires in …" for a positive remaining duration (ms). */
function formatExpiry(ms: number): string {
  if (ms <= 0) return "expiring now";
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  if (days >= 1) {
    const h = Math.floor((minutes % 1440) / 60);
    return h > 0 ? `expires in ${days}d ${h}h` : `expires in ${days}d`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours >= 1) return `expires in ${hours}h`;
  return `expires in ${Math.max(minutes, 1)}m`;
}

/** Two-letter avatar seed from the email (falls back to the brand initials). */
function avatarSeed(email: string): string {
  return (email.slice(0, 2) || "AC").toUpperCase();
}

/* ────────────────────────────────────────────────────────────────────────────
 * Sidebar body — shared by the desktop aside AND the mobile Sheet drawer. The
 * nav items are BUTTONS (client-side section switch), not Links. `onSelect`
 * carries the chosen section up so the parent can sync ?tab and close the drawer.
 * ──────────────────────────────────────────────────────────────────────────── */

function ShellNav({
  email,
  section,
  onSelect,
}: {
  email: string;
  section: SectionKey;
  onSelect: (key: SectionKey) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Brand — back to the marketing home. */}
      <Link
        href="/"
        className="group flex items-center gap-2.5 rounded-2xl px-1 outline-none transition-all duration-300 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/americell-mark.png"
          alt=""
          aria-hidden="true"
          width={464}
          height={260}
          className="h-8 w-auto shrink-0"
        />
        <span className="text-lg font-bold tracking-tight text-foreground">
          <AuroraText>Americell</AuroraText>
        </span>
        <Badge
          variant="secondary"
          className="ml-0.5 h-5 gap-1 border border-white/10 bg-white/5 px-2 text-[0.7rem] text-foreground backdrop-blur-md"
        >
          Account
        </Badge>
      </Link>

      <Separator className="bg-white/5" />

      <nav
        aria-label="Dashboard sections"
        className="-mx-1 flex-1 overflow-y-auto px-1"
      >
        <ul className="flex flex-col gap-1">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const active = section === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/nav flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    active
                      ? "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25 ring-1 ring-white/30"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110",
                      active ? "text-white" : "text-brand",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 truncate">{label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-white/10"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator className="bg-white/5" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 ring-1 ring-white/40 backdrop-blur-md">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-xs font-semibold text-white ring-1 ring-white/40"
          >
            {avatarSeed(email)}
          </span>
          <div className="min-w-0">
            <p
              className="truncate text-xs font-medium text-foreground"
              title={email}
            >
              {email || "Signed in"}
            </p>
            <p className="text-[0.7rem] text-muted-foreground">Customer</p>
          </div>
        </div>

        <form action={logout}>
          <Button
            variant="outline"
            size="lg"
            aria-label="Sign out"
            className="min-h-11 w-full justify-start gap-2 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10"
            render={<button type="submit" />}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sign out</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ── A single premium stat card ─────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass = "text-brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <div className={cn(glassCard, "flex items-start gap-4 p-5")}>
      <span
        aria-hidden="true"
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md",
          iconClass,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-0.5 text-sm font-medium text-balance text-muted-foreground">
          {label}
        </p>
        {sub ? (
          <p className="mt-1 text-xs text-balance text-muted-foreground">{sub}</p>
        ) : null}
      </div>
    </div>
  );
}

/* ── 1) OVERVIEW ────────────────────────────────────────────────────────────── */

function OverviewSection({
  activeCount,
  rentals,
  billing,
  onSelect,
}: {
  activeCount: number;
  rentals: DashboardShellProps["rentals"];
  billing: BillingRow[];
  onSelect: (key: SectionKey) => void;
}) {
  // Live clock stays null on the server + first paint (so relative-time text can't
  // cause a hydration mismatch), then ticks once mounted.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const activeLen = rentals.active.length;
  const total = activeLen + rentals.history.length;
  const hasAny = total > 0;

  // Soonest-expiring active rental (guarded for nulls / unparseable dates).
  const withExpiry = rentals.active
    .filter((r) => r.expiresAt != null && !Number.isNaN(Date.parse(r.expiresAt)))
    .sort((a, b) => Date.parse(a.expiresAt!) - Date.parse(b.expiresAt!));
  const soonestRental = withExpiry[0] ?? null;
  const expirySub =
    nowMs != null && soonestRental?.expiresAt
      ? formatExpiry(Date.parse(soonestRental.expiresAt) - nowMs)
      : null;

  const totalSpent = billing.reduce(
    (sum, row) => (PAID_ISH.has(row.status) ? sum + row.amountCents : sum),
    0,
  );
  const recent = billing[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Post-payment banner — renders nothing on a normal visit; the single
          <Suspense> in page.tsx covers its useSearchParams. */}
      <CheckoutSuccess activeCount={activeCount} />

      {hasAny ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Smartphone}
              value={String(activeLen)}
              label="Active phones"
              sub={activeLen === 1 ? "1 rental live now" : `${activeLen} rentals live now`}
            />
            <StatCard
              icon={Layers}
              value={String(total)}
              label="Total rentals"
              sub="Across your whole history"
              iconClass="text-brand-2"
            />
            <StatCard
              icon={Clock}
              value={String(activeLen)}
              label="In use / expiring"
              sub={expirySub ?? (activeLen > 0 ? "Live now" : "Nothing expiring")}
            />
            {totalSpent > 0 ? (
              <StatCard
                icon={Wallet}
                value={fmtMoney(totalSpent, "usd")}
                label="Total spent"
                sub="On completed rentals"
                iconClass="text-brand-2"
              />
            ) : null}
          </div>

          {/* Next up / recent activity — soonest expiry, else most-recent receipt. */}
          {soonestRental ? (
            <div
              className={cn(
                glassCard,
                "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-brand backdrop-blur-md"
                >
                  <Clock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Next up</p>
                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={soonestRental.model}
                  >
                    {soonestRental.model}
                    {expirySub ? ` · ${expirySub}` : ""}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSelect("phones")}
                className="min-h-11 w-full gap-2 rounded-full border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 sm:w-auto"
              >
                View my phones
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : recent ? (
            <div
              className={cn(
                glassCard,
                "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-brand backdrop-blur-md"
                >
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Recent activity
                  </p>
                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={recent.model}
                  >
                    {recent.model} · {fmtMoney(recent.amountCents, recent.currency)}{" "}
                    · {formatDate(recent.createdAt)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSelect("rent")}
                className="min-h-11 w-full gap-2 rounded-full border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 sm:w-auto"
              >
                Rent another
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className={cn("relative overflow-hidden text-center", glassCard)}>
          <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 px-6 py-12 sm:py-14">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-brand backdrop-blur-md"
            >
              <Smartphone className="h-6 w-6" />
            </span>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                No rentals yet
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your rented US phones show up here. Pick one to get started.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => onSelect("rent")}
              className={cn(CTA_GRADIENT, "min-h-11 gap-2 rounded-full font-semibold")}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Rent a phone
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 2) MY PHONES ───────────────────────────────────────────────────────────── */

function PhonesSection({
  dbConnected,
  rentals,
  onSelect,
}: {
  dbConnected: boolean;
  rentals: DashboardShellProps["rentals"];
  onSelect: (key: SectionKey) => void;
}) {
  if (!dbConnected) {
    return (
      <Alert className="border-white/10 bg-white/5 backdrop-blur-md">
        <Database className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>The database isn&rsquo;t connected yet.</AlertTitle>
        <AlertDescription>
          Add <code>DATABASE_URL</code> (see <code>.env.example</code>) and run the
          migrations to see your rentals here.
        </AlertDescription>
      </Alert>
    );
  }

  const { active, history } = rentals;

  if (active.length === 0 && history.length === 0) {
    return (
      <div className={cn("relative overflow-hidden text-center", glassCard)}>
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 px-6 py-12 sm:py-14">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-brand backdrop-blur-md"
          >
            <Smartphone className="h-6 w-6" />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              No phones yet
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Rent a real US device and it&rsquo;ll appear here with its PIN and
              remote control.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => onSelect("rent")}
            className={cn(CTA_GRADIENT, "min-h-11 gap-2 rounded-full font-semibold")}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Rent a phone
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {active.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Active
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {active.map((rental) => (
              <li key={rental.id}>
                <RentalCard rental={rental} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            History
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {history.map((rental) => (
              <li key={rental.id}>
                <RentalCard rental={rental} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/* ── 3) RENT A PHONE ────────────────────────────────────────────────────────── */

function RentHowItWorks() {
  const steps = [
    { n: 1, t: "Rent a real US phone", d: "Pick a device and how long you need it." },
    { n: 2, t: "We activate it in seconds", d: "You get a PIN + a live control link the moment you pay." },
    { n: 3, t: "Control it live", d: "Drive it from your browser — US SIM & data included." },
  ];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/40 backdrop-blur-xl sm:p-6">
      <p className="text-sm font-semibold text-foreground">How renting works</p>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-xs font-bold text-white">
              {s.n}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{s.t}</span>
              <span className="block text-xs leading-relaxed text-muted-foreground">{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RentSection({ store }: { store: DashboardShellProps["store"] }) {
  if (store.ok) {
    return (
      <div className="flex flex-col gap-5">
        <RentHowItWorks />
        <DashboardBuyPanel
          phones={store.phones}
          durations={store.durations}
          cryptoProviders={store.cryptoProviders}
        />
      </div>
    );
  }

  return (
    <div className={cn(glassCard, "p-6")}>
      {store.reason === "unconfigured" ? (
        <>
          <p className="text-sm font-semibold tracking-[0.18em] text-brand-2 uppercase">
            Demo mode
          </p>
          <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground">
            Live inventory isn&rsquo;t wired up yet
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            The device provider isn&rsquo;t configured in this environment, so we
            can&rsquo;t show live pricing right now.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold tracking-[0.18em] text-brand-2 uppercase">
            Temporary hiccup
          </p>
          <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground">
            Inventory didn&rsquo;t load
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            We couldn&rsquo;t load available devices just now. Refresh in a moment
            to see live pricing.
          </p>
        </>
      )}
    </div>
  );
}

/* ── 4) BILLING & ACCOUNT ───────────────────────────────────────────────────── */

function BillingSection({
  email,
  billing,
}: {
  email: string;
  billing: BillingRow[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Purchase history
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every rental you&rsquo;ve paid for, newest first.
        </p>

        {billing.length === 0 ? (
          <div className={cn(glassCard, "mt-4 p-8 text-center")}>
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          </div>
        ) : (
          <div className={cn(glassCard, "mt-4 overflow-hidden")}>
            {/* Scrolls inside its own box — the page never scrolls horizontally. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs tracking-wide text-muted-foreground uppercase">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Device
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Term
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map((row) => {
                    const receipt = billingReceipt(row.status);
                    const pill = platformPill(row.platform);
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-white/10 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="min-w-0 truncate font-medium text-foreground"
                              title={row.model}
                            >
                              {row.model}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn("shrink-0", pill.className)}
                            >
                              {pill.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {termLabel(row.billingPeriod)}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap text-foreground">
                          {fmtMoney(row.amountCents, row.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "whitespace-nowrap",
                              RECEIPT_CHIP[receipt.tone],
                            )}
                          >
                            {receipt.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {formatDate(row.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Account
        </h2>
        <div className={cn(glassCard, "mt-4 flex flex-col gap-4 p-5")}>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-sm font-semibold text-white ring-1 ring-white/40"
            >
              {avatarSeed(email)}
            </span>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold text-foreground"
                title={email}
              >
                {email || "Signed in"}
              </p>
              <p className="text-xs text-muted-foreground">Customer account</p>
            </div>
          </div>

          <Separator className="bg-white/5" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* No password-change route exists (auth.ts only exposes
                signup/login/logout) — plain text, never a dead link. */}
            <p className="text-xs text-muted-foreground">
              To change your password, contact support.
            </p>
            <form action={logout} className="sm:shrink-0">
              <Button
                variant="outline"
                size="lg"
                aria-label="Sign out"
                className="min-h-11 w-full gap-2 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 sm:w-auto"
                render={<button type="submit" />}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * DashboardShell — the single "use client" island for the customer dashboard.
 *
 * A light-brand glass app shell over the global aurora (SiteBackground lives in
 * app/layout.tsx): a fixed frosted sidebar on md+, a mobile Sheet drawer from a
 * slim topbar, and four client-switched sections synced to ?tab for deep-linking.
 * All data is fetched by the Server Component (page.tsx) and passed in as props —
 * nothing here fetches the catalog or rentals.
 * ──────────────────────────────────────────────────────────────────────────── */

export default function DashboardShell({
  email,
  activeCount,
  rentals,
  store,
  billing,
  dbConnected,
}: DashboardShellProps) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Deep-link: read ?tab once for the initial section. Server and client compute
  // this identically (same query), so there's no hydration mismatch.
  const tabParam = params.get("tab");
  const initialSection: SectionKey = SECTIONS.some((s) => s.key === tabParam)
    ? (tabParam as SectionKey)
    : "overview";
  const [section, setSection] = useState<SectionKey>(initialSection);

  // Switch section + sync ?tab. Cloning the CURRENT params preserves
  // ?checkout=success / ?crypto=success so CheckoutSuccess keeps working.
  const select = (key: SectionKey) => {
    setSection(key);
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", key);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];
  const CurrentIcon = current.icon;

  return (
    <div className="dark dark-surface relative min-h-screen bg-background text-foreground">
      {/* Fixed glass sidebar — md+ only. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 p-3 md:flex">
        <div className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] ring-1 ring-white/40 backdrop-blur-xl">
          <ShellNav email={email} section={section} onSelect={select} />
        </div>
      </aside>

      {/* Content column — offset for the sidebar on md+. */}
      <div className="md:pl-72">
        <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] ring-1 ring-white/40 backdrop-blur-xl md:px-4">
            {/* Mobile menu — collapses the sidebar into a Sheet (< md only). */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 rounded-xl text-foreground hover:bg-white/10 md:hidden"
                    aria-label="Open menu"
                  />
                }
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </SheetTrigger>
              <SheetContent
                side="left"
                showCloseButton={false}
                className="gap-0 border-white/10 bg-white/10 p-4 backdrop-blur-xl data-[side=left]:w-80 data-[side=left]:sm:max-w-80"
              >
                <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Your account sections
                </SheetDescription>
                <ShellNav
                  email={email}
                  section={section}
                  onSelect={(key) => {
                    select(key);
                    setOpen(false);
                  }}
                />
              </SheetContent>
            </Sheet>

            {/* Current section context. */}
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="hidden h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-2/15 text-brand ring-1 ring-white/50 sm:grid"
              >
                <CurrentIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {current.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {current.description}
                </p>
              </div>
            </div>

            {/* Account menu — email + Sign out (reused). */}
            <div className="ml-auto flex items-center">
              <DashboardUserMenu email={email} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          {section === "overview" ? (
            <OverviewSection
              activeCount={activeCount}
              rentals={rentals}
              billing={billing}
              onSelect={select}
            />
          ) : null}
          {section === "phones" ? (
            <PhonesSection
              dbConnected={dbConnected}
              rentals={rentals}
              onSelect={select}
            />
          ) : null}
          {section === "rent" ? <RentSection store={store} /> : null}
          {section === "billing" ? (
            <BillingSection email={email} billing={billing} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
