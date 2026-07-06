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

export const FAQS: Faq[] = [
  {
    q: "Real phones or emulators?",
    a: "Real, physical smartphones hosted in US datacenters on clean residential connectivity. No emulators, no virtual OS images.",
  },
  {
    q: "What can I use Americell for?",
    a: "Legitimate work on real devices: mobile app testing and QA, US localization testing, store review, and managing your own accounts and workflows for agencies and growth teams.",
  },
  {
    q: "Where are the devices?",
    a: "Across the US — currently Ashburn (VA), Dallas (TX), and San Jose (CA), with more coming.",
  },
  {
    q: "Can I automate actions?",
    a: "Yes. Drive a device live in the browser, or script repeatable flows and schedule them to run on the real device.",
  },
  {
    q: "How does billing work?",
    a: "Simple per-device plans, monthly or annual (annual saves ~20%). Cancel anytime from your dashboard.",
  },
  {
    q: "Is this allowed by app and platform rules?",
    a: "Americell is built for legitimate use. You're responsible for following the terms of any app or platform you use on a device — see our Acceptable Use policy.",
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
