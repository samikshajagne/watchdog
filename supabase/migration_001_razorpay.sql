-- Run this ONLY if you already ran the original schema.sql (the one with
-- a `stripe_customer_id` column) against your Supabase project before this
-- switch from Stripe to Razorpay. If you're setting up a fresh project,
-- ignore this file — the current schema.sql already has the right columns.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'agencies' and column_name = 'stripe_customer_id'
  ) then
    alter table agencies rename column stripe_customer_id to razorpay_customer_id;
  end if;
end $$;

alter table agencies add column if not exists razorpay_subscription_id text;
