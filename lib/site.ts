// Site-wide content constants for the Americell marketing site.

export const SITE = {
  name: "Americell",
  domain: "americell.example",
  tagline: "Real US phones. Controlled from your browser.",
  subtagline:
    "Live iPhones and Androids in US datacenters. Tap, type, install, and automate — from anywhere, any time.",
};

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Clients", href: "/#clients" },
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
    title: "Real hardware. No emulators.",
    body: "Genuine iPhones and Androids on clean US residential connectivity — exactly what your users and the app stores see.",
    icon: "device",
  },
  {
    title: "Control from anywhere",
    body: "A full live screen in your browser. Tap, type, swipe, and install — from any laptop, any time zone, any teammate.",
    icon: "globe",
  },
  {
    title: "Automate the routine",
    body: "Script repeatable flows and schedule them. Run workflows on real devices for testing, QA, and scale.",
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
  { n: 2, title: "Connect instantly", body: "Your device boots in a US datacenter and streams to your browser in seconds." },
  { n: 3, title: "Control & automate", body: "Drive it live or script flows that run on schedule — no cables, no local hardware." },
];

export type Faq = { q: string; a: string };

// Single source of truth for FAQ copy — consumed by both the visible <Faq/>
// section AND the FAQPage JSON-LD in <StructuredData/>, so the two never drift.
export const FAQS: Faq[] = [
  {
    q: "Are these real devices or emulators?",
    a: "Real, physical iPhones and Android handsets racked in US datacenters — never emulators or virtual OS images. Your team, your users, and the app stores all see genuine hardware on clean connectivity.",
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
    a: "Yes. Devices ship on clean US connectivity out of the box, and you can add dedicated SIM data plans from $15/mo per device whenever a workflow needs a live carrier number or mobile data.",
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

export const CLIENT_LOGOS: string[] = [
  "Northbeam",
  "Lattice Labs",
  "Verde QA",
  "Hammerhead",
  "Studio Nine",
  "Pacific Apps",
];
