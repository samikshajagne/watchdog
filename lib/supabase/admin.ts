import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client using the service_role key. Bypasses Row Level Security.
 * ONLY use this in trusted server contexts: the cron/check route, the
 * Stripe webhook handler, and the waitlist API — never expose this
 * client or its key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
