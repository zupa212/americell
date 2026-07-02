import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

/**
 * Shared shell for standalone content pages (legal, about, contact, 404…):
 * the same sticky header + footer as the marketing homepage, with the page
 * content in a flex-1 <main>. The root <body> is already min-h-full flex-col.
 */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
