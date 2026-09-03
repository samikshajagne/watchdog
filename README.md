# Website Watchdog

Monitoring SaaS for web agencies and freelance developers who manage
many client sites: uptime checks, SSL expiry alerts, weekly broken-link
scans, one dashboard, and Stripe billing. Built with Next.js (App
Router), Supabase (Postgres + Auth), Stripe, and Resend — all of which
have free tiers, so you can run this for close to $0 until you have
paying customers.

This README is the full path from "code on disk" to "live and able to
charge people." Follow it in order — each account you create feeds an
env var the next step needs.

## 1. Prerequisites

- Node.js 20.9+ and npm (`node -v`)
- A GitHub account (to deploy via Vercel)
- Accounts you'll create below: Supabase, Stripe, Resend, Vercel — all
  have free tiers and none require a credit card except Stripe (and
  Stripe itself is free until you charge customers)

## 2. Supabase (database + auth)

1. Create a project at supabase.com (free tier).
2. Open **SQL Editor → New query**, paste the entire contents of
   `supabase/schema.sql`, and run it. This creates every table, index,
   and Row Level Security policy the app needs. Safe to re-run.
3. Go to **Authentication → Providers** and confirm **Email** is
   enabled. Go to **Authentication → Sign In / Providers → Email** and
   make sure "Confirm email" matches your preference (magic-link login
   works either way).
4. Go to **Authentication → URL Configuration** and add your site URL
   (e.g. `https://yourdomain.com`, and `http://localhost:3000` for
   local dev) to **Site URL** and **Redirect URLs** (specifically
   `<your-url>/auth/callback`).
5. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this
     secret — it bypasses Row Level Security; it's only ever used
     server-side in the cron job, the Stripe webhook, and the waitlist
     route)

## 3. Resend (email alerts)

1. Create a free account at resend.com.
2. Add and verify a sending domain (or use a subdomain you control) —
   Resend walks you through the DNS records. Until it's verified you
   can only send test emails to your own account email.
3. Create an API key → `RESEND_API_KEY`.
4. Pick the address you want alerts to come from → `ALERT_FROM_EMAIL`
   (must be on the verified domain).

## 4. Stripe (billing)

1. Create a Stripe account. Start in **Test mode** (toggle top-right)
   — you can flip to live mode later without changing any code.
2. **Product catalog → Add product**, create three products with a
   **recurring monthly** price each:
   - Starter — $9/month
   - Agency — $25/month
   - Scale — $60/month
3. Copy each price's ID (`price_...`) into `STRIPE_PRICE_STARTER`,
   `STRIPE_PRICE_AGENCY`, `STRIPE_PRICE_SCALE`.
4. **Developers → API keys** → copy the secret key → `STRIPE_SECRET_KEY`.
5. The webhook (step 4 needs a live URL, so come back to this after
   you've deployed once in step 6): **Developers → Webhooks → Add
   endpoint**, URL `https://yourdomain.com/api/stripe/webhook`, events
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy the **Signing secret** →
   `STRIPE_WEBHOOK_SECRET`.

## 5. Local development

```bash
npm install
cp .env.example .env.local
# fill in .env.local with the values from steps 2-4
# (leave STRIPE_WEBHOOK_SECRET and the Stripe price IDs blank until
#  you need to test billing locally — everything else works without them)
npm run dev
```

Open `http://localhost:3000` — the landing page and waitlist form work
immediately. Sign in at `/login` with your own email to see the
dashboard (Supabase will email you a magic link — check the Supabase
Auth logs if it doesn't arrive locally).

To test the monitoring engine locally without waiting for a cron:

```bash
curl -H "Authorization: Bearer <your CRON_SECRET>" http://localhost:3000/api/cron/check
```

## 6. Deploy to Vercel

1. Push this project to a new GitHub repo (`git init` was already run
   for you; `git remote add origin <your repo>` then `git push -u
   origin main`).
2. Import the repo at vercel.com/new.
3. In the project's **Settings → Environment Variables**, add every
   variable from `.env.example` with your real values.
   `NEXT_PUBLIC_SITE_URL` should be your production URL (e.g.
   `https://website-watchdog.vercel.app` or your own domain).
4. Deploy. Then go back to Supabase (step 2.4) and Stripe (step 4.5)
   and update the URLs to your real deployed domain.

## 7. Turn on the monitoring cron

`vercel.json` already defines a check every 10 minutes — **this only
works on a paid Vercel plan.** Vercel's free Hobby plan only allows
cron jobs to run once a day, which is too slow for "catch it before
your client does."

Two ways to get real-time-ish checks for free:

- **External pinger (recommended to start):** use a free service like
  cron-job.org. Point it at
  `https://yourdomain.com/api/cron/check` every 5–10 minutes, with a
  custom header `Authorization: Bearer <your CRON_SECRET>`. Delete or
  ignore `vercel.json`'s cron entry in this case — it won't deploy
  successfully on Hobby anyway.
- **Upgrade to Vercel Pro** ($20/month) once you have paying customers
  — then `vercel.json`'s built-in cron just works, and Vercel
  automatically sends the correct `Authorization` header for you.

Either way, the SSL check and broken-link crawl throttle themselves
(roughly once a day and once a week per site) regardless of how often
this endpoint is hit, so it's safe to call it every few minutes.

## 8. After deploying — a quick checklist

- [ ] Submit the waitlist form on the landing page and confirm a row
      appears in Supabase's `waitlist` table.
- [ ] Sign in at `/login`, click the magic link, land on `/dashboard`.
- [ ] Add a real site you control, wait for (or manually trigger) a
      cron run, confirm it shows a status.
- [ ] On the Billing page, subscribe to a plan using a
      [Stripe test card](https://docs.stripe.com/testing) (`4242 4242
      4242 4242`, any future date/CVC) and confirm your plan tier
      updates.
- [ ] When ready to actually charge people, switch Stripe from Test to
      Live mode, replace the three `STRIPE_PRICE_*` env vars with the
      **live-mode** price IDs (Stripe test and live prices have
      different IDs), and add a **live-mode** webhook endpoint/secret.

## Known limitations (intentional, for a fast MVP)

- **Single monitoring region.** Uptime checks run from wherever Vercel
  executes the function — no multi-region confirmation before
  alerting. Fine for an MVP; mention it in your own marketing copy.
- **N+1 dashboard queries.** `lib/dashboard-data.ts` does a few queries
  per site to build the status table. Fine for dozens of sites per
  agency; worth collapsing into a Postgres view/RPC if an agency grows
  past ~100 sites.
- **Shallow broken-link crawler.** Checks the homepage's own links
  only (capped at 20), via a regex, not a real HTML parser or a
  multi-page crawl. Catches the obvious cases; not a full site audit.
- **One check runs per site, sequentially, per cron invocation.** Fine
  at MVP scale; will need concurrency limits or sharding across
  multiple cron calls once an agency has 100+ sites.
- **No team seats yet.** One login per agency account (the `agencies`
  table is 1:1 with `auth.users`). Multi-user access is a natural v2
  feature once you have paying customers asking for it.

## Where to customize

- **Pricing & site limits:** `lib/plans.ts`
- **Accent color / fonts:** `tailwind.config.ts`, `app/globals.css`
- **Landing page copy:** `app/page.tsx`
- **Alert email copy:** `lib/email.ts`
- **Alert thresholds/cadence:** `app/api/cron/check/route.ts`
  (`SSL_TIERS`, `SSL_RECHECK_HOURS`, `BROKEN_LINK_RECHECK_DAYS`)
