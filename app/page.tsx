import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";

const SAMPLE_SITES = [
  { name: "brightleaf-dental.com", dot: "#16A34A", label: "Operational", uptime: "99.98%", checked: "2 min ago" },
  { name: "riverside-realty.co", dot: "#16A34A", label: "Operational", uptime: "100%", checked: "4 min ago" },
  { name: "lumen-studio.io", dot: "#D97706", label: "SSL expires in 5 days", uptime: "99.95%", checked: "3 min ago" },
  { name: "northgate-fitness.com", dot: "#DC2626", label: "Down — 4 min ago", uptime: "98.40%", checked: "Just now" },
  { name: "harborview-law.com", dot: "#16A34A", label: "Operational", uptime: "99.99%", checked: "1 min ago" },
];

const FEATURES = [
  {
    title: "Uptime monitoring",
    body: "Checked every few minutes. The moment a site goes down, you know — before your client does.",
    icon: <path d="M3 12h4l2 7 4-14 2 7h6" />,
  },
  {
    title: "SSL expiry alerts",
    body: "Warned 30, 14, and 3 days before a certificate lapses — not after it's already broken.",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  },
  {
    title: "Broken link checks",
    body: "Weekly scans catch dead links before they cost a client's trust — or their SEO.",
    icon: (
      <>
        <path d="M9 15l6-6" />
        <path d="M8 8L6 6a3 3 0 0 1 4-4l2 2" />
        <path d="M16 16l2 2a3 3 0 0 1-4 4l-2-2" />
      </>
    ),
  },
  {
    title: "One dashboard, every client",
    body: "Every site you manage, in one place — status, uptime history, and incidents at a glance.",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
];

const PLANS = [
  { name: "Free", price: "$0", sites: "Up to 2 sites", features: ["Uptime & SSL checks", "Email alerts", "7-day history"] },
  { name: "Starter", price: "$9", sites: "Up to 10 sites", features: ["Everything in Free", "Broken-link checks", "30-day history"] },
  {
    name: "Agency",
    price: "$25",
    sites: "Up to 50 sites",
    features: ["Everything in Starter", "Priority alerts", "Unlimited history"],
    highlighted: true,
  },
  { name: "Scale", price: "$60", sites: "Up to 150 sites", features: ["Everything in Agency", "Priority email support", "Team access (soon)"] },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5 sm:px-16">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span className="font-display text-lg font-bold tracking-tight">Website Watchdog</span>
        </div>
        <nav className="flex items-center gap-8">
          <a href="#features" className="hidden text-sm font-medium hover:underline sm:inline">Features</a>
          <a href="#pricing" className="hidden text-sm font-medium hover:underline sm:inline">Pricing</a>
          <a href="#waitlist" className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Join the waitlist
          </a>
        </nav>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 pb-14 pt-20 text-center sm:pt-24">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          For web agencies &amp; freelance developers
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          One dashboard that watches every client site you manage.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--text-muted)]">
          Downtime, expiring SSL, broken links, and slipping performance — caught before your client has to tell you about it.
        </p>
        <div className="mt-1">
          <WaitlistForm />
        </div>
        <span className="text-sm text-[var(--text-muted)]">Free for your first 2 sites. No credit card.</span>
      </section>

      <section className="flex flex-col items-center gap-5 px-6 pb-20">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Every client site, one view
        </span>
        <div className="wd-card w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
            <span className="ml-3 text-[13px] text-[var(--text-muted)]">app.websitewatchdog.com/dashboard</span>
          </div>
          <div className="grid grid-cols-[2.2fr_1.3fr_1fr_1.2fr] gap-3 border-b border-[var(--border)] px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <span>Site</span><span>Status</span><span>Uptime (30d)</span><span>Last checked</span>
          </div>
          {SAMPLE_SITES.map((site) => (
            <div key={site.name} className="grid grid-cols-[2.2fr_1.3fr_1fr_1.2fr] items-center gap-3 border-b border-[var(--border)] px-6 py-4 text-sm last:border-b-0">
              <span className="font-medium">{site.name}</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: site.dot }} />
                {site.label}
              </span>
              <span className="text-[var(--text-muted)]">{site.uptime}</span>
              <span className="text-[var(--text-muted)]">{site.checked}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-white px-6 py-20 sm:px-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex max-w-xl flex-col gap-3">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Your clients shouldn&apos;t be your monitoring system.
            </h2>
            <p className="text-base leading-relaxed text-[var(--text-muted)]">
              Most agencies stitch together free tools per site — if they check at all. The first sign of trouble is usually an email from a client asking why their site is down.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { title: "No single view", body: "Every client site monitored differently — or not monitored at all.", icon: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></> },
              { title: "Found out too late", body: "Outages get reported by clients before your tools ever notice.", icon: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" /><path d="M9 2h6" /></> },
              { title: "Certificates expire quietly", body: "An SSL cert lapses and the whole site looks broken overnight.", icon: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></> },
            ].map((item) => (
              <div key={item.title} className="flex flex-col gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#20263A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
                <h3 className="font-display text-[17px] font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="flex flex-col items-center gap-12 px-6 py-20 sm:px-16">
        <h2 className="max-w-xl text-center font-display text-3xl font-bold tracking-tight">
          Everything you need to catch problems first.
        </h2>
        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f0f7]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#20263A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="flex flex-col items-center gap-14 border-y border-[var(--border)] bg-white px-6 py-20 sm:px-16">
        <div className="flex max-w-xl flex-col items-center gap-3 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">Simple pricing, by number of sites.</h2>
          <p className="text-base leading-relaxed text-[var(--text-muted)]">
            Start free. Upgrade as your client roster grows. Founding-customer pricing is locked in for your first year.
          </p>
        </div>
        <div className="grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col gap-5 rounded-2xl border p-7 ${
                plan.highlighted ? "border-2 border-accent" : "border-[var(--border)]"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-7 rounded-md bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[var(--text-muted)]">{plan.name}</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "$0" && <span className="text-sm text-[var(--text-muted)]">/month</span>}
                </div>
                <span className="text-[13px] text-[var(--text-muted)]">{plan.sites}</span>
              </div>
              <div className="flex flex-col gap-2.5 text-sm">
                {plan.features.map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
              <a
                href="#waitlist"
                className={`mt-auto rounded-lg py-2.5 text-center text-sm font-semibold ${
                  plan.highlighted
                    ? "bg-accent text-white hover:opacity-90"
                    : "border border-[var(--border-strong)] hover:bg-[var(--bg)]"
                }`}
              >
                Join the waitlist
              </a>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-[var(--text-muted)]">
          Billing begins after launch — nothing is charged during the waitlist period.
        </p>
      </section>

      <section className="flex justify-center px-6 py-20">
        <div className="flex max-w-xl flex-col items-center gap-4 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Built in the open, with the first agencies who join.
          </h2>
          <p className="text-base leading-relaxed text-[var(--text-muted)]">
            We&apos;re pre-launch — there&apos;s no case study yet, because that&apos;s you. The first 20 agencies to join the waitlist get founding-customer pricing locked in for a year, and a direct line to shape what we build next.
          </p>
        </div>
      </section>

      <section id="waitlist" className="flex flex-col items-center gap-5 bg-[var(--text)] px-6 py-24 text-center">
        <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight text-white">
          Be first to protect your clients&apos; sites.
        </h2>
        <WaitlistForm dark />
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-6 py-7 text-[13px] text-[var(--text-muted)] sm:px-16">
        <span>© 2026 Website Watchdog · Astonomiq Private Limited</span>
        <Link href="/login" className="hover:underline">Sign in</Link>
      </footer>
    </main>
  );
}
