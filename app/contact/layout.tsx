import type { ReactNode } from "react";

import { buildMetadata } from "@/lib/seo";

// The contact page is a client component (interactive Sales form), so it can't
// export `metadata` itself — this layout restores the title/description/canonical
// for /contact that would otherwise fall back to the root-layout defaults.
export const metadata = buildMetadata({
  title: "Talk to Sales",
  description:
    "Tell us about your fleet — how many real iPhones and Android devices you need, your timeline, and the workflow you want to run. It lands directly with the AMERICELL team.",
  alternates: { canonical: "/contact" },
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
