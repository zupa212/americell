import { requireAdminPage } from "@/lib/admin";
import { listLeads } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminLeadsPage() {
  await requireAdminPage();
  const leads = await listLeads();

  return (
    <div className="mx-auto w-full max-w-7xl px-1 py-4 sm:px-3 sm:py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Leads
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Marketing leads captured from the waitlist page ({leads.length}).
      </p>

      <div className={cn(glassCard, "mt-6 overflow-hidden")}>
        {leads.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No leads yet. They&rsquo;ll appear here as visitors join the
            waitlist.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-white/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Quantity</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-white/40 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {l.email}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground">
                      {l.fleetSize ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {l.source}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {fmtDate(l.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
