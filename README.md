# Website Watchdog

Monitoring SaaS for web agencies and freelance developers who manage
many client sites: uptime checks, SSL expiry alerts, weekly broken-link
scans, one dashboard, and Razorpay billing. Built with Next.js (App
Router), Supabase (Postgres + Auth), Razorpay, and Resend — all of
which have free/no-monthly-fee tiers, so you can run this for close to
₹0 until you have paying customers.

Billing runs on **Razorpay**, not Stripe — Stripe's India signup is
currently invite-only ("Preview" status, sales-contact-only) for new
businesses, so Razorpay (an Indian payment gateway built for exactly
this — Indian companies, UPI + cards, no waitlist) is the practical
choice here. See the note at the end of this README if that changes
and you'd rather switch back.

This README is the full path from "code on disk" to "live and able to
charge people." Follow it in order — each account you create feeds an
env var the next step needs.

## 1. Prerequisites

- Node.js 20.9+ and npm (`node -v`)
- A GitHub account (to deploy via Vercel)
- Accounts you'll create below: Supabase, Razorpay, Resend, Vercel —
  all are free to create; Razorpay only takes a cut (currently ~2% +
  GST per transaction, often discounted for new accounts) once you
  actually charge someone, no subscription fee to use it.

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
     server-side in the cron job, the Razorpay webhook, and the
     waitlist route)

   **Already ran the old schema before this Stripe→Razorpay switch?**
   Also run `supabase/migration_001_razorpay.sql` once — it renames the
   old `stripe_customer_id` column and adds the new subscription-id
   column. Skip it on a fresh project; the current `schema.sql`
   already has the right columns.

## 3. Resend (email alerts)

1. Create a free account at resend.com.
2. Add and verify a sending domain (or use a subdomain you control) —
   Resend walks you through the DNS records. Until it's verified you
   can only send test emails to your own account email.
3. Create an API key → `RESEND_API_KEY`.
4. Pick the address you want alerts to come from → `ALERT_FROM_EMAIL`
   (must be on the verified domain).

## 4. Razorpay (billing)

1. Create a Razorpay account at razorpay.com and complete their
   business KYC (needed before you can go live — you can build and
   test everything below in **Test mode** first, no KYC required for
   that).
2. **Account & Settings → API Keys → Generate Test Key** → copy the
   Key ID and Key Secret → `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
3. Create three subscription **Plans** — either in the Dashboard
   (**Subscriptions → Plans → Create Plan**) or once via API/`curl`.
   Amounts are in paise (smallest currency unit), period `monthly`,
   interval `1`:
   - Starter — item amount `69900` (₹699/month)
   - Agency — item amount `199900` (₹1,999/month)
   - Scale — item amount `499900` (₹4,999/month)

   Copy each plan's ID (`plan_...`) into `RAZORPAY_PLAN_STARTER`,
   `RAZORPAY_PLAN_AGENCY`, `RAZORPAY_PLAN_SCALE`. (Want different
   prices? Change the amount here and in `lib/plans.ts`'s
   `PLAN_PRICE_INR` so the dashboard display matches what you actually
   charge.)
4. The webhook (needs a live URL, so come back to this after you've
   deployed once in step 6): **Account & Settings → Webhooks → Add New
   Webhook**, URL `https://yourdomain.com/api/razorpay/webhook`,
   select events `subscription.activated`, `subscription.charged`,
   `subscription.cancelled`, `subscription.completed`,
   `subscription.halted`. Set a secret there and copy the same value
   into `RAZORPAY_WEBHOOK_SECRET`.
5. There's no Stripe-style "sync test data to live mode" — when you
   switch from Test keys to Live keys (after KYC is approved), you'll
   need to recreate the three Plans under Live mode too and update the
   `RAZORPAY_PLAN_*` env vars with the new live plan IDs.

## 5. Local development

```bash
npm install
cp .env.example .env.local
# fill in .env.local with the values from steps 2-4
# (leave RAZORPAY_WEBHOOK_SECRET blank until you deploy — webhooks need a
#  public URL — everything else, including test-mode checkout, works without it)
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
4. Deploy. Then go back to Supabase (step 2.4) and Razorpay (step 4.4)
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
      [Razorpay test card](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
      (`4111 1111 1111 1111`, any future date, any CVC — or a test UPI
      VPA like `success@razorpay`) and confirm your plan tier updates
      after the webhook fires.
- [ ] Confirm the "Cancel subscription" button drops you back to Free.
- [ ] When ready to actually charge people: complete Razorpay's KYC,
      switch from Test to Live API keys, recreate the three Plans
      under Live mode (they get new IDs — update the `RAZORPAY_PLAN_*`
      env vars), and add a Live-mode webhook endpoint/secret.

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
- **Razorpay subscriptions have a fixed number of billing cycles**,
  not "bill forever" like Stripe. This app creates each subscription
  with 120 monthly cycles (`SUBSCRIPTION_TOTAL_COUNT` in
  `lib/razorpay.ts`) — effectively 10 years, a non-issue in practice.
- **No self-serve billing portal.** Razorpay doesn't have a
  Stripe-style hosted "manage your billing" page, so cancellation is a
  plain button in this app's own dashboard (`app/api/razorpay/cancel`)
  rather than a redirect to Razorpay. Fine for MVP; a "change plan"
  flow (vs. just cancel) would be a natural v2 addition.
- **Repeated payment failures ("halted" subscriptions) don't
  auto-downgrade the customer** — see the comment in
  `app/api/razorpay/webhook/route.ts`. Worth revisiting once you have
  real subscribers to watch for silent failed renewals.

## Where to customize

- **Pricing & site limits:** `lib/plans.ts` (also update the matching
  Razorpay Plan amounts, and the copy in `app/page.tsx`'s `PLANS`
  array, if you change prices)
- **Accent color / fonts:** `tailwind.config.ts`, `app/globals.css`
- **Landing page copy:** `app/page.tsx`
- **Alert email copy:** `lib/email.ts`
- **Alert thresholds/cadence:** `app/api/cron/check/route.ts`
  (`SSL_TIERS`, `SSL_RECHECK_HOURS`, `BROKEN_LINK_RECHECK_DAYS`)

## If Stripe opens up in India later

If Stripe's India waitlist clears and you'd rather use it, the
billing integration is isolated to a handful of files: `lib/razorpay.ts`,
`app/api/razorpay/*`, `components/BillingButtons.tsx`, the billing
section of `app/dashboard/billing/page.tsx`, and the
`razorpay_customer_id`/`razorpay_subscription_id` columns in
`supabase/schema.sql`. Everything else (auth, dashboard, monitoring
engine, email alerts) is untouched by which payment processor you use.
