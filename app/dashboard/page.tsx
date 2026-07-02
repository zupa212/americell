import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Database, MapPin, RefreshCw, Smartphone } from "lucide-react";

import { auth } from "@/auth";
import { db, isDbConfigured } from "@/lib/db";
import { subscriptions, type Subscription } from "@/db/schema";
import { deviceById } from "@/lib/devices";
import RemoteControlButton from "@/components/remote-control-button";
import DashboardUserMenu from "@/components/dashboard-user-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Map a subscription status to a Badge variant + Greek label. */
function statusBadge(status: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  switch (status) {
    case "active":
      return { variant: "default", label: "ενεργή" };
    case "past_due":
      return { variant: "destructive", label: "εκκρεμεί πληρωμή" };
    case "canceled":
      return { variant: "outline", label: "ακυρωμένη" };
    case "incomplete":
      return { variant: "secondary", label: "εκκρεμής" };
    default:
      return { variant: "secondary", label: status };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let subs: Subscription[] = [];
  let dbError = false;
  if (isDbConfigured) {
    try {
      subs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id));
    } catch {
      dbError = true;
    }
  }

  const email = session.user.email ?? "";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-base font-bold text-white shadow-sm shadow-brand/20"
            >
              A
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Americell
            </span>
          </Link>
          <DashboardUserMenu email={email} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Οι συσκευές σου
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Διαχειρίσου και έλεγξε τα αληθινά τηλέφωνα ΗΠΑ του λογαριασμού σου.
        </p>

        {!isDbConfigured || dbError ? (
          <Alert className="mt-8">
            <Database className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Η βάση δεδομένων δεν έχει συνδεθεί ακόμη.</AlertTitle>
            <AlertDescription>
              Πρόσθεσε <code>DATABASE_URL</code> (δες το{" "}
              <code>.env.example</code>) και τρέξε τα migrations για να δεις εδώ
              τις ενεργές συνδρομές.
            </AlertDescription>
          </Alert>
        ) : subs.length === 0 ? (
          <Card className="mt-8 items-center py-12 text-center">
            <CardHeader className="items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"
              >
                <Smartphone className="h-6 w-6" />
              </span>
              <CardTitle className="text-lg">Δεν έχεις συσκευές ακόμη.</CardTitle>
              <CardDescription>
                Επίλεξε ένα αληθινό τηλέφωνο ΗΠΑ και ξεκίνα τον τηλεχειρισμό σε
                λίγα λεπτά.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="h-11 bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-5 text-white shadow-sm shadow-brand/25 hover:opacity-95"
                render={<Link href="/#pricing" />}
                nativeButton={false}
              >
                Δες τις συσκευές
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {subs.map((sub) => {
              const device = deviceById(sub.deviceId);
              const badge = statusBadge(sub.status);
              return (
                <li key={sub.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Smartphone
                          className="h-4 w-4 text-brand"
                          aria-hidden="true"
                        />
                        {device?.name ?? sub.deviceId}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {device?.location ?? "US"}
                      </CardDescription>
                      <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      χρέωση {sub.cycle}
                    </CardContent>
                    <CardFooter className="bg-transparent [&>div]:w-full">
                      <RemoteControlButton deviceId={sub.deviceId} />
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
