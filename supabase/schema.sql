-- Website Watchdog — database schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- for a fresh project. Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

-- One row per signed-up agency/freelancer, keyed by their auth.users id.
create table if not exists agencies (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  owner_email text,
  stripe_customer_id text,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'starter', 'agency', 'scale')),
  created_at timestamptz not null default now()
);

-- Client websites an agency is monitoring.
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies (id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz not null default now()
);
create index if not exists sites_agency_id_idx on sites (agency_id);

-- One row per uptime ping.
create table if not exists checks (
  id bigint generated always as identity primary key,
  site_id uuid not null references sites (id) on delete cascade,
  checked_at timestamptz not null default now(),
  status text not null check (status in ('up', 'down')),
  latency_ms integer,
  http_code integer
);
create index if not exists checks_site_id_checked_at_idx on checks (site_id, checked_at desc);

-- Latest known SSL certificate expiry per site (one row per site).
create table if not exists ssl_status (
  site_id uuid primary key references sites (id) on delete cascade,
  expires_at timestamptz,
  last_checked_at timestamptz
);

-- Broken links found by the weekly crawl.
create table if not exists broken_links (
  id bigint generated always as identity primary key,
  site_id uuid not null references sites (id) on delete cascade,
  checked_at timestamptz not null default now(),
  source_url text not null,
  broken_url text not null,
  status_code integer
);
create index if not exists broken_links_site_id_idx on broken_links (site_id);

-- Incidents: a downtime window, an upcoming SSL expiry, or a broken-link finding.
-- `meta` holds type-specific bookkeeping, e.g. {"tier": 14} for an SSL
-- incident so we know we've already alerted at the 14-day threshold.
create table if not exists incidents (
  id bigint generated always as identity primary key,
  site_id uuid not null references sites (id) on delete cascade,
  type text not null check (type in ('downtime', 'ssl', 'broken_link')),
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  meta jsonb not null default '{}'::jsonb
);
create index if not exists incidents_site_id_idx on incidents (site_id);
create index if not exists incidents_open_idx on incidents (site_id, type) where resolved_at is null;

-- Record of alert emails sent, so we never spam the same incident.
create table if not exists alerts_sent (
  id bigint generated always as identity primary key,
  incident_id bigint not null references incidents (id) on delete cascade,
  sent_at timestamptz not null default now(),
  channel text not null default 'email'
);

-- Pre-launch waitlist signups from the landing page.
create table if not exists waitlist (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
-- The browser talks to Supabase with the anon key, so every table an
-- agency's own dashboard reads or writes needs RLS scoped to their own
-- agency_id. Tables only the cron job / webhook / waitlist route touch
-- (checks, ssl_status, broken_links, alerts_sent, waitlist) are written
-- through the service_role key, which bypasses RLS entirely — they get
-- RLS enabled with a read-only policy (or none) so the anon/browser key
-- can never write to them directly.

alter table agencies enable row level security;
drop policy if exists agencies_select_own on agencies;
create policy agencies_select_own on agencies
  for select using (id = auth.uid());
drop policy if exists agencies_insert_own on agencies;
create policy agencies_insert_own on agencies
  for insert with check (id = auth.uid());
drop policy if exists agencies_update_own on agencies;
create policy agencies_update_own on agencies
  for update using (id = auth.uid());

alter table sites enable row level security;
drop policy if exists sites_select_own on sites;
create policy sites_select_own on sites
  for select using (agency_id = auth.uid());
drop policy if exists sites_insert_own on sites;
create policy sites_insert_own on sites
  for insert with check (agency_id = auth.uid());
drop policy if exists sites_update_own on sites;
create policy sites_update_own on sites
  for update using (agency_id = auth.uid());
drop policy if exists sites_delete_own on sites;
create policy sites_delete_own on sites
  for delete using (agency_id = auth.uid());

alter table checks enable row level security;
drop policy if exists checks_select_own on checks;
create policy checks_select_own on checks
  for select using (
    site_id in (select id from sites where agency_id = auth.uid())
  );

alter table ssl_status enable row level security;
drop policy if exists ssl_status_select_own on ssl_status;
create policy ssl_status_select_own on ssl_status
  for select using (
    site_id in (select id from sites where agency_id = auth.uid())
  );

alter table broken_links enable row level security;
drop policy if exists broken_links_select_own on broken_links;
create policy broken_links_select_own on broken_links
  for select using (
    site_id in (select id from sites where agency_id = auth.uid())
  );

alter table incidents enable row level security;
drop policy if exists incidents_select_own on incidents;
create policy incidents_select_own on incidents
  for select using (
    site_id in (select id from sites where agency_id = auth.uid())
  );

alter table alerts_sent enable row level security;
-- No policies: only the service_role key (cron job) ever touches this table.

alter table waitlist enable row level security;
-- No policies: only the service_role key (waitlist API route) ever touches this table.
