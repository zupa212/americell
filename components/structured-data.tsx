// JSON-LD structured data for the Americell marketing site.
//
// Server Component: emits a single schema.org @graph inside a
// <script type="application/ld+json"> tag. Rendering JSON-LD as raw text
// (rather than as React children) is intentional — it must be a literal
// JSON string, so we serialize with JSON.stringify and inject via
// dangerouslySetInnerHTML. There is no client-side code here; the markup is
// static and fully prerendered.
//
// The graph is derived from the same content sources the UI uses:
//   - lib/seo   → canonical SITE_URL / SITE_NAME / OG image path
//   - lib/devices → the device catalog (one Product per device)
//   - lib/site  → FAQ content (FAQPage)
// Keeping a single source of truth means the rich results can never drift
// from what's rendered on the page.

import { DEVICES } from "@/lib/devices";
import { OG_IMAGE_PATH, SITE_NAME, SITE_URL } from "@/lib/seo";
import { FAQS, SITE } from "@/lib/site";

// Minimal, index-signature-based JSON-LD node type. schema.org nodes are
// open-ended (any string of `@`-prefixed and camelCase keys), so we model a
// node as a JSON value keyed by string — no `any`, and still fully
// JSON.stringify-able.
type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

type JsonLdNode = { "@type": string; [key: string]: JsonLdValue };

/** Absolute URL helper scoped to this module (SITE_URL has no trailing slash). */
function abs(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE.tagline,
    logo: {
      "@type": "ImageObject",
      url: abs(OG_IMAGE_PATH),
    },
  };
}

function webSiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE.subtagline,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en-US",
  };
}

function productNodes(): JsonLdNode[] {
  return DEVICES.map((device) => ({
    "@type": "Product",
    "@id": `${SITE_URL}/#product-${device.id}`,
    name: device.name,
    description: `${device.name} με ${device.os} — ${device.specs}. Φιλοξενείται σε ${device.location} και ελέγχεται ζωντανά από τον browser σου.`,
    brand: {
      "@type": "Brand",
      name: device.brand,
    },
    category: "Συνδρομή φιλοξενούμενης κινητής συσκευής",
    offers: {
      "@type": "Offer",
      url: abs("/#pricing"),
      priceCurrency: "USD",
      price: device.priceMonthly,
      availability: "https://schema.org/InStock",
      seller: { "@id": ORGANIZATION_ID },
    },
  }));
}

function faqPageNode(): JsonLdNode {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

function buildGraph(): { "@context": string; "@graph": JsonLdNode[] } {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      webSiteNode(),
      ...productNodes(),
      faqPageNode(),
    ],
  };
}

/**
 * Renders the site's JSON-LD structured data. Drop once in the root layout
 * (inside <body> or <head>) so every route inherits Organization, WebSite,
 * Product, and FAQPage rich-result markup.
 */
export default function StructuredData() {
  const json = JSON.stringify(buildGraph());

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; there is no user-supplied
      // content in the graph, and JSON has no HTML-significant characters that
      // schema.org keys/values here introduce.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
