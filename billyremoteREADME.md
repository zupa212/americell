# AMERICELL — Implementation Plan

> **Status:** planning. Stack = **Next.js (App Router) + TypeScript**, deployed on **Vercel**.
> Brand = **AMERICELL**. The visual design below is anchored on the reference ("ALI") landing
> page but is **provisional — we will change it.** This document is the single source of truth;
> `BILLY123.md` is superseded by this file.

---

## 1. Product analysis

**What it is.** AMERICELL rents and remotely operates **real US smartphones** (genuine iPhones /
Android devices hosted in US datacenters, on clean US residential connectivity). Customers
**manage, automate, and control a real device from anywhere, at any time** — through a web
dashboard and an API.

**Who it's for (honest, conversion-strong positioning):**
- **Marketing & social agencies** managing many real accounts/devices from one place.
- **Mobile app testers / QA** that need real US hardware + OS versions, not emulators.
- **Growth teams** running real-device workflows, localization, and store testing.

**Positioning guardrail (kept from the original spec).** We frame the product around the
*legitimate* value — real US devices, real control, real testing/management — and keep a clear,
honest **Acceptable Use** page. We do **not** market it around "undetectable" automation, evasion,
or bypassing platform rules. This is both safer for Stripe approval/payouts and stronger for
conversion. All provider/secret keys stay server-side, never in the client.

**Reference takeaway (the "ALI" page).** Hero promise = *"Turning iPhones into remote-control
machinery — manage, automate and control your iPhone from anywhere."* Surrounded by a real phone
mockup + floating app icons (Instagram, TikTok, X, Snapchat, Telegram, Reddit, etc.). We keep that
energy, rebranded to AMERICELL with an American accent.

---

## 2. Design analysis & direction (provisional)

Distilled from the reference, plus an AMERICELL twist. **Will be iterated.**

**Mood:** light, airy, premium, lots of whitespace, monochrome base with one accent.

| Token | Reference | AMERICELL direction (provisional) |
|---|---|---|
| Background | near-white warm gray | `#F7F7F5` page / `#FFFFFF` surfaces |
| Text | near-black + gray subtext | `#0A0A0A` / `#6B7280` |
| Accent | blue gradient on hero keyword | **American accent**: primary blue `#1D4ED8`, sparing patriotic red `#E4322B` |
| Buttons | fully-rounded pills, solid black + outline | same: primary solid `#0A0A0A`/navy, secondary outline |
| Headings | very bold geometric grotesque | `Geist`/`Satoshi`/`Clash Display` (decide in build) |
| Body | clean sans | `Geist Sans` / `Inter` |

**Hero pattern to reproduce:** oversized centered bold headline with **one keyword in an accent
gradient** ("iPhones" → for us maybe "**US iPhones**"), gray two-line subhead, single solid pill
CTA, then a realistic phone mockup with **floating 3D app icons** (soft shadows + glow), gently
animated.

**Page sections (landing):**
1. **Nav** — left logo `Americell`, centered links (Home · How it works · Pricing · Clients), right
   `Log in` (outline) + `Get started` (solid) + language switcher.
2. **Hero** — headline + subhead + CTA + animated phone-with-floating-icons visual.
3. **Trust bar** — "real US devices", clean-IP, datacenter locations / logos.
4. **Features** — manage, automate, control; real hardware vs emulators.
5. **How it works** — 3 steps (pick device → connect → control/automate).
6. **Device showcase** — the rentable phones (Pixel 8, Galaxy S24, iPhone 15) with location/specs.
7. **Pricing** — monthly/annual toggle, per-device cards.
8. **Clients / testimonials**.
9. **FAQ** — accordion.
10. **CTA band** + **Footer** (with honest Acceptable Use link).

---

## 3. Recommended tech stack

