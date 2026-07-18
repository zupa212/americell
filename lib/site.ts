// Site-wide content constants for the Americell marketing site.

export const SITE = {
  name: "Americell",
  domain: "americell.example",
  tagline: "Real US phones. Controlled from your browser.",
  subtagline:
    "Live US iPhones and Androids you control right from your phone. Tap, type, and install — from anywhere.",
};

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/blog" },
];

// Stylized social-app tiles for the hero's floating-icon cluster.
// (Provisional, brand-neutral approximations — no third-party logo assets shipped.)
export type AppTile = { name: string; glyph: string; from: string; to: string };

export const APP_TILES: AppTile[] = [
  { name: "Instagram", glyph: "◎", from: "#f9ce34", to: "#ee2a7b" },
  { name: "TikTok", glyph: "♪", from: "#25f4ee", to: "#000000" },
  { name: "X", glyph: "𝕏", from: "#1d1d1f", to: "#000000" },
  { name: "Snapchat", glyph: "👻", from: "#fffc00", to: "#f7d000" },
  { name: "Telegram", glyph: "✈", from: "#2aabee", to: "#229ed9" },
  { name: "Reddit", glyph: "▣", from: "#ff5700", to: "#ff4500" },
  { name: "Tinder", glyph: "🔥", from: "#ff7854", to: "#fd267d" },
  { name: "Settings", glyph: "⚙", from: "#d1d5db", to: "#9ca3af" },
];

export type Feature = { title: string; body: string; icon: string };

export const FEATURES: Feature[] = [
  {
    title: "Real US hardware. No emulators.",
    body: "Genuine American iPhones and Androids on clean US residential connectivity — exactly what your users and the US app stores see.",
    icon: "device",
  },
  {
    title: "Control from anywhere",
    body: "A full live screen in your browser — laptop or phone. Tap, type, swipe, and install from any time zone, any teammate.",
    icon: "globe",
  },
  {
    title: "Always on, always US",
    body: "Your devices stay powered and online on real US connectivity — come back any time and pick up right where you left off.",
    icon: "bolt",
  },
  {
    title: "Built for teams",
    body: "Shared device pools, per-seat access, and full audit history — all from one clean dashboard.",
    icon: "users",
  },
];

export type Step = { n: number; title: string; body: string };

export const STEPS: Step[] = [
  { n: 1, title: "Pick a device", body: "Choose a real US phone and location from our fleet — Pixel, Galaxy, or iPhone." },
  { n: 2, title: "Connect instantly", body: "Your US device comes online and streams straight to your phone or browser in seconds." },
  { n: 3, title: "Take control", body: "Drive the real device live from your browser — tap, type, install, sign in. No cables, no local hardware." },
];

export type Faq = { q: string; a: string };

// Single source of truth for FAQ copy — consumed by both the visible <Faq/>
// section AND the FAQPage JSON-LD in <StructuredData/>, so the two never drift.
export const FAQS: Faq[] = [
  {
    q: "Are these real devices or emulators?",
    a: "Real, physical iPhones and Android handsets hosted in the US — never emulators or virtual OS images. Your team, your users, and the app stores all see genuine hardware on clean US connectivity.",
  },
  {
    q: "What latency and uptime can we expect?",
    a: "Devices stream from global edge locations at under 50ms, so live control feels local. The fleet runs on redundant power and networking behind a 99.9% uptime SLA, with hardware maintenance and replacement handled by us.",
  },
  {
    q: "How do you handle security and access control?",
    a: "Every device, session, and teammate sits under one policy. You get role-based access with granular permissions, full session recording, and complete audit logs — so you always know who touched which device, and when.",
  },
  {
    q: "Can we get SIMs and real mobile connectivity?",
    a: "Yes — and it's included in the price. Every device comes with a real US SIM, a live carrier number, and mobile data at no extra cost. Genuine carrier connectivity, not Wi-Fi only, so your workflows see exactly what a real US phone sees.",
  },
  {
    q: "How fast can we scale, and what about procurement?",
    a: "You go live in minutes, not procurement cycles. Add or remove devices on demand from the dashboard — no cables, no office hardware, no shipping. Scale from a handful of devices to an enterprise pool without touching a purchase order.",
  },
  {
    q: "How does enterprise billing and compliance work?",
    a: "Transparent per-device monthly pricing, with hosting, maintenance, and hardware replacement included — no setup fees, cancel anytime from your dashboard. For larger deployments we offer a DPA and dedicated support; talk to Sales to scope it.",
  },
];

export type Testimonial = { quote: string; name: string; role: string };

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "We replaced a closet of test phones with Americell. Real US devices, real OS versions, zero cables.",
    name: "Maya R.",
    role: "Head of QA, mobile fintech",
  },
  {
    quote: "Our agency now runs dozens of real devices from one dashboard. Live control feels truly instant.",
    name: "Devin K.",
    role: "Founder, growth agency",
  },
  {
    quote: "Store review and localization testing on real US hardware finally stopped being a logistics nightmare.",
    name: "Priya S.",
    role: "Release manager",
  },
];

// Honest trust chips — real, verifiable product guarantees, not invented clients.
export const CLIENT_LOGOS: string[] = [
  "Real US devices",
  "US SIM + data included",
  "Instant activation",
  "No-KYC crypto",
  "No setup fees",
  "Cancel anytime",
];