| Concern | Recommendation | Why |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript** | requested; SSR + API routes in one app |
| Styling | **Tailwind CSS** + **shadcn/ui** | matches the clean pill/card aesthetic fast |
| Animation | **Framer Motion** | floating app icons + hero motion |
| Hosting | **Vercel** | native Next.js, preview URLs, easy env |
| Payments | **Stripe Checkout + webhooks** (Route Handlers) | from spec; subscriptions |
| Database | **Neon Postgres** (Vercel Marketplace) + **Drizzle ORM** | serverless-friendly (the old JSON-file store won't survive serverless) |
| Auth | **Auth.js (NextAuth) credentials** *(recommended)*, or **Clerk** | keeps custom email/password from spec; Clerk = faster but 3rd-party |
| i18n | **next-intl** (optional, later) | reference shows a language switcher |

**Three decisions worth confirming before build (I have a default for each):**
1. **Auth** → default **Auth.js credentials** (closest to original JWT spec). Alt: **Clerk**.
2. **DB/ORM** → default **Neon + Drizzle**. Alt: Prisma, or Supabase.
3. **Accent color** → default **blue + sparing red** (American). Alt: keep pure blue like reference.

---

## 4. Proposed architecture

```
americell/
├─ app/
│  ├─ (marketing)/page.tsx          # landing (hero, pricing, FAQ…)
│  ├─ (marketing)/pricing/page.tsx
│  ├─ login/page.tsx · signup/page.tsx
│  ├─ dashboard/page.tsx            # auth-gated: subscriptions + device control
│  └─ api/
│     ├─ auth/[...]                 # Auth.js (or Clerk) routes
│     ├─ checkout/route.ts          # POST → Stripe Checkout Session → { url }
│     ├─ webhook/route.ts           # POST raw body → verify sig → provision subs
│     ├─ me/route.ts                # GET → user + subscriptions
│     └─ devices/[id]/unlock/route.ts  # POST auth → verify ownership → provider → { sessionUrl }
├─ components/                      # Nav, Hero, PhoneMock, FloatingIcons, PricingToggle, FaqAccordion, LoginModal …
├─ lib/                             # stripe.ts, db (drizzle), auth.ts, devices catalog, provider client
├─ db/schema.ts                     # users, subscriptions
└─ … (tailwind, env, etc.)
```

**Data model (Postgres):**
- `users(id, email, passwordHash, createdAt, stripeCustomerId)`
- `subscriptions(id, userId, deviceId, cycle, status, stripeSubscriptionId, currentPeriodEnd)`

**Device catalog (server source of truth, mirrored in UI):**
- `pixel8` — Google Pixel 8 · Ashburn, VA · $49/mo · $470/yr
- `galaxys24` — Samsung Galaxy S24 · Dallas, TX · $59/mo · $566/yr
- `iphone15` — Apple iPhone 15 · San Jose, CA · $69/mo · $662/yr

**API contract (unchanged from spec, now as Next.js Route Handlers):**
`/api/checkout`, `/api/webhook` (raw body + Stripe signature verify), `/api/me`,
`/api/devices/[id]/unlock` (auth + active-subscription ownership check; provider keys server-only;
returns a clear "not configured" response until a remote provider is wired).

---

## 5. Build phases (milestones)

1. ✅ **Scaffold + design system** — Next.js 16, Tailwind v4, Geist fonts, color tokens, shared `lib/`.
2. ✅ **Landing page + UI system** — rebuilt on **shadcn/ui + Magic UI** (Greek). Header (NavigationMenu + mobile
   Sheet), hero (iPhone mock + floating tiles + AuroraText + BorderBeam + ShimmerButton), features, how-it-works,
   pricing (Tabs), testimonials, FAQ (Accordion), CTA, footer, sonner toasts.
3. ✅ **Auth + DB** — Auth.js (next-auth v5) credentials, Neon + Drizzle, signup/login (bcrypt), `/api/me`, gated `/dashboard`.
4. ✅ **Payments** — Stripe Checkout + signature-verified webhook (idempotent + dedup table) + subscription sync.
5. ✅ **Remote control** — `/api/devices/[id]/unlock` (auth + active-subscription ownership check) + dashboard button.
   Provider call isolated in `lib/provider.ts` (**stub — wire a real device backend to go live**).
6. ✅ **Site pages** — Greek in full (`lang="el"`), comprehensive SEO (metadata, JSON-LD, sitemap, robots, OG/twitter
   images), legal/content pages (Όροι, Απόρρητο, Αποδεκτή Χρήση, Σχετικά, Επικοινωνία), 404 / error / loading.
7. ⏳ **Go live** — provide domain + Neon/Stripe keys, deploy to Vercel (§8), then integrate a real remote provider.

Everything builds green (`npm run build`), is runtime-verified, and passed adversarial security review.

---

## 6. Run it locally

```bash
npm install
cp .env.example .env.local          # then fill in the values below
npm run db:push                     # create tables once DATABASE_URL is set
npm run dev                         # http://localhost:3000
```

Required env to go fully live (see `.env.example`):
- `AUTH_SECRET` — `npx auth secret`
- `DATABASE_URL` — a Neon Postgres URL
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — `stripe listen --forward-to localhost:3000/api/webhook`
- `REMOTE_PROVIDER_URL` / `REMOTE_PROVIDER_API_KEY` — when wiring a real device backend

Without these the app still builds and runs: checkout returns a demo notice, login/sign-up show a
"configure the database" message, and remote control reports "not configured" — nothing crashes.

## 7. UI stack
Greek (`el`) site built on **shadcn/ui** (Radix) + **Magic UI** marketing components, Tailwind v4 tokens.
Brand accent = blue `#2b6bff` → violet `#7c3aed`; shadcn `--primary`/`--ring` bound to the brand blue.

## 8. Deploy to Vercel

1. Push this repo to GitHub (it's a git repo already).
2. **Provision services:**
   - **Neon Postgres** (Vercel Marketplace or neon.tech) → copy the connection string.
   - **Stripe** → get `STRIPE_SECRET_KEY`; create a webhook endpoint `https://<domain>/api/webhook` → `STRIPE_WEBHOOK_SECRET`.
   - `AUTH_SECRET` → run `npx auth secret`.
3. In Vercel → **New Project** → import the repo. Add env vars (Production + Preview):
   `AUTH_SECRET`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL=https://<domain>`,
   and later `REMOTE_PROVIDER_URL` / `REMOTE_PROVIDER_API_KEY`.
4. Run migrations against the prod DB once: `DATABASE_URL=... npm run db:push` (or `db:migrate`).
5. Deploy. Point `SITE_URL` (in `lib/seo.ts` via `NEXT_PUBLIC_SITE_URL`) at the real domain so canonical/OG/sitemap
   use it. Add the domain in Vercel → Domains.
6. Set the Stripe webhook’s signing secret to match `STRIPE_WEBHOOK_SECRET`.

Until keys are set the app runs in safe demo mode (checkout → demo notice, auth → “configure DB”, remote → “not configured”).

## 9. Still yours to decide
- **Domain** + the keys above (only you can provide these).
- A **real remote-control provider** to replace the `lib/provider.ts` stub.
- Currency: prices are in **USD ($)** — switch to € if you prefer.
